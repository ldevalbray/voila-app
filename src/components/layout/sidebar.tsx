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
  SidebarRail,
} from '@/components/ui/sidebar'
import { useTranslations } from 'next-intl'

interface SidebarProps {
  mode: 'internal' | 'client'
  projects: Project[]
  currentProject?: Project | null
}

/**
 * Sidebar moderne avec design 2025 SaaS
 * - Switch Global/Project en haut
 * - Navigation contextuelle selon le mode
 * - Project selector dans le mode Project
 */
export function AppSidebar({ mode, projects, currentProject: currentProjectProp }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const basePath = mode === 'internal' ? '/app' : '/portal'
  const [, setLastProjectId] = useLastProjectId()
  const t = useTranslations('ui')
  
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
  const tNav = useTranslations('navigation')
  const navigation = getNavigationConfig(mode, basePath, tNav)
  const globalNav = navigation.global
  const projectNav = currentProjectId ? navigation.getProject(currentProjectId) : []

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/50 px-4 py-4 bg-sidebar/50 backdrop-blur-sm group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-4">
        {/* Switch Global/Project */}
        <GlobalProjectSwitch basePath={basePath} projects={projects} />
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
        {/* Section Global */}
        {!isProjectMode && (
          <SidebarSection>
            <SidebarMenu className="space-y-0.5 group-data-[collapsible=icon]:space-y-2">
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
            <SidebarSection className="mb-2">
              <ProjectSelector
                projects={projects}
                currentProjectId={currentProjectId}
                mode={mode}
                basePath={basePath}
              />
            </SidebarSection>
            
            {currentProject ? (
              <SidebarSection>
                <SidebarMenu className="space-y-0.5 group-data-[collapsible=icon]:space-y-2">
                  {projectNav.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                    />
                  ))}
                </SidebarMenu>
              </SidebarSection>
            ) : (
              <div className="mt-2 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/30 p-4 text-sm text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                {t('selectProjectToBegin')}
              </div>
            )}
          </>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

