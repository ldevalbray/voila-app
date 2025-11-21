'use client'

import { useState, useMemo, useEffect } from 'react'
import { TimeEntry } from '@/lib/time-entries'
import { formatDuration } from '@/lib/time-utils'
import { Task } from '@/lib/tasks'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageToolbar } from '@/components/layout/page-toolbar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CompactFilterButton } from '@/components/ui/compact-filter-button'
import { Plus, User, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TimeEntryForm } from '@/components/time/time-entry-form'
import { useSprintContext } from '@/components/layout/sprint-context'
import { BillingSummaryWidget } from '@/components/invoices/billing-summary-widget'

interface ProjectTimePageClientProps {
  projectId: string
  initialEntries: TimeEntry[]
  tasks: Task[]
  members: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
  }[]
  initialStats: {
    total_minutes: number
    by_user: Record<string, number>
    by_category: Record<string, number>
    by_task: Record<string, number>
  }
  initialFilters: {
    user_id?: string
    category?: string[]
    date_from?: string
    date_to?: string
  }
}

export function ProjectTimePageClient({
  projectId,
  initialEntries,
  tasks,
  members,
  initialStats,
  initialFilters,
}: ProjectTimePageClientProps) {
  const t = useTranslations('projects.timeTracking')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { selectedSprintId } = useSprintContext()

  const [entries, setEntries] = useState(initialEntries)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // État des filtres
  const [selectedUsers, setSelectedUsers] = useState<string[]>(
    initialFilters.user_id ? [initialFilters.user_id] : []
  )
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters.category || []
  )

  // Filtrer les entrées par sprint si un sprint est sélectionné
  useEffect(() => {
    const filterBySprint = async () => {
      if (selectedSprintId) {
        // Récupérer les tâches du sprint
        const sprintTasks = tasks.filter(
          (task) => task.sprint_id === selectedSprintId
        )
        const sprintTaskIds = new Set(sprintTasks.map((t) => t.id))

        // Filtrer les entrées
        const filtered = initialEntries.filter((entry) => {
          // Entrée liée à une tâche du sprint
          if (entry.task_id && sprintTaskIds.has(entry.task_id)) {
            return true
          }
          // Pour les entrées sans tâche, on pourrait aussi filtrer par date du sprint
          // mais pour simplifier, on les exclut si un sprint est sélectionné
          return false
        })
        setEntries(filtered)
      } else {
        setEntries(initialEntries)
      }
    }

    filterBySprint()
  }, [selectedSprintId, initialEntries, tasks])

  // Calculer le total
  const totalMinutes = useMemo(
    () => entries.reduce((sum, e) => sum + e.duration_minutes, 0),
    [entries]
  )

  const categoryLabels: Record<string, string> = {
    project_management: t('categoryLabels.project_management'),
    development: t('categoryLabels.development'),
    documentation: t('categoryLabels.documentation'),
    maintenance_evolution: t('categoryLabels.maintenance_evolution'),
  }

  const getUserName = (user: { first_name: string | null; last_name: string | null; email: string }) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim()
    }
    return user.email
  }

  const updateFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (selectedUsers.length > 0) {
      params.set('user_id', selectedUsers[0])
    } else {
      params.delete('user_id')
    }

    if (selectedCategories.length > 0) {
      params.set('category', selectedCategories.join(','))
    } else {
      params.delete('category')
    }

    router.push(`?${params.toString()}`)
  }

  // Fonctions pour obtenir les labels des filtres
  const getUserFilterLabel = () => {
    if (selectedUsers.length === 0) return t('user')
    if (selectedUsers.length === 1) {
      const member = members.find((m) => m.id === selectedUsers[0])
      return member ? getUserName(member) : t('user')
    }
    return `${selectedUsers.length} ${t('user')}`
  }

  const getCategoryFilterLabel = () => {
    if (selectedCategories.length === 0) return t('category')
    if (selectedCategories.length === 1) {
      return categoryLabels[selectedCategories[0]] || t('category')
    }
    return `${selectedCategories.length} ${t('category')}`
  }

  const filterComponents = [
    <CompactFilterButton
      key="user"
      label={getUserFilterLabel()}
      icon={<User className="h-4 w-4" />}
      active={selectedUsers.length > 0}
    >
      <div className="space-y-2">
        <div
          className="flex items-center space-x-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
          onClick={() => {
            setSelectedUsers([])
            setTimeout(updateFilters, 0)
          }}
        >
          <Checkbox checked={selectedUsers.length === 0} />
          <label className="text-body-sm cursor-pointer flex-1">
            {t('allUsers') || 'Tous les utilisateurs'}
          </label>
        </div>
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center space-x-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
            onClick={() => {
              setSelectedUsers([member.id])
              setTimeout(updateFilters, 0)
            }}
          >
            <Checkbox checked={selectedUsers.includes(member.id)} />
            <label className="text-body-sm cursor-pointer flex-1">
              {getUserName(member)}
            </label>
          </div>
        ))}
      </div>
    </CompactFilterButton>,
    <CompactFilterButton
      key="category"
      label={getCategoryFilterLabel()}
      icon={<Tag className="h-4 w-4" />}
      active={selectedCategories.length > 0}
    >
      <div className="space-y-2">
        {Object.entries(categoryLabels).map(([key, label]) => (
          <div
            key={key}
            className="flex items-center space-x-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
            onClick={() => {
              const newCategories = selectedCategories.includes(key)
                ? selectedCategories.filter((c) => c !== key)
                : [...selectedCategories, key]
              setSelectedCategories(newCategories)
              setTimeout(updateFilters, 0)
            }}
          >
            <Checkbox checked={selectedCategories.includes(key)} />
            <label className="text-body-sm cursor-pointer flex-1">
              {label}
            </label>
          </div>
        ))}
      </div>
    </CompactFilterButton>,
  ]

  // Filtrer les tâches par sprint si un sprint est sélectionné
  const availableTasks = selectedSprintId
    ? tasks.filter((task) => task.sprint_id === selectedSprintId)
    : tasks

  return (
    <div className="space-y-6">
      <PageToolbar
        filters={filterComponents}
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t('logTime')}
          </Button>
        }
      />

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('totalTime')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalMinutes)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('byUser')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(initialStats.by_user)
                .slice(0, 3)
                .map(([userId, minutes]) => {
                  const user = members.find((m) => m.id === userId)
                  return (
                    <div key={userId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate">
                        {user ? getUserName(user) : userId}
                      </span>
                      <span className="font-medium">{formatDuration(minutes)}</span>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('byCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(initialStats.by_category).map(([category, minutes]) => (
                <div key={category} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {categoryLabels[category] || category}
                  </span>
                  <span className="font-medium">{formatDuration(minutes)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing summary (compact) */}
      <BillingSummaryWidget projectId={projectId} compact />

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('projectTime')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-body-sm text-muted-foreground">
                {t('noTimeEntriesDescription')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('date')}</TableHead>
                    <TableHead>{t('user')}</TableHead>
                    <TableHead>{t('task')}</TableHead>
                    <TableHead>{t('category')}</TableHead>
                    <TableHead>{t('duration')}</TableHead>
                    <TableHead>{t('notes')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        {entry.user
                          ? getUserName(entry.user)
                          : entry.user_id}
                      </TableCell>
                      <TableCell>
                        {entry.task ? (
                          <span className="text-sm">{entry.task.title}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {t('noTask')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {categoryLabels[entry.category] || entry.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatDuration(entry.duration_minutes)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {entry.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de création */}
      <TimeEntryForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projects={[{ id: projectId, name: 'Current Project' }]}
        tasks={availableTasks}
        initialData={{
          project_id: projectId,
        }}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}

