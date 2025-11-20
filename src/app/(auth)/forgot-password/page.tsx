'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth-client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

/**
 * Page de mot de passe oublié
 * Utilise les composants shadcn/ui pour une cohérence visuelle avec le reste de l'application
 */
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
    <div className="rounded-lg border border-border bg-card p-8 shadow-lg">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {success ? (
        <div className="space-y-4">
          <Alert className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{t('successMessage', { email })}</AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <Link href="/login">{t('backToLogin')}</Link>
          </Button>
        </div>
      ) : (
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t('submitButtonLoading') : t('submitButton')}
          </Button>
        </form>
      )}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t('backToLogin')}
        </Link>
      </div>
    </div>
  )
}

