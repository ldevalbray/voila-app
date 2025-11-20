'use client'

import { usePathname, useRouter } from 'next/navigation'
import { SegmentedControl } from '@/components/ui/segmented-control'

interface ModeSwitchProps {
  hasInternalRole: boolean
  hasClientRole: boolean
}

/**
 * Composant pour switcher entre Internal et Client mode
 * Utilise le nouveau composant SegmentedControl pour une UX cohérente
 */
export function ModeSwitch({ hasInternalRole, hasClientRole }: ModeSwitchProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isInternalMode = pathname?.startsWith('/app')
  const isClientMode = pathname?.startsWith('/portal')

  const currentValue = isInternalMode ? 'internal' : 'client'

  const handleValueChange = (value: string) => {
    if (value === 'internal' && hasInternalRole && !isInternalMode) {
      router.push('/app')
    } else if (value === 'client' && hasClientRole && !isClientMode) {
      router.push('/portal')
    }
  }

  return (
    <SegmentedControl
      options={[
        { value: 'internal', label: 'Internal', disabled: !hasInternalRole },
        { value: 'client', label: 'Client', disabled: !hasClientRole },
      ]}
      value={currentValue}
      onValueChange={handleValueChange}
      size="md"
    />
  )
}


