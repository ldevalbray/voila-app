'use client'

import { AppSidebar } from './sidebar'
import { Project } from '@/lib/projects'

interface SidebarWrapperProps {
  mode: 'internal' | 'client'
  projects: Project[]
  currentProject?: Project | null
}

/**
 * Wrapper pour la Sidebar
 * Les composants shadcn/ui gèrent déjà l'overlay et les états responsive
 */
export function SidebarWrapper({
  mode,
  projects,
  currentProject,
}: SidebarWrapperProps) {
  return <AppSidebar mode={mode} projects={projects} currentProject={currentProject} />
}

