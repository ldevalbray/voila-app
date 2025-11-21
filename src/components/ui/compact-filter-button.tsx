'use client'

import { ReactNode, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Fragment } from 'react'

interface CompactFilterButtonProps {
  /**
   * Label à afficher en mode normal
   */
  label: string
  /**
   * Icône à afficher en mode compact
   */
  icon: ReactNode
  /**
   * Mode compact : affiche uniquement l'icône
   */
  compact?: boolean
  /**
   * Indique si le filtre est actif (pour le style)
   */
  active?: boolean
  /**
   * Contenu du Popover (checkboxes, options, etc.)
   */
  children: ReactNode
  /**
   * Classes CSS supplémentaires
   */
  className?: string
}

/**
 * Composant réutilisable pour les filtres avec support compact
 * Affiche un bouton avec label ou une icône selon l'espace disponible
 * 
 * @example
 * <CompactFilterButton
 *   label="Status"
 *   icon={<Filter className="h-4 w-4" />}
 *   active={statusFilter.length > 0}
 *   compact={isCompact}
 * >
 *   <div className="space-y-2">
 *     Contenu du filtre
 *   </div>
 * </CompactFilterButton>
 */
export function CompactFilterButton({
  label,
  icon,
  compact = false,
  active = false,
  children,
  className,
}: CompactFilterButtonProps) {
  const [open, setOpen] = useState(false)

  const button = (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        'h-9 text-body-sm flex-shrink-0',
        compact 
          ? 'w-9 p-0 justify-center' 
          : 'justify-between min-w-[120px] max-w-[160px]',
        active && 'bg-accent',
        className
      )}
    >
      {compact ? (
        icon
      ) : (
        <>
          <span className="truncate">{label}</span>
          <ChevronDown className={cn(
            "ml-2 h-3.5 w-3.5 opacity-50 shrink-0 transition-transform duration-200 ease-out",
            open && "rotate-180"
          )} />
        </>
      )}
    </Button>
  )

  // En mode compact, envelopper dans un Tooltip
  if (compact) {
    return (
      <Tooltip>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
          </PopoverTrigger>
          <PopoverContent 
            className="w-56 p-2 animate-in fade-in-0 zoom-in-95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 duration-200" 
            align="start"
          >
            {children}
          </PopoverContent>
        </Popover>
        <TooltipContent side="bottom">
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {button}
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-2 animate-in fade-in-0 zoom-in-95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 duration-200" 
        align="start"
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

