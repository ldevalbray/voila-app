import { notFound } from 'next/navigation'
import { getProjectById } from '@/lib/projects'
import { ProjectProvider } from '@/components/layout/project-context'

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

  return (
    <ProjectProvider project={project}>
      {children}
    </ProjectProvider>
  )
}

