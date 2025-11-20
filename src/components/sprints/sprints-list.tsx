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
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import { showToast } from '@/lib/toast'
import { EmptyState } from '@/components/layout/empty-state'
import { Layers } from 'lucide-react'

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [sprintToDelete, setSprintToDelete] = useState<Sprint | null>(null)

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

  const handleDeleteClick = (sprint: Sprint) => {
    setSprintToDelete(sprint)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!sprintToDelete) return

    setDeletingSprintId(sprintToDelete.id)
    try {
      const result = await deleteSprint(sprintToDelete.id)
      if (result.error) {
        showToast.error(result.error)
      } else {
        showToast.success(t('sprintDeleted'))
        router.refresh()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : tCommon('error')
      showToast.error(errorMessage)
    } finally {
      setDeletingSprintId(null)
      setIsDeleteDialogOpen(false)
      setSprintToDelete(null)
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
            <EmptyState
              icon={Layers}
              title={t('noSprints') || t('noSprintsFound')}
              description={t('noSprintsDescription') || t('createFirstSprint')}
              action={
                <Button onClick={() => setEditingSprint(null)}>
                  {t('createFirstSprint') || t('newSprint')}
                </Button>
              }
            />
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
                            handleDeleteClick(sprint)
                          }}
                          disabled={deletingSprintId === sprint.id}
                          className="h-8 w-8 p-0"
                          aria-label={t('deleteSprint') || tCommon('delete')}
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

      {/* Dialog de confirmation de suppression */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title={t('deleteSprint') || tCommon('delete')}
        description={
          sprintToDelete
            ? t('confirmDeleteSprintMessage', { name: sprintToDelete.name }) ||
              `Êtes-vous sûr de vouloir supprimer le sprint "${sprintToDelete.name}" ?`
            : t('confirmDeleteSprint') || 'Êtes-vous sûr de vouloir supprimer ce sprint ?'
        }
        confirmText={tCommon('delete')}
        cancelText={tCommon('cancel')}
        variant="destructive"
      />
    </div>
  )
}

