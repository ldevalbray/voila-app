import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  isCurrent?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Composant Breadcrumbs pour la navigation hiérarchique
 * Utilisé sur les pages de projet pour indiquer la localisation
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2 text-body-sm', className)}
    >
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isCurrent = item.isCurrent ?? isLast

          return (
            <li key={index} className="flex items-center space-x-2">
              {index === 0 && (
                <Home className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
              {item.href && !isCurrent ? (
                <>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
                </>
              ) : (
                <>
                  <span
                    className={cn(
                      isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                  {!isCurrent && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
                  )}
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

