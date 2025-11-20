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
 * Page de connexion
 * Utilise les composants shadcn/ui pour une cohérence visuelle avec le reste de l'application
 */
export default function LoginPage() {
  const t = useTranslations('auth.login')
  const tCommon = useTranslations('common')
  const { signIn, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn(email, password)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-8 shadow-lg">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
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
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            {t('forgotPassword')}
          </Link>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t('submitButtonLoading') : t('submitButton')}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t('createAccount')}
        </Link>
      </div>
    </div>
  )
}

