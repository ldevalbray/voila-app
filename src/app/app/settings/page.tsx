import { LanguageSwitcher } from '@/components/language-switcher'
import { getTranslations } from 'next-intl/server'

export default async function SettingsPage() {
  const t = await getTranslations('settings')
  
  return (
    <div className="mx-auto max-w-7xl pt-8 px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">{t('title')}</h1>
        <p className="mt-2 text-base text-slate-600">
          {t('description')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Language Settings */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('language')}</h2>
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  )
}

