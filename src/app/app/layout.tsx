import { requireAuth } from '@/lib/auth'
import { getUserModes } from '@/lib/modes'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'
import { SidebarWrapper } from '@/components/layout/sidebar-wrapper'
import { SidebarProvider } from '@/components/ui/sidebar'
import { getInternalProjects } from '@/lib/projects'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    // Protéger la route : redirige vers /login si non authentifié
    const user = await requireAuth()
    const { hasInternalRole, hasClientRole } = await getUserModes()

    // Si l'utilisateur n'a pas de rôle interne mais a un rôle client, rediriger vers /portal
    if (!hasInternalRole && hasClientRole) {
      redirect('/portal')
    }

    // Récupérer les projets pour la sidebar
    let projects
    try {
      projects = await getInternalProjects()
    } catch (error) {
      console.error('Error fetching internal projects:', error)
      projects = []
    }

    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full flex-col bg-background">
          <TopBar
            user={user}
            hasInternalRole={hasInternalRole}
            hasClientRole={hasClientRole}
          />
          <div className="flex flex-1 w-full overflow-hidden">
            <SidebarWrapper mode="internal" projects={projects} />
            <main className="flex-1 w-full overflow-y-auto bg-background">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    )
  } catch (error) {
    console.error('Error in AppLayout:', error)
    // En cas d'erreur critique, rediriger vers /login
    redirect('/login')
    return null
  }
}

