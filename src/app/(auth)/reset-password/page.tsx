'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth-client'
import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AlertCircle, Loader2 } from 'lucide-react'

/**
 * Page de réinitialisation de mot de passe
 * Utilise les composants shadcn/ui pour une cohérence visuelle avec le reste de l'application
 */
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
      <div className="rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    )
  }

  if (isValidSession === false) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 shadow-lg">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('sessionExpired')}</AlertDescription>
        </Alert>
      </div>
    )
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
            placeholder={t('confirmPasswordPlaceholder')}
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t('submitButtonLoading') : t('submitButton')}
        </Button>
      </form>
    </div>
  )
}

