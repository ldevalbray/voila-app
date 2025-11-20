import { getProjectById } from '@/lib/projects'
import { notFound } from 'next/navigation'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { EmptyState } from '@/components/layout/empty-state'
import { Clock, Plus } from 'lucide-react'
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
 * Page Time tracking d'un projet (Internal mode)
 * Design moderne avec placeholder
 */
export default async function ProjectTimePage({
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
    <div className="flex-1 space-y-6 px-6 pb-6 md:px-8 md:pb-8">
      <PageToolbar
        title={t('timeTracking')}
        description={t('timeDescription', { projectName: project.name })}
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('logTime')}
          </Button>
        }
      />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">{t('timeTracking')}</CardTitle>
          <CardDescription>
            {t('timeDescription', { projectName: project.name })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Clock}
            title={t('timeTrackingComingSoon')}
            description={t('timeTrackingComingSoonDescription')}
          />
        </CardContent>
      </Card>
    </div>
  )
}

