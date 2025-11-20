import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FolderKanban, Clock } from 'lucide-react'
import { PageToolbar } from '@/components/layout/page-toolbar'

/**
 * Page d'accueil client (Client mode)
 * Design moderne avec sections dashboard
 */
export default async function PortalHomePage() {
  return (
    <div className="flex-1 space-y-8 px-6 pb-6 md:px-8 md:pb-8">
      <PageToolbar
        title="Home"
        description="Vue d'ensemble de vos projets"
      />

      {/* Main Content Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Projects list */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">My projects</CardTitle>
            <CardDescription>
              Liste de vos projets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Consultez vos projets dans la section Projects
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Recent activity</CardTitle>
            <CardDescription>
              Activité récente sur vos projets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucune activité récente
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

