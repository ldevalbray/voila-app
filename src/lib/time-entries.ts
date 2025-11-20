import { createSupabaseServerClient } from './supabase-server'

export type TimeEntryCategory =
  | 'project_management'
  | 'development'
  | 'documentation'
  | 'maintenance_evolution'

export interface TimeEntry {
  id: string
  project_id: string
  task_id: string | null
  user_id: string
  category: TimeEntryCategory
  duration_minutes: number
  date: string
  notes: string | null
  created_at: string
  updated_at: string
  // Relations (optionnelles, chargées via select)
  project?: {
    id: string
    name: string
  }
  task?: {
    id: string
    title: string
  } | null
  user?: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
  }
}

export interface TimeEntryFilters {
  project_id?: string
  task_id?: string | null
  user_id?: string
  category?: TimeEntryCategory[]
  date_from?: string
  date_to?: string
  sprint_id?: string | null
}

/**
 * Récupère les entrées de temps avec filtres optionnels
 * @param filters Filtres optionnels
 * @returns Liste des entrées de temps
 */
export async function getTimeEntries(
  filters?: TimeEntryFilters
): Promise<TimeEntry[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return []
    }

    // Récupérer d'abord les entrées de base
    let query = supabase
      .from('time_entries')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    // Appliquer les filtres
    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id)
    }

    if (filters?.task_id !== undefined) {
      if (filters.task_id === null) {
        query = query.is('task_id', null)
      } else {
        query = query.eq('task_id', filters.task_id)
      }
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }

    if (filters?.category && filters.category.length > 0) {
      query = query.in('category', filters.category)
    }

    if (filters?.date_from) {
      query = query.gte('date', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('date', filters.date_to)
    }

    // Filtre par sprint : si sprint_id est défini, filtrer les entrées liées à des tâches du sprint
    // ou les entrées sans tâche mais avec date dans la plage du sprint
    if (filters?.sprint_id !== undefined && filters.sprint_id !== null) {
      // Récupérer les tâches du sprint
      const { data: sprintTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('sprint_id', filters.sprint_id)

      const taskIds = sprintTasks?.map((t) => t.id) || []

      // Récupérer les dates du sprint
      const { data: sprint } = await supabase
        .from('sprints')
        .select('start_date, end_date')
        .eq('id', filters.sprint_id)
        .single()

      if (taskIds.length > 0 || sprint) {
        // Filtrer : entrées avec task_id dans le sprint OU entrées sans task mais date dans la plage
        const conditions: string[] = []
        if (taskIds.length > 0) {
          conditions.push(`task_id.in.(${taskIds.join(',')})`)
        }
        if (sprint?.start_date && sprint?.end_date) {
          conditions.push(
            `(task_id.is.null,date.gte.${sprint.start_date},date.lte.${sprint.end_date})`
          )
        }
        // Pour simplifier, on fait deux requêtes et on combine les résultats
        // Ou on utilise une sous-requête
        // Pour l'instant, on filtre côté application après récupération
      }
    }

    const { data: entries, error } = await query

    if (error) {
      console.error('Error fetching time entries:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error,
      })
      return []
    }

    if (!entries || entries.length === 0) {
      return []
    }

    // Récupérer les relations séparément
    const projectIds = [...new Set(entries.map((e) => e.project_id))]
    const taskIds = [...new Set(entries.map((e) => e.task_id).filter(Boolean) as string[])]
    const userIds = [...new Set(entries.map((e) => e.user_id))]

    // Récupérer les projets
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', projectIds)

    // Récupérer les tâches
    const { data: tasks } = taskIds.length > 0
      ? await supabase
          .from('tasks')
          .select('id, title')
          .in('id', taskIds)
      : { data: [] }

    // Récupérer les utilisateurs
    const { data: users } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .in('id', userIds)

    // Créer des maps pour les relations
    const projectsMap = new Map((projects || []).map((p) => [p.id, p]))
    const tasksMap = new Map((tasks || []).map((t) => [t.id, t]))
    const usersMap = new Map((users || []).map((u) => [u.id, u]))

    // Enrichir les entrées avec les relations
    const enrichedEntries = entries.map((entry) => ({
      ...entry,
      project: projectsMap.get(entry.project_id),
      task: entry.task_id ? tasksMap.get(entry.task_id) || null : null,
      user: usersMap.get(entry.user_id),
    }))

    // Filtrer par sprint côté application si nécessaire
    if (filters?.sprint_id !== undefined && filters.sprint_id !== null) {
      const { data: sprint } = await supabase
        .from('sprints')
        .select('start_date, end_date')
        .eq('id', filters.sprint_id)
        .single()

      const { data: sprintTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('sprint_id', filters.sprint_id)

      const sprintTaskIds = new Set(sprintTasks?.map((t) => t.id) || [])

      return enrichedEntries.filter((entry) => {
        // Entrée liée à une tâche du sprint
        if (entry.task_id && sprintTaskIds.has(entry.task_id)) {
          return true
        }
        // Entrée sans tâche mais date dans la plage du sprint
        if (!entry.task_id && sprint?.start_date && sprint?.end_date) {
          const entryDate = new Date(entry.date)
          const startDate = new Date(sprint.start_date)
          const endDate = new Date(sprint.end_date)
          return entryDate >= startDate && entryDate <= endDate
        }
        return false
      })
    }

    return enrichedEntries as TimeEntry[]
  } catch (error) {
    console.error('Unexpected error in getTimeEntries:', error)
    return []
  }
}

