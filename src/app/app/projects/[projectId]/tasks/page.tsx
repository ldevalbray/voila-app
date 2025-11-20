import { getProjectById } from '@/lib/projects'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/layout/empty-state'
import { CheckSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getTranslations } from 'next-intl/server'

/**
 * Page Tasks d'un projet (Internal mode)
 * Design moderne avec placeholder
 */
export default async function ProjectTasksPage({
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
      <PageHeader
        title={t('projectTasks')}
        description={t('tasksDescription', { projectName: project.name })}
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('newTask')}
          </Button>
        }
      />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">{t('projectTasks')}</CardTitle>
          <CardDescription>
            {t('tasksDescription', { projectName: project.name })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={CheckSquare}
            title={t('tasksComingSoon')}
            description={t('tasksComingSoonDescription')}
          />
        </CardContent>
      </Card>
    </div>
  )
}

