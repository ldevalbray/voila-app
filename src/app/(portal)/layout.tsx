import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Protéger la route : redirige vers /login si non authentifié
  try {
    await requireAuth()
  } catch {
    redirect('/login')
  }

  return <>{children}</>
}

