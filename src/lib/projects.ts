import { createSupabaseServerClient } from './supabase-server'

export interface Project {
  id: string
  name: string
  description: string | null
  status: string
  client_id: string | null
  created_by: string
  created_at: string
  updated_at: string
  client?: {
    id: string
    name: string
  } | null
  membership?: {
    id: string
    role: string
  }
}

/**
 * Récupère les projets où l'utilisateur a un rôle interne
 * (project_admin, project_participant, ou project_client)
 * En mode Internal, on peut voir tous les projets auxquels on a accès
 */
export async function getInternalProjects(): Promise<Project[]> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return []
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from('project_memberships')
    .select('project_id, role')
    .eq('user_id', session.user.id)
    .in('role', ['project_admin', 'project_participant', 'project_client'])

  if (membershipsError || !memberships || memberships.length === 0) {
    return []
  }

  const projectIds = memberships.map((m) => m.project_id)

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select(
      `
      *,
      client:clients(id, name)
    `
    )
    .in('id', projectIds)
    .order('created_at', { ascending: false })

  if (projectsError || !projects) {
    return []
  }

  // Enrichir avec les informations de membership
  return projects.map((project) => {
    const membership = memberships.find((m) => m.project_id === project.id)
    return {
      ...project,
      membership: membership
        ? {
            id: membership.project_id,
            role: membership.role,
          }
        : undefined,
    }
  })
}

/**
 * Récupère les projets où l'utilisateur a un rôle client
 * (project_client)
 */
export async function getClientProjects(): Promise<Project[]> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return []
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from('project_memberships')
    .select('project_id, role')
    .eq('user_id', session.user.id)
    .eq('role', 'project_client')

  if (membershipsError || !memberships || memberships.length === 0) {
    return []
  }

  const projectIds = memberships.map((m) => m.project_id)

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select(
      `
      *,
      client:clients(id, name)
    `
    )
    .in('id', projectIds)
    .order('created_at', { ascending: false })

  if (projectsError || !projects) {
    return []
  }

  // Enrichir avec les informations de membership
  return projects.map((project) => {
    const membership = memberships.find((m) => m.project_id === project.id)
    return {
      ...project,
      membership: membership
        ? {
            id: membership.project_id,
            role: membership.role,
          }
        : undefined,
    }
  })
}

/**
 * Récupère un projet par son ID avec vérification RLS et membership
 * @param projectId ID du projet
 * @param mode 'internal' pour vérifier project_admin/project_participant, 'client' pour project_client
 * @returns Le projet avec client et membership, ou null si non accessible
 */
export async function getProjectById(
  projectId: string,
  mode: 'internal' | 'client'
): Promise<Project | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return null
  }

  // Vérifier la membership selon le mode
  const roles =
    mode === 'internal'
      ? ['project_admin', 'project_participant']
      : ['project_client']

  const { data: membership, error: membershipError } = await supabase
    .from('project_memberships')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', session.user.id)
    .in('role', roles)
    .single()

  if (membershipError || !membership) {
    return null
  }

  // Récupérer le projet (RLS s'assure que l'utilisateur peut le voir)
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select(
      `
      *,
      client:clients(id, name)
    `
    )
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return null
  }

  return {
    ...project,
    membership: {
      id: projectId,
      role: membership.role,
    },
  }
}

