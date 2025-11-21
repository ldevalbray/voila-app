'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task } from '@/lib/tasks'
import { Epic } from '@/lib/epics'
import { BacklogPanel } from './backlog-panel'
import { SprintTasksView } from './sprint-tasks-view'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { useSprintContext } from '@/components/layout/sprint-context'
import { updateTask } from '@/lib/actions/tasks'
import { useRouter } from 'next/navigation'
import { showToast } from '@/lib/toast'

interface TasksSplitLayoutProps {
  projectId: string
  sprintTasks: Task[]
  epics: Epic[]
  stats: {
    total: number
    by_status: Record<string, number>
    open_count: number
  }
  viewMode: 'table' | 'kanban'
  onTaskClick: (task: Task) => void
  hasActiveFilters: boolean
  onCreateTask?: () => void
  onTaskCreated?: () => void // Callback après création de tâche
  onTaskUpdated?: (callback: () => void) => void // Callback pour enregistrer le handler de mise à jour
  isBacklogOpen?: boolean // État d'ouverture du backlog (géré par le parent)
  onBacklogToggle?: () => void // Callback pour toggle le backlog (géré par le parent)
}

/**
 * Layout à deux colonnes pour la page Tasks:
 * - Colonne gauche: BacklogPanel (collapsible)
 * - Colonne droite: SprintTasksView (Kanban ou Table)
 * 
 * Comportement:
 * - Desktop (md+): Layout à deux colonnes avec backlog collapsible
 * - Mobile (sm-): Tabs pour basculer entre Sprint et Backlog
 * 
 * Quand backlog est fermé sur desktop: SprintTasksView prend 100% de la largeur
 */
