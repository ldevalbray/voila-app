'use client'

import { useState, useEffect } from 'react'
import { Task } from '@/lib/tasks'
import { Epic } from '@/lib/epics'
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
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/layout/empty-state'
import { ChevronLeft, ChevronRight, Eye, EyeOff, GripVertical, Plus, CheckSquare, PlusCircle, XCircle } from 'lucide-react'
import { TaskTimeBadge } from '@/components/time/task-time-badge'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { getBacklogTasksAction } from '@/lib/actions/tasks'
import { useRouter } from 'next/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface BacklogPanelProps {
  projectId: string
  epics: Epic[]
  isOpen: boolean
  onToggle: () => void
  onTaskClick: (task: Task) => void
  onCreateTask?: () => void
  onTaskMoveToBacklog?: (taskId: string) => void
  onTaskMoveToSprint?: (taskId: string, sprintId: string | null, status?: string) => void
  refreshKey?: number // Clé pour forcer le rafraîchissement
  viewMode?: 'table' | 'kanban' // Mode d'affichage (table ou kanban)
  selectedSprintId?: string | null // Sprint sélectionné pour "add to sprint"
}

/**
 * Panneau backlog qui affiche les tâches sans sprint (sprint_id IS NULL)
 * et avec status != 'done'
 * 
 * Comportement:
 * - Quand ouvert: affiche la liste des tâches du backlog
 * - Quand fermé: affiche un bouton minimal pour rouvrir
 * - Supporte le drag & drop pour réordonner (à implémenter)
 */
