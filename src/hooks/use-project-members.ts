'use client'

import { useState, useEffect } from 'react'
import { getProjectMembers, ProjectMember } from '@/lib/actions/members'

/**
 * Hook pour récupérer les membres d'un projet
 * 
 * Ce hook sera utilisé pour :
 * - Afficher la liste des membres dans les paramètres du projet
 * - Autocomplétion @mention dans les commentaires (futur)
 * - Assignation de tâches (futur)
 * - Affichage des participants dans d'autres parties de l'UI (futur)
 * 
 * @param projectId ID du projet
 * @returns Les membres du projet, l'état de chargement et les erreurs
 */
export function useProjectMembers(projectId: string) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true)
      setError(null)

      const result = await getProjectMembers(projectId)

      if (result.error) {
        setError(result.error)
        setMembers([])
      } else {
        setMembers(result.data || [])
      }

      setLoading(false)
    }

    if (projectId) {
      fetchMembers()
    }
  }, [projectId])

  // Séparer les membres en internes et clients
  const internalMembers = members.filter(
    (m) => m.role === 'project_admin' || m.role === 'project_participant'
  )
  const clientMembers = members.filter((m) => m.role === 'project_client')

  // Mapper les membres avec member_type pour faciliter l'utilisation
  const membersWithType = members.map((m) => ({
    ...m,
    member_type:
      m.role === 'project_admin' || m.role === 'project_participant'
        ? ('internal' as const)
        : ('client' as const),
  }))

  return {
    members,
    membersWithType,
    internalMembers,
    clientMembers,
    loading,
    error,
    refetch: async () => {
      setLoading(true)
      setError(null)
      const result = await getProjectMembers(projectId)
      if (result.error) {
        setError(result.error)
        setMembers([])
      } else {
        setMembers(result.data || [])
      }
      setLoading(false)
    },
  }
}

