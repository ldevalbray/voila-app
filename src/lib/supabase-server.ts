'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  )
}

/**
 * Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * This function MUST only be called from server-side code.
 * 
 * @throws {Error} If called from client-side code
 */
export const createSupabaseServerClient = async () => {
  // Ensure this is only called on the server
  if (typeof window !== 'undefined') {
    throw new Error(
      'createSupabaseServerClient can only be used in Server Components, Server Actions, or Route Handlers.'
    )
  }

  try {
    const cookieStore = await cookies()

    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })
  } catch (error) {
    console.error('Error creating Supabase server client:', error)
    throw error
  }
}

