import { getProjectById } from '@/lib/projects'
import { getTaskStats } from '@/lib/tasks'
import { getEpicsByProjectId } from '@/lib/epics'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Building2, CheckSquare, Layers, Link as LinkIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

/**
 * Page overview d'un projet (Internal mode)
 * Design moderne avec header et sections
 */
export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await getProjectById(projectId, 'internal')
  const t = await getTranslations('projects')

  if (!project) {
    notFound()
  }

  // Récupérer les stats des tâches et epics
  const taskStats = await getTaskStats(projectId)
  const epics = await getEpicsByProjectId(projectId)

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge
                variant={project.status === 'active' ? 'default' : 'secondary'}
              >
                {project.status}
              </Badge>
            </div>
            {project.client && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{project.client.name}</span>
              </div>
            )}
            {project.description && (
              <p className="text-muted-foreground max-w-2xl">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Summary */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t('summary')}</CardTitle>
            <CardDescription>
              {t('summaryDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('status')}</span>
                <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                  {project.status}
                </Badge>
              </div>
              {project.client && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('client')}</span>
                  <span className="text-sm font-medium">{project.client.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tasks stats */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t('tasksOverview')}</CardTitle>
            <CardDescription>
              {t('tasksOverviewDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {t('totalTasks')}
                  </span>
                </div>
                <span className="text-lg font-semibold">
                  {taskStats.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {t('openTasks')}
                  </span>
                </div>
                <span className="text-lg font-semibold">
                  {taskStats.open_count}
                </span>
              </div>
              <div className="pt-2 border-t">
                <Link href={`/app/projects/${projectId}/tasks`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    {t('viewAllTasks')}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Epics stats */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t('epicsOverview')}</CardTitle>
            <CardDescription>
              {t('epicsOverviewDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {t('totalEpics')}
                  </span>
                </div>
                <span className="text-lg font-semibold">{epics.length}</span>
              </div>
              <div className="pt-2 border-t">
                <Link href={`/app/projects/${projectId}/epics`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    {t('viewAllEpics')}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last notes */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t('lastNotes')}</CardTitle>
            <CardDescription>
              {t('lastNotesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('noRecentNotes')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t('quickActions')}</CardTitle>
            <CardDescription>
              {t('quickActionsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('actionsComingSoon')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

