import { getClientProjects } from '@/lib/projects'

export default async function PortalProjectsPage() {
  const projects = await getClientProjects()

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Projects</h1>
        <p className="mt-2 text-base text-slate-600">
          Liste des projets - Mode: Client, Section: Global
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {projects.length === 0 ? (
          <p className="text-sm text-slate-600">Aucun projet trouvé.</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50"
              >
                <h3 className="text-lg font-medium text-slate-900">{project.name}</h3>
                {project.description && (
                  <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                )}
                <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                  {project.client && <span>Client: {project.client.name}</span>}
                  <span>Statut: {project.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

