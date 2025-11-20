'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import type { InvoiceStatus, Invoice } from '@/lib/invoices'
import { getInvoices } from '@/lib/invoices'
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  deleteInvoiceSchema,
  fetchProjectInvoicesSchema,
} from '@/lib/validations/invoices'
import { checkInternalProjectRole, checkProjectAdmin } from '@/lib/auth-helpers'
import { strictRateLimiter } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

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
    
    // Validation avec Zod
    const validationResult = createInvoiceSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      }
    }

    const validatedInput = validationResult.data

    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      logger.warn('Unauthenticated invoice creation attempt')
      return { error: t('error') }
    }

    // Rate limiting (strict pour les opérations financières)
    const rateLimitResult = await strictRateLimiter(`invoice:create:${session.user.id}`)
    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for invoice creation', {
        userId: session.user.id,
        retryAfter: rateLimitResult.retryAfter,
      })
      return {
        error: `Rate limit exceeded. Please try again in ${rateLimitResult.retryAfter} seconds.`,
      }
    }

    // Vérification d'autorisation explicite
    const { hasAccess } = await checkInternalProjectRole(validatedInput.project_id)
    if (!hasAccess) {
      logger.warn('Unauthorized invoice creation attempt', {
        userId: session.user.id,
        projectId: validatedInput.project_id,
      })
      return { error: 'Unauthorized: You do not have permission to create invoices in this project' }
    }

    // Vérifier que le projet existe et appartient au client
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', validatedInput.project_id)
      .single()

    if (projectError || !project) {
      return { error: 'Project not found' }
    }

    // Vérifier que le projet a un client_id
    if (!project.client_id) {
      return { error: 'Project does not have a client assigned' }
    }

    // Vérifier que client_id correspond au projet (normalement ils doivent correspondre)
    if (project.client_id !== validatedInput.client_id) {
      console.warn(
        `Invoice client_id (${validatedInput.client_id}) does not match project client_id (${project.client_id})`
      )
      return { error: 'Client ID does not match the project client' }
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        project_id: validatedInput.project_id,
        client_id: validatedInput.client_id,
        label: validatedInput.label,
        status: validatedInput.status || 'draft',
        currency: validatedInput.currency || 'EUR',
        amount_cents: validatedInput.amount_cents,
        billed_minutes: validatedInput.billed_minutes,
        issue_date: validatedInput.issue_date,
        due_date: validatedInput.due_date || null,
        notes_internal: validatedInput.notes_internal || null,
        notes_client: validatedInput.notes_client || null,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating invoice', error, {
        projectId: validatedInput.project_id,
        userId: session.user.id,
      })
      return { error: error.message }
    }

    logger.info('Invoice created successfully', {
      invoiceId: data.id,
      projectId: validatedInput.project_id,
      userId: session.user.id,
      amountCents: validatedInput.amount_cents,
    })

    // Revalider les chemins pertinents
    revalidatePath(`/app/projects/${validatedInput.project_id}/invoices`)
    revalidatePath(`/app/projects/${validatedInput.project_id}/overview`)
    revalidatePath(`/app/projects/${validatedInput.project_id}/time`)
    revalidatePath(`/app/billing`)

    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error in createInvoice', error)
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
    
    // Validation avec Zod
    const validationResult = updateInvoiceSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      }
    }

    const validatedInput = validationResult.data

    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    // Récupérer la facture existante pour récupérer project_id et vérification d'autorisation
    const { data: existingInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('project_id, status')
      .eq('id', validatedInput.id)
      .single()

    if (fetchError || !existingInvoice) {
      return { error: 'Invoice not found' }
    }

    // Vérification d'autorisation explicite
    const { hasAccess } = await checkInternalProjectRole(existingInvoice.project_id)
    if (!hasAccess) {
      return { error: 'Unauthorized: You do not have permission to update invoices in this project' }
    }

    // Pour simplifier Step 6, on permet la modification tant que le statut n'est pas 'paid'
    // On peut restreindre certains champs si nécessaire
    if (existingInvoice.status === 'paid' && validatedInput.amount_cents !== undefined) {
      return { error: 'Cannot modify amount of a paid invoice' }
    }

    const updateData: any = {}

    if (validatedInput.label !== undefined) updateData.label = validatedInput.label
    if (validatedInput.status !== undefined) updateData.status = validatedInput.status
    if (validatedInput.currency !== undefined) updateData.currency = validatedInput.currency
    if (validatedInput.amount_cents !== undefined) updateData.amount_cents = validatedInput.amount_cents
    if (validatedInput.billed_minutes !== undefined) updateData.billed_minutes = validatedInput.billed_minutes
    if (validatedInput.issue_date !== undefined) updateData.issue_date = validatedInput.issue_date
    if (validatedInput.due_date !== undefined) updateData.due_date = validatedInput.due_date
    if (validatedInput.notes_internal !== undefined) updateData.notes_internal = validatedInput.notes_internal
    if (validatedInput.notes_client !== undefined) updateData.notes_client = validatedInput.notes_client

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', validatedInput.id)
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
    
    // Validation avec Zod
    const validationResult = deleteInvoiceSchema.safeParse({ invoiceId })
    if (!validationResult.success) {
      return {
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      }
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    // Récupérer le project_id avant suppression pour vérification d'autorisation
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('project_id')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return { error: 'Invoice not found' }
    }

    // Vérification d'autorisation explicite - seulement project_admin peut supprimer
    const isAdmin = await checkProjectAdmin(invoice.project_id)
    if (!isAdmin) {
      return { error: 'Unauthorized: Only project admins can delete invoices' }
    }

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
    // Validation avec Zod
    const validationResult = fetchProjectInvoicesSchema.safeParse({ projectId })
    if (!validationResult.success) {
      return {
        data: null,
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      }
    }

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

