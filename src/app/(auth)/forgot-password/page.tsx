'use client'

import { Button, Input } from '@supabase/ui'
import { useAuth } from '@/lib/auth-client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword')
  const tCommon = useTranslations('common')
  const { resetPassword, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)
    const result = await resetPassword(email)
    if (result.success) {
      setSuccess(true)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
        <p className="mt-2 text-sm text-slate-600">{t('subtitle')}</p>
      </div>

      {success ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {t('successMessage', { email })}
          </div>
          <Link href="/login">
            <button
              type="button"
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              {t('backToLogin')}
            </button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              {tCommon('email')}
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              placeholder={t('emailPlaceholder')}
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
      )}

      <div className="mt-6 text-center text-sm text-slate-600">
        <Link href="/login" className="font-medium text-slate-900 hover:underline">
          {t('backToLogin')}
        </Link>
      </div>
    </div>
  )
}

