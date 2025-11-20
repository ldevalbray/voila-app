'use client'

import * as React from 'react'
import {
  SidebarGroup,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface SidebarSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

/**
 * SidebarSection avec design Linear-inspired
 * Hiérarchie visuelle claire avec espacements généreux
 */
export function SidebarSection({ children, className, title }: SidebarSectionProps) {
  return (
    <SidebarGroup className={cn('px-0', className)}>
      <SidebarGroupContent className="space-y-1 group-data-[collapsible=icon]:space-y-2">
        {children}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

