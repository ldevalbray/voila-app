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
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ProjectSelectorProps {
  projects: Project[]
  currentProjectId?: string
  mode: 'internal' | 'client'
  basePath: '/app' | '/portal'
}

/**
 * Composant réutilisable pour sélectionner un projet (combobox avec recherche)
 * Utilise shadcn Command et Popover pour une meilleure UX
 * Amélioré visuellement avec une meilleure hiérarchie et des badges
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

  return (
    <div className="space-y-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className={cn(
              'w-full justify-between h-auto py-3 px-3',
              'hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {currentProject ? (
              <div className="flex flex-1 flex-col items-start gap-1 text-left">
                <span className="font-semibold text-sm leading-none">
                  {currentProject.name}
                </span>
                {currentProject.client && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {currentProject.client.name}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">Select a project...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] w-auto max-w-md p-0" align="start">
          <Command>
            <CommandInput placeholder="Search projects..." className="h-9" />
            <CommandList>
              <CommandEmpty>No project found.</CommandEmpty>
              <CommandGroup>
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={`${project.name} ${project.client?.name || ''}`}
                    onSelect={() => handleSelectProject(project.id)}
                    className="flex items-center gap-2 py-3 cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        project.id === currentProjectId
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="font-medium text-sm">{project.name}</span>
                      {project.client && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {project.client.name}
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs font-normal">
            {currentProject.status}
          </Badge>
          {currentProject.client && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
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

