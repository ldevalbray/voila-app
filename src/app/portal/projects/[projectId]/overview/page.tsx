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
import { PageToolbar } from '@/components/layout/page-toolbar'

/**
 * Page overview d'un projet (Client mode)
 * Design moderne avec header et sections
 */
export default async function PortalProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await getProjectById(projectId, 'client')
  const t = await getTranslations('projects')

  if (!project) {
    notFound()
  }

  return (
    <div className="flex-1 space-y-6 px-6 pb-6 md:px-8 md:pb-8">
      <PageToolbar
        title={
          <div className="flex items-center gap-3">
            <span>{project.name}</span>
            <Badge
              variant={project.status === 'active' ? 'default' : 'secondary'}
            >
              {project.status}
            </Badge>
          </div>
        }
        description={
          project.client ? (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>{project.client.name}</span>
              {project.description && <span className="mx-2">•</span>}
              {project.description && <span>{project.description}</span>}
            </div>
          ) : (
            project.description
          )
        }
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

        {/* Project info */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t('projectInformation')}</CardTitle>
            <CardDescription>
              {t('projectInformationDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('detailedInformationComingSoon')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

