import { LanguageSwitcher } from '@/components/language-switcher'

/**
 * Layout pour les pages d'authentification
 * Utilise les tokens de design shadcn/ui pour une cohérence visuelle
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}

