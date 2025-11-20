import { createSupabaseServerClient } from './supabase-server'
import { redirect } from 'next/navigation'

export interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar: string | null
  created_at: string
  updated_at: string
}

/**
 * Récupère l'utilisateur authentifié depuis la session Supabase.
 * Retourne null si non authentifié.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return null
  }

  // Récupérer le profil depuis la table users
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Vérifie si l'utilisateur est authentifié et redirige vers /login si ce n'est pas le cas.
 * Retourne l'utilisateur si authentifié.
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

/**
 * Récupère la session Supabase actuelle (pour les Server Actions).
 */
export async function getSession() {
  const supabase = await createSupabaseServerClient()
  return await supabase.auth.getSession()
}

