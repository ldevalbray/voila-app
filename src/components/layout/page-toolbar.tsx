'use client'

import { ReactNode, useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface SearchConfig {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onClear?: () => void
  expanded?: boolean // Pour contrôler l'état depuis l'extérieur
  onExpandedChange?: (expanded: boolean) => void
}

interface PageToolbarProps {
  title?: string | ReactNode
  description?: string | ReactNode
  search?: SearchConfig
  filters?: ReactNode[] // Array de composants de filtres
  viewSwitcher?: ReactNode // Composant SegmentedControl ou autre
  actions?: ReactNode
  className?: string
}

/**
 * Composant PageToolbar réutilisable pour toutes les pages
 * Barre d'outils avec recherche, filtres, switch de vue et actions
 * Aligné avec le switch Global/Projet de la sidebar
 */
export function PageToolbar({
  title,
  description,
  search,
  filters = [],
  viewSwitcher,
  actions,
  className,
}: PageToolbarProps) {
  const t = useTranslations('ui')
  const [internalSearchExpanded, setInternalSearchExpanded] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Utiliser l'état externe si fourni, sinon utiliser l'état interne
  const isSearchExpanded = search?.expanded !== undefined ? search.expanded : internalSearchExpanded
  const setIsSearchExpanded = search?.onExpandedChange || setInternalSearchExpanded

  // Focus sur l'input quand la barre s'ouvre
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchExpanded])

  const hasLeftContent = search || filters.length > 0
  const hasToolbarControls = hasLeftContent || viewSwitcher // Contrôles de la toolbar (sans actions)
  // Si on a un titre et des actions mais pas de contrôles toolbar, mettre le bouton à côté du titre
  const showActionsInTitle = title && actions && !hasToolbarControls

  return (
    <div className={cn('space-y-3', className)}>
      {/* Titre et description (optionnel) */}
      {(title || description) && (
        <div className="flex items-baseline justify-between gap-4 pt-4">
          <div className="space-y-2 flex-1 min-w-0">
            {title && <h1 className="text-h1">{title}</h1>}
            {description && (
              <p className="text-body text-muted-foreground">{description}</p>
            )}
          </div>
          {/* Actions alignées à droite du titre si pas de toolbar */}
          {showActionsInTitle && (
            <div className="flex-shrink-0 flex items-center">{actions}</div>
          )}
        </div>
      )}

      {/* Barre d'outils - seulement si on a du contenu (recherche, filtres, viewSwitcher) ou des actions sans titre */}
      {(hasToolbarControls || (actions && !title)) && (
        <div className="flex items-center gap-3 flex-nowrap overflow-x-auto overflow-y-visible pt-4 pb-2 -mx-1 px-1">
        {/* Recherche expandable */}
        {search && (
          <>
            {isSearchExpanded ? (
              <div className="relative flex items-center flex-shrink-0">
                <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder={search.placeholder || t('searchPlaceholder')}
                  value={search.value || ''}
                  onChange={(e) => search.onChange?.(e.target.value)}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      setIsSearchExpanded(false)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSearchExpanded(false)
                      search.onClear?.()
                    }
                  }}
                  className="pl-8 pr-8 h-9 w-64 max-w-[240px] transition-all duration-200 flex-shrink-0"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsSearchExpanded(false)
                    search.onClear?.()
                  }}
                  className="absolute right-1 h-7 w-7 p-0"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchExpanded(true)}
                className="h-9 w-9 p-0 flex-shrink-0 min-w-[36px]"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            {/* Diviseur après la recherche si on a des filtres */}
            {filters.length > 0 && (
              <div className="h-9 w-px bg-border flex-shrink-0" />
            )}
          </>
        )}

        {/* Filtres */}
        {filters.map((filter, index) => (
          <div key={index} className="flex items-center gap-3 flex-shrink-0">
            {filter}
            {/* Diviseur après le filtre sauf pour le dernier */}
            {index < filters.length - 1 && (
              <div className="h-9 w-px bg-border flex-shrink-0" />
            )}
          </div>
        ))}

        {/* Espace flexible pour pousser les éléments de droite à droite */}
        {!hasLeftContent && (viewSwitcher || actions) && (
          <div className="flex-1" />
        )}

        {/* Diviseur avant les éléments de droite si on a du contenu à gauche */}
        {hasLeftContent && (viewSwitcher || actions) && (
          <>
            <div className="flex-1" />
            <div className="h-9 w-px bg-border flex-shrink-0" />
          </>
        )}

        {/* Switch de vue */}
        {viewSwitcher && <div className="flex-shrink-0">{viewSwitcher}</div>}

        {/* Actions (boutons) - dans la toolbar si pas affiché à côté du titre */}
        {actions && !showActionsInTitle && (
          <div className="flex-shrink-0">{actions}</div>
        )}
        </div>
      )}
    </div>
  )
}

