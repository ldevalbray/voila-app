'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SegmentedControlOption {
  value: string
  label: string | React.ReactNode
  disabled?: boolean
}

interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value: string
  onValueChange: (value: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean // Mode on/off pour l'animation de la barre
}

/**
 * Composant SegmentedControl réutilisable basé sur shadcn/ui
 * Utilisé pour les switches Global/Project, Mode (Internal/Client), Language, etc.
 * Avec animation fluide de la barre inférieure lors du changement de sélection
 */
export function SegmentedControl({
  options,
  value,
  onValueChange,
  className,
  size = 'md',
  animated = true, // Par défaut, l'animation est activée
}: SegmentedControlProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const [indicatorStyle, setIndicatorStyle] = React.useState<{
    left: number
    width: number
  }>({ left: 0, width: 0 })

  const activeIndex = options.findIndex((opt) => opt.value === value)

  const sizeClasses = {
    sm: 'h-8 text-[0.75rem] px-2',
    md: 'h-9 text-[0.875rem] px-3 py-0',
    lg: 'h-10 text-[1rem] px-4',
  }

  const containerPadding = {
    sm: 'p-0.5',
    md: 'p-0',
    lg: 'p-0.5',
  }

  // Calculer la position et la largeur de la barre indicatrice (seulement si animé)
  React.useEffect(() => {
    if (!animated) return

    const updateIndicator = () => {
      if (activeIndex === -1 || !containerRef.current) return

      const activeButton = buttonRefs.current[activeIndex]
      if (!activeButton) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()

      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      })
    }

    // Mettre à jour immédiatement
    updateIndicator()

    // Mettre à jour lors du redimensionnement
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [activeIndex, options, animated])

  return (
    <div
      ref={animated ? containerRef : undefined}
      className={cn(
        'relative inline-flex rounded-md border border-sidebar-border/50 bg-sidebar-accent/30',
        containerPadding[size],
        'backdrop-blur-sm',
        className
      )}
      role="radiogroup"
      aria-label="Segmented control"
    >
      {/* Barre indicatrice animée (seulement si animated = true) */}
      {animated && activeIndex !== -1 && (
        <div
          className="absolute bottom-0 h-0.5 bg-foreground/40 rounded-full transition-all duration-300 ease-out z-10"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
            transform: 'translateY(0)',
          }}
        />
      )}

      {options.map((option, index) => (
        <button
          key={option.value}
          ref={animated ? (el) => {
            buttonRefs.current[index] = el
          } : undefined}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          disabled={option.disabled}
          onClick={() => !option.disabled && onValueChange(option.value)}
          className={cn(
            'relative flex-1 rounded-sm font-medium transition-all duration-300 ease-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1',
            'disabled:pointer-events-none disabled:opacity-50',
            sizeClasses[size],
            option.value === value
              ? 'bg-sidebar text-sidebar-foreground shadow-sm font-semibold'
              : 'text-sidebar-foreground/60 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

