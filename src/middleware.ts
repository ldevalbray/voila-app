import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/config'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware next-intl pour gérer la locale
 * Avec localePrefix: 'never', les URLs ne sont pas modifiées (pas de /en ou /fr dans l'URL)
 * Mais le middleware injecte quand même la locale dans le contexte pour getRequestConfig
 */
const intlMiddleware = createMiddleware({
  // Liste de toutes les locales supportées
  locales,

  // Locale par défaut si aucune ne correspond
  defaultLocale,

  // Ne jamais afficher le préfixe de locale dans l'URL
  // Les URLs restent comme /login, /app, etc. (pas /en/login)
  localePrefix: 'never',

  // Activer la détection depuis les cookies
  // next-intl lit automatiquement le cookie 'NEXT_LOCALE' quand localeDetection est true
  localeDetection: true,

  // Exclure certaines routes du middleware
  alternateLinks: false,
})

/**
 * Middleware personnalisé qui gère correctement les routes avec next-intl
 * 
 * Le problème : next-intl avec localePrefix: 'never' fait quand même des réécritures
 * internes vers /en/... ce qui cause des 404.
 * 
 * Solution : Intercepter les réécritures et utiliser NextResponse.rewrite() pour
 * réécrire vers la bonne route sans préfixe de locale.
 */
export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Ignorer les routes statiques, API, et Next.js internes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_vercel/') ||
    pathname.includes('.') // fichiers statiques (favicon.ico, etc.)
  ) {
    return NextResponse.next()
  }

  // Pattern pour détecter les locales dans les URLs
  const localePattern = new RegExp(`^/(${locales.join('|')})(/.*)?$`)
  
  // Si la route commence déjà par une locale (ex: /en/login), rediriger vers la route sans locale
  const match = pathname.match(localePattern)
  if (match) {
    const pathWithoutLocale = match[2] || '/'
    const url = request.nextUrl.clone()
    url.pathname = pathWithoutLocale
    return NextResponse.redirect(url)
  }

  // Appeler le middleware next-intl pour gérer la locale dans le contexte
  // Avec localeDetection: true, next-intl lit automatiquement le cookie 'NEXT_LOCALE'
  const response = intlMiddleware(request)

  // Si next-intl a fait une réécriture vers /en/..., on la corrige
  if (response) {
    const rewriteHeader = response.headers.get('x-middleware-rewrite')
    if (rewriteHeader) {
      // Le header x-middleware-rewrite est un chemin relatif
      let rewritePath = rewriteHeader
      
      // Essayer de parser comme URL pour extraire le chemin
      try {
        // Si c'est une URL complète (commence par http:// ou https://)
        if (rewriteHeader.startsWith('http://') || rewriteHeader.startsWith('https://')) {
          const rewriteUrl = new URL(rewriteHeader)
          rewritePath = rewriteUrl.pathname
        } else {
          // Sinon, créer une URL relative à la requête pour extraire le chemin
          const rewriteUrl = new URL(rewriteHeader, request.url)
          rewritePath = rewriteUrl.pathname
        }
      } catch {
        // Si le parsing échoue, traiter comme un chemin direct
        rewritePath = rewriteHeader.startsWith('/') ? rewriteHeader : `/${rewriteHeader}`
      }

      // Si la réécriture contient une locale, créer une nouvelle réponse avec rewrite
      const rewriteMatch = rewritePath.match(localePattern)
      if (rewriteMatch) {
        const pathWithoutLocale = rewriteMatch[2] || '/'
        
        // Créer une nouvelle URL pour la réécriture
        const rewriteUrl = request.nextUrl.clone()
        rewriteUrl.pathname = pathWithoutLocale
        
        // Créer une nouvelle réponse qui réécrit vers la route sans locale
        // en préservant tous les autres headers du middleware next-intl
        const newResponse = NextResponse.rewrite(rewriteUrl)
        
        // Copier tous les headers de la réponse originale (sauf x-middleware-rewrite)
        response.headers.forEach((value, key) => {
          if (key !== 'x-middleware-rewrite' && key !== 'location') {
            newResponse.headers.set(key, value)
          }
        })
        
        return newResponse
      }
    }
  }

  return response || NextResponse.next()
}

export const config = {
  // Matcher toutes les routes sauf :
  // - celles qui commencent par /api, /_next ou /_vercel
  // - celles qui contiennent un point (ex: favicon.ico)
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _vercel (Vercel internals)
     * - files with extensions (static assets)
     */
    '/((?!api|_next/static|_next/image|_vercel|.*\\..*).*)',
  ],
}
