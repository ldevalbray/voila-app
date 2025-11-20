import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  try {
    const user = await getCurrentUser()

    // Si non authentifié, rediriger vers /login
    if (!user) {
      redirect('/login')
    }

    // Si authentifié, rediriger vers /app (pour Step 1)
    // La logique de mode (internal vs client) sera ajoutée dans Step 2
    redirect('/app')
  } catch (error) {
    // En cas d'erreur, rediriger vers /login
    console.error('Error in home page:', error)
    redirect('/login')
  }
}
