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

## Step 3 – Epics & Tasks (V1)

Step 3 implémente une couche minimale mais solide d'Epics et Tasks sur les projets, intégrée dans le shell existant.

### Modèle de données

Step 3 introduit trois nouvelles tables :

#### 1. `epics`

Table pour les épics (groupes de tâches) :

- `id` (UUID, PK)
- `project_id` (UUID, FK vers `projects.id`)
- `title` (text, not null)
- `description` (text, nullable)
- `status` (text, valeurs : `'open'`, `'in_progress'`, `'done'`, `'archived'`, default `'open'`)
- `created_by` (UUID, FK vers `users.id`)
- `created_at`, `updated_at` (timestamps)

#### 2. `tasks`

Table pour les tâches :

- `id` (UUID, PK)
- `project_id` (UUID, FK vers `projects.id`)
- `epic_id` (UUID, nullable, FK vers `epics.id`)
- `title` (text, not null)
- `description` (text, nullable)
- `type` (text, valeurs : `'bug'`, `'new_feature'`, `'improvement'`)
- `status` (text, valeurs : `'todo'`, `'in_progress'`, `'blocked'`, `'waiting_for_client'`, `'done'`)
- `priority` (text, valeurs : `'low'`, `'medium'`, `'high'`, `'urgent'`)
- `estimate_bucket` (text, nullable, valeurs : `'XS'`, `'S'`, `'M'`, `'L'`, `'XL'`, `'XXL'`)
  - Sémantique : XS = minutes, S = heure, M = demi-journée, L = jour, XL = jours, XXL = semaine+
- `is_client_visible` (boolean, default `false`)
- `created_by` (UUID, FK vers `users.id`)
- `updated_by` (UUID, nullable, FK vers `users.id`)
- `created_at`, `updated_at` (timestamps)

#### 3. `task_assignees`

Table de liaison many-to-many entre tâches et utilisateurs :

- `task_id` (UUID, FK vers `tasks.id`)
- `user_id` (UUID, FK vers `users.id`)
- `assigned_at` (timestamptz, default now())
- PRIMARY KEY (`task_id`, `user_id`)

**Note** : La contrainte que les assignees doivent être membres du projet est gérée au niveau application pour Step 3 (pas encore de contrainte DB).

### RLS (Row Level Security)

Les politiques RLS sont configurées pour :

1. **`epics`** :
   - `SELECT` : Tous les membres du projet peuvent voir les epics
   - `INSERT`, `UPDATE`, `DELETE` : Seulement les rôles internes (`project_admin`, `project_participant`)

2. **`tasks`** :
   - `SELECT` : Tous les membres du projet peuvent voir les tâches
   - `INSERT`, `UPDATE`, `DELETE` : Seulement les rôles internes (`project_admin`, `project_participant`)

3. **`task_assignees`** :
   - `SELECT` : Les utilisateurs peuvent voir les assignees des tâches qu'ils peuvent voir
   - `INSERT`, `DELETE` : Seulement les rôles internes sur le projet correspondant

### Fonctionnalités UI

#### Page Tasks (`/app/projects/[projectId]/tasks`)

- **Liste des tâches** : Tableau avec colonnes :
  - Titre
  - Statut (badge coloré)
  - Type (bug/new_feature/improvement)
  - Priorité (badge coloré)
  - Epic (si associée)
  - Estimation (bucket)
  - Visible client (icône)
  - Date de création

- **Filtres** :
  - Recherche textuelle (titre et description)
  - Filtre par statut (multi-sélection)
  - Filtre par type (multi-sélection)
  - Filtre par epic (dropdown)

- **Création/Édition** :
  - Dialog modal avec formulaire complet
  - Tous les champs éditables
  - Validation côté serveur

#### Page Epics (`/app/projects/[projectId]/epics`)

- **Liste des epics** : Tableau avec colonnes :
  - Titre
  - Statut (badge coloré)
  - Nombre de tâches associées
  - Date de création

- **Création/Édition** :
  - Dialog modal avec formulaire
  - Champs : titre, description, statut

#### Page Overview (`/app/projects/[projectId]/overview`)

- **Statistiques** :
  - Nombre total de tâches
  - Nombre de tâches ouvertes
  - Nombre total d'epics
  - Liens vers les pages Tasks et Epics

### Migration SQL

Exécuter la migration `supabase/migrations/004_create_epics_tasks.sql` dans le SQL Editor de Supabase.

Cette migration crée :
- Les tables `epics`, `tasks`, `task_assignees`
- Les index pour les performances
- Les triggers pour `updated_at`
- Les politiques RLS complètes

