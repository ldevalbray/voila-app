import { getProjectById } from '@/lib/projects'
import { notFound } from 'next/navigation'

export default async function ProjectOverviewPage({
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
        <h1 className="text-3xl font-semibold text-slate-900">{project.name}</h1>
        <p className="mt-2 text-base text-slate-600">
          Overview - Mode: Internal, Section: Project
        </p>
        {project.client && (
          <p className="mt-1 text-sm text-slate-500">
            Client: {project.client.name} • Statut: {project.status}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Coming soon</p>
      </div>
    </div>
  )
}

