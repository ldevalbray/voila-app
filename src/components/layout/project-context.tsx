'use client'

import { createContext, useContext, ReactNode } from 'react'
import { Project } from '@/lib/projects'

interface ProjectContextValue {
  project: Project | null
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

export function ProjectProvider({
  project,
  children,
}: {
  project: Project | null
  children: ReactNode
}) {
  return (
    <ProjectContext.Provider value={{ project }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  return context?.project ?? null
}

