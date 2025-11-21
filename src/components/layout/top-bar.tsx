'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ModeSwitch } from '@/components/mode-switch'
import { SignOutButton } from '@/components/sign-out-button'
import { User } from '@/lib/auth'
import { useState, useEffect, useMemo } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Search as SearchIcon, User as UserIcon, Settings as SettingsIcon, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/breadcrumbs'
import { useProjectContext } from '@/components/layout/project-context'

interface TopBarProps {
  user: User
  hasInternalRole: boolean
  hasClientRole: boolean
}

/**
 * TopBar moderne avec design 2025 SaaS
 * - Logo à gauche
 * - Search / Cmd+K au centre (command palette stub)
 * - Mode switch, language switcher, avatar à droite
 */
export function TopBar({ user, hasInternalRole, hasClientRole }: TopBarProps) {
  const pathname = usePathname()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const isInternalMode = pathname?.startsWith('/app')
  const basePath = isInternalMode ? '/app' : '/portal'
  const t = useTranslations('ui')
  const tNav = useTranslations('navigation')
  const tProjects = useTranslations('projects')
  const project = useProjectContext()

  // S'assurer que le composant est monté côté client pour éviter les erreurs d'hydratation
  useEffect(() => {
    setMounted(true)
  }, [])

  // Avatar initials
  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    if (user.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  // Génération automatique des breadcrumbs depuis le pathname
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    if (!pathname) return []
    
    // Ne pas afficher de breadcrumbs sur la page d'accueil
    if (pathname === basePath || pathname === `${basePath}/`) {
      return []
    }

    const segments = pathname.split('/').filter(Boolean)
    const items: BreadcrumbItem[] = []
    
    // Ignorer le premier segment (app ou portal)
    const relevantSegments = segments.slice(1)
    
    if (relevantSegments.length === 0) {
      return []
    }

    let currentPath = basePath

    for (let i = 0; i < relevantSegments.length; i++) {
      const segment = relevantSegments[i]
      const isLast = i === relevantSegments.length - 1
      
      // Mapper les segments aux labels
      let label: string | null = null

      if (segment === 'projects') {
        label = tNav('projects') || tProjects('projects') || 'Projets'
      } else if (segment === 'tasks') {
        label = tNav('tasks') || tProjects('tasks') || 'Tâches'
      } else if (segment === 'epics') {
        label = tNav('epics') || tProjects('epics') || 'Epics'
      } else if (segment === 'time') {
        label = tNav('time') || tProjects('timeTracking.projectTime') || 'Temps'
      } else if (segment === 'overview') {
        label = tNav('overview') || 'Vue d\'ensemble'
      } else if (segment === 'settings') {
        label = tNav('settings') || 'Paramètres'
      } else if (segment === 'my-time') {
        label = tNav('myTime') || 'Mon temps'
      } else if (segment === 'my-tasks') {
        label = tNav('myTasks') || 'Mes tâches'
      } else if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // C'est un UUID (projectId) - utiliser le nom du projet si disponible
        if (i === 1 && relevantSegments[0] === 'projects' && project) {
          label = project.name
        } else {
          // On ne veut pas afficher l'UUID brut, on skip ce segment
          currentPath += `/${segment}`
          continue
        }
      } else {
        // Segment non reconnu, utiliser le segment tel quel (formaté)
        label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
      }

      // Si on a un label, ajouter le breadcrumb
      if (label) {
        currentPath += `/${segment}`
        items.push({
          label,
          href: isLast ? undefined : currentPath,
          isCurrent: isLast,
        })
      } else {
        currentPath += `/${segment}`
      }
    }

    return items
  }, [pathname, basePath, tNav, tProjects, project])

  // Keyboard shortcut pour ouvrir la command palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsCommandOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-4 px-4 md:px-6">
          {/* Left: Menu button + Logo + Breadcrumbs */}
          <div className="flex items-center gap-3">
            <SidebarTrigger className="flex" />
            <Link
              href={basePath}
              className="flex items-center gap-2 text-body-lg font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/80 shrink-0"
            >
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Voila.app
              </span>
            </Link>
            {/* Breadcrumbs à droite du logo avec chevron séparateur */}
            {breadcrumbs.length > 0 && (
              <div className="hidden md:flex items-center gap-2">
                <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" aria-hidden="true" />
                <Breadcrumbs items={breadcrumbs} />
              </div>
            )}
          </div>

          {/* Center: Search / Cmd+K */}
          <div className="hidden flex-1 items-center justify-center md:flex">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-9 w-full max-w-md justify-start gap-2 text-body-sm text-muted-foreground',
                'hover:bg-accent hover:text-accent-foreground',
                'border-border/50'
              )}
              onClick={() => setIsCommandOpen(true)}
              aria-label={t('search')}
            >
              <SearchIcon className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline-flex">{t('search')}</span>
              <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>

          {/* Mobile: Search button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setIsCommandOpen(true)}
              aria-label={t('search')}
            >
              <SearchIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: Mode switch, User menu */}
          <div className="flex items-center gap-2">
            {/* Mode switch (Internal / Client) */}
            {(hasInternalRole || hasClientRole) && (
              <ModeSwitch
                hasInternalRole={hasInternalRole}
                hasClientRole={hasClientRole}
              />
            )}
            
            {/* User avatar + dropdown */}
            {mounted ? (
              <DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="relative h-9 w-9 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all hover:ring-2 hover:ring-ring/50"
                    aria-label="Open user menu"
                  >
                    <Avatar className="h-9 w-9 border-2 border-border/50">
                      {user.avatar && (
                        <AvatarImage src={user.avatar} alt={user.email || t('user')} />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col space-y-1 p-3">
                    <span className="text-body-sm font-medium leading-none">
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : t('user')}
                    </span>
                    <span className="text-caption font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`${basePath}/settings`} className="flex items-center gap-2 cursor-pointer">
                      <UserIcon className="h-4 w-4" />
                      {t('profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`${basePath}/settings`} className="flex items-center gap-2 cursor-pointer">
                      <SettingsIcon className="h-4 w-4" />
                      {t('settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="p-1">
                    <SignOutButton />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                type="button"
                className="relative h-9 w-9 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all hover:ring-2 hover:ring-ring/50"
                aria-label="Open user menu"
                disabled
              >
                <Avatar className="h-9 w-9 border-2 border-border/50">
                  {user.avatar && (
                    <AvatarImage src={user.avatar} alt={user.email || t('user')} />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette (stub) */}
      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder={t('typeCommandOrSearch')} />
        <CommandList>
          <CommandEmpty>{t('noResultsFound')}</CommandEmpty>
          <CommandGroup heading={t('suggestions')}>
            <CommandItem onSelect={() => setIsCommandOpen(false)}>
              <span>{t('comingSoon')}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}