import { getProjectById } from '@/lib/projects'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/layout/empty-state'
import { StickyNote } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getTranslations } from 'next-intl/server'

/**
 * Page Notes d'un projet (Client mode)
 * Design moderne avec placeholder
 */
export default async function PortalProjectNotesPage({
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
    <div className="flex-1 space-y-6 p-6 md:p-8">
      <PageHeader
        title={t('projectNotes')}
        description={t('notesDescription', { projectName: project.name })}
      />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">{t('projectNotes')}</CardTitle>
          <CardDescription>
            {t('clientNotesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={StickyNote}
            title={t('notesComingSoon')}
            description={t('clientNotesComingSoonDescription')}
          />
        </CardContent>
      </Card>
    </div>
  )
}

