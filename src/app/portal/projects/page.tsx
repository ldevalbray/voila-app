import { getClientProjects } from '@/lib/projects'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Building2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/layout/empty-state'
import { getTranslations } from 'next-intl/server'

/**
 * Page de liste des projets (Client mode)
 * Design moderne avec Table shadcn/ui
 */
export default async function PortalProjectsPage() {
  const projects = await getClientProjects()
  const t = await getTranslations('projects')

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* Projects Table */}
      {projects.length === 0 ? (
        <Card className="border-border/50">
          <CardContent>
            <EmptyState
              icon={Building2}
              title={t('noProjectsAssigned')}
              description={t('noProjectsAssignedDescription')}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t('myProjects')}</CardTitle>
            <CardDescription>
              {t('projectsCount', { count: projects.length, plural: projects.length > 1 ? 's' : '' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('project')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <TableCell>
                      <Link
                        href={`/portal/projects/${project.id}/overview`}
                        className="font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={project.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/portal/projects/${project.id}/overview`}>
                        <Button variant="ghost" size="sm">
                          {t('view')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

