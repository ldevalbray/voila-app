import { getCurrentUser } from '@/lib/auth'
import { getUserModes } from '@/lib/modes'
import { redirect } from 'next/navigation'

// Force dynamic rendering for authentication check
export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    const user = await getCurrentUser()

    // Si non authentifié, rediriger vers /login
    if (!user) {
      redirect('/login')
      return null // Unreachable but satisfies TypeScript
    }

    // Déterminer les modes de l'utilisateur
    const { hasInternalRole, hasClientRole } = await getUserModes()

    // Logique de redirection selon les modes :
    // - Si seulement internal → /app
    // - Si seulement client → /portal
    // - Si les deux → /app (mode par défaut = internal)
    if (hasInternalRole) {
      redirect('/app')
      return null
    } else if (hasClientRole) {
      redirect('/portal')
      return null
    } else {
      // Aucun rôle : rediriger vers /app par défaut (ou une page d'onboarding future)
      redirect('/app')
      return null
    }
  } catch (error) {
    // En cas d'erreur, rediriger vers /login
    console.error('Error in home page:', error)
    redirect('/login')
    return null
  }
}
