import { getProjectById } from '@/lib/projects'
import { getEpicsByProjectId } from '@/lib/epics'
import { notFound } from 'next/navigation'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { EpicsList } from '@/components/epics/epics-list'
import { getTranslations } from 'next-intl/server'
import { EpicsPageClient } from './epics-page-client'

/**
 * Page Epics d'un projet (Internal mode)
 * Affiche la liste des epics avec création et édition
 */
export default async function ProjectEpicsPage({
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

  const epics = await getEpicsByProjectId(projectId)

  return (
    <div className="flex-1 space-y-6 px-6 pb-6 md:px-8 md:pb-8">
      <EpicsPageClient
        projectId={projectId}
        title={t('projectEpics')}
        description={t('epicsDescription', { projectName: project.name })}
        newEpicLabel={t('newEpic')}
      />

      <EpicsList projectId={projectId} epics={epics} />
    </div>
  )
}
