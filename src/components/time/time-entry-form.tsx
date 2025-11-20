'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
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
import { createTimeEntry, updateTimeEntry, type CreateTimeEntryInput } from '@/lib/actions/time-entries'
import type { TimeEntryCategory } from '@/lib/time-entries'
import { Task } from '@/lib/tasks'

interface TimeEntryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: { id: string; name: string }[]
  tasks?: Task[]
  initialData?: {
    id?: string
    project_id?: string
    task_id?: string | null
    category?: TimeEntryCategory
    duration_minutes?: number
    date?: string
    notes?: string | null
  }
  onSuccess?: () => void
}

export function TimeEntryForm({
  open,
  onOpenChange,
  projects,
  tasks = [],
  initialData,
  onSuccess,
}: TimeEntryFormProps) {
  const t = useTranslations('projects.timeTracking')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    project_id: initialData?.project_id || '',
    task_id: initialData?.task_id || null,
    category: initialData?.category || ('development' as TimeEntryCategory),
    duration_hours: initialData?.duration_minutes
      ? Math.floor(initialData.duration_minutes / 60)
      : 0,
    duration_minutes: initialData?.duration_minutes
      ? initialData.duration_minutes % 60
      : 0,
    date: initialData?.date || new Date().toISOString().split('T')[0],
    notes: initialData?.notes || '',
  })

  // Filtrer les tâches par projet sélectionné
  const availableTasks = tasks.filter(
    (task) => !formData.project_id || task.project_id === formData.project_id
  )

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        project_id: initialData.project_id || '',
        task_id: initialData.task_id || null,
        category: initialData.category || 'development',
        duration_hours: initialData.duration_minutes
          ? Math.floor(initialData.duration_minutes / 60)
          : 0,
        duration_minutes: initialData.duration_minutes
          ? initialData.duration_minutes % 60
          : 0,
        date: initialData.date || new Date().toISOString().split('T')[0],
        notes: initialData.notes || '',
      })
    } else if (open && !initialData) {
      // Réinitialiser pour une nouvelle entrée
      setFormData({
        project_id: '',
        task_id: null,
        category: 'development',
        duration_hours: 0,
        duration_minutes: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
      })
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!formData.project_id) {
      setError(t('projectRequired'))
      setIsSubmitting(false)
      return
    }

    if (!formData.date) {
      setError(t('dateRequired'))
      setIsSubmitting(false)
      return
    }

    const totalMinutes =
      formData.duration_hours * 60 + formData.duration_minutes

    if (totalMinutes <= 0) {
      setError(t('durationMustBePositive'))
      setIsSubmitting(false)
      return
    }

    const input: CreateTimeEntryInput = {
      project_id: formData.project_id,
      task_id: formData.task_id || null,
      category: formData.category,
      duration_minutes: totalMinutes,
      date: formData.date,
      notes: formData.notes || null,
    }

    let result
    if (initialData?.id) {
      result = await updateTimeEntry({
        id: initialData.id,
        ...input,
      })
    } else {
      result = await createTimeEntry(input)
    }

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
    } else {
      onSuccess?.()
      onOpenChange(false)
      router.refresh()
    }
  }

  const categoryLabels: Record<string, string> = {
    project_management: t('categoryLabels.project_management'),
    development: t('categoryLabels.development'),
    documentation: t('categoryLabels.documentation'),
    maintenance_evolution: t('categoryLabels.maintenance_evolution'),
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? t('editTimeEntry') : t('newTimeEntry')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Projet */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="project_id">
                {t('project')} *
              </Label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, project_id: value, task_id: null })
                }}
                disabled={!!initialData?.project_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('project')} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tâche (optionnelle) */}
          {availableTasks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="task_id">{t('task')}</Label>
              <Select
                value={formData.task_id || 'none'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    task_id: value === 'none' ? null : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('noTask')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('noTask')}</SelectItem>
                  {availableTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">{t('date')} *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="category">{t('category')} *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  category: value as TimeEntryCategory,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Durée */}
          <div className="space-y-2">
            <Label>{t('duration')} *</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="duration_hours" className="text-xs text-muted-foreground">
                  {t('hoursLabel')}
                </Label>
                <Input
                  id="duration_hours"
                  type="number"
                  min="0"
                  value={formData.duration_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_hours: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="duration_minutes" className="text-xs text-muted-foreground">
                  {t('minutesLabel')}
                </Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={formData.duration_minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_minutes: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? tCommon('saving')
                : tCommon('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

