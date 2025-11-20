import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

/**
 * Composant PageHeader réutilisable pour toutes les pages
 * Design moderne avec titre, description et action optionnelle
 */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-2">
        <h1 className="text-h1">{title}</h1>
        {description && (
          <p className="text-body text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

