'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'

export interface UpdateProjectClientInput {
  project_id: string
  client_id: string | null
}

/**
 * Met à jour le client_id d'un projet
 * Seulement accessible aux project_admin
 */
export async function updateProjectClient(input: UpdateProjectClientInput) {
  try {
    const t = await getTranslations('common')
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    // Vérifier que l'utilisateur est project_admin sur ce projet
    const { data: membership, error: membershipError } = await supabase
      .from('project_memberships')
      .select('role')
      .eq('project_id', input.project_id)
      .eq('user_id', session.user.id)
      .eq('role', 'project_admin')
      .single()

    if (membershipError || !membership) {
      return { error: 'Vous devez être administrateur du projet pour modifier le client' }
    }

    // Vérifier que le client existe si un client_id est fourni
    if (input.client_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(input.client_id)) {
        return { error: 'Format de client ID invalide' }
      }

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', input.client_id)
        .single()

      if (clientError || !client) {
        return { error: 'Client introuvable' }
      }
    }

    // Mettre à jour le projet
    const { data, error } = await supabase
      .from('projects')
      .update({ client_id: input.client_id })
      .eq('id', input.project_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating project client:', error)
      return { error: error.message }
    }

    // Revalider les chemins pertinents
    revalidatePath(`/app/projects/${input.project_id}/settings`)
    revalidatePath(`/app/projects/${input.project_id}/invoices`)
    revalidatePath(`/app/projects/${input.project_id}/overview`)
    revalidatePath(`/app/projects/${input.project_id}`)

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in updateProjectClient:', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

