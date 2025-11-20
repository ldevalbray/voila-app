'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth-client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'

/**
 * Page d'inscription
 * Utilise les composants shadcn/ui pour une cohérence visuelle avec le reste de l'application
 */
export default function SignupPage() {
  const t = useTranslations('auth.signup')
  const tCommon = useTranslations('common')
  const { signUp, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

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

    await signUp(email, password)
  }

  const displayError = localError || error

  return (
    <div className="rounded-lg border border-border bg-card p-8 shadow-lg">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {displayError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">{tCommon('email')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{tCommon('password')}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={t('passwordPlaceholder')}
            minLength={6}
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">{t('passwordMinLength')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{tCommon('confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder={t('passwordPlaceholder')}
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t('submitButtonLoading') : t('submitButton')}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {t('hasAccount')}{' '}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t('signIn')}
        </Link>
      </div>
    </div>
  )
}

