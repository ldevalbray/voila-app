# Voila.app – Step 2 (Core Data Model & Modes)

Base Next.js 16 (App Router) avec authentification Supabase complète, modèle de données clients/projets, et logique de modes (internal vs client).

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

### 3. Exécuter les migrations SQL

1. Aller dans `SQL Editor` dans votre projet Supabase
2. Exécuter les migrations dans l'ordre :
   - `supabase/migrations/001_create_users_table.sql` (Step 1)
     - Cette migration crée la table `users` avec RLS
     - Elle crée un trigger pour synchroniser automatiquement `auth.users` → `users`
     - Elle configure les politiques RLS pour que chaque utilisateur ne puisse voir/modifier que son propre profil
   - `supabase/migrations/002_add_i18n_foundation.sql` (Step 1)
   - `supabase/migrations/003_create_clients_projects_memberships.sql` (Step 2)
     - Cette migration crée les tables `clients`, `projects`, et `project_memberships` avec RLS
     - Elle configure les politiques RLS pour que les utilisateurs ne voient que les projets/clients auxquels ils ont accès via leurs membreships

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

## Structure de l'application (Step 2)

### Routes d'authentification (`(auth)`)

- `/login` : Connexion avec email/password
- `/signup` : Création de compte avec email/password
- `/forgot-password` : Demande de réinitialisation de mot de passe
- `/reset-password` : Page de réinitialisation (depuis le lien email)

### Routes protégées

