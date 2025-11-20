import { requireAuth } from '@/lib/auth'
import { SignOutButton } from '@/components/sign-out-button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { getTranslations } from 'next-intl/server'

export default async function AppPage() {
  const user = await requireAuth()
  const t = await getTranslations('app')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-20">
      <div className="w-full max-w-2xl space-y-8 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">{t('title')}</h1>
          <p className="text-base text-slate-600">
            {t('subtitle', { email: user.email })}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <p className="text-sm text-slate-600">{t('placeholder')}</p>
        </div>

        <div className="flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </main>
  )
}

