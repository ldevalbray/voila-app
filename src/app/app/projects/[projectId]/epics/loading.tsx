import { SkeletonCard } from '@/components/ui/skeleton'
import { PageToolbar } from '@/components/layout/page-toolbar'

export default function ProjectEpicsLoading() {
  return (
    <div className="flex-1 pt-8 px-8">
      <div className="space-y-6">
        <PageToolbar />
        <div className="flex justify-end gap-2 mb-4">
          <div className="h-9 w-32 bg-muted animate-pulse rounded" />
          <div className="h-9 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  )
}

