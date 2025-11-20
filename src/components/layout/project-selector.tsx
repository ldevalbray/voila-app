'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Project } from '@/lib/projects'
import { useLastProjectId } from '@/hooks/use-last-project-id'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, Building2, FolderKanban, ChevronRight, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTranslations } from 'next-intl'

interface ProjectSelectorProps {
  projects: Project[]
  currentProjectId?: string
  mode: 'internal' | 'client'
  basePath: '/app' | '/portal'
}

/**
 * Composant réutilisable pour sélectionner un projet (combobox avec recherche)
 * Utilise shadcn Command et Popover pour une meilleure UX
 * S'adapte au mode collapsed avec une icône
 */
export function ProjectSelector({
  projects,
  currentProjectId: currentProjectIdProp,
  mode,
  basePath,
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const [, setLastProjectId] = useLastProjectId()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const t = useTranslations('ui')

  // Extraire le projectId depuis l'URL si disponible
  const projectIdFromUrl = pathname?.match(new RegExp(`^${basePath}/projects/([^/]+)`))?.[1]
  const currentProjectId = currentProjectIdProp || projectIdFromUrl

  // Trouver le projet actuel
  const currentProject = projects.find((p) => p.id === currentProjectId)

  const handleSelectProject = (projectId: string) => {
    setLastProjectId(projectId)
    setIsOpen(false)

    // Conserver la vue actuelle si on est déjà dans un projet
    if (currentProjectId && pathname?.includes(`/projects/${currentProjectId}/`)) {
      const currentView = pathname.split(`/projects/${currentProjectId}/`)[1]?.split('/')[0] || 'overview'
      router.push(`${basePath}/projects/${projectId}/${currentView}`)
    } else {
      router.push(`${basePath}/projects/${projectId}/overview`)
    }
  }

  // En mode collapsed, afficher une icône avec popover qui déborde joliment
  // Style différent pour indiquer que c'est un sélecteur, pas un lien
  if (isCollapsed) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'relative h-12 w-12 p-0 flex items-center justify-center rounded-lg',
                  'border-2 border-dashed border-sidebar-border/50',
                  'bg-sidebar-accent/30 hover:bg-sidebar-accent/50',
                  'transition-all duration-200 ease-out',
                  'hover:border-sidebar-border hover:scale-105',
                  'active:scale-95',
                  'group/selector',
                  isOpen && 'border-sidebar-primary/50 bg-sidebar-accent/60',
                  currentProject && 'border-sidebar-primary/30 bg-sidebar-accent/40'
                )}
                aria-label={currentProject?.name || t('selectProject')}
              >
                {/* Icône principale : chevron qui tourne vers le bas quand ouvert */}
                <ChevronRight
                  className={cn(
                    'h-5 w-5 transition-all duration-300 ease-out',
                    'text-sidebar-foreground/70 group-hover/selector:text-sidebar-foreground',
                    isOpen 
                      ? 'rotate-90 text-sidebar-primary scale-110' 
                      : 'rotate-0'
                  )} 
                />
                
                {/* Indicateur de sélection si un projet est sélectionné */}
                {currentProject && (
                  <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-sidebar-primary animate-pulse" />
                )}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            {currentProject?.name || t('selectProject')}
          </TooltipContent>
        </Tooltip>
        <PopoverContent 
          className="w-80 p-0" 
          align="start"
          side="right"
          sideOffset={12}
          alignOffset={-8}
        >
          <Command>
            <CommandInput 
              placeholder={t('searchProjects')} 
              className="h-10 border-0 focus:ring-0"
            />
            <CommandList>
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                {t('noProjectFound')}
              </CommandEmpty>
              <CommandGroup>
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={`${project.name} ${project.client?.name || ''}`}
                    onSelect={() => handleSelectProject(project.id)}
                    className={cn(
                      'flex items-center gap-3 py-2.5 px-3 cursor-pointer',
                      'transition-colors duration-150',
                      'aria-selected:bg-sidebar-accent'
                    )}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0 transition-opacity duration-150',
                        project.id === currentProjectId
                          ? 'opacity-100 text-sidebar-primary'
                          : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                      <span className="font-medium text-sm text-sidebar-foreground">
                        {project.name}
                      </span>
                      {project.client && (
                        <span className="text-xs text-sidebar-foreground/50 flex items-center gap-1">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">{project.client.name}</span>
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  // En mode expanded, afficher le sélecteur complet
  return (
    <div className="space-y-3">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            role="combobox"
            aria-expanded={isOpen}
            className={cn(
              'w-full flex items-center justify-between',
              'h-auto py-2.5 px-3 rounded-md',
              'bg-sidebar-accent/50 border border-sidebar-border/50',
              'hover:bg-sidebar-accent hover:border-sidebar-border',
              'transition-all duration-200 ease-out',
              'text-left group'
            )}
          >
            {currentProject ? (
              <div className="flex flex-1 flex-col items-start gap-0.5 min-w-0">
                <span className="font-medium text-sm leading-tight text-sidebar-foreground truncate w-full">
                  {currentProject.name}
                </span>
                {currentProject.client && (
                  <span className="text-xs text-sidebar-foreground/50 flex items-center gap-1 truncate w-full">
                    <Building2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">{currentProject.client.name}</span>
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sidebar-foreground/50 text-sm">{t('selectProjectPlaceholder')}</span>
            )}
            <ChevronsUpDown className={cn(
              'ml-2 h-4 w-4 shrink-0 transition-transform duration-200',
              'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60',
              isOpen && 'rotate-180'
            )} />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="min-w-[var(--radix-popover-trigger-width)] w-auto max-w-md p-0" 
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <Command>
            <CommandInput 
              placeholder={t('searchProjects')} 
              className="h-10 border-0 focus:ring-0"
            />
            <CommandList>
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                {t('noProjectFound')}
              </CommandEmpty>
              <CommandGroup>
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={`${project.name} ${project.client?.name || ''}`}
                    onSelect={() => handleSelectProject(project.id)}
                    className={cn(
                      'flex items-center gap-3 py-2.5 px-3 cursor-pointer',
                      'transition-colors duration-150',
                      'aria-selected:bg-sidebar-accent'
                    )}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0 transition-opacity duration-150',
                        project.id === currentProjectId
                          ? 'opacity-100 text-sidebar-primary'
                          : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                      <span className="font-medium text-sm text-sidebar-foreground">
                        {project.name}
                      </span>
                      {project.client && (
                        <span className="text-xs text-sidebar-foreground/50 flex items-center gap-1">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">{project.client.name}</span>
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {currentProject && (
        <div className="flex items-center gap-2 text-xs text-sidebar-foreground/50 px-1 group-data-[collapsible=icon]:hidden">
          <Badge 
            variant="outline" 
            className={cn(
              'text-xs font-normal h-5 px-1.5',
              'border-sidebar-border/50 bg-sidebar-accent/30',
              'text-sidebar-foreground/70'
            )}
          >
            {currentProject.status}
          </Badge>
          {currentProject.client && (
            <>
              <span className="text-sidebar-foreground/30">•</span>
              <span className="flex items-center gap-1 text-sidebar-foreground/50">
                <Building2 className="h-3 w-3" />
                {currentProject.client.name}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
