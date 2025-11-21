'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'

export type ProjectMemberRole = 'project_admin' | 'project_participant' | 'project_client'

export interface ProjectMember {
  id: string
  user_id: string
  project_id: string
  role: ProjectMemberRole
  created_at: string
  updated_at: string | null
  user: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    avatar: string | null
  }
}

export interface AddMemberInput {
  project_id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  role: ProjectMemberRole
}

export interface UpdateMemberRoleInput {
  project_id: string
  user_id: string
  role: ProjectMemberRole
}

export interface RemoveMemberInput {
  project_id: string
  user_id: string
}

/**
 * Récupère tous les membres d'un projet avec leurs informations utilisateur
 * Seuls les membres du projet peuvent voir cette liste
 */
export async function getProjectMembers(projectId: string): Promise<{
  data: ProjectMember[] | null
  error: string | null
}> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      const t = await getTranslations('common')
      return { data: null, error: t('error') || 'Non authentifié' }
    }

    // Vérifier que l'utilisateur est membre du projet
    const { data: membership, error: membershipError } = await supabase
      .from('project_memberships')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', session.user.id)
      .single()

    if (membershipError || !membership) {
      return { data: null, error: 'Vous devez être membre du projet pour voir les membres' }
    }

    // Récupérer tous les membres du projet avec leurs infos utilisateur
    const { data, error } = await supabase
      .from('project_memberships')
      .select(
        `
        id,
        user_id,
        project_id,
        role,
        created_at,
        updated_at,
        user:users!inner(
          id,
          email,
          first_name,
          last_name,
          avatar
        )
      `
      )
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching project members:', error)
      return { data: null, error: error.message }
    }

    if (!data) {
      return { data: [], error: null }
    }

    // S'assurer que toutes les données sont sérialisables (convertir les dates en strings)
    const serializedMembers: ProjectMember[] = data.map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      project_id: m.project_id,
      role: m.role as ProjectMemberRole,
      created_at: typeof m.created_at === 'string' 
        ? m.created_at 
        : new Date(m.created_at).toISOString(),
      updated_at: m.updated_at 
        ? (typeof m.updated_at === 'string' 
            ? m.updated_at 
            : new Date(m.updated_at).toISOString())
        : null,
      user: {
        id: m.user.id,
        email: m.user.email,
        first_name: m.user.first_name,
        last_name: m.user.last_name,
        avatar: m.user.avatar,
      },
    }))

    return { data: serializedMembers, error: null }
  } catch (error) {
    console.error('Unexpected error in getProjectMembers:', error)
    const t = await getTranslations('common')
    return { data: null, error: t('error') || 'Une erreur est survenue' }
  }
}

/**
 * Vérifie si l'utilisateur actuel est admin du projet
 */
async function isProjectAdmin(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  projectId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('project_memberships')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('role', 'project_admin')
    .single()

  return !error && !!data
}

/**
 * Vérifie s'il reste au moins un admin sur le projet
 */
async function hasAtLeastOneAdmin(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  projectId: string,
  excludeUserId?: string
): Promise<boolean> {
  let query = supabase
    .from('project_memberships')
    .select('id')
    .eq('project_id', projectId)
    .eq('role', 'project_admin')
    .limit(1)

  if (excludeUserId) {
    query = query.neq('user_id', excludeUserId)
  }

  const { data, error } = await query

  return !error && !!data && data.length > 0
}

/**
 * Ajoute un membre au projet
 * - Si l'utilisateur existe déjà : crée/met à jour la membership et envoie un email "ajouté au projet"
 * - Si l'utilisateur n'existe pas : invite via Supabase Auth et stocke les infos pour créer la membership après signup
 */
