'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ProjectForm } from '@/components/projects/project-form'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { PageToolbar } from '@/components/layout/page-toolbar'

interface ProjectsPageClientProps {
  children: React.ReactNode
}

export function ProjectsPageClient({ children }: ProjectsPageClientProps) {
  const t = useTranslations('projects')
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <>
      <div className="flex-1 pt-8 px-8">
        <PageToolbar
          actions={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('newProject')}
            </Button>
          }
        />
        {children}
      </div>
      <ProjectForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleSuccess}
      />
    </>
  )
}

