/**
 * Utilitaires pour le formatage des montants et du temps facturé
 * Fonctions pures qui peuvent être utilisées côté client et serveur
 */

/**
 * Convertit des centimes en format monétaire lisible
 * @param cents Montant en centimes
 * @param currency Code devise (par défaut 'EUR')
 * @param locale Locale pour le formatage (par défaut 'fr-FR')
 * @returns Format "X,XX €" ou équivalent
 */
export function formatAmount(
  cents: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  const amount = cents / 100
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Convertit un montant en format majeur (string) en centimes
 * @param amountString Montant sous forme de string (ex: "1200,50" ou "1200.50")
 * @returns Montant en centimes
 */
export function parseAmountToCents(amountString: string): number {
  // Remplacer la virgule par un point et supprimer les espaces
  const normalized = amountString.replace(/,/g, '.').replace(/\s/g, '')
  const amount = parseFloat(normalized)
  
  if (isNaN(amount)) {
    return 0
  }
  
  // Arrondir à 2 décimales et convertir en centimes
  return Math.round(amount * 100)
}

/**
 * Convertit des minutes en format lisible (heures avec décimales)
 * @param minutes Nombre de minutes
 * @returns Format "X.Xh" (ex: "12.5h" pour 12h30m)
 */
export function formatBilledMinutes(minutes: number): string {
  const hours = minutes / 60
  // Arrondir à 2 décimales maximum
  const roundedHours = Math.round(hours * 100) / 100
  return `${roundedHours}h`
}

/**
 * Convertit une durée en format heures (décimales) en minutes
 * @param durationString Durée sous forme de string (ex: "12.5h" ou "12.5" ou "12h 30m" pour compatibilité)
 * @returns Nombre de minutes
 */
export function parseDurationToMinutes(durationString: string): number {
  // Normaliser : supprimer les espaces et convertir en minuscules
  const normalized = durationString.trim().replace(/\s+/g, '').toLowerCase()
  
  // Pattern pour détecter "X.Xh" ou "X.X" (format heures décimales)
  const decimalHoursPattern = /^(\d+(?:\.\d+)?)h?$/
  
  // Pattern pour détecter "XhYm" ou "Xh" (format heures/minutes pour compatibilité)
  const hourMinutePattern = /^(\d+)h(?:(\d+)m)?$/
  
  // Pattern pour détecter "Ym" (format minutes pour compatibilité)
  const minutePattern = /^(\d+)m$/
  
  // Essayer d'abord le format heures décimales (priorité)
  const decimalHoursMatch = normalized.match(decimalHoursPattern)
  if (decimalHoursMatch) {
    const hours = parseFloat(decimalHoursMatch[1])
    if (!isNaN(hours)) {
      return Math.round(hours * 60)
    }
  }
  
  // Compatibilité avec l'ancien format "XhYm" ou "Xh"
  const hourMinuteMatch = normalized.match(hourMinutePattern)
  if (hourMinuteMatch) {
    const hours = parseInt(hourMinuteMatch[1], 10) || 0
    const minutes = parseInt(hourMinuteMatch[2], 10) || 0
    return hours * 60 + minutes
  }
  
  // Compatibilité avec le format "Ym"
  const minuteMatch = normalized.match(minutePattern)
  if (minuteMatch) {
    return parseInt(minuteMatch[1], 10) || 0
  }
  
  return 0
}

/**
 * Calcule le pourcentage de couverture de facturation
 * @param total_logged_minutes Temps total enregistré en minutes
 * @param total_billed_minutes Temps total facturé en minutes
 * @returns Pourcentage de couverture (0-100), ou null si total_logged_minutes est 0
 */
export function calculateBillingCoverage(
  total_logged_minutes: number,
  total_billed_minutes: number
): number | null {
  if (total_logged_minutes === 0) {
    return null
  }
  const coverage = (total_billed_minutes / total_logged_minutes) * 100
  return Math.min(100, Math.max(0, coverage))
}

