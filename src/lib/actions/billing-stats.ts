'use server'

import { getBillingStats as getBillingStatsLib } from '@/lib/invoices'

/**
 * Action serveur pour récupérer les statistiques de facturation d'un projet
 */
export async function getBillingStatsAction(projectId: string) {
  try {
    const stats = await getBillingStatsLib(projectId)
    return { data: stats, error: null }
  } catch (error) {
    console.error('Error in getBillingStatsAction:', error)
    return {
      data: {
        total_logged_minutes: 0,
        total_billed_minutes: 0,
        unbilled_minutes: 0,
      },
      error: 'Failed to load billing stats',
    }
  }
}

