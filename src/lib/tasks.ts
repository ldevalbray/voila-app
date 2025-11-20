import { createSupabaseServerClient } from './supabase-server'

export interface Task {
  id: string
  project_id: string
  epic_id: string | null
  title: string
  description: string | null
  type: 'bug' | 'new_feature' | 'improvement'
  status: 'todo' | 'in_progress' | 'blocked' | 'waiting_for_client' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimate_bucket: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | null
  is_client_visible: boolean
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
  epic?: {
    id: string
    title: string
  } | null
  assignees?: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
  }[]
  assignees_count?: number
}

export interface TaskFilters {
  status?: string[]
  type?: string[]
  epic_id?: string | null
  search?: string
}

export interface TaskSort {
  field: 'created_at' | 'priority'
  direction: 'asc' | 'desc'
}

/**
 * Récupère les tâches d'un projet avec filtres et tri
 * @param projectId ID du projet
 * @param filters Filtres optionnels
 * @param sort Tri optionnel
 * @returns Liste des tâches
 */
export async function getTasksByProjectId(
  projectId: string,
  filters?: TaskFilters,
  sort?: TaskSort
): Promise<Task[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return []
    }

    let query = supabase
      .from('tasks')
      .select(
        `
        *,
        epic:epics(id, title)
      `
      )
      .eq('project_id', projectId)

    // Appliquer les filtres
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters?.type && filters.type.length > 0) {
      query = query.in('type', filters.type)
    }

    if (filters?.epic_id !== undefined) {
      if (filters.epic_id === null) {
        query = query.is('epic_id', null)
      } else {
        query = query.eq('epic_id', filters.epic_id)
      }
    }

    // Recherche textuelle sur title et description
    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      )
    }

    // Appliquer le tri
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })
    } else {
      // Tri par défaut: created_at desc
      query = query.order('created_at', { ascending: false })
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return []
    }

    if (!tasks || tasks.length === 0) {
      return []
    }

    // Récupérer les assignees pour chaque tâche
    const taskIds = tasks.map((t) => t.id)
    const { data: assignees, error: assigneesError } = await supabase
      .from('task_assignees')
      .select(
        `
        task_id,
        user:users(id, email, first_name, last_name)
      `
      )
      .in('task_id', taskIds)

    if (assigneesError) {
      console.error('Error fetching assignees:', assigneesError)
      // Continuer sans assignees
    }

    // Grouper les assignees par tâche
    const assigneesMap = new Map<string, Task['assignees']>()
    if (assignees) {
      assignees.forEach((assignment: any) => {
        if (!assigneesMap.has(assignment.task_id)) {
          assigneesMap.set(assignment.task_id, [])
        }
        if (assignment.user) {
          assigneesMap.get(assignment.task_id)?.push(assignment.user)
        }
      })
    }

    return tasks.map((task) => ({
      ...task,
      assignees: assigneesMap.get(task.id) || [],
      assignees_count: assigneesMap.get(task.id)?.length || 0,
    }))
  } catch (error) {
    console.error('Unexpected error in getTasksByProjectId:', error)
    return []
  }
}

/**
 * Récupère une tâche par son ID
 * @param taskId ID de la tâche
 * @returns La tâche ou null si non accessible
 */
export async function getTaskById(taskId: string): Promise<Task | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return null
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .select(
        `
        *,
        epic:epics(id, title)
      `
      )
      .eq('id', taskId)
      .single()

    if (error || !task) {
      return null
    }

    // Récupérer les assignees
    const { data: assignees, error: assigneesError } = await supabase
      .from('task_assignees')
      .select(
        `
        user:users(id, email, first_name, last_name)
      `
      )
      .eq('task_id', taskId)

    if (assigneesError) {
      console.error('Error fetching assignees:', assigneesError)
    }

    return {
      ...task,
      assignees: assignees?.map((a: any) => a.user) || [],
      assignees_count: assignees?.length || 0,
    }
  } catch (error) {
    console.error('Unexpected error in getTaskById:', error)
    return null
  }
}

/**
 * Récupère les statistiques des tâches d'un projet
 * @param projectId ID du projet
 * @returns Statistiques des tâches
 */
export async function getTaskStats(projectId: string): Promise<{
  total: number
  by_status: Record<string, number>
  open_count: number
}> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { total: 0, by_status: {}, open_count: 0 }
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('status')
      .eq('project_id', projectId)

    if (error) {
      console.error('Error fetching task stats:', error)
      return { total: 0, by_status: {}, open_count: 0 }
    }

    if (!tasks || tasks.length === 0) {
      return { total: 0, by_status: {}, open_count: 0 }
    }

    const by_status: Record<string, number> = {}
    let open_count = 0

    tasks.forEach((task) => {
      by_status[task.status] = (by_status[task.status] || 0) + 1
      if (task.status !== 'done') {
        open_count++
      }
    })

    return {
      total: tasks.length,
      by_status,
      open_count,
    }
  } catch (error) {
    console.error('Unexpected error in getTaskStats:', error)
    return { total: 0, by_status: {}, open_count: 0 }
  }
}

