'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('language')
  const [loading, setLoading] = useState(false)

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === locale || loading) return

    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Update user locale in database if authenticated
      if (session?.user) {
        await supabase
          .from('users')
          .update({ locale: newLocale })
          .eq('id', session.user.id)
      }

      // Set cookie for immediate effect
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`

      // Reload the page to apply new locale
      router.refresh()
    } catch (error) {
      console.error('Error updating locale:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-600">{t('switch')}:</span>
      <div className="flex gap-1 rounded-md border border-slate-200 bg-white p-1">
        <button
          onClick={() => handleLanguageChange('en')}
          disabled={loading}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            locale === 'en'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {t('english')}
        </button>
        <button
          onClick={() => handleLanguageChange('fr')}
          disabled={loading}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            locale === 'fr'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {t('french')}
        </button>
      </div>
    </div>
  )
}

