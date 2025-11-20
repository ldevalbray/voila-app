import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FolderKanban, Clock } from 'lucide-react'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { getTranslations } from 'next-intl/server'

/**
 * Page d'accueil client (Client mode)
 * Design moderne avec sections dashboard
 */
export default async function PortalHomePage() {
  const t = await getTranslations('home')
  
  return (
    <div className="flex-1 space-y-8 px-6 pb-6 md:px-8 md:pb-8">
      <PageToolbar
        title={t('title')}
        description={t('descriptionPortal')}
      />

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

