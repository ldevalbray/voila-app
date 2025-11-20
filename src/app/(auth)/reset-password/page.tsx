'use client'

import { Button, Input } from '@supabase/ui'
import { useAuth } from '@/lib/auth-client'
import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword')
  const tCommon = useTranslations('common')
  const { updatePassword, loading, error } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Vérifier que l'utilisateur a une session valide (arrivé depuis le lien email)
    const checkSession = async () => {
      const supabase = createSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setIsValidSession(false)
        // Rediriger vers forgot-password si pas de session
        setTimeout(() => {
          router.push('/forgot-password')
        }, 2000)
      } else {
        setIsValidSession(true)
      }
    }

    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (password !== confirmPassword) {
      setLocalError(t('passwordMismatch'))
      return
    }

    if (password.length < 6) {
      setLocalError(t('passwordTooShort'))
      return
    }

    await updatePassword(password)
  }

  if (isValidSession === null) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-center text-slate-600">{tCommon('loading')}</p>
      </div>
    )
  }

  if (isValidSession === false) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {t('sessionExpired')}
        </div>
      </div>
    )
  }

  const displayError = localError || error

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
        <p className="mt-2 text-sm text-slate-600">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {displayError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {displayError}
          </div>
        )}

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700"
          >
            {tCommon('password')}
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1"
            placeholder={t('passwordPlaceholder')}
            minLength={6}
          />
          <p className="mt-1 text-xs text-slate-500">{t('passwordMinLength')}</p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-slate-700"
          >
            {tCommon('confirmPassword')}
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1"
            placeholder={t('confirmPasswordPlaceholder')}
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('submitButtonLoading') : t('submitButton')}
        </button>
      </form>
    </div>
  )
}

