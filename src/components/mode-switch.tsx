'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { SegmentedControl } from '@/components/ui/segmented-control'

interface ModeSwitchProps {
  hasInternalRole: boolean
  hasClientRole: boolean
}

/**
 * Composant pour switcher entre Freelance et Client mode
 * Utilise le nouveau composant SegmentedControl pour une UX cohérente
 */
export function ModeSwitch({ hasInternalRole, hasClientRole }: ModeSwitchProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('mode')
  const isInternalMode = pathname?.startsWith('/app')
  const isClientMode = pathname?.startsWith('/portal')

  const currentValue = isInternalMode ? 'internal' : 'client'

  const handleValueChange = (value: string) => {
    if (value === 'internal' && hasInternalRole && !isInternalMode) {
      router.push('/app')
    } else if (value === 'client' && !isClientMode) {
      // Permettre l'accès au mode client même sans hasClientRole
      router.push('/portal')
    }
  }

  return (
    <SegmentedControl
      options={[
        { value: 'internal', label: t('freelance'), disabled: !hasInternalRole },
        { value: 'client', label: t('client'), disabled: false },
      ]}
      value={currentValue}
      onValueChange={handleValueChange}
      size="md"
    />
  )
}