export async function addProjectMember(input: AddMemberInput): Promise<{
  data: ProjectMember | null
  error: string | null
}> {
  try {
    const t = await getTranslations('common')
    const supabase = await createSupabaseServerClient()
    const adminSupabase = await createSupabaseAdminClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { data: null, error: t('error') || 'Non authentifié' }
    }

    // Vérifier que l'utilisateur est admin du projet
    const isAdmin = await isProjectAdmin(supabase, input.project_id, session.user.id)
    if (!isAdmin) {
      return { data: null, error: 'Vous devez être administrateur du projet pour ajouter des membres' }
    }

    // Normaliser l'email
    const email = input.email.toLowerCase().trim()

    // Chercher si un utilisateur avec cet email existe déjà dans Supabase Auth
    const { data: existingUsers, error: listError } = await adminSupabase.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return { data: null, error: 'Erreur lors de la vérification de l\'utilisateur' }
    }

    const existingUser = existingUsers.users.find((u) => u.email?.toLowerCase() === email)

    if (existingUser) {
      // CAS 1: L'utilisateur existe déjà
      // S'assurer qu'il y a une ligne dans la table users
      const { error: upsertUserError } = await supabase
        .from('users')
        .upsert(
          {
            id: existingUser.id,
            email: existingUser.email!,
            first_name: input.first_name || null,
            last_name: input.last_name || null,
          },
          { onConflict: 'id' }
        )

      if (upsertUserError) {
        console.error('Error upserting user:', upsertUserError)
        // Continue quand même, l'utilisateur existe peut-être déjà
      }

      // Créer ou mettre à jour la membership
      const { data: membership, error: membershipError } = await supabase
        .from('project_memberships')
        .upsert(
          {
            project_id: input.project_id,
            user_id: existingUser.id,
            role: input.role,
          },
          { onConflict: 'project_id,user_id' }
        )
        .select(
          `
          id,
          user_id,
          project_id,
          role,
          created_at,
          updated_at,
          user:users!inner(
            id,
            email,
            first_name,
            last_name,
            avatar
          )
        `
        )
        .single()

      if (membershipError) {
        console.error('Error creating/updating membership:', membershipError)
        return { data: null, error: membershipError.message }
      }

      if (!membership) {
        return { data: null, error: 'Erreur lors de la création de la membership' }
      }

      // S'assurer que les données sont sérialisables (convertir les dates en strings)
      const serializedMembership: ProjectMember = {
        id: membership.id,
        user_id: membership.user_id,
        project_id: membership.project_id,
        role: membership.role as ProjectMemberRole,
        created_at: typeof membership.created_at === 'string' 
          ? membership.created_at 
          : new Date(membership.created_at).toISOString(),
        updated_at: membership.updated_at 
          ? (typeof membership.updated_at === 'string' 
              ? membership.updated_at 
              : new Date(membership.updated_at).toISOString())
          : null,
        user: {
          id: membership.user.id,
          email: membership.user.email,
          first_name: membership.user.first_name,
          last_name: membership.user.last_name,
          avatar: membership.user.avatar,
        },
      }

      // TODO: Envoyer un email "Vous avez été ajouté au projet"
      // Utiliser votre service d'email (Resend, Supabase Functions, etc.)
      // Email subject: "You've been added to a project on Voila.app"
      // Email body: mention project name, who added them, link to /app/projects/[projectId]/tasks

      return { data: serializedMembership, error: null }
    } else {
      // CAS 2: L'utilisateur n'existe pas encore
      // Inviter l'utilisateur via Supabase Auth Admin API
      const { data: invitedUser, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            invitedProjectId: input.project_id,
            invitedRole: input.role,
            invitedFirstName: input.first_name || null,
            invitedLastName: input.last_name || null,
          },
        }
      )

      if (inviteError || !invitedUser) {
        console.error('Error inviting user:', inviteError)
        return { data: null, error: inviteError?.message || 'Erreur lors de l\'invitation' }
      }

      // Option A (recommandée): Créer un placeholder dans users avec les infos d'invitation
      // Quand l'utilisateur complétera son signup, le trigger créera automatiquement la ligne users
      // On peut aussi créer une table project_invitations pour tracker les invitations en attente
      // Pour l'instant, on stocke les infos dans user_metadata et on créera la membership après signup

      // Note: La membership sera créée automatiquement quand l'utilisateur acceptera l'invitation
      // via un webhook ou une fonction qui vérifie user_metadata.invitedProjectId
      // Pour l'instant, on retourne null car l'utilisateur n'a pas encore de membership

      // TODO: Implémenter la logique de création automatique de membership après signup
      // Option 1: Webhook Supabase qui écoute auth.users INSERT
      // Option 2: Fonction Edge qui vérifie user_metadata et crée la membership
      // Option 3: Vérification au premier login de l'utilisateur

      // Note: L'invitation a été envoyée, mais la membership sera créée après signup
      // Pour l'instant, on retourne null car l'utilisateur n'a pas encore de membership
      // TODO: Implémenter la logique de création automatique de membership après signup
      return {
        data: null,
        error: null,
      }
    }
  } catch (error) {
    console.error('Unexpected error in addProjectMember:', error)
    const t = await getTranslations('common')
    return { data: null, error: t('error') || 'Une erreur est survenue' }
  }
}

/**
 * Met à jour le rôle d'un membre
 * Empêche de retirer le dernier admin
 */
