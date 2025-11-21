import { getProjectById } from '@/lib/projects'
import { getTasksByProjectId, getTaskStats } from '@/lib/tasks'
import { getEpicsByProjectId } from '@/lib/epics'
import { notFound } from 'next/navigation'
import { TasksPageClient } from './tasks-page-client'
import { getTranslations } from 'next-intl/server'

/**
 * Page Tasks d'un projet (Internal mode)
 * Affiche la liste des tâches avec filtres et création/édition
 * Utilise le contexte sprint pour filtrer les tâches
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

  // Récupérer les tâches avec filtres (sans filtre sprint pour l'instant, le client le fera)
  const statusFilter = searchParamsResolved.status
    ? searchParamsResolved.status.split(',')
    : undefined
  const typeFilter = searchParamsResolved.type
    ? searchParamsResolved.type.split(',')
    : undefined

  const tasksResult = await getTasksByProjectId(projectId, {
    status: statusFilter,
    type: typeFilter,
    epic_id: searchParamsResolved.epic_id || undefined,
    search: searchParamsResolved.search,
    // Ne pas filtrer par sprint ici, le client le fera selon le contexte
  })
  const tasks = tasksResult.data

  // Récupérer les epics pour le filtre
  const epics = await getEpicsByProjectId(projectId)

  // Récupérer les stats pour l'overview (sans filtre sprint pour l'instant)
  const stats = await getTaskStats(projectId)

  return (
    <div className="flex-1 pt-8 px-8">
      <TasksPageClient
        projectId={projectId}
        initialTasks={tasks}
        epics={epics}
        initialStats={stats}
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
