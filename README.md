# Voila.app – Step 1 (Authentication & Account Flows)

Base Next.js 16 (App Router) avec authentification Supabase complète.

## Prérequis

- Node.js ≥ 18.18
- pnpm 10.22 (installé via `corepack enable`)
- Compte Supabase + Vercel + GitHub

## Installation

```bash
pnpm install
```

## Configuration Supabase

### 1. Créer le projet Supabase

1. Créer un projet Supabase (organisation Voila).
2. Récupérer l'URL et la clé anonyme dans `Project Settings → API`.

### 2. Configurer l'authentification

Dans votre projet Supabase :

1. Aller dans `Authentication → Settings`
2. Configurer l'authentification email/password :
   - **Enable Email Signup** : activé
   - **Confirm email** : au choix (pour Step 1, on peut le désactiver pour simplifier les tests)
   - **Site URL** : `http://localhost:3000` (dev) et votre URL Vercel (prod)
   - **Redirect URLs** : ajouter `http://localhost:3000/reset-password` et `https://votre-domaine.vercel.app/reset-password`

### 3. Exécuter la migration SQL

1. Aller dans `SQL Editor` dans votre projet Supabase
2. Exécuter le contenu du fichier `supabase/migrations/001_create_users_table.sql`
   - Cette migration crée la table `users` avec RLS
   - Elle crée un trigger pour synchroniser automatiquement `auth.users` → `users`
   - Elle configure les politiques RLS pour que chaque utilisateur ne puisse voir/modifier que son propre profil

### 4. Variables d'environnement

1. Créer `.env.local` (non versionné) à partir de `.env.example` :
   ```bash
   cp .env.example .env.local
   ```
2. Remplir les valeurs :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Mettre les mêmes variables dans Vercel (`Project Settings → Environment Variables`).

## Scripts utiles

- `pnpm dev` : serveur Next.js local sur http://localhost:3000
- `pnpm lint` : ESLint (Next core web vitals + Prettier)
- `pnpm format` : Prettier
- `pnpm build && pnpm start` : build + preview production

## Structure de l'application (Step 1)

### Routes d'authentification (`(auth)`)

- `/login` : Connexion avec email/password
- `/signup` : Création de compte avec email/password
- `/forgot-password` : Demande de réinitialisation de mot de passe
- `/reset-password` : Page de réinitialisation (depuis le lien email)

### Routes protégées

- `/app` : Application interne (placeholder pour Step 1)
- `/portal` : Portail client (placeholder pour Step 1)

### Routing

- `/` : Redirige vers `/login` si non authentifié, vers `/app` si authentifié
- Toutes les routes sous `(app)` et `(portal)` sont protégées (redirection vers `/login` si non authentifié)

## Flux d'authentification

### Inscription

1. L'utilisateur remplit le formulaire sur `/signup`
2. Supabase crée l'utilisateur dans `auth.users`
3. Le trigger `on_auth_user_created` crée automatiquement une ligne dans `users`
4. Si l'email confirmation est désactivée, l'utilisateur est connecté directement et redirigé vers `/app`
5. Si l'email confirmation est activée, un email est envoyé et l'utilisateur doit confirmer avant de se connecter

### Connexion

1. L'utilisateur remplit le formulaire sur `/login`
2. Supabase authentifie l'utilisateur
3. Redirection vers `/app` en cas de succès

### Réinitialisation de mot de passe

1. L'utilisateur entre son email sur `/forgot-password`
2. Supabase envoie un email avec un lien de réinitialisation
3. Le lien pointe vers `/reset-password` avec un token dans l'URL
4. L'utilisateur entre son nouveau mot de passe
5. Redirection vers `/login` après succès

## Test de l'application

1. Démarrer le serveur : `pnpm dev`
2. Aller sur http://localhost:3000
3. Créer un compte via `/signup`
4. Se connecter via `/login`
5. Tester la réinitialisation de mot de passe via `/forgot-password`

## Tooling embarqué

- **Next.js 16 App Router** + React 19 + TypeScript strict.
- **Tailwind CSS 3** configuré (`tailwind.config.ts`, `postcss.config.mjs`).
- **Supabase JS + @supabase/ssr** avec helpers `src/lib/supabaseClient.ts`.
- **Supabase UI** comme librairie par défaut + fallback **shadcn/ui** (`components.json`, `src/lib/utils.ts`).
- **Prettier + ESLint flat config** pour formatage et lint.

## Déploiement / Git

1. `git init && git add . && git commit -m "chore: step 1 - auth setup"` si ce n'est pas déjà fait.
2. `gh repo create voila-app --private --source=. --remote=origin`.
3. `git push -u origin main`.
4. Connecter le dépôt sur [Vercel](https://vercel.com/new) et sélectionner la branche `main`.
5. Renseigner les variables Supabase sur Vercel avant le premier déploiement.
6. Mettre à jour les Redirect URLs dans Supabase avec l'URL de production Vercel.

## Prêt pour Step 2

Step 1 implémente uniquement l'authentification et les flux de compte. Les éléments suivants seront ajoutés dans Step 2 :

- Modèle de données : clients, projets, membres
- Logique de mode (internal vs client)
- Project memberships et RLS associées
- Navigation et project switcher
