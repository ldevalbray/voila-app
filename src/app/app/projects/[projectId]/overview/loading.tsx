import { SkeletonCard } from '@/components/ui/skeleton'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ProjectOverviewLoading() {
  return (
    <div className="flex-1 pt-8 px-8">
      <PageToolbar />
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}