/**
 * Récupère les entrées de temps pour une tâche spécifique
 * @param taskId ID de la tâche
 * @returns Liste des entrées de temps
 */
export async function getTimeEntriesByTaskId(
  taskId: string
): Promise<TimeEntry[]> {
  return getTimeEntries({ task_id: taskId })
}

/**
 * Récupère le temps total (en minutes) pour une tâche
 * @param taskId ID de la tâche
 * @returns Temps total en minutes
 */
export async function getTotalTimeByTaskId(taskId: string): Promise<number> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return 0
    }

    const { data, error } = await supabase
      .from('time_entries')
      .select('duration_minutes')
      .eq('task_id', taskId)

    if (error) {
      console.error('Error fetching total time:', error)
      return 0
    }

    if (!data || data.length === 0) {
      return 0
    }

    return data.reduce((sum, entry) => sum + entry.duration_minutes, 0)
  } catch (error) {
    console.error('Unexpected error in getTotalTimeByTaskId:', error)
    return 0
  }
}

/**
 * Récupère les statistiques de temps pour un projet
 * @param projectId ID du projet
 * @param filters Filtres optionnels (sprint, date range, etc.)
 * @returns Statistiques agrégées
 */
export async function getTimeStats(
  projectId: string,
  filters?: {
    sprint_id?: string | null
    user_id?: string
    date_from?: string
    date_to?: string
  }
): Promise<{
  total_minutes: number
  by_user: Record<string, number>
  by_category: Record<string, number>
  by_task: Record<string, number>
}> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return {
        total_minutes: 0,
        by_user: {},
        by_category: {},
        by_task: {},
      }
    }

    const timeFilters: TimeEntryFilters = {
      project_id: projectId,
      ...filters,
    }

    const entries = await getTimeEntries(timeFilters)

    const stats = {
      total_minutes: 0,
      by_user: {} as Record<string, number>,
      by_category: {} as Record<string, number>,
      by_task: {} as Record<string, number>,
    }

    entries.forEach((entry) => {
      stats.total_minutes += entry.duration_minutes

      // Par utilisateur
      stats.by_user[entry.user_id] =
        (stats.by_user[entry.user_id] || 0) + entry.duration_minutes

      // Par catégorie
      stats.by_category[entry.category] =
        (stats.by_category[entry.category] || 0) + entry.duration_minutes

      // Par tâche (si liée)
      if (entry.task_id) {
        stats.by_task[entry.task_id] =
          (stats.by_task[entry.task_id] || 0) + entry.duration_minutes
      }
    })

    return stats
  } catch (error) {
    console.error('Unexpected error in getTimeStats:', error)
    return {
      total_minutes: 0,
      by_user: {},
      by_category: {},
      by_task: {},
    }
  }
}

// formatDuration a été déplacé vers lib/time-utils.ts pour éviter les imports serveur dans les composants client
export { formatDuration } from './time-utils'

