'use client'

import { useEffect, useState } from 'react'
import { useSprintContext } from '@/components/layout/sprint-context'
import { TasksList } from '@/components/tasks/tasks-list'
import { SprintPicker } from '@/components/layout/sprint-picker'
import { Task } from '@/lib/tasks'
import { Epic } from '@/lib/epics'
import { useRouter } from 'next/navigation'
import { SkeletonTable } from '@/components/ui/skeleton'
import { showToast } from '@/lib/toast'

interface TasksPageClientProps {
  projectId: string
  initialTasks: Task[]
  epics: Epic[]
  initialStats: {
    total: number
    by_status: Record<string, number>
    open_count: number
  }
  initialFilters?: {
    status?: string[]
    type?: string[]
    epic_id?: string
    search?: string
  }
}

/**
 * Composant client pour la page Tasks qui utilise le contexte sprint
 * pour filtrer les tâches dynamiquement
 */
export function TasksPageClient({
  projectId,
  initialTasks,
  epics,
  initialStats,
  initialFilters,
}: TasksPageClientProps) {
  const { selectedSprintId } = useSprintContext()
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [isLoading, setIsLoading] = useState(false)

  // Recharger les tâches quand le sprint sélectionné change
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true)
      try {
        // Filtrer les tâches selon le sprint sélectionné
        // IMPORTANT: Exclure les tâches sans sprint (backlog) du Kanban/Table
        // Les tâches sans sprint sont gérées par BacklogPanel séparément
        const filteredTasks = initialTasks.filter((task) => {
          // Toujours exclure les tâches sans sprint (backlog) du sprint view
          // Ces tâches sont affichées dans le BacklogPanel
          if (!task.sprint_id) {
            return false
          }
          
          if (selectedSprintId === null) {
            // "Tous les sprints" - afficher toutes les tâches avec un sprint
            return true
          }
          
          // Sprint spécifique sélectionné - afficher seulement les tâches de ce sprint
          return task.sprint_id === selectedSprintId
        })
        console.log('[TasksPageClient] Filtered tasks:', filteredTasks.length, 'from', initialTasks.length, 'initial tasks')
        setTasks(filteredTasks)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des tâches'
        showToast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadTasks()
  }, [projectId, selectedSprintId, initialTasks])

  // Recharger quand les filtres changent (via router.refresh)
  useEffect(() => {
    const handleFocus = () => {
      router.refresh()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [router])

  return (
    <div>
      {/* Tasks List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
          <SkeletonTable rows={5} />
        </div>
      ) : (
        <TasksList
          projectId={projectId}
          tasks={tasks}
          epics={epics}
          stats={initialStats}
          initialFilters={initialFilters}
        />
      )}
    </div>
  )
}

