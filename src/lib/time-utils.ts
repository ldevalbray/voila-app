/**
 * Utilitaires pour le formatage du temps
 * Fonctions pures qui peuvent être utilisées côté client et serveur
 */

/**
 * Convertit des minutes en format lisible (heures et minutes)
 * @param minutes Nombre de minutes
 * @returns Format "Xh Ym" ou "Ym" si < 1h
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}m`
}

