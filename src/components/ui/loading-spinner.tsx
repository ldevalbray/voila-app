import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

/**
 * Composant LoadingSpinner standardisé
 * Remplace l'usage direct de Loader2
 */
export function LoadingSpinner({
  size = 'md',
  className,
  text,
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2
        className={cn('animate-spin text-muted-foreground', sizeClasses[size])}
        aria-hidden="true"
      />
      {text && (
        <p className="text-body-sm text-muted-foreground" role="status" aria-live="polite">
          {text}
        </p>
      )}
      {!text && <span className="sr-only">Chargement...</span>}
    </div>
  )
}

