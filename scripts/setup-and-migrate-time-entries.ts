#!/usr/bin/env tsx
/**
 * Script pour configurer exec_sql et exécuter la migration time_entries
 * 
 * Ce script guide l'utilisateur pour créer exec_sql, puis exécute automatiquement
 * la migration time_entries via l'API REST.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

// Charger les variables d'environnement depuis .env.local
try {
  const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8')
  envFile.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
} catch (err) {
  // Ignorer si le fichier n'existe pas
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Récupérer la clé service role via Supabase CLI si nécessaire
if (!supabaseServiceRoleKey && supabaseUrl) {
  try {
    const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
    if (projectRefMatch) {
      const projectRef = projectRefMatch[1]
      console.log('🔍 Récupération de la clé service role via Supabase CLI...\n')
      const output = execSync(`npx supabase projects api-keys --project-ref ${projectRef}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      })
      const serviceRoleMatch = output.match(/service_role\s+\|\s+([^\s]+)/)
      if (serviceRoleMatch) {
        supabaseServiceRoleKey = serviceRoleMatch[1].trim()
        console.log('✅ Clé service role récupérée via Supabase CLI\n')
      }
    }
  } catch (error: any) {
    console.log('⚠️  Impossible de récupérer la clé via CLI:', error.message)
  }
}

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL n\'est pas défini')
  process.exit(1)
}

if (!supabaseServiceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY n\'est pas défini')
  process.exit(1)
}

async function checkExecSql() {
  console.log('🔍 Vérification de l\'existence de la fonction exec_sql...\n')
  
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceRoleKey,
      'Authorization': `Bearer ${supabaseServiceRoleKey}`,
    },
    body: JSON.stringify({ sql: 'SELECT 1' }),
  })

  if (response.status === 404) {
    return false
  }
  return response.ok
}

async function runMigration() {
  const execSqlExists = await checkExecSql()
  
  if (!execSqlExists) {
    console.log('⚠️  La fonction exec_sql n\'existe pas encore.\n')
    console.log('📝 ÉTAPE 1: Créez d\'abord la fonction exec_sql dans Supabase SQL Editor\n')
    console.log('─'.repeat(80))
    console.log()
    
    const execSqlPath = join(process.cwd(), 'supabase/migrations/000_create_exec_sql_function.sql')
    const execSqlSQL = readFileSync(execSqlPath, 'utf-8')
    console.log(execSqlSQL)
    console.log()
    console.log('─'.repeat(80))
    console.log()
    console.log('✅ Après avoir exécuté ce SQL dans Supabase SQL Editor,')
    console.log('   réexécutez ce script pour continuer avec la migration time_entries.\n')
    process.exit(1)
  }

  console.log('✅ La fonction exec_sql existe!\n')
  console.log('🚀 Exécution de la migration 006_create_time_entries.sql...\n')

  const migrationPath = join(process.cwd(), 'supabase/migrations/006_create_time_entries.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      },
      body: JSON.stringify({ sql: migrationSQL }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}\n${errorText}`)
    }

    const result = await response.json()
    if (result.success === false) {
      throw new Error(`Erreur SQL: ${result.error || 'Erreur inconnue'}`)
    }

    console.log('✅ Migration exécutée avec succès!\n')
    console.log('Résultat:', JSON.stringify(result, null, 2))
    console.log('\n🔍 Vérification de la table...')
    
    // Vérifier que la table existe
    const checkScript = join(process.cwd(), 'scripts/check-time-entries-table.ts')
    execSync(`npx tsx ${checkScript}`, { stdio: 'inherit', encoding: 'utf-8' })
    
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'exécution de la migration:', error.message)
    console.log('\n📝 Alternative: Exécutez la migration manuellement via Supabase Dashboard :')
    console.log('   1. Allez dans SQL Editor')
    console.log('   2. Copiez le contenu de supabase/migrations/006_create_time_entries.sql')
    console.log('   3. Exécutez le script\n')
    process.exit(1)
  }
}

runMigration().catch((error) => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})



