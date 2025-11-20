/**
 * Système de rate limiting simple pour les Server Actions
 * 
 * NOTE: Cette implémentation utilise un cache en mémoire simple.
 * Pour la production, utilisez un service dédié comme:
 * - Upstash Redis
 * - Vercel KV
 * - Un middleware dédié
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

// Cache en mémoire (sera réinitialisé à chaque redémarrage du serveur)
// En production, utilisez un cache distribué (Redis, etc.)
const rateLimitStore: RateLimitStore = {}

export interface RateLimitOptions {
  /**
   * Nombre maximum de requêtes autorisées
   */
  maxRequests: number
  /**
   * Fenêtre de temps en millisecondes
   */
  windowMs: number
  /**
   * Identifiant unique pour le rate limiting (ex: userId, IP, etc.)
   */
  identifier: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfter?: number
}

/**
 * Vérifie si une requête respecte les limites de rate
 * 
 * @param options Options de rate limiting
 * @returns Résultat de la vérification
 */
export async function checkRateLimit(
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { maxRequests, windowMs, identifier } = options
  const now = Date.now()
  const key = identifier

  // Nettoyer les entrées expirées (simple cleanup)
  // En production, utilisez un TTL automatique avec Redis
  Object.keys(rateLimitStore).forEach((k) => {
    if (rateLimitStore[k].resetAt < now) {
      delete rateLimitStore[k]
    }
  })

  const current = rateLimitStore[key]

  // Première requête ou fenêtre expirée
  if (!current || current.resetAt < now) {
    rateLimitStore[key] = {
      count: 1,
      resetAt: now + windowMs,
    }

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    }
  }

  // Vérifier si la limite est dépassée
  if (current.count >= maxRequests) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000)

    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfter,
    }
  }

  // Incrémenter le compteur
  current.count++

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - current.count,
    resetAt: current.resetAt,
  }
}

/**
 * Helper pour créer un rate limiter avec des paramètres par défaut
 */
export function createRateLimiter(
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute par défaut
) {
  return async (identifier: string): Promise<RateLimitResult> => {
    return checkRateLimit({
      maxRequests,
      windowMs,
      identifier,
    })
  }
}

/**
 * Rate limiter par défaut pour les Server Actions
 * 10 requêtes par minute par utilisateur
 */
export const defaultRateLimiter = createRateLimiter(10, 60000)

/**
 * Rate limiter strict pour les opérations sensibles
 * 5 requêtes par minute par utilisateur
 */
export const strictRateLimiter = createRateLimiter(5, 60000)

