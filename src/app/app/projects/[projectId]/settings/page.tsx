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
    <div className="flex-1 space-y-6 px-6 pb-6 md:px-8 md:pb-8">
      <PageToolbar
        title={t('projectSettings')}
        description={t('settingsDescription', { projectName: project.name })}
      />

      <SettingsPageClient
        projectId={projectId}
        project={project}
        clients={clients}
      />
    </div>
  )
}

