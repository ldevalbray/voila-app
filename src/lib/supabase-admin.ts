'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase admin env vars. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
  )
}

/**
 * Creates a Supabase admin client with service role key.
 * This client bypasses RLS and should ONLY be used in server-side code
 * for operations that require admin privileges (e.g., inviting users, checking if users exist).
 * 
 * NEVER expose this client to the browser or use it in client components.
 * 
 * @throws {Error} If called from client-side code
 */
export const createSupabaseAdminClient = async () => {
  // Ensure this is only called on the server
  if (typeof window !== 'undefined') {
    throw new Error(
      'createSupabaseAdminClient can only be used in Server Components, Server Actions, or Route Handlers.'
    )
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

