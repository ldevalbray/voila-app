'use client'

import { useState } from 'react'
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
import { Plus } from 'lucide-react'
import { EpicForm } from './epic-form'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface EpicsListProps {
  projectId: string
  epics: Epic[]
}

export function EpicsList({ projectId, epics }: EpicsListProps) {
  const t = useTranslations('projects')
  const router = useRouter()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null)

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
      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {epics.length} {t('epicsTotal')}
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('newEpic')}
        </Button>
      </div>

      {/* Liste des epics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('epicsList')}</CardTitle>
        </CardHeader>
        <CardContent>
          {epics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {t('noEpicsFound')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('title')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('tasksCount')}</TableHead>
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
                      <Badge variant="outline">{epic.tasks_count || 0}</Badge>
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

      {/* Dialog de création */}
      <EpicForm
        projectId={projectId}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          router.refresh()
        }}
      />

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

