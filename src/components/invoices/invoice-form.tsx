'use client'

import { useState, useEffect } from 'react'
import { Invoice } from '@/lib/invoices'
import { createInvoice, updateInvoice } from '@/lib/actions/invoices'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslations } from 'next-intl'
import { formatAmount, parseAmountToCents, formatBilledMinutes, parseDurationToMinutes } from '@/lib/billing-utils'

interface InvoiceFormProps {
  projectId: string
  clientId: string
  invoice?: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InvoiceForm({
  projectId,
  clientId,
  invoice,
  open,
  onOpenChange,
  onSuccess,
}: InvoiceFormProps) {
  const t = useTranslations('projects.invoices')
  const tCommon = useTranslations('common')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculer la date du jour au format YYYY-MM-DD pour la valeur par défaut
  const today = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    label: invoice?.label || '',
    status: invoice?.status || 'draft',
    currency: invoice?.currency || 'EUR',
    amount: invoice ? (invoice.amount_cents / 100).toFixed(2) : '',
    billed_minutes: invoice ? formatBilledMinutes(invoice.billed_minutes) : '',
    issue_date: invoice?.issue_date || today,
    due_date: invoice?.due_date || '',
    notes_internal: invoice?.notes_internal || '',
    notes_client: invoice?.notes_client || '',
  })

  // Réinitialiser le formulaire quand le dialog s'ouvre/ferme ou que l'invoice change
  useEffect(() => {
    if (open) {
      if (invoice) {
        setFormData({
          label: invoice.label,
          status: invoice.status,
          currency: invoice.currency,
          amount: (invoice.amount_cents / 100).toFixed(2),
          billed_minutes: formatBilledMinutes(invoice.billed_minutes),
          issue_date: invoice.issue_date,
          due_date: invoice.due_date || '',
          notes_internal: invoice.notes_internal || '',
          notes_client: invoice.notes_client || '',
        })
      } else {
        setFormData({
          label: '',
          status: 'draft',
          currency: 'EUR',
          amount: '',
          billed_minutes: '',
          issue_date: today,
          due_date: '',
          notes_internal: '',
          notes_client: '',
        })
      }
      setError(null)
    }
  }, [open, invoice, today])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validation
      if (!formData.label.trim()) {
        setError(t('errors.labelRequired'))
        setIsSubmitting(false)
        return
      }

      if (!formData.amount || parseFloat(formData.amount.replace(/,/g, '.')) <= 0) {
        setError(t('errors.amountRequired'))
        setIsSubmitting(false)
        return
      }

      if (!formData.billed_minutes || parseDurationToMinutes(formData.billed_minutes) <= 0) {
        setError(t('errors.billedMinutesRequired'))
        setIsSubmitting(false)
        return
      }

      const amountCents = parseAmountToCents(formData.amount)
      const billedMinutes = parseDurationToMinutes(formData.billed_minutes)

      if (invoice) {
        // Mise à jour
        const result = await updateInvoice({
          id: invoice.id,
          label: formData.label,
          status: formData.status as any,
          currency: formData.currency,
          amount_cents: amountCents,
          billed_minutes: billedMinutes,
          issue_date: formData.issue_date,
          due_date: formData.due_date || null,
          notes_internal: formData.notes_internal || null,
          notes_client: formData.notes_client || null,
        })

        if (result.error) {
          setError(result.error)
          setIsSubmitting(false)
          return
        }
      } else {
        // Création
        const result = await createInvoice({
          project_id: projectId,
          client_id: clientId,
          label: formData.label,
          status: formData.status as any,
          currency: formData.currency,
          amount_cents: amountCents,
          billed_minutes: billedMinutes,
          issue_date: formData.issue_date,
          due_date: formData.due_date || null,
          notes_internal: formData.notes_internal || null,
          notes_client: formData.notes_client || null,
        })

        if (result.error) {
          setError(result.error)
          setIsSubmitting(false)
          return
        }
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? t('editInvoice') : t('newInvoice')}
          </DialogTitle>
          <DialogDescription>
            {invoice ? t('editInvoiceDescription') : t('newInvoiceDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="label">{t('label')} *</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              placeholder={t('labelPlaceholder')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">{t('statusLabel')}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as any })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t('status.draft')}</SelectItem>
                  <SelectItem value="sent">{t('status.sent')}</SelectItem>
                  <SelectItem value="paid">{t('status.paid')}</SelectItem>
                  <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t('currency')}</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t('amount')} *</Label>
              <Input
                id="amount"
                type="text"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder={t('amountHint')}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('amountHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billed_minutes">{t('billedMinutes')} *</Label>
              <Input
                id="billed_minutes"
                type="text"
                value={formData.billed_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, billed_minutes: e.target.value })
                }
                placeholder={t('billedMinutesHint')}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('billedMinutesHint')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue_date">{t('issueDate')} *</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) =>
                  setFormData({ ...formData, issue_date: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">{t('dueDate')}</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes_internal">{t('notesInternal')}</Label>
            <Textarea
              id="notes_internal"
              value={formData.notes_internal}
              onChange={(e) =>
                setFormData({ ...formData, notes_internal: e.target.value })
              }
              placeholder={t('notesInternalPlaceholder')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes_client">{t('notesClient')}</Label>
            <Textarea
              id="notes_client"
              value={formData.notes_client}
              onChange={(e) =>
                setFormData({ ...formData, notes_client: e.target.value })
              }
              placeholder={t('notesClientPlaceholder')}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? tCommon('saving')
                : invoice
                  ? tCommon('update')
                  : tCommon('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