### Limitations Step 3

Cette version V1 est **minimale** et n'inclut **pas** :

- Subtasks (sous-tâches)
- Tags
- Comments (commentaires)
- Documents (pièces jointes)
- Sprints et sprint picker
- Time tracking (suivi du temps)
- Invoices (factures)
- Notifications
- Assignee selection dans l'UI (le schéma supporte `task_assignees` mais l'UI n'est pas encore implémentée)
- Portal views (vues client) - seulement Internal mode pour l'instant

Ces fonctionnalités seront ajoutées dans les prochaines étapes.

### Composants créés

- `TasksList` : Liste des tâches avec filtres
- `TaskForm` : Formulaire de création/édition de tâche
- `EpicsList` : Liste des epics
- `EpicForm` : Formulaire de création/édition d'epic
- Server actions : `createTask`, `updateTask`, `deleteTask`, `createEpic`, `updateEpic`, `deleteEpic`

### Helpers TypeScript

- `src/lib/tasks.ts` : `getTasksByProjectId`, `getTaskById`, `getTaskStats`
- `src/lib/epics.ts` : `getEpicsByProjectId`, `getEpicById`

## Step 4 – Sprints & Sprint picker

Step 4 introduit les **Sprints** et un **Sprint picker** au niveau du projet, permettant de filtrer les tâches et les vues par sprint.

### Modèle de données

Step 4 introduit une nouvelle table et modifie la table `tasks` :

#### 1. `sprints`

Table pour les sprints (périodes de travail) :

- `id` (UUID, PK)
- `project_id` (UUID, FK vers `projects.id`)
- `name` (text, not null) - ex: "Sprint 1", "MVP phase", "2025-01"
- `goal` (text, nullable)
- `status` (text, valeurs : `'planned'`, `'active'`, `'completed'`, `'cancelled'`, `'archived'`, default `'planned'`)
- `start_date` (date, nullable)
- `end_date` (date, nullable)
- `sort_index` (integer, nullable) - pour l'ordre manuel
- `created_by` (UUID, FK vers `users.id`)
- `created_at`, `updated_at` (timestamps)

**Note importante** : Un seul sprint par projet devrait être `status = 'active'` à la fois. Cette contrainte est gérée au niveau application pour Step 4 (pas encore de contrainte DB).

#### 2. Modification de `tasks`

Ajout de la colonne `sprint_id` :

- `tasks.sprint_id` (UUID, nullable, FK vers `sprints.id`)

**Comportement** :
- Une tâche appartient à **au plus un sprint** (single `sprint_id`)
- `sprint_id` doit référencer un sprint du même projet que la tâche
- Cette contrainte est vérifiée au niveau application pour Step 4

### RLS (Row Level Security)

Les politiques RLS sont configurées pour `sprints` :

1. **`SELECT`** : Tous les membres du projet peuvent voir les sprints
2. **`INSERT`, `UPDATE`, `DELETE`** : Seulement les rôles internes (`project_admin`, `project_participant`)

### Contexte Sprint au niveau projet

Un **contexte React** (`SprintContext`) gère la sélection de sprint par projet :

- **Sélection par défaut** :
  - Si un sprint actif existe → il est sélectionné automatiquement
  - Sinon → "Tous les sprints" (pas de filtre)
- **Persistance** : La sélection est stockée dans `localStorage` par projet
- **Navigation** : La sélection est conservée lors de la navigation entre Tasks/Epics/Overview

### Fonctionnalités UI

#### Sprint Picker

Un composant `SprintPicker` permet de sélectionner :
- "Tous les sprints" (affiche toutes les tâches)
- Un sprint spécifique du projet

Le picker est intégré dans :
- Page Tasks (`/app/projects/[projectId]/tasks`)
- Page Epics (`/app/projects/[projectId]/epics`)
- Page Overview (`/app/projects/[projectId]/overview`)

#### Page Tasks

- **Filtrage par sprint** : Les tâches sont filtrées selon le sprint sélectionné
- **Création de tâche** : Le champ "Sprint" est pré-rempli avec le sprint sélectionné (si un sprint est sélectionné)
- Les autres filtres (statut, type, epic) fonctionnent en combinaison avec le filtre sprint

#### Page Epics

- **Affichage des stats** : Affiche le nombre de tâches par epic dans le sprint sélectionné
- Si un sprint est sélectionné : affiche "X / Y" (tâches dans le sprint / total)
- Si "Tous les sprints" : affiche le total comme avant

