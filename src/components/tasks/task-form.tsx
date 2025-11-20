'use client'

import { useState } from 'react'
import { Task } from '@/lib/tasks'
import { Epic } from '@/lib/epics'
import { createTask, updateTask } from '@/lib/actions/tasks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslations } from 'next-intl'

interface TaskFormProps {
  projectId: string
  epics: Epic[]
  task?: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TaskForm({
  projectId,
  epics,
  task,
  open,
  onOpenChange,
  onSuccess,
}: TaskFormProps) {
  const t = useTranslations('projects')
  const tCommon = useTranslations('common')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    type: task?.type || 'new_feature',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    estimate_bucket: task?.estimate_bucket || null,
    epic_id: task?.epic_id || null,
    is_client_visible: task?.is_client_visible || false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (task) {
        // Mise à jour
        const result = await updateTask({
          id: task.id,
          ...formData,
        })
        if (result.error) {
          setError(result.error)
          setIsSubmitting(false)
          return
        }
      } else {
        // Création
        const result = await createTask({
          project_id: projectId,
          ...formData,
        })
        if (result.error) {
          setError(result.error)
          setIsSubmitting(false)
          return
        }
      }

      onSuccess()
    } catch (err) {
      setError(tCommon('error'))
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? t('editTask') : t('newTask')}
          </DialogTitle>
          <DialogDescription>
            {task
              ? t('editTaskDescription')
              : t('createTaskDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">{t('title')} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t('type')} *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">{t('taskType.bug')}</SelectItem>
                  <SelectItem value="new_feature">
                    {t('taskType.new_feature')}
                  </SelectItem>
                  <SelectItem value="improvement">
                    {t('taskType.improvement')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t('status')} *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">{t('taskStatus.todo')}</SelectItem>
                  <SelectItem value="in_progress">
                    {t('taskStatus.in_progress')}
                  </SelectItem>
                  <SelectItem value="blocked">
                    {t('taskStatus.blocked')}
                  </SelectItem>
                  <SelectItem value="waiting_for_client">
                    {t('taskStatus.waiting_for_client')}
                  </SelectItem>
                  <SelectItem value="done">{t('taskStatus.done')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">{t('priority')} *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('taskPriority.low')}</SelectItem>
                  <SelectItem value="medium">
                    {t('taskPriority.medium')}
                  </SelectItem>
                  <SelectItem value="high">
                    {t('taskPriority.high')}
                  </SelectItem>
                  <SelectItem value="urgent">
                    {t('taskPriority.urgent')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimate_bucket">{t('estimate')}</Label>
              <Select
                value={formData.estimate_bucket || 'none'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    estimate_bucket: value === 'none' ? null : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('noEstimate')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('noEstimate')}</SelectItem>
                  <SelectItem value="XS">XS</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                  <SelectItem value="XXL">XXL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="epic_id">{t('epic')}</Label>
            <Select
              value={formData.epic_id || 'none'}
              onValueChange={(value) =>
                setFormData({ ...formData, epic_id: value === 'none' ? null : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('noEpic')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('noEpic')}</SelectItem>
                {epics.map((epic) => (
                  <SelectItem key={epic.id} value={epic.id}>
                    {epic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_client_visible"
              checked={formData.is_client_visible}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  is_client_visible: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_client_visible" className="cursor-pointer">
              {t('clientVisible')}
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? tCommon('saving')
                : task
                  ? tCommon('update')
                  : tCommon('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

