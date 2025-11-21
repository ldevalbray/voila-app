'use client'

import { useState, useEffect } from 'react'
import { Epic } from '@/lib/epics'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EpicForm } from './epic-form'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useSprintContext } from '@/components/layout/sprint-context'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { showToast } from '@/lib/toast'
import { EmptyState } from '@/components/layout/empty-state'
import { Layers } from 'lucide-react'

interface EpicsListProps {
  projectId: string
  epics: Epic[]
}

export function EpicsList({ projectId, epics }: EpicsListProps) {
  const t = useTranslations('projects')
  const router = useRouter()
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null)
  const { selectedSprintId } = useSprintContext()
  const [sprintTaskCounts, setSprintTaskCounts] = useState<Record<string, number>>({})

  // Récupérer le nombre de tâches par epic dans le sprint sélectionné
  useEffect(() => {
    const loadSprintTaskCounts = async () => {
      if (!selectedSprintId) {
        setSprintTaskCounts({})
        return
      }

      try {
        const supabase = createSupabaseBrowserClient()
        const epicIds = epics.map((e) => e.id)
        
        if (epicIds.length === 0) {
          setSprintTaskCounts({})
          return
        }

        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('epic_id')
          .eq('project_id', projectId)
          .eq('sprint_id', selectedSprintId)
          .in('epic_id', epicIds)

        if (error) {
          // Erreur silencieuse pour cette opération non-critique
          setSprintTaskCounts({})
          return
        }

        // Compter les tâches par epic
        const counts: Record<string, number> = {}
        tasks?.forEach((task) => {
          if (task.epic_id) {
            counts[task.epic_id] = (counts[task.epic_id] || 0) + 1
          }
        })

        setSprintTaskCounts(counts)
      } catch (error) {
        // Erreur silencieuse pour cette opération non-critique
        setSprintTaskCounts({})
      }
    }

    loadSprintTaskCounts()
  }, [projectId, selectedSprintId, epics])

  const getEpicStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      open: t('epicStatus.open'),
      in_progress: t('epicStatus.in_progress'),
      done: t('epicStatus.done'),
      archived: t('epicStatus.archived'),
    }
    return statusMap[status] || status
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'done':
        return 'default'
      case 'in_progress':
        return 'default'
      case 'archived':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-4">
      {/* Compteur */}
      <div className="text-body-sm text-muted-foreground">
        {epics.length} {t('epicsTotal')}
      </div>

      {/* Liste des epics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('epicsList')}</CardTitle>
        </CardHeader>
        <CardContent>
          {epics.length === 0 ? (
            <EmptyState
              icon={Layers}
              title={t('noEpics') || t('noEpicsFound')}
              description={t('noEpicsDescription') || t('createFirstEpic')}
              action={
                <Button onClick={() => setEditingEpic(null)}>
                  {t('createFirstEpic') || t('newEpic')}
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('title')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>
                    {selectedSprintId ? t('tasksInSprint') : t('tasksCount')}
                  </TableHead>
                  <TableHead>{t('createdAt')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {epics.map((epic) => (
                  <TableRow
                    key={epic.id}
                    className="cursor-pointer"
                    onClick={() => setEditingEpic(epic)}
                  >
                    <TableCell className="font-medium">{epic.title}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(epic.status)}>
                        {getEpicStatusLabel(epic.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {selectedSprintId
                            ? sprintTaskCounts[epic.id] || 0
                            : epic.tasks_count || 0}
                        </Badge>
                        {selectedSprintId && epic.tasks_count !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            / {epic.tasks_count}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(epic.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      {editingEpic && (
        <EpicForm
          projectId={projectId}
          epic={editingEpic}
          open={!!editingEpic}
          onOpenChange={(open) => {
            if (!open) setEditingEpic(null)
          }}
          onSuccess={() => {
            setEditingEpic(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

