import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Inbox, CheckSquare, Receipt, TrendingUp, ArrowRight } from 'lucide-react'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { getTranslations } from 'next-intl/server'
import { MyTasksCard, MyTasksSummaryCard } from './home-page-cards'

/**
 * Page d'accueil globale (Internal mode)
 * Design moderne avec sections dashboard
 */
export default async function AppHomePage() {
  const t = await getTranslations('home')
  const tNav = await getTranslations('navigation')
  
  return (
    <div className="flex-1 pt-8 px-8">
      <PageToolbar />

      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="pb-2">
            <div className="flex flex-row items-center">
              <Inbox className="h-4 w-4 text-muted-foreground mr-2" />
              <CardTitle className="text-sm font-medium">{t('inbox')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('pendingNotifications')}
            </p>
          </CardContent>
        </Card>

        <MyTasksCard />

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="pb-2">
            <div className="flex flex-row items-center">
              <Receipt className="h-4 w-4 text-muted-foreground mr-2" />
              <CardTitle className="text-sm font-medium">{t('projectsToInvoice')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('projectsToBill')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="pb-2">
            <div className="flex flex-row items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground mr-2" />
              <CardTitle className="text-sm font-medium">{t('quickStats')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('globalStats')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Sections */}
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        {/* Inbox / Notifications */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t('inboxTitle')}</CardTitle>
            <CardDescription>
              {t('inboxDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                {t('noNotifications')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* My tasks summary */}
        <MyTasksSummaryCard />

        {/* Projects to invoice / at risk */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t('projectsToInvoiceTitle')}</CardTitle>
            <CardDescription>
              {t('projectsToInvoiceDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                {t('noProjectsToBill')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t('quickStatsTitle')}</CardTitle>
            <CardDescription>
              {t('quickStatsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                {t('statsComingSoon')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

