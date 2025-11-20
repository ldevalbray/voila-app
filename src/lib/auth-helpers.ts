'use server'

import { createSupabaseServerClient } from './supabase-server'

/**
 * Vérifie si l'utilisateur a un rôle spécifique sur un projet
 */
export async function checkProjectRole(
  projectId: string,
  allowedRoles: ('project_admin' | 'project_participant' | 'project_client')[]
): Promise<{ hasAccess: boolean; role: string | null }> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { hasAccess: false, role: null }
    }

    const { data: membership, error } = await supabase
      .from('project_memberships')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', session.user.id)
      .in('role', allowedRoles)
      .single()

    if (error || !membership) {
      return { hasAccess: false, role: null }
    }

    return { hasAccess: true, role: membership.role }
  } catch (error) {
    console.error('Error checking project role:', error)
    return { hasAccess: false, role: null }
  }
}

/**
 * Vérifie si l'utilisateur a un rôle interne (admin ou participant) sur un projet
 */
export async function checkInternalProjectRole(
  projectId: string
): Promise<{ hasAccess: boolean; role: string | null }> {
  return checkProjectRole(projectId, ['project_admin', 'project_participant'])
}

/**
 * Vérifie si l'utilisateur est project_admin sur un projet
 */
export async function checkProjectAdmin(
  projectId: string
): Promise<boolean> {
  const { hasAccess } = await checkProjectRole(projectId, ['project_admin'])
  return hasAccess
}