- `/app` : Application interne (affiche les projets où l'utilisateur a un rôle interne)
- `/portal` : Portail client (affiche les projets où l'utilisateur a un rôle client)

### Routing

- `/` : Redirige vers `/login` si non authentifié, sinon vers `/app` ou `/portal` selon les modes disponibles
- Toutes les routes sous `(app)` et `(portal)` sont protégées (redirection vers `/login` si non authentifié)
- Les layouts `(app)` et `(portal)` redirigent automatiquement si l'utilisateur n'a pas le bon rôle

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
3. Redirection vers `/app` ou `/portal` selon les modes disponibles (voir section "Logique de modes" ci-dessous)

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

## Step 2 – Core data model & modes

### Modèle de données

Step 2 introduit trois nouvelles tables :

#### 1. `clients`
- `id` (UUID, PK)
- `name` (text, not null)
- `created_at`, `updated_at` (timestamps)

#### 2. `projects`
- `id` (UUID, PK)
- `name` (text, not null)
- `description` (text, nullable)
- `status` (text, e.g. `active` / `archived`)
- `client_id` (UUID, nullable, FK vers `clients.id`)
- `created_by` (UUID, FK vers `users.id`)
- `created_at`, `updated_at` (timestamps)

#### 3. `project_memberships`
- `id` (UUID, PK)
- `project_id` (UUID, FK vers `projects.id`)
- `user_id` (UUID, FK vers `users.id`)
- `role` (text, valeurs possibles : `project_admin`, `project_participant`, `project_client`)
- `created_at`, `updated_at` (timestamps)
- Contrainte unique sur `(project_id, user_id)`

**Comportement automatique** : Lorsqu'un projet est créé, une membership avec le rôle `project_admin` est automatiquement créée pour le créateur du projet (via trigger).

### RLS (Row Level Security)

Les politiques RLS sont configurées pour :

1. **`project_memberships`** : Un utilisateur peut voir uniquement ses propres membreships
2. **`projects`** : Un utilisateur peut voir les projets où il a au moins une membership
3. **`clients`** : Un utilisateur peut voir les clients référencés par les projets auxquels il a accès

### Logique de modes (internal vs client)

Le système détermine automatiquement les modes disponibles pour chaque utilisateur :

- **Rôle interne** : L'utilisateur a au moins une membership avec `role = 'project_admin'` ou `'project_participant'`
- **Rôle client** : L'utilisateur a au moins une membership avec `role = 'project_client'`

**Règles de redirection** :

- Si l'utilisateur a **seulement un rôle interne** → redirection vers `/app`
- Si l'utilisateur a **seulement un rôle client** → redirection vers `/portal`
- Si l'utilisateur a **les deux rôles** → redirection vers `/app` par défaut (mode interne), avec un switch de mode dans le header pour basculer vers `/portal`

**Mode switch** : Si l'utilisateur a les deux modes, un switch apparaît dans le header des layouts `(app)` et `(portal)` pour basculer entre "Interne" et "Client".

### Exemple de scénario

**Utilisateur A** :
- Admin sur **Projet 1** (client ACME) → rôle `project_admin`
- Client sur **Projet 2** (client BETA) → rôle `project_client`

**Comportement** :
- Après connexion → redirection vers `/app` (mode interne par défaut)
- Sur `/app` : voit uniquement **Projet 1** (ACME) avec le badge "Administrateur"
- Sur `/portal` : voit uniquement **Projet 2** (BETA)
- Le header affiche un switch pour basculer entre les deux modes

### Création de données de test

Pour tester Step 2, vous pouvez créer des données directement dans Supabase :

1. **Créer un client** :
   ```sql
   INSERT INTO public.clients (name) VALUES ('ACME Corp');
   ```

2. **Créer un projet** (remplacer `USER_ID` et `CLIENT_ID` par des valeurs réelles) :
   ```sql
   INSERT INTO public.projects (name, description, client_id, created_by)
   VALUES ('Site web ACME', 'Refonte du site web', 'CLIENT_ID', 'USER_ID');
   ```
   → Une membership `project_admin` sera automatiquement créée pour le créateur

3. **Ajouter un membre avec rôle participant** :
   ```sql
   INSERT INTO public.project_memberships (project_id, user_id, role)
   VALUES ('PROJECT_ID', 'OTHER_USER_ID', 'project_participant');
   ```

4. **Ajouter un membre avec rôle client** :
   ```sql
   INSERT INTO public.project_memberships (project_id, user_id, role)
   VALUES ('PROJECT_ID', 'CLIENT_USER_ID', 'project_client');
   ```

### Pages mises à jour

- **`/app`** : Affiche la liste des projets où l'utilisateur a un rôle interne (`project_admin` ou `project_participant`), avec le nom du client, le statut, et le rôle de l'utilisateur
- **`/portal`** : Affiche la liste des projets où l'utilisateur a un rôle client (`project_client`), avec le nom du client et le statut

## Step 2 – Shell & Navigation

Step 2 implémente le shell et la navigation pour Voila.app avec une TopBar minimale, une Sidebar avec switch Global/Project, et toutes les routes placeholder pour les modes Internal (`/app`) et Client (`/portal`).

### TopBar

La **TopBar** est un composant réutilisable utilisé dans les layouts `(app)` et `(portal)`. Elle contient :

- **Logo** : Lien vers `/app` ou `/portal` selon le mode
- **Recherche** : Bouton placeholder "Search / Cmd+K" (stub pour future fonctionnalité)
- **Mode switch** : Switch entre Internal et Client (si l'utilisateur a les deux rôles)
- **Menu utilisateur** : Avatar avec dropdown contenant :
  - Profile (lien stub)
  - Settings (lien stub)
  - Logout (utilise `signOutAction`)

### Sidebar

La **Sidebar** est un composant réutilisable avec deux modes :

#### Switch Global/Project

Un segmented control en haut de la sidebar permet de basculer entre :
- **Global** : Vues cross-project, centrées sur l'utilisateur
- **Project** : Vues dans un projet spécifique

**Comportement (lecture)** :
- Le mode actif est déterminé depuis l'URL :
  - Global : `/app`, `/app/tasks`, `/app/projects` (sans projectId)
  - Project : `/app/projects/[projectId]/...`

**Comportement (clic)** :
- Cliquer sur **Global** : Si déjà en mode global, rien. Sinon, navigue vers `/app`
- Cliquer sur **Project** : Si déjà en mode project, rien. Sinon, navigue vers `/app/projects/[last_project_id]/overview` ou `/app/projects` si pas de `last_project_id`

#### Section Global

Affichée quand le mode Global est actif :

**Internal mode** :
- Home → `/app`
- My tasks → `/app/tasks`
- Projects → `/app/projects`

**Client mode** :
- Home → `/portal`
- Projects → `/portal/projects`

#### Section Project

Affichée quand le mode Project est actif :

- **Project selector** : Combobox avec recherche qui liste tous les projets accessibles selon le mode
  - Internal : projets avec `project_admin` ou `project_participant`
  - Client : projets avec `project_client`
- **Info projet** : Affiche `Client: <name> • <status>`
- **Navigation projet** :
  - **Internal** : Overview, Tasks, Epics, Time, Invoices, Notes, Documents, Settings
  - **Client** : Overview, Tasks, Notes, Documents, Invoices

**Comportement de sélection de projet** :
- Si vous êtes sur `/app/projects/A/tasks` et sélectionnez "Project B", vous naviguez vers `/app/projects/B/tasks`
- La vue actuelle est conservée lors du changement de projet

### Gestion de `last_project_id`

Le dernier projet visité est stocké dans **localStorage** côté client :
- Sauvegardé automatiquement lors de la navigation vers un projet
- Utilisé lors du switch vers Project mode si aucun projet n'est actuellement sélectionné

### Routes

#### Internal mode (`/app`)

- `/app` : Home global (placeholder)
- `/app/tasks` : My tasks (placeholder)
- `/app/projects` : Liste globale des projets
- `/app/projects/[projectId]/overview` : Vue d'ensemble du projet
- `/app/projects/[projectId]/tasks` : Tâches du projet
- `/app/projects/[projectId]/epics` : Epics du projet
- `/app/projects/[projectId]/time` : Time tracking
- `/app/projects/[projectId]/invoices` : Factures
- `/app/projects/[projectId]/notes` : Notes
- `/app/projects/[projectId]/documents` : Documents
- `/app/projects/[projectId]/settings` : Paramètres du projet

#### Client mode (`/portal`)

- `/portal` : Home client (placeholder)
- `/portal/projects` : Liste des projets client
- `/portal/projects/[projectId]/overview` : Vue d'ensemble
- `/portal/projects/[projectId]/tasks` : Tâches (client-visible uniquement)
- `/portal/projects/[projectId]/notes` : Notes (client-visible uniquement)
- `/portal/projects/[projectId]/documents` : Documents
- `/portal/projects/[projectId]/invoices` : Factures

### Layouts de projet

Les layouts de projet (`/app/projects/[projectId]/layout.tsx` et `/portal/projects/[projectId]/layout.tsx`) :

- Vérifient l'accès au projet via RLS et membership
- Récupèrent le projet et son client
- Passent le projet au Sidebar via un contexte React
- Affichent une erreur "Project not found or access denied" si l'accès est refusé

### Responsive

- **Desktop** : Sidebar fixe à gauche, toujours visible
- **Mobile** : Sidebar en drawer (menu hamburger dans TopBar), overlay sombre quand ouverte
- Le switch Global/Project reste accessible sur mobile

### Composants réutilisables créés

- `TopBar` : Barre supérieure avec logo, recherche, mode switch, menu utilisateur
- `Sidebar` : Navigation principale avec switch Global/Project
- `GlobalProjectSwitch` : Switch Global/Project réutilisable
- `ProjectSelector` : Sélecteur de projet avec recherche
- `NavItem` : Item de navigation avec état actif
- `ProjectProvider` / `useProjectContext` : Contexte pour passer le projet actuel au Sidebar
- `SidebarProvider` / `useSidebar` : Contexte pour gérer l'état responsive de la sidebar

### Notes importantes

- Toutes les pages projet (Overview, Tasks, Epics, Time, Invoices, Notes, Documents, Settings) sont des **stubs/placeholders** pour l'instant
- La logique métier (tasks, epics, time entries, invoices, etc.) sera implémentée dans les prochaines étapes
- Cette étape se concentre uniquement sur le shell, la navigation et les layouts

## Prêt pour Step 3

Step 2 implémente le shell et la navigation. Les éléments suivants seront ajoutés dans les prochaines étapes :

- Tasks, epics, sprints
- Time tracking
- Invoices
- Comments et notifications
