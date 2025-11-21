import { requireAuth } from '@/lib/auth'
import { getUserModes } from '@/lib/modes'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'
import { SidebarWrapper } from '@/components/layout/sidebar-wrapper'
import { SidebarProvider } from '@/components/ui/sidebar'
import { getClientProjects, type Project } from '@/lib/projects'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    // Protéger la route : redirige vers /login si non authentifié
    const user = await requireAuth()
    const { hasInternalRole, hasClientRole } = await getUserModes()

    // Si l'utilisateur a un rôle interne, rediriger vers /app (priorité au mode freelance)
    if (hasInternalRole) {
      redirect('/app')
    }

    // Récupérer les projets pour la sidebar
    let projects: Project[] = []
    try {
      const result = await getClientProjects()
      projects = result.data
    } catch (error) {
      console.error('Error fetching client projects:', error)
      projects = []
    }

    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full flex-col">
          <TopBar
            user={user}
            hasInternalRole={hasInternalRole}
            hasClientRole={hasClientRole}
          />
          <div className="flex flex-1 w-full overflow-hidden">
            <SidebarWrapper mode="client" projects={projects} />
            <main className="flex-1 w-full overflow-y-auto lg:ml-0">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    )
  } catch (error) {
    console.error('Error in PortalLayout:', error)
    // En cas d'erreur critique, rediriger vers /login
    redirect('/login')
    return null
  }
}

