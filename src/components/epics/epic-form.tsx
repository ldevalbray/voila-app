'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useTranslations } from 'next-intl'
import { showToast } from '@/lib/toast'
import { epicFormSchema, type EpicFormValues } from '@/lib/validations/epic-form'

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

  // Initialiser React Hook Form avec Zod
  const form = useForm<EpicFormValues>({
    resolver: zodResolver(epicFormSchema),
    defaultValues: {
      title: epic?.title || '',
      description: epic?.description || '',
      status: epic?.status || 'open',
    },
    mode: 'onChange', // Validation en temps réel
  })

  // Réinitialiser le formulaire quand l'epic ou l'état open change
  useEffect(() => {
    if (open) {
      form.reset({
        title: epic?.title || '',
        description: epic?.description || '',
        status: epic?.status || 'open',
      })
    }
  }, [open, epic, form])

  const onSubmit = async (values: EpicFormValues) => {
    try {
      if (epic) {
        // Mise à jour
        const result = await updateEpic({
          id: epic.id,
          ...values,
        })
        if (result.error) {
          showToast.error(result.error)
          return
        }
        showToast.success(t('epicUpdated') || 'Épopée mise à jour')
      } else {
        // Création
        const result = await createEpic({
          project_id: projectId,
          ...values,
        })
        if (result.error) {
          showToast.error(result.error)
          return
        }
        showToast.success(t('epicCreated') || 'Épopée créée')
      }

      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : tCommon('error')
      showToast.error(errorMessage)
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('title')} *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('epicTitlePlaceholder') || 'Titre de l\'épopée'} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      rows={4}
                      placeholder={t('epicDescriptionPlaceholder') || 'Description de l\'épopée (optionnel)'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('status')} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectStatus')} />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? tCommon('saving')
                  : epic
                    ? tCommon('update')
                    : tCommon('create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
