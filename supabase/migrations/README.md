# Processus d'exécution des migrations Supabase

Ce document décrit le processus pour exécuter les migrations SQL dans Supabase.

## 📋 Prérequis

1. **Variables d'environnement** configurées dans `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL` : URL de votre projet Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` : Clé service role (optionnelle, peut être récupérée via CLI)
   - `SUPABASE_DB_PASSWORD` : Mot de passe de la base de données PostgreSQL (optionnel, pour connexion directe)

2. **Fonction RPC `exec_sql`** : Doit être créée **une seule fois** dans Supabase pour permettre l'exécution automatique des migrations.

## 🚀 Processus d'exécution

### Étape 1 : Créer la fonction `exec_sql` (une seule fois)

**⚠️ IMPORTANT : Cette étape n'est nécessaire qu'une seule fois au début du projet.**

1. Ouvrir **Supabase Dashboard → SQL Editor**
2. Exécuter le contenu de `000_create_exec_sql_function.sql`
3. Cette fonction permet d'exécuter du SQL via l'API REST de Supabase

### Étape 2 : Exécuter une migration

**Option A : Automatique (recommandé)**

```bash
npx tsx scripts/setup-and-migrate-time-entries.ts
```

Ce script :
- Vérifie si `exec_sql` existe
- Si non, affiche les instructions pour la créer
- Si oui, exécute automatiquement la migration via l'API REST
- Vérifie que la table/objet a été créé correctement

**Option B : Manuelle**

1. Ouvrir **Supabase Dashboard → SQL Editor**
2. Copier le contenu du fichier de migration (ex: `006_create_time_entries.sql`)
3. Coller dans l'éditeur SQL
4. Exécuter (Cmd/Ctrl + Enter)

## 📝 Scripts disponibles

### `scripts/setup-and-migrate-time-entries.ts`
Script principal pour exécuter les migrations. Vérifie `exec_sql` et exécute la migration automatiquement.

### `scripts/run-time-entries-migration.ts`
Script alternatif qui tente d'exécuter une migration spécifique via `exec_sql` ou l'API Management.

### `scripts/check-time-entries-table.ts`
Script de vérification pour confirmer qu'une table existe et est correctement configurée.

### `scripts/check-and-create-exec-sql.ts`
Script pour vérifier si `exec_sql` existe et afficher les instructions si nécessaire.

## 🔧 Dépannage

### Erreur : "La fonction RPC exec_sql n'existe pas"
**Solution** : Exécutez manuellement `000_create_exec_sql_function.sql` dans Supabase SQL Editor.

### Erreur : "password authentication failed"
**Solution** : Vérifiez que `SUPABASE_DB_PASSWORD` dans `.env.local` correspond au mot de passe de la base de données (Settings → Database → Database password).

### Erreur : "JWT failed verification" (401)
**Solution** : Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est correct. Le script peut la récupérer automatiquement via Supabase CLI.

### Erreur : "connect ECONNREFUSED"
**Solution** : Problème de connexion réseau. Utilisez l'option manuelle (Supabase SQL Editor) ou vérifiez votre connexion internet.

## 📚 Ordre des migrations

Les migrations doivent être exécutées dans l'ordre numérique :

1. `000_create_exec_sql_function.sql` - Fonction helper (une seule fois)
2. `001_create_users_table.sql` - Table users
3. `002_add_i18n_foundation.sql` - Fondation i18n
4. `003_create_clients_projects_memberships.sql` - Modèle de données de base
5. `004_create_tasks.sql` - Table tasks
6. `005_create_sprints.sql` - Table sprints
7. `006_create_time_entries.sql` - Table time_entries

## ✅ Checklist pour une nouvelle migration

- [ ] Créer le fichier SQL dans `supabase/migrations/` avec un numéro séquentiel
- [ ] Ajouter des commentaires SQL expliquant la migration
- [ ] Tester la migration dans un environnement de développement
- [ ] Vérifier que les politiques RLS sont correctement configurées
- [ ] Vérifier que les index nécessaires sont créés
- [ ] Exécuter la migration via `setup-and-migrate-time-entries.ts` ou manuellement
- [ ] Vérifier avec un script de vérification si disponible
- [ ] Documenter les changements dans le README principal du projet

## 🔐 Sécurité

- La fonction `exec_sql` est sécurisée avec `SECURITY DEFINER` et ne doit être accessible qu'avec la clé `service_role`
- Ne jamais exposer la clé `service_role` dans le code client
- Toujours vérifier les politiques RLS après chaque migration

## 📖 Références

- [Documentation Supabase Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

