import { getProjectById } from '@/lib/projects'
import { getTaskStats } from '@/lib/tasks'
import { getEpicsByProjectId } from '@/lib/epics'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Building2, CheckSquare, Layers, Link as LinkIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { OverviewPageClient } from './overview-page-client'

/**
 * Page overview d'un projet (Internal mode)
 * Design moderne avec header et sections
 */
export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await getProjectById(projectId, 'internal')
  const t = await getTranslations('projects')

  if (!project) {
    notFound()
  }

  // Récupérer les stats des tâches et epics (sans filtre sprint pour l'instant)
  const taskStats = await getTaskStats(projectId)
  const epics = await getEpicsByProjectId(projectId)

  // Construire la description avec client et description
  const descriptionParts = []
  if (project.client) {
    descriptionParts.push(project.client.name)
  }
  if (project.description) {
    descriptionParts.push(project.description)
  }

  return (
    <div className="flex-1 pt-8 px-8">
      <OverviewPageClient
        projectId={projectId}
        project={project}
        initialTaskStats={taskStats}
        epics={epics}
      />
    </div>
  )
}

