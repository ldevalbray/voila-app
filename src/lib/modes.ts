import { createSupabaseServerClient } from './supabase-server'

/**
 * Détermine si l'utilisateur actuel a un rôle interne
 * (project_admin ou project_participant)
 */
export async function hasInternalRole(): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return false
  }

  const { data, error } = await supabase
    .from('project_memberships')
    .select('role')
    .eq('user_id', session.user.id)
    .in('role', ['project_admin', 'project_participant'])
    .limit(1)

  if (error || !data || data.length === 0) {
    return false
  }

  return true
}

/**
 * Détermine si l'utilisateur actuel a un rôle client
 * (project_client)
 */
export async function hasClientRole(): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return false
  }

  const { data, error } = await supabase
    .from('project_memberships')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('role', 'project_client')
    .limit(1)

  if (error || !data || data.length === 0) {
    return false
  }

  return true
}

/**
 * Récupère les informations de mode pour l'utilisateur actuel
 */
export async function getUserModes() {
  const [hasInternal, hasClient] = await Promise.all([
    hasInternalRole(),
    hasClientRole(),
  ])

  return {
    hasInternalRole: hasInternal,
    hasClientRole: hasClient,
  }
}

