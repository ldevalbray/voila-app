#!/usr/bin/env tsx
/**
 * Script pour exécuter la migration 004_create_epics_tasks.sql
 * 
 * Usage: pnpm tsx scripts/run-migration.ts
 * 
 * Note: Ce script nécessite la variable d'environnement SUPABASE_SERVICE_ROLE_KEY
 * pour exécuter des commandes SQL directement.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL n\'est pas défini')
  process.exit(1)
}

if (!supabaseServiceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY n\'est pas défini')
  console.error('   Ce script nécessite la clé service role pour exécuter des migrations SQL.')
  console.error('   Vous pouvez l\'obtenir dans Supabase Dashboard > Settings > API > service_role key')
  process.exit(1)
}

// Créer un client avec les droits admin
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function runMigration() {
  console.log('🚀 Démarrage de la migration 004_create_epics_tasks.sql...\n')

  // Lire le fichier de migration
  const migrationPath = join(process.cwd(), 'supabase/migrations/004_create_epics_tasks.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  // Exécuter la migration
  // Note: Supabase JS ne supporte pas directement l'exécution de SQL arbitraire
  // Il faut utiliser l'API REST ou psql directement
  console.log('⚠️  Le client Supabase JS ne peut pas exécuter directement du SQL arbitraire.')
  console.log('📝 Pour exécuter cette migration, vous avez deux options :\n')
  console.log('   1. Via Supabase Dashboard :')
  console.log('      - Allez dans SQL Editor')
  console.log('      - Copiez le contenu de supabase/migrations/004_create_epics_tasks.sql')
  console.log('      - Exécutez le script\n')
  console.log('   2. Via Supabase CLI (si installé) :')
  console.log('      supabase db push\n')
  console.log('   3. Via psql directement :')
  console.log(`      psql "${supabaseUrl.replace('https://', 'postgresql://postgres:[PASSWORD]@').replace('.supabase.co', '.supabase.co:5432')}/postgres" -f supabase/migrations/004_create_epics_tasks.sql\n`)
  
  console.log('📄 Contenu de la migration :')
  console.log('─'.repeat(60))
  console.log(migrationSQL.substring(0, 500) + '...\n')
  console.log('─'.repeat(60))
}

runMigration().catch((error) => {
  console.error('❌ Erreur lors de l\'exécution de la migration:', error)
  process.exit(1)
})

