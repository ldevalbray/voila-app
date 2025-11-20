import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/config'

/**
 * Middleware next-intl pour gérer la locale
 * Avec localePrefix: 'never', les URLs ne sont pas modifiées (pas de /en ou /fr dans l'URL)
 * Mais le middleware injecte quand même la locale dans le contexte pour getRequestConfig
 */
export default createMiddleware({
  // Liste de toutes les locales supportées
  locales,

  // Locale par défaut si aucune ne correspond
  defaultLocale,

  // Ne jamais afficher le préfixe de locale dans l'URL
  // Les URLs restent comme /login, /app, etc. (pas /en/login)
  localePrefix: 'never',

  // Désactiver la détection automatique depuis Accept-Language
  // On gère la locale via cookies et préférences utilisateur dans getRequestConfig
  localeDetection: false,
})

export const config = {
  // Matcher toutes les routes sauf :
  // - celles qui commencent par /api, /_next ou /_vercel
  // - celles qui contiennent un point (ex: favicon.ico)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}

