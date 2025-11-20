'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Project } from '@/lib/projects'
import { GlobalProjectSwitch } from './global-project-switch'
import { ProjectSelector } from './project-selector'
import { NavItem } from './nav-item'
import { SidebarSection } from './sidebar-section'
import { useLastProjectId } from '@/hooks/use-last-project-id'
import { useProjectContext } from './project-context'
import { useEffect } from 'react'
import { getNavigationConfig } from './navigation-config'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
} from '@/components/ui/sidebar'

interface SidebarProps {
  mode: 'internal' | 'client'
  projects: Project[]
  currentProject?: Project | null
}

/**
 * Composant Sidebar réutilisable pour Internal et Client modes
 * Utilise la configuration de navigation centralisée et les nouveaux composants
 */
export function AppSidebar({ mode, projects, currentProject: currentProjectProp }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const basePath = mode === 'internal' ? '/app' : '/portal'
  const [, setLastProjectId] = useLastProjectId()
  
  // Utiliser le projet depuis le contexte si disponible, sinon depuis les props
  const projectFromContext = useProjectContext()
  
  // Extraire le projectId depuis l'URL si on est sur une route projet
  const projectIdFromUrl = pathname?.match(new RegExp(`^${basePath}/projects/([^/]+)`))?.[1]
  
  // Déterminer le projet actuel : contexte > props > recherche dans la liste par URL
  let currentProject = projectFromContext || currentProjectProp
  if (!currentProject && projectIdFromUrl) {
    // Si on n'a pas de projet depuis le contexte ou les props, chercher dans la liste
    currentProject = projects.find((p) => p.id === projectIdFromUrl) || null
  }

  // Sauvegarder le projet actuel dans localStorage
  useEffect(() => {
    if (currentProject?.id) {
      setLastProjectId(currentProject.id)
    }
  }, [currentProject?.id, setLastProjectId])

  // Déterminer si on est en mode Project
  // Si on est sur /app/projects avec ?mode=project, on est en mode Project
  // Sinon, vérifier si on est sur une route projet spécifique
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
  const currentProjectId = currentProject?.id || projectIdFromUrl

  // Utiliser la configuration de navigation centralisée
  const navigation = getNavigationConfig(mode, basePath)
  const globalNav = navigation.global
  const projectNav = currentProjectId ? navigation.getProject(currentProjectId) : []

  return (
    <Sidebar>
      <SidebarHeader>
        {/* Switch Global/Project */}
        <GlobalProjectSwitch basePath={basePath} projects={projects} />
      </SidebarHeader>
      
      <SidebarContent>
        {/* Section Global */}
        {!isProjectMode && (
          <SidebarSection title="Global">
            <SidebarMenu>
              {globalNav.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  exact={item.exact}
                  icon={item.icon}
                />
              ))}
            </SidebarMenu>
          </SidebarSection>
        )}

        {/* Section Project */}
        {isProjectMode && (
          <>
            <SidebarSection title="Current project">
              <ProjectSelector
                projects={projects}
                currentProjectId={currentProjectId}
                mode={mode}
                basePath={basePath}
              />
            </SidebarSection>
            
            {currentProject ? (
              <SidebarMenu>
                {projectNav.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                  />
                ))}
              </SidebarMenu>
            ) : (
              <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-4 text-sm text-sidebar-foreground/70">
                Select a project to begin
              </div>
            )}
          </>
        )}
      </SidebarContent>
    </Sidebar>
  )
}

