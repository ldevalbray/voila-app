import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  )
}

export const createSupabaseBrowserClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey)

export const createSupabaseServerClient = () => {
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(
        name: string,
        value: string,
        options: { path?: string; maxAge?: number }
      ) {
        cookieStore.set({
          name,
          value,
          path: options?.path,
          maxAge: options?.maxAge,
        })
      },
      remove(name: string, options: { path?: string }) {
        cookieStore.set({
          name,
          value: '',
          path: options?.path,
          maxAge: 0,
        })
      },
    },
  })
}
