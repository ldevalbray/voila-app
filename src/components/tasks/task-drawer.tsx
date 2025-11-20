'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Task } from '@/lib/tasks'
import { Epic } from '@/lib/epics'
import { updateTask } from '@/lib/actions/tasks'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskDrawerProps {
  task: Task | null
  epics: Epic[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDrawer({
  task,
  epics,
  open,
  onOpenChange,
}: TaskDrawerProps) {
  const t = useTranslations('projects')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

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

  // Mettre à jour le formData quand la tâche change
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        type: task.type || 'new_feature',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        estimate_bucket: task.estimate_bucket || null,
        epic_id: task.epic_id || null,
        is_client_visible: task.is_client_visible || false,
      })
      setLastSaved(null)
      // Déclencher l'animation d'entrée
      if (open) {
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 600)
      }
    }
  }, [task?.id, open])

  // Fonction de sauvegarde avec debounce
  const saveTask = useCallback(
    async (data: typeof formData) => {
      if (!task) return

      setIsSaving(true)
      const result = await updateTask({
        id: task.id,
        ...data,
      })

      if (!result.error) {
        setLastSaved(new Date())
        router.refresh()
      }

      setIsSaving(false)
    },
    [task, router]
  )

  // Auto-save avec debounce
  const [hasInitialized, setHasInitialized] = useState(false)
  const prevFormDataRef = React.useRef(formData)

  useEffect(() => {
    if (task && open) {
      // Initialiser après un court délai pour éviter la sauvegarde immédiate
      const timer = setTimeout(() => {
        setHasInitialized(true)
        prevFormDataRef.current = formData
      }, 500)
      return () => clearTimeout(timer)
    } else if (!open) {
      setHasInitialized(false)
    }
  }, [task?.id, open])

  useEffect(() => {
    if (!task || !open || !hasInitialized) return

    // Vérifier si les données ont réellement changé
    const hasChanged = JSON.stringify(prevFormDataRef.current) !== JSON.stringify(formData)
    if (!hasChanged) return

    const timeoutId = setTimeout(() => {
      saveTask(formData)
      prevFormDataRef.current = formData
    }, 1000) // Debounce de 1 seconde

    return () => clearTimeout(timeoutId)
  }, [formData, task, open, saveTask, hasInitialized])

  // Helpers pour les traductions
  const getTaskStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      todo: t('taskStatus.todo'),
      in_progress: t('taskStatus.in_progress'),
      blocked: t('taskStatus.blocked'),
      waiting_for_client: t('taskStatus.waiting_for_client'),
      done: t('taskStatus.done'),
    }
    return statusMap[status] || status
  }

  const getTaskTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      bug: t('taskType.bug'),
      new_feature: t('taskType.new_feature'),
      improvement: t('taskType.improvement'),
    }
    return typeMap[type] || type
  }

  const getTaskPriorityLabel = (priority: string) => {
    const priorityMap: Record<string, string> = {
      low: t('taskPriority.low'),
      medium: t('taskPriority.medium'),
      high: t('taskPriority.high'),
      urgent: t('taskPriority.urgent'),
    }
    return priorityMap[priority] || priority
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'done':
        return 'default'
      case 'in_progress':
        return 'default'
      case 'blocked':
        return 'destructive'
      case 'waiting_for_client':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  // Debug: vérifier si la tâche est bien passée
  useEffect(() => {
    if (open) {
      console.log('TaskDrawer - open:', open)
      console.log('TaskDrawer - task:', task)
    }
  }, [open, task])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto scrollbar-thin"
        style={{ 
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          height: '100vh',
          zIndex: 51,
        }}
      >
        {task ? (
          <>
            <SheetHeader className="border-b pb-4 animate-slide-up-fade relative z-10 pointer-events-none [&>*]:pointer-events-auto" style={{ animationDelay: '0.05s', animationFillMode: 'both', animationDuration: '0.3s' }}>
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl font-semibold">
                  {t('taskDetails')}
                </SheetTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-1 rounded-full bg-accent/50 backdrop-blur-sm border transition-all duration-300">
                  {isSaving && (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      <span className="font-medium">{tCommon('saving')}</span>
                    </>
                  )}
                  {!isSaving && lastSaved && (
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {t('saved')} {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
          {/* Titre */}
          <div className="space-y-2 animate-slide-up-fade" style={{ animationDelay: '0.1s', animationFillMode: 'both', animationDuration: '0.3s' }}>
            <Label htmlFor="title" className="text-sm font-medium">
              {t('title')} *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="text-base font-medium input-modern transition-all duration-300"
              placeholder={t('title')}
            />
          </div>

          {/* Description */}
          <div className="space-y-2 animate-slide-up-fade" style={{ animationDelay: '0.15s', animationFillMode: 'both', animationDuration: '0.3s' }}>
            <Label htmlFor="description" className="text-sm font-medium">
              {t('description')}
            </Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={6}
              className="resize-none input-modern transition-all duration-300"
              placeholder={t('description') || 'Ajouter une description...'}
            />
          </div>

          {/* Métadonnées en grille */}
          <div className="grid grid-cols-2 gap-4 animate-slide-up-fade" style={{ animationDelay: '0.2s', animationFillMode: 'both', animationDuration: '0.3s' }}>
            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                {t('type')} *
              </Label>
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

            {/* Statut */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                {t('status')} *
              </Label>
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

            {/* Priorité */}
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">
                {t('priority')} *
              </Label>
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
                  <SelectItem value="high">{t('taskPriority.high')}</SelectItem>
                  <SelectItem value="urgent">
                    {t('taskPriority.urgent')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estimation */}
            <div className="space-y-2">
              <Label htmlFor="estimate_bucket" className="text-sm font-medium">
                {t('estimate')}
              </Label>
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

          {/* Epic */}
          <div className="space-y-2 animate-slide-up-fade" style={{ animationDelay: '0.25s', animationFillMode: 'both', animationDuration: '0.3s' }}>
            <Label htmlFor="epic_id" className="text-sm font-medium">
              {t('epic')}
            </Label>
            <Select
              value={formData.epic_id || 'none'}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  epic_id: value === 'none' ? null : value,
                })
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

          {/* Visibilité client */}
          <div className="flex items-center space-x-2 p-3 rounded-lg border bg-card animate-slide-up-fade transition-all duration-300 hover:shadow-md hover:border-primary/20" style={{ animationDelay: '0.3s', animationFillMode: 'both', animationDuration: '0.3s' }}>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  is_client_visible: !formData.is_client_visible,
                })
              }
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              {formData.is_client_visible ? (
                <Eye className="h-5 w-5 text-primary" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <Label className="cursor-pointer text-sm font-medium">
                {t('clientVisible')}
              </Label>
            </button>
          </div>

          {/* Aperçu des badges */}
          <div className="space-y-3 p-4 rounded-lg border bg-muted/50 animate-slide-up-fade transition-all duration-300 hover:bg-muted/70 hover:shadow-md" style={{ animationDelay: '0.35s', animationFillMode: 'both', animationDuration: '0.3s' }}>
            <Label className="text-sm font-medium text-muted-foreground">
              {t('preview') || 'Aperçu'}
            </Label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={getStatusBadgeVariant(formData.status)}
                className="text-xs transition-all duration-300 hover:scale-110 hover:shadow-md"
              >
                {getTaskStatusLabel(formData.status)}
              </Badge>
              <Badge variant="outline" className="text-xs transition-all duration-300 hover:scale-110 hover:shadow-md">
                {getTaskTypeLabel(formData.type)}
              </Badge>
              <Badge
                variant={getPriorityBadgeVariant(formData.priority)}
                className="text-xs transition-all duration-300 hover:scale-110 hover:shadow-md"
              >
                {getTaskPriorityLabel(formData.priority)}
              </Badge>
              {formData.epic_id && (
                <Badge variant="secondary" className="text-xs transition-all duration-300 hover:scale-110 hover:shadow-md">
                  {epics.find((e) => e.id === formData.epic_id)?.title || ''}
                </Badge>
              )}
              {formData.estimate_bucket && (
                <Badge variant="outline" className="text-xs transition-all duration-300 hover:scale-110 hover:shadow-md">
                  {formData.estimate_bucket}
                </Badge>
              )}
            </div>
          </div>

          {/* Métadonnées de la tâche */}
          <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground animate-slide-up-fade" style={{ animationDelay: '0.4s', animationFillMode: 'both', animationDuration: '0.3s' }}>
            <div className="flex justify-between">
              <span>{t('createdAt') || 'Créé le'}:</span>
              <span>
                {new Date(task.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {task.updated_at && (
              <div className="flex justify-between">
                <span>{t('updatedAt') || 'Modifié le'}:</span>
                <span>
                  {new Date(task.updated_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>
              {!task && open && (
                <p className="text-xs text-destructive mt-2">
                  Aucune tâche sélectionnée (open={String(open)}, task={task ? 'exists' : 'null'})
                </p>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

