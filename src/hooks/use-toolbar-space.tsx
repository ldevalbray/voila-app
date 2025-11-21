'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Hook pour détecter si la toolbar a assez d'espace pour afficher tous les éléments
 * en mode normal, ou si elle doit passer en mode compact (icônes uniquement)
 */
export function useToolbarSpace() {
  const [isCompact, setIsCompact] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const checkSpace = useCallback(() => {
    const container = containerRef.current
    const content = contentRef.current

    if (!container || !content) return

    // Vérifier si le conteneur a un débordement horizontal
    // Si scrollWidth > clientWidth, cela signifie que le contenu déborde
    const containerWidth = container.clientWidth
    const containerScrollWidth = container.scrollWidth
    
    // Si le contenu dépasse la largeur disponible, passer en mode compact
    // Ajouter une petite marge pour éviter les basculements fréquents
    setIsCompact(containerScrollWidth > containerWidth + 2)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current

    if (!container || !content) return

    // Vérifier au chargement et au redimensionnement
    // Utiliser requestAnimationFrame pour s'assurer que le DOM est rendu
    const rafId = requestAnimationFrame(() => {
      checkSpace()
    })

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(checkSpace)
    })
    resizeObserver.observe(container)
    resizeObserver.observe(content)

    return () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
    }
  }, [checkSpace])

  return { isCompact, containerRef, contentRef, checkSpace }
}

