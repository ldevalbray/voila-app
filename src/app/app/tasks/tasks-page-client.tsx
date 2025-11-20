'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { TaskForm } from '@/components/tasks/task-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Project } from '@/lib/projects'
import { Epic } from '@/lib/epics'
import { useRouter } from 'next/navigation'

interface TasksPageClientProps {
  projects: Project[]
  epics: Epic[]
  variant?: 'toolbar' | 'empty-state'
}

export function TasksPageClient({ 
  projects, 
  epics,
  variant = 'toolbar'
}: TasksPageClientProps) {
  const t = useTranslations('tasks')
  const tProjects = useTranslations('projects')
  const tCommon = useTranslations('common')
  const tUI = useTranslations('ui')
  const router = useRouter()
  const [isProjectSelectOpen, setIsProjectSelectOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)

  const handleOpenCreateDialog = () => {
    if (projects.length === 0) {
      // Pas de projets disponibles
      return
    }
    if (projects.length === 1) {
      // Un seul projet, l'utiliser directement
      setSelectedProjectId(projects[0].id)
      setIsTaskFormOpen(true)
    } else {
      // Plusieurs projets, demander de choisir
      setIsProjectSelectOpen(true)
    }
  }

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    setIsProjectSelectOpen(false)
    setIsTaskFormOpen(true)
  }

  const handleTaskCreated = () => {
    setIsTaskFormOpen(false)
    setSelectedProjectId(null)
    router.refresh()
  }

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null

  const projectEpics = selectedProjectId
    ? epics.filter((e) => e.project_id === selectedProjectId)
    : []

  const buttonText = variant === 'empty-state' ? t('createFirstTask') : t('newTask')

  return (
    <>
      <Button onClick={handleOpenCreateDialog} disabled={projects.length === 0}>
        <Plus className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>

      {/* Dialog de sélection de projet */}
      <Dialog open={isProjectSelectOpen} onOpenChange={setIsProjectSelectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tUI('selectProject')}</DialogTitle>
            <DialogDescription>
              {tProjects('selectProjectDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project">{tProjects('project')}</Label>
              <Select
                value={selectedProjectId || ''}
                onValueChange={handleProjectSelect}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder={tUI('selectProjectPlaceholder')} />
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulaire de création de tâche */}
      {selectedProject && (
        <TaskForm
          projectId={selectedProject.id}
          epics={projectEpics}
          open={isTaskFormOpen}
          onOpenChange={setIsTaskFormOpen}
          onSuccess={handleTaskCreated}
        />
      )}
    </>
  )
}

