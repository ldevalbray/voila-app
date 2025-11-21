'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { SidebarMenu } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface AnimatedSidebarMenuProps {
  children: React.ReactNode
  className?: string
  activeIndex?: number
}

/**
 * Composant wrapper pour SidebarMenu avec animation fluide de la barre verticale
 * La barre se déplace de manière fluide entre les éléments actifs
 */
export function AnimatedSidebarMenu({
  children,
  className,
  activeIndex,
}: AnimatedSidebarMenuProps) {
  const pathname = usePathname()
  const containerRef = React.useRef<HTMLUListElement>(null)
  const itemRefs = React.useRef<(HTMLLIElement | null)[]>([])
  const [indicatorStyle, setIndicatorStyle] = React.useState<{
    top: number
    height: number
  }>({ top: 0, height: 0 })

  // Trouver l'index actif depuis les enfants si non fourni
  const resolvedActiveIndex = React.useMemo(() => {
    if (activeIndex !== undefined) return activeIndex
    
    // Parcourir les enfants pour trouver l'élément actif en vérifiant le href
    const childrenArray = React.Children.toArray(children)
    return childrenArray.findIndex((child) => {
      if (React.isValidElement(child)) {
        const href = child.props.href
        const exact = child.props.exact ?? false
        if (href) {
          if (exact) {
            return pathname === href
          } else {
            return pathname?.startsWith(href)
          }
        }
        // Fallback sur isActive si fourni
        if (child.props.isActive !== undefined) {
          return child.props.isActive
        }
      }
      return false
    })
  }, [activeIndex, children, pathname])

  // Calculer la position et la hauteur de la barre indicatrice
  React.useEffect(() => {
    const updateIndicator = () => {
      if (resolvedActiveIndex === -1 || !containerRef.current) {
        setIndicatorStyle({ top: 0, height: 0 })
        return
      }

      const activeItem = itemRefs.current[resolvedActiveIndex]
      if (!activeItem) {
        setIndicatorStyle({ top: 0, height: 0 })
        return
      }

      const containerRect = containerRef.current.getBoundingClientRect()
      const itemRect = activeItem.getBoundingClientRect()

      setIndicatorStyle({
        top: itemRect.top - containerRect.top,
        height: itemRect.height,
      })
    }

    // Mettre à jour immédiatement
    updateIndicator()

    // Mettre à jour lors du redimensionnement
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [resolvedActiveIndex, children, pathname])

  // Cloner les enfants pour ajouter les refs
  const childrenWithRefs = React.useMemo(() => {
    return React.Children.map(children, (child, index) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          ref: (el: HTMLLIElement | null) => {
            itemRefs.current[index] = el
            // Appeler la ref originale si elle existe
            if (typeof child.ref === 'function') {
              child.ref(el)
            } else if (child.ref) {
              (child.ref as React.MutableRefObject<HTMLLIElement | null>).current = el
            }
          },
        } as any)
      }
      return child
    })
  }, [children])

  return (
    <SidebarMenu
      ref={containerRef}
      className={cn('relative', className)}
    >
      {/* Barre indicatrice animée verticale */}
      {resolvedActiveIndex !== -1 && indicatorStyle.height > 0 && (
        <div
          className="absolute left-0 w-0.5 bg-foreground/40 rounded-r-full transition-all duration-300 ease-out z-10 group-data-[collapsible=icon]:hidden"
          style={{
            top: `${indicatorStyle.top}px`,
            height: `${indicatorStyle.height}px`,
          }}
        />
      )}
      {childrenWithRefs}
    </SidebarMenu>
  )
}