export function BacklogPanel({
  projectId,
  epics,
  isOpen,
  onToggle,
  onTaskClick,
  onCreateTask,
  onTaskMoveToBacklog,
  onTaskMoveToSprint,
  refreshKey,
  viewMode = 'kanban', // Par défaut, mode kanban
  selectedSprintId,
}: BacklogPanelProps) {
  const t = useTranslations('projects')
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Charger les tâches du backlog (toujours, même si fermé, pour afficher le badge)
  useEffect(() => {
    const loadBacklogTasks = async () => {
      setIsLoading(true)
      try {
        const result = await getBacklogTasksAction(projectId)
        if (result.error) {
          console.error('Error loading backlog tasks:', result.error)
          setTasks([])
        } else {
          setTasks(result.data)
        }
      } catch (error) {
        console.error('Error loading backlog tasks:', error)
        setTasks([])
      } finally {
        setIsLoading(false)
      }
    }

    loadBacklogTasks()
  }, [projectId, refreshKey]) // Ajouter refreshKey comme dépendance

  // Recharger quand la page est rafraîchie ou après router.refresh()
  useEffect(() => {
    const loadBacklogTasks = async () => {
      try {
        const result = await getBacklogTasksAction(projectId)
        if (result.error) {
          console.error('Error loading backlog tasks:', result.error)
        } else {
          setTasks(result.data)
        }
      } catch (error) {
        console.error('Error loading backlog tasks:', error)
      }
    }

    const handleFocus = () => {
      loadBacklogTasks()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadBacklogTasks()
      }
    }
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [projectId])

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

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.setData('source', 'backlog')
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTask(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    const source = e.dataTransfer.getData('source')
    // Seulement activer l'effet visuel si la tâche vient du sprint (pas du backlog)
    if (source !== 'backlog') {
      e.dataTransfer.dropEffect = 'move'
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Vérifier que l'on quitte vraiment la zone (pas juste un enfant)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const taskId = e.dataTransfer.getData('text/plain')
    const source = e.dataTransfer.getData('source')

    // Si la tâche vient du sprint (source === 'kanban' ou undefined), on la déplace vers le backlog
    if (taskId && source !== 'backlog' && onTaskMoveToBacklog) {
      await onTaskMoveToBacklog(taskId)
    }
  }

  // ==========================================
  // COLLAPSED STATE (Rail)
  // ==========================================
  // Design: Rail interactif fixe de 36px de largeur
  // - Badge circulaire avec count en haut
  // - Texte vertical "BACKLOG" centré
  // - Chevron `›` pour indiquer l'interaction
  // - Background légèrement teinté (muted) pour se démarquer
  // - Hover: background plus foncé + chevron translateX
  // - Focus: outline visible pour accessibilité
  // - Tooltip: "Open backlog (X)" au survol
  if (!isOpen) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                // Layout: rail fixe de 36px, directement adjacent aux tâches
                'flex flex-col h-full',
                'w-9 flex-shrink-0', // 36px fixe
                // Styling: background légèrement teinté, border subtile
                'bg-muted/40 border-r border-border',
                'transition-all duration-200 ease-out',
                // Hover: background plus foncé + effet visuel
                'hover:bg-muted/60 cursor-pointer',
                // Focus: outline visible pour accessibilité clavier
                'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                'focus-visible:ring-2 focus-visible:ring-primary/20',
                'group/backlog-rail'
              )}
              onClick={onToggle}
              role="button"
              tabIndex={0}
              aria-label={`${t('openBacklog') || 'Ouvrir le backlog'} (${tasks.length})`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onToggle()
                }
              }}
            >
              {/* Badge circulaire en haut avec le count */}
              <div className="flex-shrink-0 w-full flex items-center justify-center pt-2.5 pb-1">
                <Badge
                  variant="secondary"
                  className={cn(
                    'h-5 min-w-[20px] px-1.5',
                    'flex items-center justify-center',
                    'text-[10px] font-semibold',
                    'rounded-full', // Badge circulaire
                    'transition-all duration-200',
                    'group-hover/backlog-rail:scale-110'
                  )}
                >
                  {tasks.length}
                </Badge>
              </div>

              {/* Corps du rail: texte vertical "BACKLOG" + chevron */}
              <div className="flex-1 flex items-center justify-center w-full py-4">
                <div className="flex flex-col items-center justify-center gap-2.5">
                  {/* Texte "BACKLOG" tourné à 90° */}
                  <span
                    className={cn(
                      'text-xs font-semibold text-foreground/70',
                      'tracking-widest uppercase',
                      'transition-colors duration-200',
                      'group-hover/backlog-rail:text-foreground',
                      'select-none whitespace-nowrap'
                    )}
                    style={{
                      transform: 'rotate(-90deg)',
                      letterSpacing: '0.15em',
                    }}
                  >
                    {t('backlog') || 'BACKLOG'}
                  </span>

                  {/* Chevron `›` qui bouge au hover */}
                  <ChevronRight
                    className={cn(
                      'h-3.5 w-3.5 text-foreground/50',
                      'transition-all duration-200 ease-out',
                      'group-hover/backlog-rail:text-foreground',
                      'group-hover/backlog-rail:translate-x-0.5' // Translate légèrement à droite au hover
                    )}
                  />
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <p>
              {t('openBacklog') || 'Ouvrir le backlog'} ({tasks.length})
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // ==========================================
  // OPEN STATE (Panel)
  // ==========================================
  // Design: Panel avec header horizontal
  // - Header: "Backlog" + badge count + chevron `‹` pour collapse
  // - Style unifié avec Tasks (même Card, border radius, padding)
  // - Largeur: 35-40% via grid layout dans tasks-split-layout
  // - Pas de label vertical quand ouvert (seulement dans collapsed state)
  return (
    <Card
      className={cn(
        'flex flex-col h-full transition-all duration-200',
        // Feedback visuel pour drag & drop
        isDragOver && 'ring-2 ring-primary ring-offset-2'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header horizontal: "Backlog" + badge + chevron collapse */}
      {/* Style unifié avec CardHeader des Tasks (même padding, typography) */}
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              {t('backlog') || 'Backlog'}
            </CardTitle>
            <Badge variant="secondary" className="text-caption">
              {tasks.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
            aria-label={t('closeBacklog') || 'Fermer le backlog'}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Liste des tâches - Vue Table ou Kanban selon viewMode */}
      <CardContent className={cn(
        'flex-1 overflow-hidden p-0 transition-all duration-200 relative',
        isDragOver && 'bg-primary/5'
      )}>
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-primary/10 border-2 border-dashed border-primary rounded-lg px-4 py-3">
              <p className="text-body-sm font-medium text-primary">
                {t('dropTaskInBacklog') || 'Déposer la tâche dans le backlog'}
              </p>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-caption text-muted-foreground">{t('loading') || 'Chargement...'}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <EmptyState
              icon={Plus}
              title={t('noBacklogTasks') || 'Aucune tâche dans le backlog'}
              description={
                t('noBacklogTasksDescription') ||
                'Créez une nouvelle tâche sans sprint pour l\'ajouter ici.'
              }
              action={
                onCreateTask && (
                  <Button onClick={onCreateTask} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('newTask') || 'Nouvelle tâche'}
                  </Button>
                )
              }
            />
          </div>
        ) : viewMode === 'table' ? (
          // Vue Table (même style que sprint-tasks-view)
          <div
            className="overflow-x-auto scrollbar-thin h-full overflow-y-auto"
            role="region"
            aria-label={t('backlog') || 'Backlog'}
          >
            <div className="min-w-full inline-block align-middle">
              <Table role="table" aria-label={t('backlog') || 'Backlog'}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">{t('taskTitle')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('type')}</TableHead>
                    <TableHead>{t('priority')}</TableHead>
                    <TableHead>{t('epic')}</TableHead>
                    <TableHead className="w-[100px]">{t('time')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-accent/50 group relative',
                        draggedTask === task.id && 'opacity-50'
                      )}
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
                      {onTaskMoveToSprint && selectedSprintId && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="pointer-events-auto bg-background/95 backdrop-blur-sm px-2 py-1 rounded border shadow-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                onTaskMoveToSprint(task.id, selectedSprintId, task.status)
                              }}
                              title={t('addToSprint') || 'Ajouter au sprint'}
                            >
                              <PlusCircle className="h-3.5 w-3.5 mr-1" />
                              {t('addToSprint') || 'Ajouter'}
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
                      <TableCell className="hidden sm:table-cell">
                        <TaskTimeBadge taskId={task.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          // Vue Kanban (cartes)
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tasks.map((task) => (
            <Card
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              onDragEnd={handleDragEnd}
              onClick={() => onTaskClick(task)}
              role="button"
              tabIndex={0}
              aria-label={`${task.title} - Backlog`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onTaskClick(task)
                }
              }}
              className={cn(
                'cursor-pointer transition-all duration-200',
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
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

