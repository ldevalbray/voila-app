import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
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
 * Composant Breadcrumbs compact pour la navigation hiérarchique
 * Version minimale pour la top bar
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-body-xs', className)}
    >
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isCurrent = item.isCurrent ?? isLast

          return (
            <li key={index} className="flex items-center space-x-1">
              {item.href && !isCurrent ? (
                <>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[120px]"
                  >
                    {item.label}
                  </Link>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" aria-hidden="true" />
                </>
              ) : (
                <>
                  <span
                    className={cn(
                      isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground',
                      'truncate max-w-[120px]'
                    )}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                  {!isCurrent && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" aria-hidden="true" />
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