#### Page Overview

- **Stats filtrées** : Les statistiques des tâches sont filtrées par le sprint sélectionné
- Si un sprint est sélectionné : affiche les stats pour ce sprint uniquement
- Si "Tous les sprints" : affiche les stats globales du projet

### Migration SQL

Exécuter la migration `supabase/migrations/005_create_sprints.sql` dans le SQL Editor de Supabase.

Cette migration crée :
- La table `sprints` avec RLS
- La colonne `sprint_id` dans `tasks`
- Les index pour les performances
- Les triggers pour `updated_at`
- Les politiques RLS complètes

### Composants créés

- `SprintProvider` / `useSprintContext` : Contexte pour gérer la sélection de sprint par projet
- `SprintPicker` : Composant de sélection de sprint
- `TasksPageClient` : Composant client pour la page Tasks avec filtrage sprint
- `OverviewPageClient` : Composant client pour la page Overview avec stats filtrées

### Helpers TypeScript

- `src/lib/sprints.ts` : `getSprintsByProjectId`, `getActiveSprintByProjectId`, `getSprintById`

### Limitations Step 4

Cette version n'inclut **pas** :

- Création/édition de sprints dans l'UI (seulement via SQL pour l'instant)
- Time tracking par sprint
- Rapports avancés par sprint
- Portal views avec sprints (seulement Internal mode pour l'instant)
- Validation DB pour "un seul sprint actif par projet" (géré en application)

Ces fonctionnalités seront ajoutées dans les prochaines étapes.

## Step 5 – Time tracking & Time ledger

Step 5 implémente le suivi du temps et un registre de temps sur les projets et les tâches.

### Migration SQL

Exécuter la migration `supabase/migrations/006_create_time_entries.sql` :

Cette migration crée :
- La table `time_entries` avec RLS
- Les index pour les performances
- Les triggers pour `updated_at`
- Les politiques RLS complètes

### Modèle de données

#### Table `time_entries`

- `id` : UUID, PK
- `project_id` : UUID, FK → `projects.id` (not null)
- `task_id` : UUID, FK → `tasks.id` (nullable)
- `user_id` : UUID, FK → `users.id` (not null)
- `category` : TEXT (not null) - valeurs autorisées :
  - `project_management` : Gestion de projet
  - `development` : Développement
  - `documentation` : Documentation
  - `maintenance_evolution` : Maintenance & Évolution
- `duration_minutes` : INTEGER (not null) - unité canonique = minutes
- `date` : DATE (not null) - jour où le travail a été effectué
- `notes` : TEXT (nullable) - description libre du travail
- `created_at` : TIMESTAMPTZ
- `updated_at` : TIMESTAMPTZ

**Contrainte de cohérence** : Si `task_id` est défini, `tasks.project_id` doit être égal à `time_entries.project_id`. Cette contrainte est vérifiée au niveau application pour Step 5.

### RLS (Row Level Security)

Les politiques RLS permettent :

1. **SELECT** : Tous les membres d'un projet peuvent voir toutes les entrées de temps de ce projet
2. **INSERT** : Les utilisateurs peuvent créer leurs propres entrées pour les projets où ils ont un membership
3. **UPDATE** : Les utilisateurs peuvent modifier leurs propres entrées, et les admins/participants peuvent modifier toutes les entrées du projet
4. **DELETE** : Même logique que UPDATE

### Vues UI

#### 1. Vue globale "My time" – `/app/my-time`

Affiche toutes les entrées de temps de l'utilisateur connecté avec :
- Filtres : période (semaine en cours par défaut), projet, catégorie
- Tableau avec colonnes : Date, Projet, Tâche, Catégorie, Durée, Notes
- Résumés : temps total, répartition par projet, répartition par catégorie
- Bouton "Log time" pour créer une nouvelle entrée

#### 2. Vue projet Time – `/app/projects/[projectId]/time`

Affiche toutes les entrées de temps du projet, **sprint-aware** :
- Utilise le contexte Sprint pour filtrer les entrées liées aux tâches du sprint sélectionné
- Filtres : sprint (via SprintPicker), utilisateur, catégorie
- Tableau avec colonnes : Date, Utilisateur, Tâche, Catégorie, Durée, Notes
- Résumés : temps total, répartition par utilisateur, répartition par catégorie
- Bouton "Log time" pour créer une nouvelle entrée (pré-remplie avec le projet courant)

### Intégration avec les Tâches

#### Affichage du temps total

- Dans la liste des tâches (`/app/projects/[projectId]/tasks`) :
  - Colonne "Temps" affichant le temps total enregistré pour chaque tâche
  - Badge avec icône horloge et durée formatée (ex: "3h 45m")
  - Affiché uniquement si du temps a été enregistré

#### Log time depuis une tâche

- Dans le drawer de détail d'une tâche :
  - Section "Temps enregistré" avec le total
  - Bouton "Enregistrer du temps pour cette tâche"
  - Modal de création d'entrée pré-remplie avec :
    - Projet (courant)
    - Tâche (courante)
    - Date (aujourd'hui)

### Helpers TypeScript

- `src/lib/time-entries.ts` :
  - `getTimeEntries()` : Récupère les entrées avec filtres
  - `getTimeEntriesByTaskId()` : Récupère les entrées d'une tâche
  - `getTotalTimeByTaskId()` : Calcule le temps total d'une tâche
  - `getTimeStats()` : Statistiques agrégées pour un projet
  - `formatDuration()` : Convertit minutes en format lisible

### Actions serveur

- `src/lib/actions/time-entries.ts` :
  - `createTimeEntry()` : Crée une nouvelle entrée
  - `updateTimeEntry()` : Met à jour une entrée
  - `deleteTimeEntry()` : Supprime une entrée
  - `getTotalTimeByTaskId()` : Récupère le temps total d'une tâche (action serveur)

### Composants UI

- `TimeEntryForm` : Formulaire de création/édition d'entrée de temps
- `TaskTimeSection` : Section temps dans le drawer de tâche
- `TaskTimeBadge` : Badge affichant le temps total d'une tâche
- `MyTimePageClient` : Client pour la page "My time"
- `ProjectTimePageClient` : Client pour la page Time du projet

### Limitations Step 5

Cette version n'inclut **pas** :

- Facturation et tarifs horaires
- Vues portal pour les clients
- Rapports avancés (export CSV, PDF)
- Notifications de temps enregistré
- Validation côté DB pour la cohérence `task_id` / `project_id` (géré en application)

Ces fonctionnalités seront ajoutées dans les prochaines étapes.

## Step 6 – Minimal Invoices as Ledger Credits

Step 6 implémente un système de facturation minimal basé sur des **crédits dans le registre de temps**. Chaque facture représente un crédit contre le registre de temps d'un projet.

### Migration SQL

Exécuter la migration `supabase/migrations/007_create_invoices.sql` :

Cette migration crée :
- La table `invoices` avec RLS
- Les index pour les performances
- Les triggers pour `updated_at`
- Les politiques RLS complètes

### Modèle de données

#### Table `invoices`

- `id` : UUID, PK
- `project_id` : UUID, FK → `projects.id` (not null)
- `client_id` : UUID, FK → `clients.id` (not null, généralement identique à `projects.client_id`)
- `label` : TEXT (not null) - libellé de la facture (ex: "Facture Mars 2025 – Sprint 3")
- `status` : TEXT (not null, default 'draft') - valeurs autorisées :
  - `draft` : Brouillon
  - `sent` : Envoyée
  - `paid` : Payée
  - `cancelled` : Annulée
- `currency` : TEXT (not null, default 'EUR') - code devise (EUR, USD, GBP, etc.)
- `amount_cents` : BIGINT (not null) - montant total en centimes (unité mineure)
- `billed_minutes` : INTEGER (not null) - durée facturée en minutes (crédit contre le registre de temps)
- `issue_date` : DATE (not null) - date d'émission de la facture
- `due_date` : DATE (nullable) - date d'échéance
- `notes_internal` : TEXT (nullable) - notes internes (non visibles par le client)
- `notes_client` : TEXT (nullable) - notes client (pour futur portail/PDF)
- `created_by` : UUID, FK → `users.id` (not null)
- `created_at` : TIMESTAMPTZ
- `updated_at` : TIMESTAMPTZ

**Important** : `billed_minutes` est traité comme un **crédit** contre le registre de temps. Il n'y a pas de lien direct 1:1 avec des `time_entries` spécifiques. La logique métier est libre de décider combien de minutes sont couvertes par une facture donnée.

### RLS (Row Level Security)

Les politiques RLS permettent :

1. **SELECT** : Tous les membres d'un projet peuvent voir les factures de ce projet
2. **INSERT** : Seuls les rôles internes (`project_admin`, `project_participant`) peuvent créer des factures
3. **UPDATE** : Seuls les rôles internes peuvent modifier des factures
4. **DELETE** : Seuls les `project_admin` peuvent supprimer des factures (pour conserver un audit trail, on peut aussi utiliser `status = 'cancelled'`)

### Logique de registre (Ledger Logic)

Pour chaque projet, on calcule :

- **`total_logged_minutes`** : Somme de `time_entries.duration_minutes` pour ce projet
- **`total_billed_minutes`** : Somme de `invoices.billed_minutes` pour ce projet où `status IN ('draft', 'sent', 'paid')` (factures non annulées)
- **`unbilled_minutes`** : `total_logged_minutes - total_billed_minutes` (temps non facturé)

Ces calculs sont effectués **au niveau application** (via `getBillingStats()`), pas dans la base de données.

**Note** : On ne suit pas encore quelles `time_entries` spécifiques sont couvertes par quelle facture. C'est une simplification pour Step 6.

### Vues UI

#### 1. Page Invoices du projet – `/app/projects/[projectId]/invoices`

Affiche la liste des factures du projet avec :
- Tableau avec colonnes : Label, Statut, Date d'émission, Montant (formaté), Temps facturé
- Tri par défaut : `issue_date` descendant
- Bouton "Nouvelle facture" qui ouvre un formulaire
- Clic sur une facture pour éditer (restrictions selon le statut, ex: ne pas modifier `amount_cents` si `status = 'paid'`)
- Suppression possible uniquement pour les factures non payées (uniquement `project_admin`)

#### 2. Formulaire Invoice

Modal de création/édition avec :
- **Label** (requis) : Libellé de la facture
- **Statut** : draft, sent, paid, cancelled
- **Devise** : EUR, USD, GBP (par défaut EUR)
- **Montant** : Saisie en format majeur (ex: "1200,50"), converti en centimes
- **Temps facturé** : Saisie en format "Xh Ym" (ex: "12h 30m"), converti en minutes
- **Date d'émission** (requis, par défaut aujourd'hui)
- **Date d'échéance** (optionnelle)
- **Notes internes** (optionnel)
- **Notes client** (optionnel)

#### 3. Widget de résumé de facturation

Affiché sur :
- `/app/projects/[projectId]/overview` : Version complète avec :
  - Temps total enregistré
  - Temps total facturé
  - Temps non facturé
  - Pourcentage de couverture (si temps enregistré > 0)
  - Lien vers la page Invoices
- `/app/projects/[projectId]/time` : Version compacte avec :
  - Temps non facturé
  - Lien vers la page Invoices

### Helpers TypeScript

- `src/lib/invoices.ts` :
  - `getInvoices()` : Récupère les factures avec filtres
  - `getInvoiceById()` : Récupère une facture par ID
  - `getBillingStats()` : Calcule les statistiques de facturation (total_logged_minutes, total_billed_minutes, unbilled_minutes)
- `src/lib/billing-utils.ts` :
  - `formatAmount()` : Convertit centimes en format monétaire lisible
  - `parseAmountToCents()` : Convertit format majeur en centimes
  - `formatBilledMinutes()` : Convertit minutes en format lisible
  - `parseDurationToMinutes()` : Convertit format "Xh Ym" en minutes
  - `calculateBillingCoverage()` : Calcule le pourcentage de couverture

### Actions serveur

- `src/lib/actions/invoices.ts` :
  - `createInvoice()` : Crée une nouvelle facture
  - `updateInvoice()` : Met à jour une facture (restrictions si status = 'paid')
  - `deleteInvoice()` : Supprime une facture (uniquement `project_admin`)

### Composants UI

- `InvoiceForm` : Formulaire de création/édition de facture
- `InvoicesPageClient` : Client pour la page Invoices du projet
- `BillingSummaryWidget` : Widget de résumé de facturation (mode normal et compact)

### Limitations Step 6

Cette version n'inclut **pas** :

- Lignes de facture (invoice line items)
- Lien direct entre factures et `time_entries` spécifiques
- Génération de PDF
- Envoi d'email
- Portail client pour visualiser les factures
- Vue globale de facturation (`/app/billing`)

Ces fonctionnalités seront ajoutées dans les prochaines étapes.

## Prêt pour Step 7

Step 6 implémente les factures minimales comme crédits dans le registre de temps. Les éléments suivants seront ajoutés dans les prochaines étapes :

- UI de création/édition de sprints
- Assignee selection dans l'UI
- Portal views pour les clients (filtrage `is_client_visible`)
- Subtasks
- Tags
- Comments
- Documents
- Liens détaillés entre factures et time entries
- Génération PDF des factures
- Envoi d'email des factures
- Vue globale de facturation
- Notifications
