import { getInternalProjects } from '@/lib/projects'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, ArrowRight } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'
import { PageToolbar } from '@/components/layout/page-toolbar'

/**
 * Page de liste des projets (Internal mode)
 * Design moderne avec Table shadcn/ui
 */
export default async function ProjectsPage() {
  const projectsResult = await getInternalProjects()
  const projects = projectsResult.data
  const t = await getTranslations('projects')

  return (
    <div className="flex-1 pt-8 px-8">
      <PageToolbar
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('newProject')}
          </Button>
        }
      />

      {/* Projects Table */}
      {projects.length === 0 ? (
        <Card className="border-border/50 mt-6">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noProjects')}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {t('noProjectsDescription')}
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('createFirstProject')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 mt-6">
          <CardHeader>
            <CardTitle className="text-lg">{t('allProjects')}</CardTitle>
            <CardDescription>
              {t('projectsCount', { count: projects.length, plural: projects.length > 1 ? 's' : '' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('project')}</TableHead>
                  <TableHead>{t('client')}</TableHead>
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
                        href={`/app/projects/${project.id}/overview`}
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
                      {project.client ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{project.client.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
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
                      <Link href={`/app/projects/${project.id}/overview`}>
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

