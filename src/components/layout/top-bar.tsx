'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ModeSwitch } from '@/components/mode-switch'
import { SignOutButton } from '@/components/sign-out-button'
import { User } from '@/lib/auth'
import { useState, useEffect } from 'react'
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
import { Search as SearchIcon, User as UserIcon, Settings as SettingsIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

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
  const isInternalMode = pathname?.startsWith('/app')
  const basePath = isInternalMode ? '/app' : '/portal'
  const t = useTranslations('ui')

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
          {/* Left: Menu button + Logo */}
          <div className="flex items-center gap-3">
            <SidebarTrigger className="flex" />
            <Link
              href={basePath}
              className="flex items-center gap-2 text-body-lg font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/80"
            >
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Voila.app
              </span>
            </Link>
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