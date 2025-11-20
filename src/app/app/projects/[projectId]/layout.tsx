import { notFound } from 'next/navigation'
import { getProjectById } from '@/lib/projects'
import { ProjectProvider } from '@/components/layout/project-context'
import { SprintProvider } from '@/components/layout/sprint-context'
import { getSprintsByProjectId, getActiveSprintByProjectId } from '@/lib/sprints'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await getProjectById(projectId, 'internal')

  if (!project) {
    notFound()
  }

  // Récupérer les sprints et le sprint actif pour le contexte
  const sprints = await getSprintsByProjectId(projectId)
  const activeSprint = await getActiveSprintByProjectId(projectId)

  return (
    <ProjectProvider project={project}>
      <SprintProvider
        projectId={projectId}
        sprints={sprints}
        activeSprint={activeSprint}
      >
      {children}
      </SprintProvider>
    </ProjectProvider>
  )
}

