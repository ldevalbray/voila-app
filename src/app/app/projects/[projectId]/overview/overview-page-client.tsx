'use client'

import { useEffect, useState } from 'react'
import { useSprintContext } from '@/components/layout/sprint-context'
import { SprintPicker } from '@/components/layout/sprint-picker'
import { getTaskStatsAction } from '@/lib/actions/task-stats'
import { CheckSquare, Layers, Link as LinkIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { useTranslations } from 'next-intl'
import { Project } from '@/lib/projects'
import { Epic } from '@/lib/epics'

interface OverviewPageClientProps {
  projectId: string
  project: Project | null
  initialTaskStats: {
    total: number
    by_status: Record<string, number>
    open_count: number
  }
  epics: Epic[]
}

/**
 * Composant client pour la page Overview qui utilise le contexte sprint
 * pour afficher les stats filtrées par sprint
 */
export function OverviewPageClient({
  projectId,
  project,
  initialTaskStats,
  epics,
}: OverviewPageClientProps) {
  const t = useTranslations('projects')
  const { selectedSprintId } = useSprintContext()
  const [taskStats, setTaskStats] = useState(initialTaskStats)
  const [isLoading, setIsLoading] = useState(false)

  // Recharger les stats quand le sprint sélectionné change
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const stats = await getTaskStatsAction(projectId, selectedSprintId)
        setTaskStats(stats)
      } catch (error) {
        console.error('Error loading task stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [projectId, selectedSprintId])

  if (!project) {
    return null
  }

  // Construire la description avec client et description
  const descriptionParts = []
  if (project.client) {
    descriptionParts.push(project.client.name)
  }
  if (project.description) {
    descriptionParts.push(project.description)
  }

  return (
    <div className="space-y-6">
      <PageToolbar
        filters={[<SprintPicker key="sprint" compact />]}
      />

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
            <CardTitle className="text-lg">
              {selectedSprintId ? t('tasksInSprint') : t('tasksOverview')}
            </CardTitle>
            <CardDescription>
              {selectedSprintId
                ? t('tasksInSprintDescription')
                : t('tasksOverviewDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : (
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
            )}
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

