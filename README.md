# Voila.app – Step 0 (Environnement & Tooling)

Base Next.js 16 (App Router) prête pour construire Voila.app en Step 1.

## Prérequis

- Node.js ≥ 18.18
- pnpm 10.22 (installé via `corepack enable`)
- Compte Supabase + Vercel + GitHub

## Installation

```bash
pnpm install
```

## Variables d’environnement

1. Créer un projet Supabase (organisation Voila).
2. Récupérer l’URL et la clé anonyme dans `Project Settings → API`.
3. Remplir `.env.local` (non versionné) :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. Mettre les mêmes variables dans Vercel (`Project Settings → Environment Variables`).

## Scripts utiles

- `pnpm dev` : serveur Next.js local sur http://localhost:3000
- `pnpm lint` : ESLint (Next core web vitals + Prettier)
- `pnpm format` : Prettier
- `pnpm build && pnpm start` : build + preview production

## Tooling embarqué

- **Next.js 16 App Router** + React 19 + TypeScript strict.
- **Tailwind CSS 3** configuré (`tailwind.config.ts`, `postcss.config.mjs`).
- **Supabase JS + @supabase/ssr** avec helpers `src/lib/supabaseClient.ts`.
- **Supabase UI** comme librairie par défaut + fallback **shadcn/ui** (`components.json`, `src/lib/utils.ts`).
- **Prettier + ESLint flat config** pour formatage et lint.

## Déploiement / Git

1. `git init && git add . && git commit -m "chore: initial setup"` si ce n’est pas déjà fait.
2. `gh repo create voila-app --private --source=. --remote=origin`.
3. `git push -u origin main`.
4. Connecter le dépôt sur [Vercel](https://vercel.com/new) et sélectionner la branche `main`.
5. Renseigner les variables Supabase sur Vercel avant le premier déploiement.

## Étapes suivantes

- Vérifier que le bouton de test Supabase UI sur la home s’affiche.
- Configurer Husky/lint-staged ou CI GitHub Actions (optionnel, Step 1+).
