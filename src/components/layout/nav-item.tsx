'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

interface NavItemProps {
  href: string
  label: string
  icon?: ReactNode
  isActive?: boolean
  exact?: boolean
}

/**
 * Composant réutilisable pour un item de navigation
 * Utilise les composants shadcn/ui SidebarMenuItem et SidebarMenuButton
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
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={href} aria-current={isActive ? 'page' : undefined}>
          {icon && icon}
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

