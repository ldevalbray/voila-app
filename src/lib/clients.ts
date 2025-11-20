import { createSupabaseServerClient } from './supabase-server'

export interface Client {
  id: string
  name: string
  created_at: string
  updated_at: string
}

/**
 * Récupère tous les clients accessibles par l'utilisateur
 * (basé sur les politiques RLS : clients des projets accessibles)
 */
export async function getAllClients(): Promise<Client[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return []
    }

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching clients:', error)
      return []
    }

    return clients || []
  } catch (error) {
    console.error('Unexpected error in getAllClients:', error)
    return []
  }
}

