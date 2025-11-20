import { Button } from '@supabase/ui'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-20">
      <div className="w-full max-w-2xl space-y-8 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="space-y-3 text-center md:text-left">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Voila.app · Step 0
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Stack Next.js + Supabase prête à builder
          </h1>
          <p className="text-base text-slate-600">
            Supabase UI est déjà dispo. Quand un composant manque, ajoute un
            composant shadcn via `pnpm dlx shadcn add`.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-700">
            Vérification rapide
          </p>
          <p className="text-sm text-slate-600">
            Clique sur le bouton ci-dessous pour confirmer que Supabase UI est
            bien prêt.
          </p>
          <div className="mt-4">
            <Button block>Test Supabase UI</Button>
          </div>
        </div>
      </div>
    </main>
  )
}
