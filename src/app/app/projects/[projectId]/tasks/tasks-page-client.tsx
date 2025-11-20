'use client'

import { useEffect, useState } from 'react'
import { useSprintContext } from '@/components/layout/sprint-context'
import { TasksList } from '@/components/tasks/tasks-list'
import { SprintPicker } from '@/components/layout/sprint-picker'
import { Task } from '@/lib/tasks'
import { Epic } from '@/lib/epics'
import { useRouter } from 'next/navigation'
import { LoadingSpinner, SkeletonTable } from '@/components/ui/skeleton'
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
        // Utiliser fetch pour appeler l'API route ou recharger la page
        // Pour l'instant, on filtre côté client
        const filteredTasks = initialTasks.filter((task) => {
          if (selectedSprintId === null) {
            // "Tous les sprints" - pas de filtre
            return true
          }
          return task.sprint_id === selectedSprintId
        })
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
    <div className="space-y-4">
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

