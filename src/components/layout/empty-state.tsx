import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

/**
 * Composant EmptyState réutilisable pour les pages vides
 * Design moderne avec icône, titre, description et action optionnelle
 */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <h3 className="text-h4 mb-2">{title}</h3>
      <p className="text-body-sm text-muted-foreground mb-6 max-w-sm">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  )
}

