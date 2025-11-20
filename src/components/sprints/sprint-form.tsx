'use client'

import { useState } from 'react'
import { Sprint } from '@/lib/sprints'
import { createSprint, updateSprint } from '@/lib/actions/sprints-actions'
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

interface SprintFormProps {
  projectId: string
  sprint?: Sprint | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SprintForm({
  projectId,
  sprint,
  open,
  onOpenChange,
  onSuccess,
}: SprintFormProps) {
  const t = useTranslations('projects')
  const tCommon = useTranslations('common')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: sprint?.name || '',
    goal: sprint?.goal || '',
    status: sprint?.status || 'planned',
    start_date: sprint?.start_date || '',
    end_date: sprint?.end_date || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (sprint) {
        // Mise à jour
        const result = await updateSprint({
          id: sprint.id,
          name: formData.name,
          goal: formData.goal || null,
          status: formData.status,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
        })
        if (result.error) {
          setError(result.error)
          setIsSubmitting(false)
          return
        }
      } else {
        // Création
        const result = await createSprint({
          project_id: projectId,
          name: formData.name,
          goal: formData.goal || null,
          status: formData.status,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {sprint ? t('editSprint') : t('newSprint')}
          </DialogTitle>
          <DialogDescription>
            {sprint
              ? t('editSprintDescription')
              : t('createSprintDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{t('name')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">{t('goal')}</Label>
            <Textarea
              id="goal"
              value={formData.goal}
              onChange={(e) =>
                setFormData({ ...formData, goal: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="planned">
                    {t('sprintStatus.planned')}
                  </SelectItem>
                  <SelectItem value="active">
                    {t('sprintStatus.active')}
                  </SelectItem>
                  <SelectItem value="completed">
                    {t('sprintStatus.completed')}
                  </SelectItem>
                  <SelectItem value="cancelled">
                    {t('sprintStatus.cancelled')}
                  </SelectItem>
                  <SelectItem value="archived">
                    {t('sprintStatus.archived')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">{t('startDate')}</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">{t('endDate')}</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
              />
            </div>
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
                : sprint
                  ? tCommon('update')
                  : tCommon('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

