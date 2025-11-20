'use client'

import * as React from 'react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'

interface SidebarSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

/**
 * Composant SidebarSection pour structurer les sections de la sidebar
 * Utilise les composants shadcn/ui SidebarGroup, SidebarGroupLabel, SidebarGroupContent
 */
export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarGroupContent>
        {children}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

