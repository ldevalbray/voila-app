'use client'

import { useEffect, useState } from 'react'

const LAST_PROJECT_ID_KEY = 'voila_last_project_id'

/**
 * Hook pour gérer le dernier projet visité dans localStorage
 */
export function useLastProjectId() {
  const [lastProjectId, setLastProjectIdState] = useState<string | null>(null)

  useEffect(() => {
    // Lire depuis localStorage au montage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LAST_PROJECT_ID_KEY)
      if (stored) {
        setLastProjectIdState(stored)
      }
    }
  }, [])

  const setLastProjectId = (projectId: string | null) => {
    if (typeof window !== 'undefined') {
      if (projectId) {
        localStorage.setItem(LAST_PROJECT_ID_KEY, projectId)
      } else {
        localStorage.removeItem(LAST_PROJECT_ID_KEY)
      }
      setLastProjectIdState(projectId)
    }
  }

  return [lastProjectId, setLastProjectId] as const
}

