import { getProjectById } from '@/lib/projects'
import { getEpicsByProjectId } from '@/lib/epics'
import { getSprintsByProjectId } from '@/lib/sprints'
import { notFound } from 'next/navigation'
import { EpicsList } from '@/components/epics/epics-list'
import { SprintsList } from '@/components/sprints/sprints-list'
import { getTranslations } from 'next-intl/server'
import { EpicsPageClient } from './epics-page-client'
import { PageToolbar } from '@/components/layout/page-toolbar'

/**
 * Page Epics & Sprints d'un projet (Internal mode)
 * Affiche la liste des epics et des sprints avec création et édition
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
  const sprints = await getSprintsByProjectId(projectId)

  return (
    <div className="flex-1 pt-8 px-8">
      <PageToolbar />
      <div className="space-y-6">
        <EpicsPageClient
          projectId={projectId}
          newEpicLabel={t('newEpic')}
          newSprintLabel={t('newSprint')}
        />

        <div className="space-y-6">
        <EpicsList projectId={projectId} epics={epics} />
        <SprintsList projectId={projectId} sprints={sprints} />
        </div>
      </div>
    </div>
  )
}
