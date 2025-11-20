import { getProjectById } from '@/lib/projects'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Building2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getTranslations } from 'next-intl/server'

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

        {/* Upcoming tasks */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t('upcomingTasks')}</CardTitle>
            <CardDescription>
              {t('upcomingTasksDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('noUpcomingTasks')}
              </p>
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

