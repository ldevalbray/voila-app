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

/**
 * Page d'accueil globale (Internal mode)
 * Design moderne avec sections dashboard
 */
export default async function AppHomePage() {
  return (
    <div className="flex-1 space-y-8 px-6 pb-6 md:px-8 md:pb-8">
      <PageToolbar
        title="Home"
        description="Vue d'ensemble globale de vos projets et tâches"
      />

      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inbox</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Notifications en attente
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tâches assignées
            </p>
            <Link href="/app/tasks" className="mt-2 inline-block">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Voir toutes <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects to invoice</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Projets à facturer
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick stats</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">
              Statistiques globales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Inbox / Notifications */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Inbox / Notifications</CardTitle>
            <CardDescription>
              Vos notifications et messages récents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucune notification pour le moment
              </p>
            </div>
          </CardContent>
        </Card>

        {/* My tasks summary */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">My tasks</CardTitle>
            <CardDescription>
              Résumé de vos tâches assignées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Aucune tâche assignée
              </p>
              <Link href="/app/tasks">
                <Button variant="outline" size="sm">
                  Voir toutes les tâches
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Projects to invoice / at risk */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Projects to invoice</CardTitle>
            <CardDescription>
              Projets prêts à être facturés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucun projet à facturer
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Quick stats</CardTitle>
            <CardDescription>
              Statistiques rapides de vos projets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Statistiques à venir
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

