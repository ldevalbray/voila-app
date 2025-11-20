import { createSupabaseServerClient } from './supabase-server'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled'

export interface Invoice {
  id: string
  project_id: string
  client_id: string
  label: string
  status: InvoiceStatus
  currency: string
  amount_cents: number
  billed_minutes: number
  issue_date: string
  due_date: string | null
  notes_internal: string | null
  notes_client: string | null
  created_by: string
  created_at: string
  updated_at: string
  // Relations (optionnelles, chargées via select)
  project?: {
    id: string
    name: string
  }
  client?: {
    id: string
    name: string
  }
  creator?: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
  }
}

export interface InvoiceFilters {
  project_id?: string
  client_id?: string
  status?: InvoiceStatus[]
}

/**
 * Récupère les factures avec filtres optionnels
 * @param filters Filtres optionnels
 * @returns Liste des factures
 */
export async function getInvoices(
  filters?: InvoiceFilters
): Promise<Invoice[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return []
    }

    let query = supabase
      .from('invoices')
      .select('*')
      .order('issue_date', { ascending: false })
      .order('created_at', { ascending: false })

    // Appliquer les filtres
    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id)
    }

    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id)
    }

    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    const { data: invoices, error } = await query

    if (error) {
      console.error('Error fetching invoices:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error,
      })
      return []
    }

    if (!invoices || invoices.length === 0) {
      return []
    }

    // Récupérer les relations séparément
    const projectIds = [...new Set(invoices.map((i) => i.project_id))]
    const clientIds = [...new Set(invoices.map((i) => i.client_id))]
    const creatorIds = [...new Set(invoices.map((i) => i.created_by))]

    // Récupérer les projets
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', projectIds)

    // Récupérer les clients
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .in('id', clientIds)

    // Récupérer les créateurs
    const { data: creators } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .in('id', creatorIds)

    // Créer des maps pour les relations
    const projectsMap = new Map((projects || []).map((p) => [p.id, p]))
    const clientsMap = new Map((clients || []).map((c) => [c.id, c]))
    const creatorsMap = new Map((creators || []).map((u) => [u.id, u]))

    // Enrichir les factures avec les relations
    const enrichedInvoices = invoices.map((invoice) => ({
      ...invoice,
      project: projectsMap.get(invoice.project_id),
      client: clientsMap.get(invoice.client_id),
      creator: creatorsMap.get(invoice.created_by),
    }))

    return enrichedInvoices as Invoice[]
  } catch (error) {
    console.error('Unexpected error in getInvoices:', error)
    return []
  }
}

/**
 * Récupère une facture par son ID
 * @param invoiceId ID de la facture
 * @returns La facture ou null
 */
export async function getInvoiceById(
  invoiceId: string
): Promise<Invoice | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return null
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (error) {
      console.error('Error fetching invoice:', error)
      return null
    }

    if (!invoice) {
      return null
    }

    // Récupérer les relations
    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', invoice.project_id)
      .single()

    const { data: client } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', invoice.client_id)
      .single()

    const { data: creator } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', invoice.created_by)
      .single()

    return {
      ...invoice,
      project: project || undefined,
      client: client || undefined,
      creator: creator || undefined,
    } as Invoice
  } catch (error) {
    console.error('Unexpected error in getInvoiceById:', error)
    return null
  }
}

/**
 * Récupère les statistiques de facturation pour un projet
 * @param projectId ID du projet
 * @returns Statistiques agrégées (total_logged_minutes, total_billed_minutes, unbilled_minutes)
 */
export async function getBillingStats(projectId: string): Promise<{
  total_logged_minutes: number
  total_billed_minutes: number
  unbilled_minutes: number
}> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return {
        total_logged_minutes: 0,
        total_billed_minutes: 0,
        unbilled_minutes: 0,
      }
    }

    // Récupérer le temps total enregistré pour ce projet
    const { data: timeEntries, error: timeError } = await supabase
      .from('time_entries')
      .select('duration_minutes')
      .eq('project_id', projectId)

    let total_logged_minutes = 0
    if (!timeError && timeEntries) {
      total_logged_minutes = timeEntries.reduce(
        (sum, entry) => sum + entry.duration_minutes,
        0
      )
    }

    // Récupérer le temps total facturé pour ce projet
    // On compte uniquement les factures non annulées (draft, sent, paid)
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('billed_minutes')
      .eq('project_id', projectId)
      .in('status', ['draft', 'sent', 'paid'])

    let total_billed_minutes = 0
    if (!invoicesError && invoices) {
      total_billed_minutes = invoices.reduce(
        (sum, invoice) => sum + invoice.billed_minutes,
        0
      )
    }

    const unbilled_minutes = Math.max(0, total_logged_minutes - total_billed_minutes)

    return {
      total_logged_minutes,
      total_billed_minutes,
      unbilled_minutes,
    }
  } catch (error) {
    console.error('Unexpected error in getBillingStats:', error)
    return {
      total_logged_minutes: 0,
      total_billed_minutes: 0,
      unbilled_minutes: 0,
    }
  }
}

