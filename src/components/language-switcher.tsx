'use client'

import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SegmentedControl } from '@/components/ui/segmented-control'

/**
 * Composant pour switcher entre les langues
 * Utilise le nouveau composant SegmentedControl pour une UX cohérente
 */
export function LanguageSwitcher() {
  const locale = useLocale()
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
      // Utiliser les mêmes attributs que next-intl attend
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`

      // Attendre un peu pour s'assurer que le cookie est bien défini
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Force a full page reload to ensure middleware reads the new cookie
      // This will unmount the component, so we don't need to reset loading state
      window.location.reload()
    } catch (error) {
      console.error('Error updating locale:', error)
      // Only reset loading if there was an error (no reload happened)
      setLoading(false)
    }
  }

  return (
    <SegmentedControl
      options={[
        { value: 'en', label: t('english'), disabled: loading },
        { value: 'fr', label: t('french'), disabled: loading },
      ]}
      value={locale}
      onValueChange={handleLanguageChange}
      size="sm"
    />
  )
}

