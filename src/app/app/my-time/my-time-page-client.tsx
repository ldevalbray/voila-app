'use client'

import { useState, useMemo } from 'react'
import { TimeEntry } from '@/lib/time-entries'
import { formatDuration } from '@/lib/time-utils'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Calendar, ChevronDown, FolderKanban, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TimeEntryForm } from '@/components/time/time-entry-form'

interface MyTimePageClientProps {
  initialEntries: TimeEntry[]
  projects: { id: string; name: string }[]
  initialFilters: {
    date_from?: string
    date_to?: string
    project_id?: string
    category?: string[]
  }
}

export function MyTimePageClient({
  initialEntries,
  projects,
  initialFilters,
}: MyTimePageClientProps) {
  const t = useTranslations('projects.timeTracking')
  const router = useRouter()
  const searchParams = useSearchParams()

  const [entries] = useState(initialEntries)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // État des filtres
  const [dateFrom, setDateFrom] = useState(initialFilters.date_from || '')
  const [dateTo, setDateTo] = useState(initialFilters.date_to || '')
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    initialFilters.project_id ? [initialFilters.project_id] : []
  )
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters.category || []
  )

  // Calculer le total
  const totalMinutes = useMemo(
    () => entries.reduce((sum, e) => sum + e.duration_minutes, 0),
    [entries]
  )

  // Répartition par projet
  const byProject = useMemo(() => {
    const map = new Map<string, number>()
    entries.forEach((entry) => {
      const key = entry.project?.name || 'Unknown'
      map.set(key, (map.get(key) || 0) + entry.duration_minutes)
    })
    return Object.fromEntries(map)
  }, [entries])

  // Répartition par catégorie
  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    entries.forEach((entry) => {
      map.set(
        entry.category,
        (map.get(entry.category) || 0) + entry.duration_minutes
      )
    })
    return Object.fromEntries(map)
  }, [entries])

  const categoryLabels: Record<string, string> = {
    project_management: t('categoryLabels.project_management'),
    development: t('categoryLabels.development'),
    documentation: t('categoryLabels.documentation'),
    maintenance_evolution: t('categoryLabels.maintenance_evolution'),
  }

  const updateFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (dateFrom) params.set('date_from', dateFrom)
    else params.delete('date_from')

    if (dateTo) params.set('date_to', dateTo)
    else params.delete('date_to')

    if (selectedProjects.length > 0) {
      params.set('project_id', selectedProjects[0])
    } else {
      params.delete('project_id')
    }

    if (selectedCategories.length > 0) {
      params.set('category', selectedCategories.join(','))
    } else {
      params.delete('category')
    }

    router.push(`?${params.toString()}`)
  }

  const handleDateRangePreset = (preset: string) => {
    const today = new Date()
    let from: Date
    let to: Date

    switch (preset) {
      case 'thisWeek': {
        const dayOfWeek = today.getDay()
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        from = new Date(today.setDate(diff))
        from.setHours(0, 0, 0, 0)
        to = new Date(from)
        to.setDate(from.getDate() + 6)
        to.setHours(23, 59, 59, 999)
        break
      }
      case 'lastWeek': {
        const dayOfWeek = today.getDay()
        const diff = today.getDate() - dayOfWeek - 6
        from = new Date(today.setDate(diff))
        from.setHours(0, 0, 0, 0)
        to = new Date(from)
        to.setDate(from.getDate() + 6)
        to.setHours(23, 59, 59, 999)
        break
      }
      case 'thisMonth': {
        from = new Date(today.getFullYear(), today.getMonth(), 1)
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        to.setHours(23, 59, 59, 999)
        break
      }
      case 'lastMonth': {
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        to = new Date(today.getFullYear(), today.getMonth(), 0)
        to.setHours(23, 59, 59, 999)
        break
      }
      default:
        return
    }

    setDateFrom(from.toISOString().split('T')[0])
    setDateTo(to.toISOString().split('T')[0])
    setTimeout(updateFilters, 0)
  }

  const filterComponents = [
    <Popover key="dateRange">
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 text-body-sm">
          <Calendar className="mr-2 h-4 w-4" />
          {t('dateRange')}
          <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('from')}</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('to')}</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDateRangePreset('thisWeek')}
            >
              {t('thisWeek')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDateRangePreset('lastWeek')}
            >
              {t('lastWeek')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDateRangePreset('thisMonth')}
            >
              {t('thisMonth')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDateRangePreset('lastMonth')}
            >
              {t('lastMonth')}
            </Button>
          </div>
          <Button onClick={updateFilters} size="sm" className="w-full">
            {t('apply') || 'Appliquer'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>,
    <CompactFilterButton
      key="project"
      label={getProjectFilterLabel()}
      icon={<FolderKanban className="h-4 w-4" />}
      active={selectedProjects.length > 0}
    >
      <div className="space-y-2">
        <div
          className="flex items-center space-x-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
          onClick={() => {
            setSelectedProjects([])
            setTimeout(updateFilters, 0)
          }}
        >
          <Checkbox checked={selectedProjects.length === 0} />
          <label className="text-body-sm cursor-pointer flex-1">
            {t('allProjects') || 'Tous les projets'}
          </label>
        </div>
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex items-center space-x-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
            onClick={() => {
              setSelectedProjects([project.id])
              setTimeout(updateFilters, 0)
            }}
          >
            <Checkbox checked={selectedProjects.includes(project.id)} />
            <label className="text-body-sm cursor-pointer flex-1">
              {project.name}
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
            <CardTitle className="text-sm font-medium">{t('byProject')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(byProject).slice(0, 3).map(([project, minutes]) => (
                <div key={project} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate">{project}</span>
                  <span className="font-medium">{formatDuration(minutes)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('byCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(byCategory).map(([category, minutes]) => (
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

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
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
                    <TableHead>{t('project')}</TableHead>
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
                      <TableCell>{entry.project?.name || '—'}</TableCell>
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
        projects={projects}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}

