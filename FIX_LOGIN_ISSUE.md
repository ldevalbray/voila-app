# Fix pour le problème de connexion

## Problème identifié

La migration `011_add_project_members_management_rls.sql` créait une **récursion infinie** dans les politiques RLS. Les politiques RLS sur `project_memberships` faisaient des requêtes SELECT sur la même table qu'elles protégeaient, créant une boucle infinie :

```
Error: infinite recursion detected in policy for relation "project_memberships"
```

Cela empêchait complètement l'authentification et l'accès aux données.

## Solution appliquée

La solution utilise des **fonctions SECURITY DEFINER** qui contournent RLS pour éviter la récursion :

1. **Fonctions helper** : `is_project_member()` et `is_project_admin()` qui peuvent lire `project_memberships` sans être affectées par RLS
2. **Politiques RLS corrigées** : Utilisent ces fonctions au lieu de requêtes directes sur la table
3. **Préservation des fonctionnalités** : Les utilisateurs peuvent toujours voir leurs propres membreships ET les membres des projets où ils sont membres

## Action requise

**Si vous avez déjà exécuté la migration 011** dans Supabase, vous devez exécuter la migration de correction `012_fix_login_rls_policies.sql` :

1. Aller dans Supabase Dashboard → SQL Editor
2. Ouvrir le fichier `supabase/migrations/012_fix_login_rls_policies.sql`
3. Copier tout le contenu et l'exécuter dans SQL Editor

**OU** exécuter manuellement le contenu de `012_fix_login_rls_policies.sql` qui :
- Crée les fonctions helper `is_project_member()` et `is_project_admin()`
- Corrige toutes les politiques RLS pour utiliser ces fonctions
- Élimine la récursion infinie

3. Vérifier que la politique "Users can view own profile" existe toujours sur la table `users` :

```sql
-- Vérifier que cette politique existe
SELECT * FROM pg_policies 
WHERE tablename = 'users' 
AND policyname = 'Users can view own profile';
```

Si elle n'existe pas, la recréer :

```sql
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);
```

## Vérification

Après avoir appliqué le correctif :
1. Essayez de vous connecter à nouveau
2. Vérifiez que vous pouvez accéder à vos projets
3. Vérifiez que vous pouvez voir la liste des membres dans les paramètres du projet