export async function updateMemberRole(input: UpdateMemberRoleInput): Promise<{
  data: ProjectMember | null
  error: string | null
}> {
  try {
    const t = await getTranslations('common')
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { data: null, error: t('error') || 'Non authentifié' }
    }

    // Vérifier que l'utilisateur est admin du projet
    const isAdmin = await isProjectAdmin(supabase, input.project_id, session.user.id)
    if (!isAdmin) {
      return { data: null, error: 'Vous devez être administrateur du projet pour modifier les rôles' }
    }

    // Vérifier si on essaie de retirer le dernier admin
    const currentMembership = await supabase
      .from('project_memberships')
      .select('role')
      .eq('project_id', input.project_id)
      .eq('user_id', input.user_id)
      .single()

    if (
      currentMembership.data?.role === 'project_admin' &&
      input.role !== 'project_admin'
    ) {
      const hasOtherAdmin = await hasAtLeastOneAdmin(supabase, input.project_id, input.user_id)
      if (!hasOtherAdmin) {
        return {
          data: null,
          error: 'Impossible de retirer le dernier administrateur du projet',
        }
      }
    }

    // Mettre à jour le rôle
    const { data: membership, error } = await supabase
      .from('project_memberships')
      .update({ role: input.role })
      .eq('project_id', input.project_id)
      .eq('user_id', input.user_id)
      .select(
        `
        id,
        user_id,
        project_id,
        role,
        created_at,
        updated_at,
        user:users!inner(
          id,
          email,
          first_name,
          last_name,
          avatar
        )
      `
      )
      .single()

    if (error) {
      console.error('Error updating member role:', error)
      return { data: null, error: error.message }
    }

    if (!membership) {
      return { data: null, error: 'Erreur lors de la mise à jour du rôle' }
    }

    // S'assurer que les données sont sérialisables (convertir les dates en strings)
    const serializedMembership: ProjectMember = {
      id: membership.id,
      user_id: membership.user_id,
      project_id: membership.project_id,
      role: membership.role as ProjectMemberRole,
      created_at: typeof membership.created_at === 'string' 
        ? membership.created_at 
        : new Date(membership.created_at).toISOString(),
      updated_at: membership.updated_at 
        ? (typeof membership.updated_at === 'string' 
            ? membership.updated_at 
            : new Date(membership.updated_at).toISOString())
        : null,
      user: {
        id: membership.user.id,
        email: membership.user.email,
        first_name: membership.user.first_name,
        last_name: membership.user.last_name,
        avatar: membership.user.avatar,
      },
    }

    // Revalider les chemins pertinents
    revalidatePath(`/app/projects/${input.project_id}/settings`)

    return { data: serializedMembership, error: null }
  } catch (error) {
    console.error('Unexpected error in updateMemberRole:', error)
    const t = await getTranslations('common')
    return { data: null, error: t('error') || 'Une erreur est survenue' }
  }
}

/**
 * Supprime un membre du projet
 * Empêche de supprimer le dernier admin
 */
export async function removeProjectMember(input: RemoveMemberInput): Promise<{
  error: string | null
}> {
  try {
    const t = await getTranslations('common')
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') || 'Non authentifié' }
    }

    // Vérifier que l'utilisateur est admin du projet
    const isAdmin = await isProjectAdmin(supabase, input.project_id, session.user.id)
    if (!isAdmin) {
      return { error: 'Vous devez être administrateur du projet pour supprimer des membres' }
    }

    // Vérifier si on essaie de supprimer le dernier admin
    const currentMembership = await supabase
      .from('project_memberships')
      .select('role')
      .eq('project_id', input.project_id)
      .eq('user_id', input.user_id)
      .single()

    if (currentMembership.data?.role === 'project_admin') {
      const hasOtherAdmin = await hasAtLeastOneAdmin(supabase, input.project_id, input.user_id)
      if (!hasOtherAdmin) {
        return {
          error: 'Impossible de supprimer le dernier administrateur du projet',
        }
      }
    }

    // Supprimer la membership
    const { error } = await supabase
      .from('project_memberships')
      .delete()
      .eq('project_id', input.project_id)
      .eq('user_id', input.user_id)

    if (error) {
      console.error('Error removing member:', error)
      return { error: error.message }
    }

    // Revalider les chemins pertinents
    revalidatePath(`/app/projects/${input.project_id}/settings`)

    return { error: null }
  } catch (error) {
    console.error('Unexpected error in removeProjectMember:', error)
    const t = await getTranslations('common')
    return { error: t('error') || 'Une erreur est survenue' }
  }
}

