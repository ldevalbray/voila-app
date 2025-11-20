import { getInternalProjects } from '@/lib/projects'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Page de liste des projets (Internal mode)
 * Améliorée avec un layout cohérent et une meilleure hiérarchie visuelle
 */
export default async function ProjectsPage() {
  const projects = await getInternalProjects()

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
        <p className="text-base text-muted-foreground">
          Liste des projets - Mode: Internal, Section: Global
        </p>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">Aucun projet trouvé.</p>
          </div>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              href={`/app/projects/${project.id}/overview`}
              className={cn(
                'block rounded-lg border border-border bg-card p-6 shadow-sm',
                'transition-all hover:shadow-md hover:border-primary/50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {project.name}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {project.status}
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  )}
                  {project.client && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{project.client.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

