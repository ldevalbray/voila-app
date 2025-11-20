import { getProjectById } from '@/lib/projects'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/layout/empty-state'
import { Settings } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getTranslations } from 'next-intl/server'

/**
 * Page Settings d'un projet (Internal mode)
 * Design moderne avec placeholder
 */
export default async function ProjectSettingsPage({
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
        title={t('projectSettings')}
        description={t('settingsDescription', { projectName: project.name })}
      />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">{t('projectSettings')}</CardTitle>
          <CardDescription>
            {t('settingsDescription', { projectName: project.name })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Settings}
            title={t('settingsComingSoon')}
            description={t('settingsComingSoonDescription')}
          />
        </CardContent>
      </Card>
    </div>
  )
}

