'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { sprintFormSchema, type SprintFormValues } from '@/lib/validations/sprint-form'

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

  // Initialiser React Hook Form avec Zod
  const form = useForm<SprintFormValues>({
    resolver: zodResolver(sprintFormSchema),
    defaultValues: {
      name: sprint?.name || '',
      goal: sprint?.goal || '',
      status: sprint?.status || 'planned',
      start_date: sprint?.start_date || '',
      end_date: sprint?.end_date || '',
    },
    mode: 'onChange', // Validation en temps réel
  })

  // Réinitialiser le formulaire quand le sprint ou l'état open change
  useEffect(() => {
    if (open) {
      form.reset({
        name: sprint?.name || '',
        goal: sprint?.goal || '',
        status: sprint?.status || 'planned',
        start_date: sprint?.start_date || '',
        end_date: sprint?.end_date || '',
      })
    }
  }, [open, sprint, form])

  const onSubmit = async (values: SprintFormValues) => {
    try {
      if (sprint) {
        // Mise à jour
        const result = await updateSprint({
          id: sprint.id,
          name: values.name,
          goal: values.goal || null,
          status: values.status,
          start_date: values.start_date || null,
          end_date: values.end_date || null,
        })
        if (result.error) {
          showToast.error(result.error)
          return
        }
        showToast.success(t('sprintUpdated') || 'Sprint mis à jour')
      } else {
        // Création
        const result = await createSprint({
          project_id: projectId,
          name: values.name,
          goal: values.goal || null,
          status: values.status,
          start_date: values.start_date || null,
          end_date: values.end_date || null,
        })
        if (result.error) {
          showToast.error(result.error)
          return
        }
        showToast.success(t('sprintCreated') || 'Sprint créé')
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
          <DialogTitle>
            {sprint ? t('editSprint') : t('newSprint')}
          </DialogTitle>
          <DialogDescription>
            {sprint
              ? t('editSprintDescription')
              : t('createSprintDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('name')} *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('sprintNamePlaceholder') || 'Nom du sprint'} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('goal')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      rows={3}
                      placeholder={t('sprintGoalPlaceholder') || 'Objectif du sprint (optionnel)'}
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('startDate')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('endDate')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                  : sprint
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