export function TasksSplitLayout({
  projectId,
  sprintTasks,
  epics,
  stats,
  viewMode,
  onTaskClick,
  hasActiveFilters,
  onCreateTask,
  onTaskCreated,
  onTaskUpdated,
  isBacklogOpen: isBacklogOpenProp,
  onBacklogToggle: onBacklogToggleProp,
}: TasksSplitLayoutProps) {
  const t = useTranslations('projects')
  const isMobile = useIsMobile()
  const router = useRouter()
  const { selectedSprintId } = useSprintContext()
  // Utiliser les props si fournies, sinon gérer l'état localement
  const [isBacklogOpenLocal, setIsBacklogOpenLocal] = useState(true)
  const isBacklogOpen = isBacklogOpenProp !== undefined ? isBacklogOpenProp : isBacklogOpenLocal
  const [mobileView, setMobileView] = useState<'sprint' | 'backlog'>('sprint')
  const [backlogRefreshKey, setBacklogRefreshKey] = useState(0)

  // Gérer le déplacement d'une tâche du backlog vers le sprint
  const handleTaskMoveToSprint = async (
    taskId: string,
    sprintId: string | null,
    status?: string
  ) => {
    try {
      const result = await updateTask({
        id: taskId,
        sprint_id: sprintId,
        ...(status && { status: status as any }),
      })

      if (result.error) {
        showToast.error(result.error)
      } else {
        showToast.success(t('taskUpdated'))
        // Rafraîchir le backlog car une tâche a été déplacée
        setBacklogRefreshKey((prev) => prev + 1)
        router.refresh()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('error')
      showToast.error(errorMessage)
    }
  }

  // Gérer le déplacement d'une tâche du sprint vers le backlog
  const handleTaskMoveToBacklog = async (taskId: string) => {
    try {
      const result = await updateTask({
        id: taskId,
        sprint_id: null,
      })

      if (result.error) {
        showToast.error(result.error)
      } else {
        showToast.success(t('taskUpdated'))
        // Rafraîchir le backlog car une tâche a été ajoutée
        setBacklogRefreshKey((prev) => prev + 1)
        router.refresh()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('error')
      showToast.error(errorMessage)
    }
  }

  // Charger l'état du backlog depuis localStorage (seulement si géré localement)
  useEffect(() => {
    if (isBacklogOpenProp === undefined && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`backlog_open_${projectId}`)
      if (stored !== null) {
        setIsBacklogOpenLocal(stored === 'true')
      }
    }
  }, [projectId, isBacklogOpenProp])

  // Sauvegarder l'état du backlog dans localStorage (seulement si géré localement)
  useEffect(() => {
    if (isBacklogOpenProp === undefined && typeof window !== 'undefined') {
      localStorage.setItem(`backlog_open_${projectId}`, String(isBacklogOpenLocal))
    }
  }, [isBacklogOpenLocal, projectId, isBacklogOpenProp])

  // Rafraîchir le backlog après les actions de drag & drop
  // Le backlog se rafraîchit automatiquement via refreshKey après handleTaskMoveToSprint et handleTaskMoveToBacklog

  // Handler pour mettre à jour le backlog quand une tâche est modifiée (ex: via TaskDrawer)
  const handleTaskUpdated = useCallback(() => {
    // Incrémenter le refreshKey pour forcer le rafraîchissement du backlog
    setBacklogRefreshKey((prev) => prev + 1)
  }, [])

  // Exposer le handler via le callback parent
  useEffect(() => {
    onTaskUpdated?.(handleTaskUpdated)
  }, [onTaskUpdated, handleTaskUpdated])

  const handleToggleBacklog = () => {
    if (onBacklogToggleProp) {
      onBacklogToggleProp()
    } else {
      setIsBacklogOpenLocal(!isBacklogOpenLocal)
    }
  }

  // Mode mobile: tabs pour basculer entre Sprint et Backlog
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Tabs pour mobile */}
        <div className="flex-shrink-0 border-b bg-muted/30 px-4 py-2">
          <SegmentedControl
            value={mobileView}
            onValueChange={(value) => setMobileView(value as 'sprint' | 'backlog')}
            options={[
              {
                value: 'sprint',
                label: t('sprint') || 'Sprint',
              },
              {
                value: 'backlog',
                label: t('backlog') || 'Backlog',
              },
            ]}
            size="sm"
          />
        </div>

        {/* Contenu selon le tab sélectionné */}
        <div className="flex-1 overflow-hidden">
          {mobileView === 'sprint' ? (
            <div className="h-full overflow-auto">
              <SprintTasksView
                projectId={projectId}
                tasks={sprintTasks}
                epics={epics}
                stats={stats}
                viewMode={viewMode}
                onTaskClick={onTaskClick}
                hasActiveFilters={hasActiveFilters}
                selectedSprintId={selectedSprintId}
                onTaskMoveToSprint={handleTaskMoveToSprint}
              />
            </div>
          ) : (
            <div className="h-full">
              <BacklogPanel
                projectId={projectId}
                epics={epics}
                isOpen={true}
                onToggle={handleToggleBacklog}
                onTaskClick={onTaskClick}
                onCreateTask={onCreateTask}
                onTaskMoveToBacklog={handleTaskMoveToBacklog}
                refreshKey={backlogRefreshKey}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // DESKTOP MODE: Layout à deux colonnes
  // ==========================================
  // Design:
  // - Flex layout avec ratio ~40/60 (Backlog ~35-40%, Tasks ~60-65%)
  // - Backlog rail (collapsed): toujours visible, 36px fixe, adjacent aux Tasks (pas de gap)
  // - Backlog panel (open): prend ~35-40% de la largeur disponible (min 280px, max 40%)
  // - Tasks panel: prend ~60-65% de la largeur disponible (flex-1)
  // - Transitions smooth 200ms avec ease-out pour ouverture/fermeture
  // - Gap de 16px (gap-4) entre backlog et tasks pour séparation visuelle
  // - Prend toute la hauteur disponible avec min-h-0 pour permettre le scroll
  return (
    <div className="flex h-full gap-4 min-h-0">
      {/* Colonne gauche: Backlog */}
      {/* - Si collapsed: rail de 36px fixe (géré par BacklogPanel)
          - Si open: panel qui prend ~35-40% via flex-basis ou width
          - Transition smooth sur la largeur */}
      <div
        className={cn(
          'transition-all duration-[200ms] ease-out',
          isBacklogOpen
            ? // En mode table: backlog plus large (55%), sinon ratio normal (40%)
              viewMode === 'table'
              ? 'min-w-[320px] w-[55%] max-w-[55%] flex-shrink-0'
              : 'min-w-[280px] w-[40%] max-w-[40%] flex-shrink-0'
            : 'w-9 flex-shrink-0' // Rail collapsed: 36px fixe
        )}
      >
        <BacklogPanel
          projectId={projectId}
          epics={epics}
          isOpen={isBacklogOpen}
          onToggle={handleToggleBacklog}
          onTaskClick={onTaskClick}
          onCreateTask={onCreateTask}
          onTaskMoveToBacklog={handleTaskMoveToBacklog}
          onTaskMoveToSprint={handleTaskMoveToSprint}
          refreshKey={backlogRefreshKey}
          viewMode={viewMode}
          selectedSprintId={selectedSprintId}
        />
      </div>

      {/* Colonne droite: Sprint Tasks */}
      {/* - Prend ~60-65% de la largeur disponible (flex-1)
          - Doit occuper toute la largeur restante quand backlog est collapsed
          - Doit s'adapter smooth quand backlog s'ouvre/ferme
          - Prend toute la hauteur avec scroll Y si nécessaire */}
      <div className="flex-1 min-w-0 transition-all duration-[200ms] ease-out h-full">
        <SprintTasksView
          projectId={projectId}
          tasks={sprintTasks}
          epics={epics}
          stats={stats}
          viewMode={viewMode}
          onTaskClick={onTaskClick}
          hasActiveFilters={hasActiveFilters}
          selectedSprintId={selectedSprintId}
          onTaskMoveToSprint={handleTaskMoveToSprint}
          onTaskMoveToBacklog={handleTaskMoveToBacklog}
          onTaskUpdated={handleTaskUpdated}
        />
      </div>
    </div>
  )
}

