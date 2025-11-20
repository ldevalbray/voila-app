'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLastProjectId } from '@/hooks/use-last-project-id'
import { Project } from '@/lib/projects'
import { SegmentedControl } from '@/components/ui/segmented-control'

interface GlobalProjectSwitchProps {
  basePath: '/app' | '/portal'
  projects: Project[]
}

/**
 * Composant réutilisable pour le switch Global/Project
 * Utilise le nouveau composant SegmentedControl pour une UX cohérente
 */
export function GlobalProjectSwitch({ basePath, projects }: GlobalProjectSwitchProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [lastProjectId] = useLastProjectId()

  // Déterminer le mode actif depuis l'URL
  // Global : /app, /app/tasks, /app/projects (sans query param mode=project)
  // Project : /app/projects/[projectId]/... (avec un projectId UUID) OU /app/projects?mode=project
  const isProjectMode = (() => {
    if (!pathname) return false
    // Si on est sur /app/projects avec ?mode=project, on est en mode Project
    if (pathname === `${basePath}/projects` && searchParams?.get('mode') === 'project') {
      return true
    }
    // Exclure explicitement /app/projects (sans projectId et sans mode=project)
    if (pathname === `${basePath}/projects`) return false
    // Vérifier si on est sur une route projet : /app/projects/[projectId]/...
    const projectRouteMatch = pathname.match(new RegExp(`^${basePath}/projects/([^/]+)/`))
    return !!projectRouteMatch && projectRouteMatch[1] !== 'projects'
  })()

  const currentValue = isProjectMode ? 'project' : 'global'

  const handleValueChange = (value: string) => {
    if (value === 'global' && isProjectMode) {
      // Si on est sur /app/projects?mode=project, enlever le query param
      if (pathname === `${basePath}/projects` && searchParams?.get('mode') === 'project') {
        router.push(`${basePath}/projects`)
      } else {
        router.push(basePath)
      }
    } else if (value === 'project' && !isProjectMode) {
      // Naviguer vers un projet spécifique, pas vers /app/projects
      if (lastProjectId) {
        router.push(`${basePath}/projects/${lastProjectId}/overview`)
      } else if (projects.length > 0) {
        // Naviguer vers le premier projet disponible
        router.push(`${basePath}/projects/${projects[0].id}/overview`)
      } else {
        // Si aucun projet disponible, naviguer vers /app/projects avec mode=project
        // pour forcer l'affichage du mode Project dans la sidebar
        router.push(`${basePath}/projects?mode=project`)
      }
    }
  }

  return (
    <div className="mb-6 w-full">
      <SegmentedControl
        options={[
          { value: 'global', label: 'Global' },
          { value: 'project', label: 'Project' },
        ]}
        value={currentValue}
        onValueChange={handleValueChange}
        size="sm"
        className="w-full"
      />
    </div>
  )
}

