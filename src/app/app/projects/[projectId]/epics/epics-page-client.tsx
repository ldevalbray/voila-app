'use client'

import { useState } from 'react'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { EpicForm } from '@/components/epics/epic-form'
import { useRouter } from 'next/navigation'

interface EpicsPageClientProps {
  projectId: string
  title: string
  description: string
  newEpicLabel: string
}

export function EpicsPageClient({
  projectId,
  title,
  description,
  newEpicLabel,
}: EpicsPageClientProps) {
  const router = useRouter()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  return (
    <>
      <PageToolbar
        title={title}
        description={description}
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {newEpicLabel}
          </Button>
        }
      />

      <EpicForm
        projectId={projectId}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          router.refresh()
        }}
      />
    </>
  )
}

