import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CheckSquare } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { getInternalProjects } from '@/lib/projects'
import { getEpicsByProjectId } from '@/lib/epics'
import { TasksPageClient } from './tasks-page-client'

/**
 * Page "My tasks" globale (Internal mode)
 * Design moderne avec placeholder pour future table/board
 */
export default async function TasksPage() {
  const t = await getTranslations('tasks')
  const projectsResult = await getInternalProjects()
  const projects = projectsResult.data
  
  // Récupérer tous les épics de tous les projets
  const allEpics = []
  for (const project of projects) {
    const epics = await getEpicsByProjectId(project.id)
    allEpics.push(...epics)
  }
  
  return (
    <div className="flex-1 pt-8 px-8">
      <PageToolbar
        actions={
          <TasksPageClient projects={projects} epics={allEpics} variant="toolbar" />
        }
      />

      {/* Content */}
      <Card className="border-border/50 mt-6">
        <CardHeader>
          <CardTitle className="text-lg">{t('tasksList')}</CardTitle>
          <CardDescription>
            {t('tasksListDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noTasks')}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {t('noTasksDescription')}
            </p>
            <TasksPageClient projects={projects} epics={allEpics} variant="empty-state" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

