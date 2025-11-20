import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  illustration?: ReactNode // Pour des illustrations SVG personnalisées
}

/**
 * Composant EmptyState réutilisable pour les pages vides
 * Design moderne avec icône/illustration, titre, description actionnable et action optionnelle
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="status" aria-live="polite">
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : (
        <Icon className="h-16 w-16 text-muted-foreground/30 mb-4" aria-hidden="true" />
      )}
      <h3 className="text-h4 mb-2">{title}</h3>
      <p className="text-body-sm text-muted-foreground mb-6 max-w-sm">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  )
}

