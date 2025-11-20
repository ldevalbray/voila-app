import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * Page d'accueil globale (Internal mode)
 * Utilise les composants shadcn/ui Card pour une meilleure cohérence
 */
export default async function AppHomePage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Home</h1>
        <p className="text-base text-muted-foreground">
          Vue d'ensemble globale - Mode: Internal, Section: Global
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inbox</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Coming soon</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Coming soon</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Projects to invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Coming soon</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Coming soon</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

