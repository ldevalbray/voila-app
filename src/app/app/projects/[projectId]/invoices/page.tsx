import { getProjectById } from '@/lib/projects'
import { getInvoices } from '@/lib/invoices'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { InvoicesPageClient } from './invoices-page-client'

/**
 * Page Invoices d'un projet (Internal mode)
 * Affiche la liste des factures du projet avec possibilité de créer/éditer
 */
export default async function ProjectInvoicesPage({
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

  // Récupérer les factures du projet
  const invoices = await getInvoices({
    project_id: projectId,
  })

  return (
    <div className="flex-1 space-y-6 pt-8 px-8">
      <InvoicesPageClient
        projectId={projectId}
        project={project}
        initialInvoices={invoices}
      />
    </div>
  )
}
