'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ModeSwitch } from '@/components/mode-switch'
import { SignOutButton } from '@/components/sign-out-button'
import { User } from '@/lib/auth'
import { useState } from 'react'
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
import { Search as SearchIcon, User as UserIcon, Settings as SettingsIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface TopBarProps {
  user: User
  hasInternalRole: boolean
  hasClientRole: boolean
}

/**
 * Composant TopBar réutilisable pour Internal et Client modes
 * Utilise les tokens de design shadcn/ui pour une cohérence visuelle
 */
export function TopBar({ user, hasInternalRole, hasClientRole }: TopBarProps) {
  const pathname = usePathname()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const isInternalMode = pathname?.startsWith('/app')
  const basePath = isInternalMode ? '/app' : '/portal'

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-full items-center justify-between gap-4 px-4 md:px-6">
        {/* Left: Menu button (mobile) + Logo */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="lg:hidden" />
          <Link
            href={basePath}
            className="flex items-center gap-2 text-xl font-semibold text-foreground transition-colors hover:text-foreground/80"
          >
            Voila.app
          </Link>
        </div>

        {/* Center: Search placeholder (stub) */}
        <div className="hidden flex-1 items-center justify-center md:flex">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-9 w-full max-w-sm justify-start gap-2 text-sm text-muted-foreground',
              'hover:bg-accent hover:text-accent-foreground'
            )}
            onClick={() => {
              // Stub pour future recherche / command palette
              console.log('Search / Cmd+K clicked')
            }}
          >
            <SearchIcon className="h-4 w-4" />
            <span className="hidden lg:inline-flex">Search...</span>
            <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Right: Language, Mode switch, User menu */}
        <div className="flex items-center gap-3">
          <ModeSwitch
            hasInternalRole={hasInternalRole}
            hasClientRole={hasClientRole}
          />
          <DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative h-9 w-9 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Open user menu"
              >
                <Avatar className="h-9 w-9">
                  {user.avatar && (
                    <AvatarImage src={user.avatar} alt={user.email || 'User'} />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col space-y-1 p-3">
                <span className="text-sm font-medium leading-none">
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : 'User'}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`${basePath}/profile`} className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`${basePath}/settings`} className="flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  Settings
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
  )
}

