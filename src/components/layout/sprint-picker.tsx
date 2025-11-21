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
import { Calendar } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SprintPickerProps {
  /**
   * Mode compact : retire le label et utilise le style des filtres de la toolbar
   * Si compact est true ET qu'on est en mode toolbar, affiche uniquement une icône
   */
  compact?: boolean
  /**
   * Mode icône : affiche uniquement une icône (utilisé quand la toolbar est en mode compact)
   * Si compact est true, iconOnly sera automatiquement true
   */
  iconOnly?: boolean
}

/**
 * Composant SprintPicker pour sélectionner un sprint
 * Affiche "Tous les sprints" en premier, puis la liste des sprints du projet
 * Les sprints sont triés par statut (active first) puis par date de début
 */
export function SprintPicker({ compact = false, iconOnly: iconOnlyProp }: SprintPickerProps = {}) {
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

  // Si compact est true (passé depuis PageToolbar en mode compact), utiliser iconOnly
  const iconOnly = iconOnlyProp !== undefined ? iconOnlyProp : (compact === true)

  if (iconOnly) {
    // Mode icône uniquement avec tooltip
    return (
      <Select value={displayValue} onValueChange={handleValueChange}>
        <SelectTrigger 
          compact 
          icon={<Calendar className="h-4 w-4" />}
          compactTitle={getDisplayLabel()}
          className="h-9 w-9 p-0 flex-shrink-0"
        />
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

  if (compact) {
    // Mode compact pour les filtres de la toolbar (sans label)
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

  // Mode standalone (sans label, pour usage en dehors de la toolbar)
  return (
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
  )
}

