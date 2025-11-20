'use server'

import { getTaskStats } from '@/lib/tasks'

/**
 * Server Action pour récupérer les stats des tâches filtrées par sprint
 * Utilisable depuis les composants clients
 */
export async function getTaskStatsAction(
  projectId: string,
  sprintId?: string | null
) {
  return await getTaskStats(projectId, sprintId)
}

