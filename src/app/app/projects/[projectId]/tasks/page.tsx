import { getProjectById } from '@/lib/projects'
import { getTasksByProjectId, getTaskStats } from '@/lib/tasks'
import { getEpicsByProjectId } from '@/lib/epics'
import { notFound } from 'next/navigation'
import { TasksList } from '@/components/tasks/tasks-list'
import { getTranslations } from 'next-intl/server'

/**
 * Page Tasks d'un projet (Internal mode)
 * Affiche la liste des tâches avec filtres et création/édition
 */
export default async function ProjectTasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{
    status?: string
    type?: string
    epic_id?: string
    search?: string
  }>
}) {
  const { projectId } = await params
  const searchParamsResolved = await searchParams
  const project = await getProjectById(projectId, 'internal')
  const t = await getTranslations('projects')

  if (!project) {
    notFound()
  }

  // Récupérer les tâches avec filtres
  const statusFilter = searchParamsResolved.status
    ? searchParamsResolved.status.split(',')
    : undefined
  const typeFilter = searchParamsResolved.type
    ? searchParamsResolved.type.split(',')
    : undefined

  const tasks = await getTasksByProjectId(projectId, {
    status: statusFilter,
    type: typeFilter,
    epic_id: searchParamsResolved.epic_id || undefined,
    search: searchParamsResolved.search,
  })

  // Récupérer les epics pour le filtre
  const epics = await getEpicsByProjectId(projectId)

  // Récupérer les stats pour l'overview
  const stats = await getTaskStats(projectId)

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      <TasksList
        projectId={projectId}
        tasks={tasks}
        epics={epics}
        stats={stats}
        initialFilters={{
          status: statusFilter,
          type: typeFilter,
          epic_id: searchParamsResolved.epic_id || undefined,
          search: searchParamsResolved.search,
        }}
      />
    </div>
  )
}
