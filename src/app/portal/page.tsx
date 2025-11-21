import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FolderKanban, Clock, UserPlus } from 'lucide-react'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { getTranslations } from 'next-intl/server'
import { getClientProjects } from '@/lib/projects'
import { EmptyState } from '@/components/layout/empty-state'

/**
 * Page d'accueil client (Client mode)
 * Design moderne avec sections dashboard
 */
export default async function PortalHomePage() {
  const t = await getTranslations('home')
  const tProjects = await getTranslations('projects')
  
  // Récupérer les projets clients
  let projects: any[] = []
  try {
    const result = await getClientProjects()
    projects = result.data
  } catch (error) {
    console.error('Error fetching client projects:', error)
    projects = []
  }

  // Si aucun projet n'est disponible, afficher un écran de bienvenue
  if (projects.length === 0) {
    return (
      <div className="flex-1 pt-8 px-8">
        <PageToolbar />
        <Card className="border-border/50">
          <CardContent>
            <EmptyState
              icon={UserPlus}
              title={tProjects('noProjectsAssigned')}
              description={t('noFreelanceInvitation')}
            />
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="flex-1 pt-8 px-8">
      <PageToolbar />

      {/* Main Content Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Projects list */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t('myProjectsTitle')}</CardTitle>
            <CardDescription>
              {t('myProjectsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                {t('viewProjectsSection')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t('recentActivityTitle')}</CardTitle>
            <CardDescription>
              {t('recentActivityDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                {t('noRecentActivity')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

