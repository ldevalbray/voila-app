import { getTimeEntries } from '@/lib/time-entries'
import { getTranslations } from 'next-intl/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getInternalProjects } from '@/lib/projects'
import { MyTimePageClient } from './my-time-page-client'

/**
 * Page "My time" globale (Internal mode)
 * Affiche toutes les entrées de temps de l'utilisateur connecté
 */
export default async function MyTimePage({
  searchParams,
}: {
  searchParams: Promise<{
    date_from?: string
    date_to?: string
    project_id?: string
    category?: string
  }>
}) {
  const t = await getTranslations('projects.timeTracking')
  const resolvedSearchParams = await searchParams
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return null
  }

  // Calculer la période par défaut (semaine en cours)
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Lundi
  const monday = new Date(today.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const dateFrom =
    resolvedSearchParams.date_from ||
    monday.toISOString().split('T')[0]
  const dateTo =
    resolvedSearchParams.date_to ||
    sunday.toISOString().split('T')[0]

  // Récupérer les entrées de temps
  const categoryFilter = resolvedSearchParams.category
    ? resolvedSearchParams.category.split(',')
    : undefined

  const entries = await getTimeEntries({
    user_id: session.user.id,
    date_from: dateFrom,
    date_to: dateTo,
    project_id: resolvedSearchParams.project_id,
    category: categoryFilter as any,
  })

  // Récupérer tous les projets pour le filtre (seulement ceux auxquels l'utilisateur a accès)
  const projects = await getInternalProjects()

  return (
    <div className="flex-1 space-y-6 px-6 pb-6 md:px-8 md:pb-8">
      <MyTimePageClient
        initialEntries={entries}
        projects={projects || []}
        initialFilters={{
          date_from: dateFrom,
          date_to: dateTo,
          project_id: resolvedSearchParams.project_id,
          category: categoryFilter,
        }}
      />
    </div>
  )
}

