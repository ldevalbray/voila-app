'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { Sprint } from '@/lib/sprints'

// Valeur spéciale pour "Tous les sprints"
export const ALL_SPRINTS_VALUE = '__all_sprints__'

interface SprintContextValue {
  sprints: Sprint[]
  selectedSprintId: string | null
  setSelectedSprintId: (sprintId: string | null) => void
  activeSprint: Sprint | null
}

const SprintContext = createContext<SprintContextValue | undefined>(undefined)

interface SprintProviderProps {
  projectId: string
  sprints: Sprint[]
  activeSprint: Sprint | null
  children: ReactNode
}

/**
 * Provider pour le contexte Sprint
 * Gère la sélection de sprint par projet avec persistance dans localStorage
 */
export function SprintProvider({
  projectId,
  sprints,
  activeSprint,
  children,
}: SprintProviderProps) {
  // Clé localStorage pour stocker la sélection par projet
  const storageKey = `sprint_selection_${projectId}`

  // Initialiser la sélection :
  // 1. Vérifier localStorage
  // 2. Sinon, utiliser le sprint actif s'il existe
  // 3. Sinon, "Tous les sprints" (null)
  const [selectedSprintId, setSelectedSprintIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      // SSR: utiliser le sprint actif par défaut
      return activeSprint?.id || null
    }

    const stored = localStorage.getItem(storageKey)
    if (stored === ALL_SPRINTS_VALUE) {
      return null
    }
    if (stored && sprints.some((s) => s.id === stored)) {
      return stored
    }
    // Par défaut: sprint actif ou null (tous les sprints)
    return activeSprint?.id || null
  })

  // Mettre à jour localStorage quand la sélection change
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (selectedSprintId === null) {
      localStorage.setItem(storageKey, ALL_SPRINTS_VALUE)
    } else {
      localStorage.setItem(storageKey, selectedSprintId)
    }
  }, [selectedSprintId, storageKey])

  // Mettre à jour si le sprint actif change (par exemple après création d'un nouveau sprint actif)
  useEffect(() => {
    // Si aucun sprint n'est sélectionné et qu'un sprint actif apparaît, le sélectionner
    if (selectedSprintId === null && activeSprint) {
      const stored = localStorage.getItem(storageKey)
      // Seulement si l'utilisateur n'a pas explicitement choisi "Tous les sprints"
      if (stored !== ALL_SPRINTS_VALUE) {
        setSelectedSprintIdState(activeSprint.id)
      }
    }
  }, [activeSprint, selectedSprintId, storageKey])

  const setSelectedSprintId = (sprintId: string | null) => {
    setSelectedSprintIdState(sprintId)
  }

  return (
    <SprintContext.Provider
      value={{
        sprints,
        selectedSprintId,
        setSelectedSprintId,
        activeSprint,
      }}
    >
      {children}
    </SprintContext.Provider>
  )
}

/**
 * Hook pour utiliser le contexte Sprint
 */
export function useSprintContext() {
  const context = useContext(SprintContext)
  if (!context) {
    throw new Error('useSprintContext must be used within SprintProvider')
  }
  return context
}

