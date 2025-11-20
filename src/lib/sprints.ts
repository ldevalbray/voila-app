import { createSupabaseServerClient } from './supabase-server'

export interface Sprint {
  id: string
  project_id: string
  name: string
  goal: string | null
  status: 'planned' | 'active' | 'completed' | 'cancelled' | 'archived'
  start_date: string | null
  end_date: string | null
  sort_index: number | null
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Récupère tous les sprints d'un projet, triés par statut (active first) puis par date de début
 * @param projectId ID du projet
 * @returns Liste des sprints
 */
export async function getSprintsByProjectId(projectId: string): Promise<Sprint[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return []
    }

    const { data: sprints, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .order('status', { ascending: true }) // active comes before planned, etc.
      .order('start_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching sprints:', error)
      return []
    }

    return sprints || []
  } catch (error) {
    console.error('Unexpected error in getSprintsByProjectId:', error)
    return []
  }
}

/**
 * Récupère le sprint actif d'un projet (s'il existe)
 * @param projectId ID du projet
 * @returns Le sprint actif ou null
 */
export async function getActiveSprintByProjectId(projectId: string): Promise<Sprint | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return null
    }

    const { data: sprint, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      console.error('Error fetching active sprint:', error)
      return null
    }

    return sprint
  } catch (error) {
    console.error('Unexpected error in getActiveSprintByProjectId:', error)
    return null
  }
}

/**
 * Récupère un sprint par son ID
 * @param sprintId ID du sprint
 * @returns Le sprint ou null si non accessible
 */
export async function getSprintById(sprintId: string): Promise<Sprint | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return null
    }

    const { data: sprint, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('id', sprintId)
      .single()

    if (error || !sprint) {
      return null
    }

    return sprint
  } catch (error) {
    console.error('Unexpected error in getSprintById:', error)
    return null
  }
}

