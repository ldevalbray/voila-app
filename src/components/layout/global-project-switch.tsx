'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLastProjectId } from '@/hooks/use-last-project-id'
import { Project } from '@/lib/projects'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useSidebar } from '@/components/ui/sidebar'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { LayoutGrid, FolderKanban, Home, FolderOpen } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useEffect, useRef } from 'react'

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
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

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

  const t = useTranslations('ui')
  const [isAnimating, setIsAnimating] = useState(false)

  // Animation lors du changement de mode
  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), 300)
    return () => clearTimeout(timer)
  }, [currentValue])

  // En mode collapsed, afficher une icône avec tooltip et animations
  if (isCollapsed) {
    const GlobalIcon = LayoutGrid
    const ProjectIcon = FolderKanban
    const label = currentValue === 'global' ? t('global') : t('project')
    
    return (
      <SidebarMenuButton
        onClick={() => handleValueChange(currentValue === 'global' ? 'project' : 'global')}
        tooltip={label}
        className={cn(
          'h-12 w-12 p-0 justify-center rounded-lg',
          'relative overflow-hidden',
          'transition-all duration-300 ease-out',
          'hover:bg-sidebar-accent/80 hover:scale-105',
          'active:scale-95',
          currentValue === 'project' 
            ? 'bg-sidebar-accent/50 shadow-sm' 
            : 'bg-sidebar-accent/30 hover:bg-sidebar-accent/50'
        )}
      >
        {/* Effet de brillance au hover */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-sidebar-primary/10 via-transparent to-transparent" />
        
        {/* Container pour les icônes avec animation */}
        <div className="relative w-5 h-5">
          <GlobalIcon
            className={cn(
              'absolute inset-0 w-5 h-5 transition-all duration-300 ease-in-out',
              currentValue === 'global'
                ? 'opacity-100 scale-100 rotate-0'
                : 'opacity-0 scale-75 -rotate-90',
              isAnimating && 'animate-pulse'
            )}
          />
          <ProjectIcon
            className={cn(
              'absolute inset-0 w-5 h-5 transition-all duration-300 ease-in-out',
              currentValue === 'project'
                ? 'opacity-100 scale-100 rotate-0'
                : 'opacity-0 scale-75 rotate-90',
              isAnimating && 'animate-pulse'
            )}
          />
        </div>
        
        {/* Indicateur de mode actif */}
        <div
          className={cn(
            'absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
            'transition-all duration-300 ease-out',
            currentValue === 'project'
              ? 'bg-sidebar-primary scale-100'
              : 'bg-sidebar-primary/50 scale-0'
          )}
        />
      </SidebarMenuButton>
    )
  }

  // En mode expanded, afficher le SegmentedControl avec icônes
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number
    width: number
  }>({ left: 0, width: 0 })

  const options = [
    { value: 'global', label: t('global'), icon: LayoutGrid },
    { value: 'project', label: t('project'), icon: FolderKanban },
  ]
  const activeIndex = options.findIndex((opt) => opt.value === currentValue)

  // Calculer la position et la largeur de la barre indicatrice
  useEffect(() => {
    const updateIndicator = () => {
      if (activeIndex === -1 || !containerRef.current) return

      const activeButton = buttonRefs.current[activeIndex]
      if (!activeButton) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()

      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      })
    }

    // Mettre à jour immédiatement
    updateIndicator()

    // Mettre à jour lors du redimensionnement
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [activeIndex, currentValue])

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className={cn(
          'relative inline-flex w-full rounded-md border border-sidebar-border/50 bg-sidebar-accent/30 p-0',
          'backdrop-blur-sm transition-all duration-200',
          'hover:border-sidebar-border hover:bg-sidebar-accent/40'
        )}
        role="radiogroup"
        aria-label="Global/Project switch"
      >
        {/* Barre indicatrice animée */}
        {activeIndex !== -1 && (
          <div
            className="absolute bottom-0 h-0.5 bg-foreground/40 rounded-full transition-all duration-300 ease-out z-10"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              transform: 'translateY(0)',
            }}
          />
        )}

        {options.map((option, index) => {
          const Icon = option.icon
          const isActive = option.value === currentValue
          
          return (
            <button
              key={option.value}
              ref={(el) => {
                buttonRefs.current[index] = el
              }}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => handleValueChange(option.value)}
              className={cn(
                'relative flex-1 flex items-center justify-center gap-2 rounded-md',
                'h-9 px-3 text-[0.875rem] font-medium',
                'transition-all duration-300 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1',
                'group',
                isActive
                  ? 'bg-sidebar text-sidebar-foreground shadow-sm font-semibold scale-100'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:scale-[1.02]',
                isAnimating && isActive && 'animate-pulse'
              )}
            >
              {/* Indicateur de fond animé */}
              <div
                className={cn(
                  'absolute inset-0 rounded-md transition-all duration-300 ease-out',
                  isActive
                    ? 'bg-sidebar shadow-sm'
                    : 'bg-transparent'
                )}
              />
              
              {/* Icône avec animation */}
              <Icon
                className={cn(
                  'relative z-10 w-4 h-4 transition-all duration-300 ease-out',
                  isActive
                    ? 'text-sidebar-foreground scale-100 rotate-0'
                    : 'text-sidebar-foreground/60 scale-90 group-hover:scale-100 group-hover:text-sidebar-foreground/80',
                  isAnimating && isActive && 'animate-pulse'
                )}
              />
              
              {/* Label avec animation */}
              <span
                className={cn(
                  'relative z-10 transition-all duration-300 ease-out',
                  isActive
                    ? 'text-sidebar-foreground'
                    : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground/80'
                )}
              >
                {option.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

