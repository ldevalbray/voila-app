import { getProjectById } from '@/lib/projects'
import { getAllClients } from '@/lib/clients'
import { notFound } from 'next/navigation'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { getTranslations } from 'next-intl/server'
import { SettingsPageClient } from './settings-page-client'

/**
 * Page Settings d'un projet (Internal mode)
 * Permet de gérer les paramètres du projet (client, etc.)
 */
export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await getProjectById(projectId, 'internal')
  const clients = await getAllClients()
  const t = await getTranslations('projects')

  if (!project) {
    notFound()
  }

  return (
    <div className="flex-1 pt-8 px-8">
      <div className="space-y-6">
        <PageToolbar />

        <SettingsPageClient
        projectId={projectId}
        project={project}
        clients={clients}
      />
      </div>
    </div>
  )
}

