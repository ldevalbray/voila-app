import { SkeletonTable } from '@/components/ui/skeleton'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ProjectsLoading() {
  return (
    <div className="flex-1 pt-8 px-8">
      <PageToolbar />
      <Card className="border-border/50 mt-6">
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent>
          <SkeletonTable rows={5} />
        </CardContent>
      </Card>
    </div>
  )
}

