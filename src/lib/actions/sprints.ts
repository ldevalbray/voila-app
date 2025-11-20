'use server'

import { getSprintsByProjectId } from '@/lib/sprints'

/**
 * Server Action pour récupérer les sprints d'un projet
 * Utilisable depuis les composants clients
 */
export async function getSprintsByProjectIdAction(projectId: string) {
  return await getSprintsByProjectId(projectId)
}

