import { getTimeEntries, getTimeStats } from '@/lib/time-entries'
import { getProjectById } from '@/lib/projects'
import { getTasksByProjectId } from '@/lib/tasks'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { ProjectTimePageClient } from './project-time-page-client'
import { useSprintContext } from '@/components/layout/sprint-context'

/**
 * Page Time d'un projet (Internal mode)
 * Affiche les entrées de temps du projet, sprint-aware
 */
export default async function ProjectTimePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{
    user_id?: string
    category?: string
    date_from?: string
    date_to?: string
  }>
}) {
  const { projectId } = await params
  const resolvedSearchParams = await searchParams
  const project = await getProjectById(projectId, 'internal')
  const t = await getTranslations('projects.timeTracking')

  if (!project) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return null
  }

  // Récupérer les membres du projet pour le filtre utilisateur
  const { data: memberships } = await supabase
    .from('project_memberships')
    .select(
      `
      user:users(id, email, first_name, last_name)
    `
    )
    .eq('project_id', projectId)

  const members =
    memberships?.map((m: any) => m.user).filter(Boolean) || []

  // Récupérer les tâches du projet pour le formulaire
  const tasks = await getTasksByProjectId(projectId)

  // Récupérer les entrées de temps
  // Note: Le filtre sprint sera géré côté client via le contexte sprint
  const categoryFilter = resolvedSearchParams.category
    ? resolvedSearchParams.category.split(',')
    : undefined

  const entries = await getTimeEntries({
    project_id: projectId,
    user_id: resolvedSearchParams.user_id,
    category: categoryFilter as any,
    date_from: resolvedSearchParams.date_from,
    date_to: resolvedSearchParams.date_to,
  })

  // Récupérer les stats
  const stats = await getTimeStats(projectId)

  return (
    <div className="flex-1 space-y-6 px-6 pb-6 md:px-8 md:pb-8">
      <ProjectTimePageClient
        projectId={projectId}
        initialEntries={entries}
        tasks={tasks}
        members={members}
        initialStats={stats}
        initialFilters={{
          user_id: resolvedSearchParams.user_id,
          category: categoryFilter,
          date_from: resolvedSearchParams.date_from,
          date_to: resolvedSearchParams.date_to,
        }}
      />
    </div>
  )
}
