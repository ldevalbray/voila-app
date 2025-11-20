import { createSupabaseServerClient } from './supabase-server'

export interface Epic {
  id: string
  project_id: string
  title: string
  description: string | null
  status: 'open' | 'in_progress' | 'done' | 'archived'
  created_by: string
  created_at: string
  updated_at: string
  tasks_count?: number
}

/**
 * Récupère tous les epics d'un projet
 * @param projectId ID du projet
 * @returns Liste des epics avec le nombre de tâches associées
 */
export async function getEpicsByProjectId(projectId: string): Promise<Epic[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return []
    }

    // Récupérer les epics avec le nombre de tâches
    const { data: epics, error: epicsError } = await supabase
      .from('epics')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (epicsError) {
      console.error('Error fetching epics:', epicsError)
      return []
    }

    if (!epics || epics.length === 0) {
      return []
    }

    // Récupérer le nombre de tâches pour chaque epic
    const epicIds = epics.map((e) => e.id)
    const { data: tasksCounts, error: tasksError } = await supabase
      .from('tasks')
      .select('epic_id')
      .in('epic_id', epicIds)

    if (tasksError) {
      console.error('Error fetching tasks counts:', tasksError)
      // Continuer même si on ne peut pas récupérer les counts
    }

    // Compter les tâches par epic
    const countsMap = new Map<string, number>()
    if (tasksCounts) {
      tasksCounts.forEach((task) => {
        if (task.epic_id) {
          countsMap.set(task.epic_id, (countsMap.get(task.epic_id) || 0) + 1)
        }
      })
    }

    return epics.map((epic) => ({
      ...epic,
      tasks_count: countsMap.get(epic.id) || 0,
    }))
  } catch (error) {
    console.error('Unexpected error in getEpicsByProjectId:', error)
    return []
  }
}

/**
 * Récupère un epic par son ID
 * @param epicId ID de l'epic
 * @returns L'epic ou null si non accessible
 */
export async function getEpicById(epicId: string): Promise<Epic | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return null
    }

    const { data: epic, error } = await supabase
      .from('epics')
      .select('*')
      .eq('id', epicId)
      .single()

    if (error || !epic) {
      return null
    }

    return epic
  } catch (error) {
    console.error('Unexpected error in getEpicById:', error)
    return null
  }
}

