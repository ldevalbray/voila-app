'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createProject } from '@/lib/actions/projects'
import { getAllClientsClient, type Client } from '@/lib/clients'
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
import { projectFormSchema, type ProjectFormValues } from '@/lib/validations/project-form'
import { useRouter } from 'next/navigation'

interface ProjectFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ProjectForm({ open, onOpenChange, onSuccess }: ProjectFormProps) {
  const t = useTranslations('projects')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)

  // Initialiser React Hook Form avec Zod
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'active',
      client_id: null,
    },
    mode: 'onChange',
  })

  // Charger les clients quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      setLoadingClients(true)
      getAllClientsClient()
        .then((clientsData) => {
          setClients(clientsData)
        })
        .catch((error) => {
          console.error('Error loading clients:', error)
          showToast.error('Erreur lors du chargement des clients')
        })
        .finally(() => {
          setLoadingClients(false)
        })
    }
  }, [open])

  // Réinitialiser le formulaire quand l'état open change
  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        description: '',
        status: 'active',
        client_id: null,
      })
    }
  }, [open, form])

  const onSubmit = async (values: ProjectFormValues) => {
    try {
      const result = await createProject({
        name: values.name,
        description: values.description || null,
        status: values.status,
        client_id: values.client_id || null,
      })

      if (result.error) {
        showToast.error(result.error)
        return
      }

      showToast.success(t('projectCreated'))
      onSuccess()
      onOpenChange(false)

      // Rediriger vers le nouveau projet
      if (result.data?.id) {
        router.push(`/app/projects/${result.data.id}/overview`)
        router.refresh()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : tCommon('error')
      showToast.error(errorMessage)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('newProject')}</DialogTitle>
          <DialogDescription>
            {t('createProjectDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projectName')} *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('projectNamePlaceholder')} />
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
                      placeholder={t('projectDescriptionPlaceholder')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('client')}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                    value={field.value || 'none'}
                    disabled={loadingClients}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingClients ? tCommon('loading') : t('selectClient')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t('noClient')}</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
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
                      <SelectItem value="active">{t('projectStatus.active')}</SelectItem>
                      <SelectItem value="on_hold">{t('projectStatus.on_hold')}</SelectItem>
                      <SelectItem value="completed">{t('projectStatus.completed')}</SelectItem>
                      <SelectItem value="archived">{t('projectStatus.archived')}</SelectItem>
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
                  : tCommon('create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

