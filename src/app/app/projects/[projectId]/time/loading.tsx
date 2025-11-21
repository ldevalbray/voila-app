import { SkeletonTable, SkeletonCard } from '@/components/ui/skeleton'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ProjectTimeLoading() {
  return (
    <div className="flex-1 pt-8 px-8">
      <PageToolbar />
      <div className="space-y-6 mt-6">
        {/* Résumé cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        {/* Table */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <SkeletonTable rows={6} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

