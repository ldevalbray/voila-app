'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface NavItemProps {
  href: string
  label: string
  icon?: ReactNode
  isActive?: boolean
  exact?: boolean
}

/**
 * Composant réutilisable pour un item de navigation
 * Design Linear-inspired avec animations fluides et états visuels clairs
 */
export function NavItem({
  href,
  label,
  icon,
  isActive: isActiveProp,
  exact = false,
}: NavItemProps) {
  const pathname = usePathname()
  const isActive =
    isActiveProp !== undefined
      ? isActiveProp
      : exact
        ? pathname === href
        : pathname?.startsWith(href)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={label}
        className={cn(
          'relative h-9 px-3 transition-all duration-200 ease-out',
          'hover:bg-sidebar-accent/80 hover:text-sidebar-foreground',
          'group/item',
          isActive && [
            'bg-sidebar-accent text-sidebar-foreground font-medium',
            'shadow-sm',
            'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2',
            'before:w-0.5 before:h-5 before:bg-sidebar-primary before:rounded-r-full',
            'before:transition-all before:duration-200',
            'group-data-[collapsible=icon]:before:hidden',
          ],
          !isActive && 'text-sidebar-foreground/70'
        )}
      >
        <Link
          href={href}
          aria-current={isActive ? 'page' : undefined}
          className="flex items-center gap-2.5 w-full"
        >
          {icon && (
            <span
              className={cn(
                'flex-shrink-0 transition-transform duration-200',
                'flex items-center justify-center',
                isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/60',
                'group-hover/item:scale-105',
                '[&>svg]:size-4 group-data-[collapsible=icon]:[&>svg]:size-5'
              )}
            >
              {icon}
            </span>
          )}
          <span className="flex-1 text-sm leading-none tracking-tight group-data-[collapsible=icon]:hidden">{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

