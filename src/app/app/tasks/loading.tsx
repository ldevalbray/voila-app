import { SkeletonTable } from '@/components/ui/skeleton'
import { PageToolbar } from '@/components/layout/page-toolbar'

export default function TasksLoading() {
  return (
    <div className="flex-1 pt-8 px-8">
      <PageToolbar />
      <div className="mt-6">
        <SkeletonTable rows={8} />
      </div>
    </div>
  )
}

