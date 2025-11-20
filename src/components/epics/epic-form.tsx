'use client'

import { useState } from 'react'
import { Epic } from '@/lib/epics'
import { createEpic, updateEpic } from '@/lib/actions/epics'
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

interface EpicFormProps {
  projectId: string
  epic?: Epic | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EpicForm({
  projectId,
  epic,
  open,
  onOpenChange,
  onSuccess,
}: EpicFormProps) {
  const t = useTranslations('projects')
  const tCommon = useTranslations('common')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: epic?.title || '',
    description: epic?.description || '',
    status: epic?.status || 'open',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (epic) {
        // Mise à jour
        const result = await updateEpic({
          id: epic.id,
          ...formData,
        })
        if (result.error) {
          setError(result.error)
          setIsSubmitting(false)
          return
        }
      } else {
        // Création
        const result = await createEpic({
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{epic ? t('editEpic') : t('newEpic')}</DialogTitle>
          <DialogDescription>
            {epic ? t('editEpicDescription') : t('createEpicDescription')}
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
                <SelectItem value="open">{t('epicStatus.open')}</SelectItem>
                <SelectItem value="in_progress">
                  {t('epicStatus.in_progress')}
                </SelectItem>
                <SelectItem value="done">{t('epicStatus.done')}</SelectItem>
                <SelectItem value="archived">
                  {t('epicStatus.archived')}
                </SelectItem>
              </SelectContent>
            </Select>
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
                : epic
                  ? tCommon('update')
                  : tCommon('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

