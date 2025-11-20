'use client'

import { useSprintContext, ALL_SPRINTS_VALUE } from './sprint-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslations } from 'next-intl'

interface SprintPickerProps {
  /**
   * Mode compact : retire le label et utilise le style des filtres de la toolbar
   */
  compact?: boolean
}

/**
 * Composant SprintPicker pour sélectionner un sprint
 * Affiche "Tous les sprints" en premier, puis la liste des sprints du projet
 * Les sprints sont triés par statut (active first) puis par date de début
 */
export function SprintPicker({ compact = false }: SprintPickerProps = {}) {
  const t = useTranslations('projects')
  const { sprints, selectedSprintId, setSelectedSprintId, activeSprint } =
    useSprintContext()

  const handleValueChange = (value: string) => {
    if (value === ALL_SPRINTS_VALUE) {
      setSelectedSprintId(null)
    } else {
      setSelectedSprintId(value)
    }
  }

  // Déterminer la valeur affichée
  const displayValue = selectedSprintId || ALL_SPRINTS_VALUE

  // Déterminer le label à afficher
  const getDisplayLabel = () => {
    if (selectedSprintId === null) {
      return t('allSprints')
    }
    const sprint = sprints.find((s) => s.id === selectedSprintId)
    return sprint?.name || t('allSprints')
  }

  if (compact) {
    // Mode compact pour les filtres de la toolbar
    return (
      <Select value={displayValue} onValueChange={handleValueChange}>
        <SelectTrigger className="h-9 text-body-sm min-w-[160px] max-w-[200px] flex-shrink-0">
          <SelectValue placeholder={t('sprints')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SPRINTS_VALUE}>{t('allSprints')}</SelectItem>
          {sprints.map((sprint) => (
            <SelectItem key={sprint.id} value={sprint.id}>
              <div className="flex items-center gap-2">
                <span>{sprint.name}</span>
                {sprint.status === 'active' && (
                  <span className="text-xs text-muted-foreground">
                    ({t('sprintStatus.active')})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // Mode avec label (pour usage standalone)
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-muted-foreground">
        {t('sprint')}:
      </label>
      <Select value={displayValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue>{getDisplayLabel()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SPRINTS_VALUE}>{t('allSprints')}</SelectItem>
          {sprints.map((sprint) => (
            <SelectItem key={sprint.id} value={sprint.id}>
              <div className="flex items-center gap-2">
                <span>{sprint.name}</span>
                {sprint.status === 'active' && (
                  <span className="text-xs text-muted-foreground">
                    ({t('sprintStatus.active')})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

