'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import type { InvoiceStatus, Invoice } from '@/lib/invoices'
import { getInvoices } from '@/lib/invoices'

export interface CreateInvoiceInput {
  project_id: string
  client_id: string
  label: string
  status?: InvoiceStatus
  currency?: string
  amount_cents: number
  billed_minutes: number
  issue_date: string
  due_date?: string | null
  notes_internal?: string | null
  notes_client?: string | null
}

export interface UpdateInvoiceInput {
  id: string
  label?: string
  status?: InvoiceStatus
  currency?: string
  amount_cents?: number
  billed_minutes?: number
  issue_date?: string
  due_date?: string | null
  notes_internal?: string | null
  notes_client?: string | null
}

/**
 * Crée une nouvelle facture
 */
export async function createInvoice(input: CreateInvoiceInput) {
  try {
    const t = await getTranslations('common')
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    // Vérifier que project_id et client_id sont des UUIDs valides
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(input.project_id)) {
      return { error: 'Invalid project ID format' }
    }
    if (!uuidRegex.test(input.client_id)) {
      return { error: 'Invalid client ID format' }
    }

    // Vérifier que le projet existe et appartient au client
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', input.project_id)
      .single()

    if (projectError || !project) {
      return { error: 'Project not found' }
    }

    // Vérifier que le projet a un client_id
    if (!project.client_id) {
      return { error: 'Project does not have a client assigned' }
    }

    // Vérifier que client_id correspond au projet (normalement ils doivent correspondre)
    if (project.client_id !== input.client_id) {
      console.warn(
        `Invoice client_id (${input.client_id}) does not match project client_id (${project.client_id})`
      )
      return { error: 'Client ID does not match the project client' }
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        project_id: input.project_id,
        client_id: input.client_id,
        label: input.label,
        status: input.status || 'draft',
        currency: input.currency || 'EUR',
        amount_cents: input.amount_cents,
        billed_minutes: input.billed_minutes,
        issue_date: input.issue_date,
        due_date: input.due_date || null,
        notes_internal: input.notes_internal || null,
        notes_client: input.notes_client || null,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invoice:', error)
      return { error: error.message }
    }

    // Revalider les chemins pertinents
    revalidatePath(`/app/projects/${input.project_id}/invoices`)
    revalidatePath(`/app/projects/${input.project_id}/overview`)
    revalidatePath(`/app/projects/${input.project_id}/time`)
    revalidatePath(`/app/billing`)

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in createInvoice:', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

/**
 * Met à jour une facture existante
 */
export async function updateInvoice(input: UpdateInvoiceInput) {
  try {
    const t = await getTranslations('common')
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    // Récupérer la facture existante pour récupérer project_id
    const { data: existingInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('project_id, status')
      .eq('id', input.id)
      .single()

    if (fetchError || !existingInvoice) {
      return { error: 'Invoice not found' }
    }

    // Pour simplifier Step 6, on permet la modification tant que le statut n'est pas 'paid'
    // On peut restreindre certains champs si nécessaire
    if (existingInvoice.status === 'paid' && input.amount_cents !== undefined) {
      return { error: 'Cannot modify amount of a paid invoice' }
    }

    const updateData: any = {}

    if (input.label !== undefined) updateData.label = input.label
    if (input.status !== undefined) updateData.status = input.status
    if (input.currency !== undefined) updateData.currency = input.currency
    if (input.amount_cents !== undefined) updateData.amount_cents = input.amount_cents
    if (input.billed_minutes !== undefined) updateData.billed_minutes = input.billed_minutes
    if (input.issue_date !== undefined) updateData.issue_date = input.issue_date
    if (input.due_date !== undefined) updateData.due_date = input.due_date
    if (input.notes_internal !== undefined) updateData.notes_internal = input.notes_internal
    if (input.notes_client !== undefined) updateData.notes_client = input.notes_client

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating invoice:', error)
      return { error: error.message }
    }

    // Revalider les chemins pertinents
    revalidatePath(`/app/projects/${existingInvoice.project_id}/invoices`)
    revalidatePath(`/app/projects/${existingInvoice.project_id}/overview`)
    revalidatePath(`/app/projects/${existingInvoice.project_id}/time`)
    revalidatePath(`/app/billing`)

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in updateInvoice:', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

/**
 * Supprime une facture (uniquement pour project_admin)
 */
export async function deleteInvoice(invoiceId: string) {
  try {
    const t = await getTranslations('common')
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    // Récupérer le project_id avant suppression
    const { data: invoice } = await supabase
      .from('invoices')
      .select('project_id')
      .eq('id', invoiceId)
      .single()

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)

    if (error) {
      console.error('Error deleting invoice:', error)
      return { error: error.message }
    }

    // Revalider les chemins pertinents
    if (invoice) {
      revalidatePath(`/app/projects/${invoice.project_id}/invoices`)
      revalidatePath(`/app/projects/${invoice.project_id}/overview`)
      revalidatePath(`/app/projects/${invoice.project_id}/time`)
      revalidatePath(`/app/billing`)
    }

    return { error: null }
  } catch (error) {
    console.error('Unexpected error in deleteInvoice:', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

/**
 * Récupère les factures d'un projet (action serveur pour le client)
 */
export async function fetchProjectInvoices(projectId: string): Promise<{
  data: Invoice[] | null
  error: string | null
}> {
  try {
    const invoices = await getInvoices({
      project_id: projectId,
    })
    return { data: invoices, error: null }
  } catch (error) {
    console.error('Error fetching invoices:', error)
    const t = await getTranslations('common')
    return { data: null, error: t('error') }
  }
}

