'use client'

import { Task } from '@/lib/tasks'
import { Epic } from '@/lib/epics'
import { TasksKanbanView } from './tasks-kanban-view'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/layout/empty-state'
import { CheckSquare, Eye, EyeOff, XCircle, PlusCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { TaskTimeBadge } from '@/components/time/task-time-badge'
import { Button } from '@/components/ui/button'

interface SprintTasksViewProps {
  projectId: string
  tasks: Task[]
  epics: Epic[]
  stats: {
    total: number
    by_status: Record<string, number>
    open_count: number
  }
  viewMode: 'table' | 'kanban'
  onTaskClick: (task: Task) => void
  hasActiveFilters: boolean
  selectedSprintId?: string | null
  onTaskMoveToSprint?: (taskId: string, sprintId: string | null, status?: string) => void
  onTaskMoveToBacklog?: (taskId: string) => void
}

/**
 * Composant qui affiche les tâches du sprint en mode Table ou Kanban
 * Ce composant est utilisé dans le layout à deux colonnes (backlog + sprint)
 * et doit reproduire exactement le comportement actuel quand utilisé seul
 */
export function SprintTasksView({
  projectId,
  tasks,
  epics,
  stats,
  viewMode,
  onTaskClick,
  hasActiveFilters,
  selectedSprintId,
  onTaskMoveToSprint,
  onTaskMoveToBacklog,
}: SprintTasksViewProps) {
  const t = useTranslations('projects')

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

  if (viewMode === 'kanban') {
    return (
      <div className="space-y-4">
        <TasksKanbanView
          projectId={projectId}
          tasks={tasks}
          epics={epics}
          stats={stats}
          onTaskClick={onTaskClick}
          selectedSprintId={selectedSprintId}
          onTaskMoveToSprint={onTaskMoveToSprint}
        />
      </div>
    )
  }

  // Mode Table
  // ==========================================
  // Design unifié avec BacklogPanel:
  // - Même Card component avec même border radius
  // - Même CardHeader avec même padding (pb-3)
  // - Même CardTitle typography (text-base font-semibold)
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-base font-semibold">{t('tasksList')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <EmptyState
              icon={CheckSquare}
              title={hasActiveFilters ? t('noTasksFound') : t('noTasks')}
              description={
                hasActiveFilters
                  ? t('noTasksFoundDescription') || t('noTasksFound')
                  : t('noTasksDescription') || t('createFirstTaskDescription')
              }
            />
          </div>
        ) : (
          <div
            className="overflow-x-auto scrollbar-thin h-full overflow-y-auto"
            role="region"
            aria-label={t('tasksList')}
          >
            <div className="min-w-full inline-block align-middle">
              <Table role="table" aria-label={t('tasksTable')}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">{t('taskTitle')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('type')}</TableHead>
                    <TableHead>{t('priority')}</TableHead>
                    <TableHead>{t('epic')}</TableHead>
                    <TableHead>{t('estimate')}</TableHead>
                    <TableHead className="w-[100px]">{t('time')}</TableHead>
                    <TableHead className="w-[80px]">{t('clientVisible')}</TableHead>
                    <TableHead className="w-[100px]">{t('createdAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className="cursor-pointer transition-colors hover:bg-accent/50 group relative"
                      onClick={() => onTaskClick(task)}
                      role="row"
                      tabIndex={0}
                      aria-label={`${task.title} - ${getTaskStatusLabel(task.status)}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onTaskClick(task)
                        }
                      }}
                    >
                      {/* Actions au hover - overlay absolu sur toute la ligne */}
                      {onTaskMoveToBacklog && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="pointer-events-auto bg-background/95 backdrop-blur-sm px-2 py-1 rounded border shadow-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                onTaskMoveToBacklog(task.id)
                              }}
                              title={t('removeFromSprint') || 'Retirer du sprint'}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              {t('removeFromSprint') || 'Retirer'}
                            </Button>
                          </div>
                        </div>
                      )}
                      <TableCell className="font-medium">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="line-clamp-1 block">{task.title}</span>
                            <div className="flex items-center gap-2 mt-1 sm:hidden">
                              <Badge
                                variant={getStatusBadgeVariant(task.status)}
                                className="text-caption"
                              >
                                {getTaskStatusLabel(task.status)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {getTaskTypeLabel(task.type)}
                              </Badge>
                            </div>
                          </div>
                          <div className="hidden sm:flex">
                            <TaskTimeBadge taskId={task.id} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant={getStatusBadgeVariant(task.status)}
                          className="text-caption"
                        >
                          {getTaskStatusLabel(task.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {getTaskTypeLabel(task.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge
                          variant={getPriorityBadgeVariant(task.priority)}
                          className="text-caption"
                        >
                          {getTaskPriorityLabel(task.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {task.epic ? (
                          <Badge
                            variant="secondary"
                            className="text-xs max-w-[150px] truncate"
                          >
                            {task.epic.title}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-caption">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {task.estimate_bucket ? (
                          <Badge variant="outline" className="text-xs">
                            {task.estimate_bucket}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-caption">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <TaskTimeBadge taskId={task.id} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {task.is_client_visible ? (
                          <Eye
                            className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors"
                            aria-label={t('visibleToClient')}
                          />
                        ) : (
                          <EyeOff
                            className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors"
                            aria-label={t('notVisibleToClient')}
                          />
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-caption text-muted-foreground">
                        {new Date(task.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

