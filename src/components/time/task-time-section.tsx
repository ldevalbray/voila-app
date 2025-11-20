'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Plus } from 'lucide-react'
import { formatDuration } from '@/lib/time-utils'
import { getTotalTimeByTaskId } from '@/lib/actions/time-entries'
import { TimeEntryForm } from './time-entry-form'
import { useRouter } from 'next/navigation'

interface TaskTimeSectionProps {
  taskId: string
  projectId: string
  taskTitle: string
}

export function TaskTimeSection({
  taskId,
  projectId,
  taskTitle,
}: TaskTimeSectionProps) {
  const t = useTranslations('projects.timeTracking')
  const router = useRouter()
  const [totalMinutes, setTotalMinutes] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    const loadTotalTime = async () => {
      setIsLoading(true)
      const result = await getTotalTimeByTaskId(taskId)
      setTotalMinutes(result.data || 0)
      setIsLoading(false)
    }

    loadTotalTime()
  }, [taskId])

  const handleSuccess = async () => {
    setIsFormOpen(false)
    // Recharger le temps total
    const result = await getTotalTimeByTaskId(taskId)
    setTotalMinutes(result.data || 0)
    router.refresh()
  }

  return (
    <div className="space-y-3 pt-4 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t('timeLogged')}</span>
        </div>
        {isLoading ? (
          <Badge variant="outline" className="text-xs">
            ...
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            {totalMinutes !== null ? formatDuration(totalMinutes) : '0m'}
          </Badge>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsFormOpen(true)}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t('logTimeForTask')}
      </Button>

      <TimeEntryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        projects={[{ id: projectId, name: 'Current Project' }]}
        tasks={[{ id: taskId, project_id: projectId, title: taskTitle } as any]}
        initialData={{
          project_id: projectId,
          task_id: taskId,
        }}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

