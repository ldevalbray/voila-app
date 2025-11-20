'use client'

import { useState } from 'react'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { EpicForm } from '@/components/epics/epic-form'
import { SprintForm } from '@/components/sprints/sprint-form'
import { useRouter } from 'next/navigation'

interface EpicsPageClientProps {
  projectId: string
  newEpicLabel: string
  newSprintLabel: string
}

export function EpicsPageClient({
  projectId,
  newEpicLabel,
  newSprintLabel,
}: EpicsPageClientProps) {
  const router = useRouter()
  const [isCreateEpicDialogOpen, setIsCreateEpicDialogOpen] = useState(false)
  const [isCreateSprintDialogOpen, setIsCreateSprintDialogOpen] = useState(false)

  return (
    <>
      <PageToolbar
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateSprintDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {newSprintLabel}
            </Button>
            <Button onClick={() => setIsCreateEpicDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {newEpicLabel}
            </Button>
          </div>
        }
      />

      <EpicForm
        projectId={projectId}
        open={isCreateEpicDialogOpen}
        onOpenChange={setIsCreateEpicDialogOpen}
        onSuccess={() => {
          setIsCreateEpicDialogOpen(false)
          router.refresh()
        }}
      />

      <SprintForm
        projectId={projectId}
        open={isCreateSprintDialogOpen}
        onOpenChange={setIsCreateSprintDialogOpen}
        onSuccess={() => {
          setIsCreateSprintDialogOpen(false)
          router.refresh()
        }}
      />
    </>
  )
}

