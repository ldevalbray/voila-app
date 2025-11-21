# Configuration de SUPABASE_SERVICE_ROLE_KEY

## Pourquoi cette variable est nécessaire

La `SUPABASE_SERVICE_ROLE_KEY` est nécessaire pour :
- Inviter de nouveaux utilisateurs via l'API Admin de Supabase
- Vérifier si un utilisateur existe déjà dans Supabase Auth
- Contourner RLS pour certaines opérations administratives (de manière sécurisée)

## Comment récupérer la clé

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet

2. **Accéder aux paramètres API**
   - Menu de gauche → **Settings** (⚙️)
   - Cliquer sur **API**

3. **Récupérer la Service Role Key**
   - Dans la section **Project API keys**
   - Trouver la clé **`service_role`** (⚠️ **secret**)
   - Cliquer sur **Reveal** pour afficher la clé
   - **Copier la clé complète**

## Ajouter la clé au fichier .env.local

1. **Ouvrir le fichier `.env.local`** à la racine du projet

2. **Ajouter la ligne suivante** :
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
   ```

3. **Exemple complet** :
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://meagahrsxqwvihycyqyi.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lYWdhaHJzeHF3dmloeWN5cXlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU5MzQ1OCwiZXhwIjoyMDc5MTY5NDU4fQ...
   ```

## ⚠️ Sécurité importante

- **NE JAMAIS** commiter cette clé dans Git
- **NE JAMAIS** l'exposer côté client (browser)
- Cette clé a des **permissions complètes** sur votre base de données
- Elle est utilisée **uniquement côté serveur** dans les Server Actions

## Vérification

Après avoir ajouté la clé :
1. Redémarrer le serveur de développement (`npm run dev` ou `pnpm dev`)
2. L'erreur devrait disparaître
3. La fonctionnalité d'invitation d'utilisateurs devrait fonctionner

