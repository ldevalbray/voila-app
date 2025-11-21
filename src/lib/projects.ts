import { createSupabaseServerClient } from './supabase-server'
import {
  PaginationParams,
  PaginatedResult,
  normalizePagination,
  calculatePaginationMetadata,
  DEFAULT_PAGE_SIZE,
} from './pagination'

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
 * @param pagination Paramètres de pagination optionnels
 */
export async function getInternalProjects(
  pagination?: PaginationParams
): Promise<PaginatedResult<Project>> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return {
        data: [],
        pagination: calculatePaginationMetadata(0, 1, DEFAULT_PAGE_SIZE),
      }
    }

    const { data: memberships, error: membershipsError } = await supabase
      .from('project_memberships')
      .select('project_id, role')
      .eq('user_id', session.user.id)
      .in('role', ['project_admin', 'project_participant', 'project_client'])

    if (membershipsError) {
      console.error('Error fetching project memberships:', membershipsError)
      return {
        data: [],
        pagination: calculatePaginationMetadata(0, 1, DEFAULT_PAGE_SIZE),
      }
    }

    if (!memberships || memberships.length === 0) {
      return {
        data: [],
        pagination: calculatePaginationMetadata(0, 1, DEFAULT_PAGE_SIZE),
      }
    }

    const projectIds = memberships.map((m) => m.project_id)

    // Appliquer la pagination
    const { page, limit, offset } = normalizePagination(pagination)

    // Compter le total
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('id', projectIds)

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
      .range(offset, offset + limit - 1)

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return {
        data: [],
        pagination: calculatePaginationMetadata(0, page, limit),
      }
    }

    if (!projects) {
      return {
        data: [],
        pagination: calculatePaginationMetadata(0, page, limit),
      }
    }

    // Enrichir avec les informations de membership
    const data = projects.map((project) => {
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

    return {
      data,
      pagination: calculatePaginationMetadata(count || 0, page, limit),
    }
  } catch (error) {
    console.error('Unexpected error in getInternalProjects:', error)
    return {
      data: [],
      pagination: calculatePaginationMetadata(0, 1, DEFAULT_PAGE_SIZE),
    }
  }
}

/**
 * Récupère les projets où l'utilisateur a un rôle client
 * (project_client)
 * @param pagination Paramètres de pagination optionnels
 */
export async function getClientProjects(
  pagination?: PaginationParams
): Promise<PaginatedResult<Project>> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return {
        data: [],
        pagination: calculatePaginationMetadata(0, 1, DEFAULT_PAGE_SIZE),
      }
    }

    const { data: memberships, error: membershipsError } = await supabase
      .from('project_memberships')
      .select('project_id, role')
      .eq('user_id', session.user.id)
      .eq('role', 'project_client')

    if (membershipsError) {
      console.error('Error fetching client project memberships:', membershipsError)
      return {
        data: [],
        pagination: calculatePaginationMetadata(0, 1, DEFAULT_PAGE_SIZE),
      }
    }

    if (!memberships || memberships.length === 0) {
      return {
        data: [],
        pagination: calculatePaginationMetadata(0, 1, DEFAULT_PAGE_SIZE),
      }
    }

    const projectIds = memberships.map((m) => m.project_id)

    // Appliquer la pagination
    const { page, limit, offset } = normalizePagination(pagination)

    // Compter le total
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('id', projectIds)

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
      .range(offset, offset + limit - 1)

    if (projectsError) {
      console.error('Error fetching client projects:', projectsError)
      return {
        data: [],
        pagination: calculatePaginationMetadata(0, page, limit),
      }
    }

    if (!projects) {
      return {
        data: [],
        pagination: calculatePaginationMetadata(0, page, limit),
      }
    }

    // Enrichir avec les informations de membership
    const data = projects.map((project) => {
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

    return {
      data,
      pagination: calculatePaginationMetadata(count || 0, page, limit),
    }
  } catch (error) {
    console.error('Unexpected error in getClientProjects:', error)
    return {
      data: [],
      pagination: calculatePaginationMetadata(0, 1, DEFAULT_PAGE_SIZE),
    }
  }
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

/**
 * Vérifie si l'utilisateur actuel est admin d'un projet
 * @param projectId ID du projet
 * @returns true si l'utilisateur est project_admin, false sinon
 */
export async function isProjectAdmin(projectId: string): Promise<boolean> {
  try {
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
      .eq('project_id', projectId)
      .eq('user_id', session.user.id)
      .eq('role', 'project_admin')
      .single()

    return !error && !!data
  } catch (error) {
    console.error('Unexpected error in isProjectAdmin:', error)
    return false
  }
}

