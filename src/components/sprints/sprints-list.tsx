'use client'

import { useState } from 'react'
import { Sprint } from '@/lib/sprints'
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
import { SprintForm } from './sprint-form'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { deleteSprint } from '@/lib/actions/sprints-actions'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface SprintsListProps {
  projectId: string
  sprints: Sprint[]
}

export function SprintsList({ projectId, sprints }: SprintsListProps) {
  const t = useTranslations('projects')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null)
  const [deletingSprintId, setDeletingSprintId] = useState<string | null>(null)

  const getSprintStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      planned: t('sprintStatus.planned'),
      active: t('sprintStatus.active'),
      completed: t('sprintStatus.completed'),
      cancelled: t('sprintStatus.cancelled'),
      archived: t('sprintStatus.archived'),
    }
    return statusMap[status] || status
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'completed':
        return 'default'
      case 'cancelled':
        return 'destructive'
      case 'archived':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const handleDelete = async (sprintId: string) => {
    if (!confirm(t('confirmDeleteSprint'))) {
      return
    }

    setDeletingSprintId(sprintId)
    try {
      const result = await deleteSprint(sprintId)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting sprint:', error)
      alert(tCommon('error'))
    } finally {
      setDeletingSprintId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Compteur */}
      <div className="text-body-sm text-muted-foreground">
        {sprints.length} {t('sprintsTotal')}
      </div>

      {/* Liste des sprints */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('sprintsList')}</CardTitle>
        </CardHeader>
        <CardContent>
          {sprints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {t('noSprintsFound')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('goal')}</TableHead>
                  <TableHead>{t('startDate')}</TableHead>
                  <TableHead>{t('endDate')}</TableHead>
                  <TableHead className="w-[100px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sprints.map((sprint) => (
                  <TableRow key={sprint.id} className="cursor-pointer">
                    <TableCell
                      className="font-medium"
                      onClick={() => setEditingSprint(sprint)}
                    >
                      {sprint.name}
                    </TableCell>
                    <TableCell onClick={() => setEditingSprint(sprint)}>
                      <Badge variant={getStatusBadgeVariant(sprint.status)}>
                        {getSprintStatusLabel(sprint.status)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      onClick={() => setEditingSprint(sprint)}
                      className="max-w-[200px] truncate"
                    >
                      {sprint.goal || '—'}
                    </TableCell>
                    <TableCell onClick={() => setEditingSprint(sprint)}>
                      {sprint.start_date
                        ? new Date(sprint.start_date).toLocaleDateString('fr-FR')
                        : '—'}
                    </TableCell>
                    <TableCell onClick={() => setEditingSprint(sprint)}>
                      {sprint.end_date
                        ? new Date(sprint.end_date).toLocaleDateString('fr-FR')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(sprint.id)
                          }}
                          disabled={deletingSprintId === sprint.id}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      {editingSprint && (
        <SprintForm
          projectId={projectId}
          sprint={editingSprint}
          open={!!editingSprint}
          onOpenChange={(open) => {
            if (!open) setEditingSprint(null)
          }}
          onSuccess={() => {
            setEditingSprint(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

