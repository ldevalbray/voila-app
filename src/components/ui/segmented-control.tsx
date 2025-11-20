'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SegmentedControlOption {
  value: string
  label: string
  disabled?: boolean
}

interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value: string
  onValueChange: (value: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Composant SegmentedControl réutilisable basé sur shadcn/ui
 * Utilisé pour les switches Global/Project, Mode (Internal/Client), Language, etc.
 */
export function SegmentedControl({
  options,
  value,
  onValueChange,
  className,
  size = 'md',
}: SegmentedControlProps) {
  const activeIndex = options.findIndex((opt) => opt.value === value)
  const sizeClasses = {
    sm: 'h-8 text-xs px-2',
    md: 'h-9 text-sm px-3',
    lg: 'h-10 text-base px-4',
  }

  return (
    <div
      className={cn(
        'inline-flex rounded-lg border border-border bg-muted p-1 shadow-sm',
        className
      )}
      role="radiogroup"
      aria-label="Segmented control"
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          disabled={option.disabled}
          onClick={() => !option.disabled && onValueChange(option.value)}
          className={cn(
            'relative flex-1 rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            sizeClasses[size],
            option.value === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

