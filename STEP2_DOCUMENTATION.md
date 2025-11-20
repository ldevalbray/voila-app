# Step 2 – Documentation complète

Documentation pour Step 2 : Core data model & modes (internal vs client).

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Exécuter la migration](#exécuter-la-migration)
3. [Créer les données de test](#créer-les-données-de-test)
4. [Tester l'application](#tester-lapplication)
5. [Scénarios de test](#scénarios-de-test)
6. [Dépannage](#dépannage)

---

## Vue d'ensemble

Step 2 introduit le modèle de données de base et la logique de modes (internal vs client).

### Modèle de données

- **`clients`** : Table des clients
- **`projects`** : Table des projets (liés à un client optionnel)
- **`project_memberships`** : Table de liaison users ↔ projects avec rôles

### Rôles

- **`project_admin`** : Administrateur du projet (rôle interne)
- **`project_participant`** : Participant au projet (rôle interne)
- **`project_client`** : Client du projet (rôle client)

### Logique de modes

- **Rôle interne** : Utilisateur avec au moins une membership `project_admin` ou `project_participant`
- **Rôle client** : Utilisateur avec au moins une membership `project_client`
- **Mode switch** : Si l'utilisateur a les deux types de rôles, un switch apparaît dans le header

---

## Exécuter la migration

### Prérequis

- ✅ Projet Supabase créé et configuré
- ✅ Variables d'environnement configurées (`.env.local`)
- ✅ Migrations Step 1 exécutées (`001_create_users_table.sql`, `002_add_i18n_foundation.sql`)

### Étapes

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet

2. **Ouvrir SQL Editor**
   - Menu de gauche → "SQL Editor"
   - Cliquer sur "New query"

3. **Exécuter la migration**
   - Ouvrir le fichier : `supabase/migrations/003_create_clients_projects_memberships.sql`
   - Copier tout le contenu
   - Coller dans l'éditeur SQL
   - Cliquer sur "Run" (ou `Cmd/Ctrl + Enter`)

4. **Vérifier le succès**
   - Vous devriez voir "Success. No rows returned"
   - Vérifier les tables : Menu gauche → "Table Editor" → vous devriez voir `clients`, `projects`, `project_memberships`

### Vérification des politiques RLS

1. Aller dans **Authentication → Policies**
2. Vérifier que les politiques existent pour :
   - `clients` : "Users can view clients of accessible projects"
   - `projects` : "Users can view projects they are members of"
   - `project_memberships` : "Users can view own memberships"

---

## Créer les données de test

### Méthode recommandée : Via Supabase Dashboard (Table Editor)

C'est la méthode la plus simple et pédagogique.

#### 1. Créer les clients

1. Aller dans **Supabase Dashboard** → **Table Editor** → **clients**
2. Cliquer sur **"Insert"** → **"Insert row"**
3. Créer 2 clients :
   - **Client 1** : `name` = `ACME Corp`
   - **Client 2** : `name` = `BETA Inc`
   - (Les `id`, `created_at`, `updated_at` sont générés automatiquement)

#### 2. Récupérer votre UUID utilisateur

1. Aller dans **Authentication** → **Users**
2. **Noter l'UUID** de votre utilisateur
   - Exemple : `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

#### 3. Créer les projets

1. Aller dans **Table Editor** → **projects**
2. Cliquer sur **"Insert"** → **"Insert row"**
3. Créer 3 projets :

   **Projet 1 : Site web ACME**
   - `name`: `Site web ACME`
   - `description`: `Refonte complète du site web corporate`
   - `status`: `active`
   - `client_id`: Sélectionner `ACME Corp` (ou coller l'UUID du client)
   - `created_by`: Coller votre UUID utilisateur

   **Projet 2 : Application mobile ACME**
   - `name`: `Application mobile ACME`
   - `description`: `Développement d'une application iOS et Android`
   - `status`: `active`
   - `client_id`: Sélectionner `ACME Corp`
   - `created_by`: Coller votre UUID utilisateur

   **Projet 3 : Dashboard BETA**
   - `name`: `Dashboard BETA`
   - `description`: `Tableau de bord analytique pour BETA Inc`
   - `status`: `active`
   - `client_id`: Sélectionner `BETA Inc`
   - `created_by`: Coller votre UUID utilisateur

   ✅ **Note importante** : Quand vous créez un projet, un **membership `project_admin`** est automatiquement créé pour le `created_by` (grâce au trigger) !

#### 4. Vérifier les membreships automatiques

1. Aller dans **Table Editor** → **project_memberships**
2. Vous devriez voir **3 membreships** avec le rôle `project_admin` :
   - Une pour chaque projet que vous venez de créer
   - Toutes liées à votre utilisateur

#### 5. Ajouter une membership client (pour tester le mode switch)

Pour tester le **switch de mode** (Interne/Client), ajoutons un rôle `project_client` :

1. Aller dans **Table Editor** → **project_memberships**
2. Cliquer sur **"Insert"** → **"Insert row"**
3. Créer une nouvelle membership :
   - `project_id`: Sélectionner `Dashboard BETA` (ou coller son UUID)
   - `user_id`: Coller votre UUID utilisateur
   - `role`: `project_client`
   - ⚠️ **Note** : Si vous avez déjà une membership `project_admin` sur ce projet, Supabase vous dira qu'il y a un conflit (contrainte unique sur `project_id, user_id`). Dans ce cas :
     - Soit modifier la membership existante pour changer le rôle en `project_client`
     - Soit supprimer la membership `project_admin` et créer la `project_client`

### Résultat attendu

Après ces étapes, vous devriez avoir :

- **2 clients** : ACME Corp, BETA Inc
- **3 projets** : Site web ACME, Application mobile ACME, Dashboard BETA
- **Membreships** pour votre utilisateur :
  - `project_admin` sur Site web ACME (rôle interne)
  - `project_admin` sur Application mobile ACME (rôle interne)
  - `project_admin` sur Dashboard BETA (rôle interne) - OU `project_client` si vous l'avez modifié
  - `project_client` sur Dashboard BETA (rôle client) - si vous l'avez ajouté

---

## Tester l'application

### Démarrer l'application

```bash
pnpm dev
```

### Scénario de base

1. **Se connecter** avec votre utilisateur
2. **Vérifier** :
   - ✅ Redirection automatique vers `/app`
   - ✅ Affichage des projets créés
   - ✅ Informations client affichées
   - ✅ Rôle de l'utilisateur affiché (Administrateur/Participant)

### Tester le mode switch

Si vous avez les deux types de rôles (internal + client) :

1. **Vérifier** :
   - ✅ Switch de mode visible dans le header (Interne/Client)
   - ✅ Cliquer sur "Client" → redirection vers `/portal`
   - ✅ Sur `/portal` : voir uniquement les projets avec rôle `project_client`
   - ✅ Cliquer sur "Interne" → retour vers `/app`

---

## Scénarios de test

### Scénario 1 : Utilisateur avec rôle interne uniquement

**Configuration** :
- Utilisateur avec seulement des membreships `project_admin` ou `project_participant`

**Comportement attendu** :
- ✅ Redirection automatique vers `/app`
- ✅ Affichage de tous les projets avec rôle interne
- ✅ Pas de switch de mode dans le header
- ✅ Accès à `/portal` → redirection automatique vers `/app`

### Scénario 2 : Utilisateur avec les deux rôles (mode switch)

**Configuration** :
- Utilisateur avec au moins une membership `project_admin`/`project_participant` ET au moins une membership `project_client`

**Comportement attendu** :
- ✅ Redirection vers `/app` (mode interne par défaut)
- ✅ Switch de mode visible dans le header
- ✅ Cliquer sur "Client" → redirection vers `/portal`
- ✅ Sur `/portal` : voir uniquement les projets avec rôle client
- ✅ Cliquer sur "Interne" → retour vers `/app`

### Scénario 3 : Utilisateur avec rôle client uniquement

**Configuration** :
- Utilisateur avec seulement des membreships `project_client`

**Comportement attendu** :
- ✅ Redirection automatique vers `/portal`
- ✅ Affichage uniquement des projets avec rôle client
- ✅ Pas de switch de mode
- ✅ Accès à `/app` → redirection automatique vers `/portal`

---

## Requêtes SQL utiles

### Voir tous les projets avec leurs clients

```sql
SELECT 
  p.id, 
  p.name, 
  p.status, 
  c.name as client_name, 
  u.email as created_by_email
FROM public.projects p
LEFT JOIN public.clients c ON c.id = p.client_id
LEFT JOIN public.users u ON u.id = p.created_by;
```

### Voir toutes les membreships

```sql
SELECT 
  pm.role,
  u.email as user_email,
  p.name as project_name,
  c.name as client_name
FROM public.project_memberships pm
JOIN public.users u ON u.id = pm.user_id
JOIN public.projects p ON p.id = pm.project_id
LEFT JOIN public.clients c ON c.id = p.client_id
ORDER BY u.email, p.name;
```

### Vérifier les modes d'un utilisateur

```sql
-- Remplacer USER_ID par l'UUID de votre utilisateur
SELECT 
  pm.role,
  p.name as project_name,
  CASE 
    WHEN pm.role IN ('project_admin', 'project_participant') THEN 'Internal'
    WHEN pm.role = 'project_client' THEN 'Client'
  END as mode_type
FROM public.project_memberships pm
JOIN public.projects p ON p.id = pm.project_id
WHERE pm.user_id = 'USER_ID';
```

### Vérifier les membreships d'un utilisateur

```sql
-- Remplacer USER_ID
SELECT * FROM public.project_memberships WHERE user_id = 'USER_ID';
```

---

## Dépannage

### Erreur : "relation does not exist"

**Cause** : La migration n'a pas été exécutée

**Solution** : 
- Exécuter `003_create_clients_projects_memberships.sql` dans Supabase SQL Editor
- Vérifier que les tables sont créées dans Table Editor

### Erreur : "permission denied"

**Cause** : Problème de RLS ou utilisateur non authentifié

**Solution** : 
- Vérifier que l'utilisateur est connecté dans l'app
- Vérifier les politiques RLS dans Supabase → Authentication → Policies
- Vérifier que les membreships existent pour l'utilisateur

### Aucun projet affiché

**Cause** : Pas de membreships pour l'utilisateur

**Solution** : 
- Vérifier les membreships : `SELECT * FROM public.project_memberships WHERE user_id = 'VOTRE_UUID';`
- Vérifier que l'utilisateur est bien connecté
- Vérifier que les projets existent : `SELECT * FROM public.projects;`

### Le switch de mode n'apparaît pas

**Cause** : L'utilisateur n'a qu'un seul type de rôle

**Solution** : 
- L'utilisateur doit avoir les deux types de rôles (internal ET client)
- Vérifier avec la requête SQL "Vérifier les modes d'un utilisateur" ci-dessus
- Ajouter une membership `project_client` si l'utilisateur n'a que des rôles internes

### Les données existent déjà

**Solution** : 
- Si vous utilisez le script SQL de seed, il utilise `ON CONFLICT DO NOTHING`, donc il est sûr de le réexécuter
- Pour recréer, supprimez d'abord les données dans Supabase Dashboard → Table Editor

---

## Checklist de vérification

- [ ] Migration `003_create_clients_projects_memberships.sql` exécutée avec succès
- [ ] Tables `clients`, `projects`, `project_memberships` visibles dans Table Editor
- [ ] Politiques RLS configurées et actives
- [ ] Données de test créées (clients, projets, membreships)
- [ ] Application démarre sans erreur (`pnpm dev`)
- [ ] Connexion fonctionne
- [ ] Projets s'affichent sur `/app`
- [ ] Informations client affichées correctement
- [ ] Mode switch fonctionne (si applicable)

---

## Prêt pour Step 3

Step 2 implémente le modèle de données de base et la logique de modes. Les éléments suivants seront ajoutés dans les prochaines étapes :

- Tasks, epics, sprints
- Time tracking
- Invoices
- Comments et notifications

