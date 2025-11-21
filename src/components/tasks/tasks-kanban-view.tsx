'use client'

import { useState } from 'react'
import { Task } from '@/lib/tasks'
import { Epic } from '@/lib/epics'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, GripVertical } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { updateTask } from '@/lib/actions/tasks'
import { useRouter } from 'next/navigation'
import { showToast } from '@/lib/toast'

interface TasksKanbanViewProps {
  projectId: string
  tasks: Task[]
  epics: Epic[]
  stats: {
    total: number
    by_status: Record<string, number>
    open_count: number
  }
  onTaskClick: (task: Task) => void
  selectedSprintId?: string | null
  onTaskMoveToSprint?: (taskId: string, sprintId: string | null, status: TaskStatus) => void
}

type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'waiting_for_client' | 'done'

export function TasksKanbanView({
  projectId,
  tasks,
  epics,
  stats,
  onTaskClick,
  selectedSprintId,
  onTaskMoveToSprint,
}: TasksKanbanViewProps) {
  const t = useTranslations('projects')
  const router = useRouter()
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

  // Helpers pour les traductions
  const getTaskStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      todo: t('taskStatus.todo'),
      in_progress: t('taskStatus.in_progress'),
      blocked: t('taskStatus.blocked'),
      waiting_for_client: t('taskStatus.waiting_for_client'),
      done: t('taskStatus.done'),
    }
    return statusMap[status] || status
  }

  const getTaskTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      bug: t('taskType.bug'),
      new_feature: t('taskType.new_feature'),
      improvement: t('taskType.improvement'),
    }
    return typeMap[type] || type
  }

  const getTaskPriorityLabel = (priority: string) => {
    const priorityMap: Record<string, string> = {
      low: t('taskPriority.low'),
      medium: t('taskPriority.medium'),
      high: t('taskPriority.high'),
      urgent: t('taskPriority.urgent'),
    }
    return priorityMap[priority] || priority
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'done':
        return 'default'
      case 'in_progress':
        return 'default'
      case 'blocked':
        return 'destructive'
      case 'waiting_for_client':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  // Grouper les tâches par statut
  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    blocked: tasks.filter((t) => t.status === 'blocked'),
    waiting_for_client: tasks.filter((t) => t.status === 'waiting_for_client'),
    done: tasks.filter((t) => t.status === 'done'),
  }

  const columns: { id: TaskStatus; label: string }[] = [
    { id: 'todo', label: getTaskStatusLabel('todo') },
    { id: 'in_progress', label: getTaskStatusLabel('in_progress') },
    { id: 'blocked', label: getTaskStatusLabel('blocked') },
    { id: 'waiting_for_client', label: getTaskStatusLabel('waiting_for_client') },
    { id: 'done', label: getTaskStatusLabel('done') },
  ]

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.setData('source', 'kanban')
    // Optionnel: ajouter un style visuel
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTask(null)
    setDragOverColumn(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault()
    setDragOverColumn(null)

    const taskId = e.dataTransfer.getData('text/plain')
    const source = e.dataTransfer.getData('source') // 'backlog' ou 'kanban'
    
    if (!taskId) return

    // Si la tâche vient du backlog, on doit la récupérer depuis l'API
    // ou la passer depuis le parent
    const task = tasks.find((t) => t.id === taskId)
    
    // Si la tâche vient du backlog (source === 'backlog'), on doit:
    // 1. Mettre à jour sprint_id (sera géré par le parent via onTaskMoveToSprint)
    // 2. Mettre à jour le statut
    if (source === 'backlog') {
      // La tâche vient du backlog, on doit mettre à jour sprint_id et status
      if (onTaskMoveToSprint && selectedSprintId) {
        onTaskMoveToSprint(taskId, selectedSprintId, newStatus)
      } else if (onTaskMoveToSprint && selectedSprintId === null) {
        // "Tous les sprints" sélectionné - on ne peut pas déplacer depuis backlog
        showToast.error(t('cannotMoveToAllSprints') || 'Impossible de déplacer vers "Tous les sprints"')
      }
      setDraggedTask(null)
      return
    }

    // Tâche existante dans le sprint: mise à jour du statut uniquement
    if (!task || task.status === newStatus) {
      setDraggedTask(null)
      return
    }

    // Mettre à jour le statut
    try {
      const result = await updateTask({
        id: taskId,
        status: newStatus,
      })

      if (result.error) {
        showToast.error(result.error)
      } else {
        showToast.success(t('taskUpdated'))
        router.refresh()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('error')
      showToast.error(errorMessage)
    }

    setDraggedTask(null)
  }

  return (
    <div 
      className="flex gap-4 overflow-x-auto pb-4"
      role="application"
      aria-label={t('kanbanBoard')}
      aria-describedby="kanban-description"
    >
      <span id="kanban-description" className="sr-only">
        {t('kanbanBoardDescription')}
      </span>
      {columns.map((column) => {
        const columnTasks = tasksByStatus[column.id]
        const isDragOver = dragOverColumn === column.id

        return (
          <div
            key={column.id}
            className={cn(
              'flex min-w-[280px] max-w-[320px] flex-shrink-0 flex-col',
              'rounded-lg border bg-card transition-all duration-200',
              'h-[calc(100vh-280px)] max-h-[800px]',
              'sm:min-w-[240px] sm:max-w-[280px]',
              // Feedback visuel DnD: highlight la colonne quand on drag depuis backlog ou sprint
              isDragOver && 'ring-2 ring-primary ring-offset-2 scale-[1.02] bg-primary/5'
            )}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
            role="region"
            aria-label={`${column.label} - ${columnTasks.length} ${t('tasks')}`}
          >
            {/* Header de la colonne */}
            <div className="flex-shrink-0 border-b bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-body-sm font-semibold">{column.label}</span>
                <Badge variant="secondary" className="ml-2 text-caption">
                  {columnTasks.length}
                </Badge>
              </div>
            </div>

            {/* Liste des tâches */}
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {columnTasks.length === 0 ? (
                <div className="flex h-full items-center justify-center py-8 text-center text-caption text-muted-foreground">
                  <span>{t('noTasks')}</span>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onTaskClick(task)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${task.title} - ${getTaskStatusLabel(task.status)}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onTaskClick(task)
                      }
                    }}
                    className={cn(
                      'cursor-move transition-all duration-200',
                      'hover:shadow-md hover:scale-[1.01]',
                      'active:scale-[0.99]',
                      'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                      draggedTask === task.id && 'opacity-50 scale-95'
                    )}
                  >
                    <CardContent className="p-3">
                      {/* Header de la tâche */}
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h4 className="flex-1 text-body-sm font-medium leading-tight line-clamp-2">
                          {task.title}
                        </h4>
                        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
                      </div>

                      {/* Badges */}
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          {getTaskTypeLabel(task.type)}
                        </Badge>
                        <Badge
                          variant={getPriorityBadgeVariant(task.priority)}
                          className="text-caption"
                        >
                          {getTaskPriorityLabel(task.priority)}
                        </Badge>
                      </div>

                      {/* Métadonnées */}
                      <div className="mt-2 flex items-center justify-between gap-2 text-caption text-muted-foreground">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {task.epic && (
                            <Badge variant="secondary" className="text-xs truncate max-w-full">
                              {task.epic.title}
                            </Badge>
                          )}
                          {task.estimate_bucket && (
                            <span className="text-caption shrink-0">{task.estimate_bucket}</span>
                          )}
                        </div>
                        {task.is_client_visible ? (
                          <Eye className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 shrink-0 opacity-50" />
                        )}
                      </div>

                      {/* Description tronquée */}
                      {task.description && (
                        <p className="mt-2 line-clamp-2 text-caption text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

