'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useTranslations } from 'next-intl'
import { useSprintContext } from '@/components/layout/sprint-context'
import { getSprintsByProjectIdAction } from '@/lib/actions/sprints'
import { showToast } from '@/lib/toast'
import { taskFormSchema, type TaskFormValues } from '@/lib/validations/task-form'

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
  
  // Récupérer le contexte sprint pour pré-remplir le sprint sélectionné
  let sprintContext: ReturnType<typeof useSprintContext> | null = null
  try {
    sprintContext = useSprintContext()
  } catch {
    // Le contexte n'est pas disponible (par exemple dans un composant isolé)
    // On continuera sans pré-remplir le sprint
  }

  // Initialiser React Hook Form avec Zod
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      type: task?.type || 'new_feature',
      status: task?.status || 'todo',
      priority: task?.priority || 'medium',
      estimate_bucket: task?.estimate_bucket || null,
      epic_id: task?.epic_id || null,
      sprint_id: task?.sprint_id || (sprintContext?.selectedSprintId || null),
      is_client_visible: task?.is_client_visible || false,
    },
    mode: 'onChange', // Validation en temps réel
  })

  // Charger les sprints du projet
  const [sprints, setSprints] = useState<Array<{ id: string; name: string }>>([])
  useEffect(() => {
    if (open) {
      getSprintsByProjectIdAction(projectId).then((sprintsList) => {
        setSprints(sprintsList.map((s) => ({ id: s.id, name: s.name })))
      })
    }
  }, [projectId, open])

  // Réinitialiser le formulaire quand la tâche ou l'état open change
  useEffect(() => {
    if (open) {
      form.reset({
        title: task?.title || '',
        description: task?.description || '',
        type: task?.type || 'new_feature',
        status: task?.status || 'todo',
        priority: task?.priority || 'medium',
        estimate_bucket: task?.estimate_bucket || null,
        epic_id: task?.epic_id || null,
        sprint_id: task?.sprint_id || (sprintContext?.selectedSprintId || null),
        is_client_visible: task?.is_client_visible || false,
      })
    }
  }, [open, task, form, sprintContext?.selectedSprintId])

  // Mettre à jour sprint_id si le contexte change et qu'on crée une nouvelle tâche
  useEffect(() => {
    if (!task && sprintContext?.selectedSprintId && open) {
      form.setValue('sprint_id', sprintContext.selectedSprintId)
    }
  }, [sprintContext?.selectedSprintId, task, open, form])

  const onSubmit = async (values: TaskFormValues) => {
    try {
      if (task) {
        // Mise à jour
        const result = await updateTask({
          id: task.id,
          ...values,
        })
        if (result.error) {
          showToast.error(result.error)
          return
        }
        showToast.success(t('taskUpdated'))
      } else {
        // Création
        const result = await createTask({
          project_id: projectId,
          ...values,
        })
        if (result.error) {
          showToast.error(result.error)
          return
        }
        showToast.success(t('taskCreated'))
      }

      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : tCommon('error')
      showToast.error(errorMessage)
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('title')} *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('taskTitlePlaceholder') || 'Titre de la tâche'} />
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
                      placeholder={t('taskDescriptionPlaceholder') || 'Description de la tâche (optionnel)'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('type')} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectType')} />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('priority')} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectPriority')} />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimate_bucket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('estimate')}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('noEstimate')} />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="epic_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('epic')}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('noEpic')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t('noEpic')}</SelectItem>
                        {epics.map((epic) => (
                          <SelectItem key={epic.id} value={epic.id}>
                            {epic.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sprint_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sprint')}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('noSprint')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t('noSprint')}</SelectItem>
                        {sprints.map((sprint) => (
                          <SelectItem key={sprint.id} value={sprint.id}>
                            {sprint.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_client_visible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      {t('clientVisible')}
                    </FormLabel>
                  </div>
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
                  : task
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
