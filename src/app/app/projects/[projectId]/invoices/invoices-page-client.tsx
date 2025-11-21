'use client'

import { useState, useEffect } from 'react'
import { Invoice } from '@/lib/invoices'
import { Project } from '@/lib/projects'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/layout/empty-state'
import { Plus, Receipt, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatAmount, formatBilledMinutes } from '@/lib/billing-utils'
import { useRouter } from 'next/navigation'
import { deleteInvoice, fetchProjectInvoices } from '@/lib/actions/invoices'
import { SkeletonTable } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface InvoicesPageClientProps {
  projectId: string
  project: Project | null
  initialInvoices: Invoice[]
}

export function InvoicesPageClient({
  projectId,
  project,
  initialInvoices,
}: InvoicesPageClientProps) {
  const t = useTranslations('projects.invoices')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [invoices, setInvoices] = useState(initialInvoices)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Synchroniser le state avec les props quand elles changent (après router.refresh())
  useEffect(() => {
    setInvoices(initialInvoices)
  }, [initialInvoices])

  if (!project) {
    return null
  }

  // Vérifier que le projet a un client_id avant de permettre la création d'invoices
  if (!project.client_id) {
    return (
      <div className="space-y-6">
        <PageToolbar
          title={t('title')}
          description={t('description', { projectName: project.name })}
        />
        <EmptyState
          icon={Receipt}
          title={t('noClient')}
          description={t('noClientDescription')}
        />
      </div>
    )
  }

  const clientId = project.client_id

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: t('status.draft'), variant: 'outline' },
      sent: { label: t('status.sent'), variant: 'secondary' },
      paid: { label: t('status.paid'), variant: 'default' },
      cancelled: { label: t('status.cancelled'), variant: 'destructive' },
    }
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const handleCreateClick = () => {
    setEditingInvoice(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (invoice: Invoice) => {
    setDeletingInvoice(invoice)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingInvoice) return

    setIsDeleting(true)
    setIsLoading(true)
    try {
      const result = await deleteInvoice(deletingInvoice.id)
      if (result.error) {
        console.error('Error deleting invoice:', result.error)
        // TODO: Afficher une notification d'erreur
      } else {
        // Recharger les invoices depuis le serveur
        const fetchResult = await fetchProjectInvoices(projectId)
        if (fetchResult.data) {
          setInvoices(fetchResult.data)
        }
        setDeletingInvoice(null)
        // Revalider le serveur
        router.refresh()
      }
    } catch (error) {
      console.error('Unexpected error deleting invoice:', error)
    } finally {
      setIsDeleting(false)
      setIsLoading(false)
    }
  }

  const handleFormSuccess = async () => {
    setIsFormOpen(false)
    setEditingInvoice(null)
    setIsLoading(true)
    try {
      // Recharger les invoices depuis le serveur
      const result = await fetchProjectInvoices(projectId)
      if (result.data) {
        setInvoices(result.data)
      }
      // Revalider le serveur pour que les props soient à jour aussi
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageToolbar
        actions={
          <Button onClick={handleCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            {t('newInvoice')}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
          <SkeletonTable rows={5} />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={t('noInvoices')}
          description={t('noInvoicesDescription')}
          action={
            <Button onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              {t('newInvoice')}
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border border-border/50 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('label')}</TableHead>
                <TableHead>{t('statusLabel')}</TableHead>
                <TableHead>{t('issueDate')}</TableHead>
                <TableHead className="text-right">{t('amount')}</TableHead>
                <TableHead className="text-right">{t('billedMinutes')}</TableHead>
                <TableHead className="text-right">{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.label}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(invoice.amount_cents, invoice.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatBilledMinutes(invoice.billed_minutes)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(invoice)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {invoice.status !== 'paid' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(invoice)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <InvoiceForm
        projectId={projectId}
        clientId={clientId}
        invoice={editingInvoice}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
      />

      <Dialog
        open={!!deletingInvoice}
        onOpenChange={(open) => !open && setDeletingInvoice(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteInvoiceConfirm')}</DialogTitle>
            <DialogDescription>
              {t('deleteInvoiceConfirmDescription', {
                label: deletingInvoice?.label || '',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingInvoice(null)}
              disabled={isDeleting}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? tCommon('loading') : tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

