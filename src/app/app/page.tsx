import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Inbox, CheckSquare, Receipt, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { getTranslations } from 'next-intl/server'

/**
 * Page d'accueil globale (Internal mode)
 * Design moderne avec sections dashboard
 */
export default async function AppHomePage() {
  const t = await getTranslations('home')
  const tNav = await getTranslations('navigation')
  
  return (
    <div className="flex-1 space-y-8 px-6 pb-6 md:px-8 md:pb-8">
      <PageToolbar
        title={t('title')}
        description={t('description')}
      />

      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('inbox')}</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('pendingNotifications')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('myTasks')}</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('assignedTasks')}
            </p>
            <Link href="/app/tasks" className="mt-2 inline-block">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                {t('viewAll')} <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('projectsToInvoice')}</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('projectsToBill')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('quickStats')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
      <div className="grid gap-6 md:grid-cols-2">
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
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t('myTasksTitle')}</CardTitle>
            <CardDescription>
              {t('myTasksDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                {t('noAssignedTasks')}
              </p>
              <Link href="/app/tasks">
                <Button variant="outline" size="sm">
                  {t('viewAllTasks')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

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

