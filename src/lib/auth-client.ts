'use client'

import { createSupabaseBrowserClient } from './supabase-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * Hook client pour les actions d'authentification.
 */
export function useAuth() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createSupabaseBrowserClient()

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        return { success: false, error: signUpError.message }
      }

      // Si l'email confirmation est désactivée, l'utilisateur est connecté directement
      if (data.user) {
        router.push('/app')
        router.refresh()
      }

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return { success: false, error: signInError.message }
      }

      router.push('/app')
      router.refresh()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    setLoading(true)
    setError(null)

    try {
      const redirectTo = `${window.location.origin}/reset-password`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo,
        }
      )

      if (resetError) {
        setError(resetError.message)
        return { success: false, error: resetError.message }
      }

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (newPassword: string) => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError.message)
        return { success: false, error: updateError.message }
      }

      router.push('/login')
      router.refresh()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        setError(signOutError.message)
        return { success: false, error: signOutError.message }
      }

      router.push('/login')
      router.refresh()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  return {
    signUp,
    signIn,
    resetPassword,
    updatePassword,
    signOut,
    loading,
    error,
  }
}

