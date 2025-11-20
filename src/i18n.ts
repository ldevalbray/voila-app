import { getRequestConfig } from 'next-intl/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { defaultLocale, isValidLocale, type Locale } from './i18n/config'
import { cookies } from 'next/headers'

/**
 * Get user's preferred locale from database
 * Falls back to default locale if not found
 */
async function getUserLocale(): Promise<Locale> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return defaultLocale
    }

    const { data: user } = await supabase
      .from('users')
      .select('locale')
      .eq('id', session.user.id)
      .single()

    if (user?.locale && isValidLocale(user.locale)) {
      return user.locale
    }

    return defaultLocale
  } catch (error) {
    console.error('Error fetching user locale:', error)
    return defaultLocale
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  // Le middleware next-intl injecte requestLocale dans le contexte
  // On le résout s'il est une Promise
  let locale: Locale = defaultLocale

  if (requestLocale) {
    const resolvedLocale =
      requestLocale instanceof Promise ? await requestLocale : requestLocale
    if (resolvedLocale && isValidLocale(resolvedLocale)) {
      locale = resolvedLocale
    }
  }

  // Si le middleware n'a pas fourni de locale (première visite, pas de cookie),
  // on détermine la locale depuis le cookie ou la préférence utilisateur
  if (locale === defaultLocale) {
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value

    if (cookieLocale && isValidLocale(cookieLocale)) {
      locale = cookieLocale
    } else {
      // Si pas de cookie, essayer de récupérer depuis la DB
      locale = await getUserLocale()
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})

