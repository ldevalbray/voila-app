# 🚀 Quick Start - Exécution des migrations

## Processus rapide

### 1️⃣ Première fois seulement : Créer `exec_sql`

```bash
# Dans Supabase Dashboard → SQL Editor, exécuter :
supabase/migrations/000_create_exec_sql_function.sql
```

### 2️⃣ Exécuter une migration

```bash
# Automatique (recommandé)
npx tsx scripts/setup-and-migrate-time-entries.ts

# OU manuellement dans Supabase SQL Editor
# Copier-coller le contenu du fichier de migration
```

### 3️⃣ Vérifier

```bash
# Vérifier qu'une table existe
npx tsx scripts/check-time-entries-table.ts
```

## ⚠️ Rappels importants

- **`exec_sql` doit exister** avant d'exécuter les migrations automatiquement
- **Ordre des migrations** : Exécuter dans l'ordre numérique (001, 002, 003...)
- **Variables d'env** : `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` nécessaires
- **En cas d'erreur** : Utiliser Supabase SQL Editor (méthode manuelle)

## 📝 Pour une nouvelle migration

1. Créer `00X_nom_migration.sql` dans `supabase/migrations/`
2. Exécuter : `npx tsx scripts/setup-and-migrate-time-entries.ts`
3. Vérifier que tout fonctionne

