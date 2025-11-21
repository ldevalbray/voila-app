'use client'

import { useState, useMemo, useEffect } from 'react'
import { Task } from '@/lib/tasks'
import { Epic } from '@/lib/epics'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { Plus, Eye, EyeOff, X, Table2, LayoutGrid, ChevronDown, Search, CheckSquare } from 'lucide-react'
import { TaskForm } from './task-form'
import { TasksKanbanView } from './tasks-kanban-view'
import { TaskDrawer } from './task-drawer'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SprintPicker } from '@/components/layout/sprint-picker'
import { TaskTimeBadge } from '@/components/time/task-time-badge'
import { EmptyState } from '@/components/layout/empty-state'
import { useProjectContext } from '@/components/layout/project-context'

const TASKS_VIEW_KEY = 'voila_tasks_view'

interface TasksListProps {
  projectId: string
  tasks: Task[]
  epics: Epic[]
  stats: {
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

export function TasksList({
  projectId,
  tasks,
  epics,
  stats,
  initialFilters,
}: TasksListProps) {
  const t = useTranslations('projects')
  const router = useRouter()
  const searchParams = useSearchParams()
  const project = useProjectContext()
  
  // Helpers pour les traductions dynamiques
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

  // État pour la vue (table/kanban) avec persistance localStorage
  const [view, setView] = useState<'table' | 'kanban'>('table')
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem(TASKS_VIEW_KEY) as 'table' | 'kanban' | null
      if (savedView === 'table' || savedView === 'kanban') {
        setView(savedView)
      }
    }
  }, [])

  const handleViewChange = (newView: 'table' | 'kanban') => {
    setView(newView)
    if (typeof window !== 'undefined') {
      localStorage.setItem(TASKS_VIEW_KEY, newView)
    }
  }

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState(initialFilters?.search || '')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string[]>(
    initialFilters?.status || []
  )
  const [typeFilter, setTypeFilter] = useState<string[]>(
    initialFilters?.type || []
  )
  const [epicFilter, setEpicFilter] = useState<string | 'all' | 'none'>(
    initialFilters?.epic_id === undefined
      ? 'all'
      : initialFilters.epic_id === null
        ? 'none'
        : initialFilters.epic_id
  )

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    updateFilters({ search: query || undefined })
  }

  const handleStatusFilter = (status: string) => {
    const newStatus = statusFilter.includes(status)
      ? statusFilter.filter((s) => s !== status)
      : [...statusFilter, status]
    setStatusFilter(newStatus)
    updateFilters({ status: newStatus.length > 0 ? newStatus : undefined })
  }

  const handleTypeFilter = (type: string) => {
    const newType = typeFilter.includes(type)
      ? typeFilter.filter((t) => t !== type)
      : [...typeFilter, type]
    setTypeFilter(newType)
    updateFilters({ type: newType.length > 0 ? newType : undefined })
  }

  const handleEpicFilter = (epicId: string) => {
    setEpicFilter(epicId)
    updateFilters({
      epic_id:
        epicId === 'all' ? undefined : epicId === 'none' ? null : epicId,
    })
  }

  const updateFilters = (updates: {
    status?: string[]
    type?: string[]
    epic_id?: string | null | undefined
    search?: string
  }) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (updates.status && updates.status.length > 0) {
      params.set('status', updates.status.join(','))
    } else {
      params.delete('status')
    }

    if (updates.type && updates.type.length > 0) {
      params.set('type', updates.type.join(','))
    } else {
      params.delete('type')
    }

    if (updates.epic_id !== undefined) {
      if (updates.epic_id === null) {
        params.set('epic_id', 'none')
      } else if (updates.epic_id) {
        params.set('epic_id', updates.epic_id)
      } else {
        params.delete('epic_id')
      }
    }

    if (updates.search) {
      params.set('search', updates.search)
    } else {
      params.delete('search')
    }

    router.push(`?${params.toString()}`)
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

  // Calculer les compteurs de type depuis toutes les tâches du projet
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      bug: 0,
      new_feature: 0,
      improvement: 0,
    }
    // Utiliser toutes les tâches du projet pour les compteurs (pas seulement les tâches filtrées)
    // On récupère le nombre depuis les tâches déjà chargées
    // Note: Pour une vraie implémentation, il faudrait récupérer toutes les tâches non filtrées
    // Pour l'instant, on utilise les tâches disponibles comme approximation
    tasks.forEach((task) => {
      if (task.type in counts) {
        counts[task.type]++
      }
    })
    return counts
  }, [tasks])

  // Vérifier si des filtres sont actifs
  const hasActiveFilters =
    searchQuery.length > 0 ||
    statusFilter.length > 0 ||
    typeFilter.length > 0 ||
    epicFilter !== 'all'

  // Fonction pour réinitialiser tous les filtres
  const handleResetFilters = () => {
    setSearchQuery('')
    setStatusFilter([])
    setTypeFilter([])
    setEpicFilter('all')
    updateFilters({
      search: undefined,
      status: undefined,
      type: undefined,
      epic_id: undefined,
    })
  }

  // Récupérer le label de l'épopée sélectionnée
  const getEpicLabel = (epicId: string | 'all' | 'none') => {
    if (epicId === 'all') return t('allEpics')
    if (epicId === 'none') return t('noEpic')
    const epic = epics.find((e) => e.id === epicId)
    return epic ? epic.title : ''
  }

  // Nouveaux handlers pour multi-select
  const handleStatusMultiSelect = (status: string, checked: boolean) => {
    const newStatus = checked
      ? [...statusFilter, status]
      : statusFilter.filter((s) => s !== status)
    setStatusFilter(newStatus)
    updateFilters({ status: newStatus.length > 0 ? newStatus : undefined })
  }

  const handleTypeMultiSelect = (type: string, checked: boolean) => {
    const newType = checked
      ? [...typeFilter, type]
      : typeFilter.filter((t) => t !== type)
    setTypeFilter(newType)
    updateFilters({ type: newType.length > 0 ? newType : undefined })
  }

  // Calculer le label du multi-select statut
  const getStatusSelectLabel = () => {
    if (statusFilter.length === 0) return t('filterStatus')
    if (statusFilter.length === 1) return getTaskStatusLabel(statusFilter[0])
    return `${statusFilter.length} ${t('filterStatus')}`
  }

  // Calculer le label du multi-select type
  const getTypeSelectLabel = () => {
    if (typeFilter.length === 0) return t('filterType')
    if (typeFilter.length === 1) return getTaskTypeLabel(typeFilter[0])
    return `${typeFilter.length} ${t('filterType')}`
  }

  // Préparer les filtres pour PageToolbar
  const filterComponents = [
    // Filtre Statut
    <Popover key="status">
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 text-body-sm justify-between min-w-[120px] max-w-[160px] flex-shrink-0',
            statusFilter.length > 0 && 'bg-accent'
          )}
        >
          <span className="truncate">{getStatusSelectLabel()}</span>
          <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-2">
          {['todo', 'in_progress', 'blocked', 'waiting_for_client', 'done'].map((status) => (
            <div
              key={status}
              className="flex items-center space-x-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
              onClick={() => handleStatusMultiSelect(status, !statusFilter.includes(status))}
            >
              <Checkbox
                checked={statusFilter.includes(status)}
                onCheckedChange={(checked) => handleStatusMultiSelect(status, !!checked)}
              />
              <label className="text-body-sm cursor-pointer flex-1 flex items-center justify-between">
                <span>{getTaskStatusLabel(status)}</span>
                <span className="ml-2 text-caption text-muted-foreground">
                  ({stats.by_status[status] || 0})
                </span>
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>,
    // Filtre Type
    <Popover key="type">
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 text-body-sm justify-between min-w-[120px] max-w-[160px] flex-shrink-0',
            typeFilter.length > 0 && 'bg-accent'
          )}
        >
          <span className="truncate">{getTypeSelectLabel()}</span>
          <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-2">
          {['bug', 'new_feature', 'improvement'].map((type) => (
            <div
              key={type}
              className="flex items-center space-x-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
              onClick={() => handleTypeMultiSelect(type, !typeFilter.includes(type))}
            >
              <Checkbox
                checked={typeFilter.includes(type)}
                onCheckedChange={(checked) => handleTypeMultiSelect(type, !!checked)}
              />
              <label className="text-body-sm cursor-pointer flex-1 flex items-center justify-between">
                <span>{getTaskTypeLabel(type)}</span>
                <span className="ml-2 text-caption text-muted-foreground">
                  ({typeCounts[type] || 0})
                </span>
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>,
    // Filtre Epic
    <Select key="epic" value={epicFilter} onValueChange={handleEpicFilter}>
      <SelectTrigger className="h-9 text-body-sm min-w-[160px] max-w-[200px] flex-shrink-0">
        <SelectValue placeholder={t('epics')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t('allEpics')}</SelectItem>
        <SelectItem value="none">{t('noEpic')}</SelectItem>
        {epics.map((epic) => (
          <SelectItem key={epic.id} value={epic.id}>
            {epic.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>,
    // Filtre Sprint
    <SprintPicker key="sprint" compact />,
  ]

  // Switch de vue
  const viewSwitcher = (
    <SegmentedControl
      value={view}
      onValueChange={(value) => handleViewChange(value as 'table' | 'kanban')}
      options={[
        {
          value: 'table',
          label: (
            <span className="flex items-center gap-1.5">
              <Table2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('tableView')}</span>
            </span>
          ),
        },
        {
          value: 'kanban',
          label: (
            <span className="flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('kanbanView')}</span>
            </span>
          ),
        },
      ]}
      size="md"
      className="border-border bg-background"
    />
  )

  return (
    <div className="space-y-3">
      {/* Barre d'outils avec PageToolbar */}
      <PageToolbar
        breadcrumbs={[
          { label: t('home'), href: '/app' },
          { label: t('projects'), href: '/app/projects' },
          ...(project ? [{ label: project.name, href: `/app/projects/${projectId}/overview` }] : []),
          { label: t('tasks') },
        ]}
        search={{
          placeholder: t('searchTasks'),
          value: searchQuery,
          onChange: handleSearch,
          onClear: () => {
            setSearchQuery('')
            updateFilters({ search: undefined })
          },
          expanded: isSearchExpanded,
          onExpandedChange: setIsSearchExpanded,
        }}
        filters={filterComponents}
        viewSwitcher={viewSwitcher}
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="flex-shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            {t('newTask')}
          </Button>
        }
      />

      {/* Filtres actifs - ligne séparée si actifs (optionnel et compact) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border/50">
          {searchQuery && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 px-2 py-0.5 cursor-pointer hover:bg-secondary/80 transition-all duration-200 ease-out text-caption h-6"
              onClick={() => {
                setSearchQuery('')
                updateFilters({ search: undefined })
              }}
            >
              <Search className="h-3 w-3" />
              <span>{searchQuery}</span>
              <X className="h-3 w-3 transition-transform hover:rotate-90" />
            </Badge>
          )}
          {statusFilter.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="flex items-center gap-1.5 px-2 py-0.5 cursor-pointer hover:bg-secondary/80 transition-all duration-200 ease-out text-caption h-6"
              onClick={() => handleStatusFilter(status)}
            >
              <span>{getTaskStatusLabel(status)}</span>
              <X className="h-3 w-3 transition-transform hover:rotate-90" />
            </Badge>
          ))}
          {typeFilter.map((type) => (
            <Badge
              key={type}
              variant="secondary"
              className="flex items-center gap-1.5 px-2 py-0.5 cursor-pointer hover:bg-secondary/80 transition-all duration-200 ease-out text-caption h-6"
              onClick={() => handleTypeFilter(type)}
            >
              <span>{getTaskTypeLabel(type)}</span>
              <X className="h-3 w-3 transition-transform hover:rotate-90" />
            </Badge>
          ))}
          {epicFilter !== 'all' && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 px-2 py-0.5 cursor-pointer hover:bg-secondary/80 transition-all duration-200 ease-out text-caption h-6"
              onClick={() => handleEpicFilter('all')}
            >
              <span>{getEpicLabel(epicFilter)}</span>
              <X className="h-3 w-3 transition-transform hover:rotate-90" />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-6 text-caption ml-auto"
          >
            {t('resetFilters')}
          </Button>
        </div>
      )}

      {/* Liste des tâches - Table ou Kanban selon la vue */}
      {view === 'kanban' ? (
        <div className="space-y-4">
          <TasksKanbanView
            projectId={projectId}
            tasks={tasks}
            epics={epics}
            stats={stats}
            onTaskClick={setEditingTask}
          />
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t('tasksList')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {tasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title={hasActiveFilters ? t('noTasksFound') : t('noTasks')}
                description={
                  hasActiveFilters
                    ? t('noTasksFoundDescription') || t('noTasksFound')
                    : t('noTasksDescription') || t('createFirstTaskDescription')
                }
                action={
                  !hasActiveFilters && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('createFirstTask') || t('newTask')}
                    </Button>
                  )
                }
              />
            ) : (
              <div className="overflow-x-auto scrollbar-thin" role="region" aria-label={t('tasksList')}>
                <div className="min-w-full inline-block align-middle">
                  <Table role="table" aria-label={t('tasksTable')}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">{t('title')}</TableHead>
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
                        className="cursor-pointer transition-colors hover:bg-accent/50 group"
                        onClick={() => setEditingTask(task)}
                        role="row"
                        tabIndex={0}
                        aria-label={`${task.title} - ${getTaskStatusLabel(task.status)}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setEditingTask(task)
                          }
                        }}
                      >
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
                            <Badge variant="secondary" className="text-xs max-w-[150px] truncate">
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
                            <Eye className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" aria-label={t('visibleToClient')} />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" aria-label={t('notVisibleToClient')} />
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
      )}

      {/* Dialog de création */}
      <TaskForm
        projectId={projectId}
        epics={epics}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          router.refresh()
        }}
      />

      {/* Drawer d'édition inline */}
      <TaskDrawer
        task={editingTask}
        epics={epics}
        open={!!editingTask}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null)
        }}
      />
    </div>
  )
}

