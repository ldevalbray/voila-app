import { getProjectById } from '@/lib/projects'
import { notFound } from 'next/navigation'

export default async function ProjectNotesPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await getProjectById(projectId, 'internal')

  if (!project) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Notes</h1>
        <p className="mt-2 text-base text-slate-600">
          {project.name} - Mode: Internal, Section: Project
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Coming soon</p>
      </div>
    </div>
  )
}

