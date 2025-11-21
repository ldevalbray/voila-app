import { getProjectById } from '@/lib/projects'
import { notFound } from 'next/navigation'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { EmptyState } from '@/components/layout/empty-state'
import { Receipt } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getTranslations } from 'next-intl/server'

/**
 * Page Invoices d'un projet (Client mode)
 * Design moderne avec placeholder
 */
export default async function PortalProjectInvoicesPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await getProjectById(projectId, 'client')
  const t = await getTranslations('projects')

  if (!project) {
    notFound()
  }

  return (
    <div className="flex-1 pt-8 px-8">
      <div className="space-y-6">
        <PageToolbar />

        <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">{t('projectInvoices')}</CardTitle>
          <CardDescription>
            {t('clientInvoicesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Receipt}
            title={t('invoicesComingSoon')}
            description={t('clientInvoicesComingSoonDescription')}
          />
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

