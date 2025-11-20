#!/usr/bin/env tsx
/**
 * Script pour exécuter la migration 007_create_invoices.sql
 * 
 * Usage: pnpm tsx scripts/run-invoices-migration.ts
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

// Si la clé service role n'est pas dans .env.local, essayer de la récupérer via Supabase CLI
if (!supabaseServiceRoleKey && supabaseUrl) {
  try {
    // Extraire le project ref de l'URL
    const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
    if (projectRefMatch) {
      const projectRef = projectRefMatch[1]
      console.log('🔍 Récupération de la clé service role via Supabase CLI...\n')
      
      // Récupérer les clés API via Supabase CLI
      const output = execSync(`npx supabase projects api-keys --project-ref ${projectRef}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      })
      
      // Parser la sortie pour extraire la service_role key
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
  console.error('   Ce script nécessite la clé service role pour exécuter des migrations SQL.')
  console.error('   Vous pouvez l\'obtenir dans Supabase Dashboard > Settings > API > service_role key')
  process.exit(1)
}

async function runMigration() {
  console.log('🚀 Démarrage de la migration 007_create_invoices.sql...\n')

  // Lire le fichier de migration
  const migrationPath = join(process.cwd(), 'supabase/migrations/007_create_invoices.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  try {
    // Utiliser l'API REST de Supabase pour exécuter le SQL
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
      // Si la fonction RPC n'existe pas, utiliser l'endpoint SQL direct
      console.log('⚠️  La fonction RPC exec_sql n\'existe pas, tentative avec l\'endpoint SQL direct...\n')
      
      // Extraire le project ref
      const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
      if (!projectRefMatch) {
        throw new Error('Impossible d\'extraire le project ref de l\'URL')
      }
      const projectRef = projectRefMatch[1]
      
      // Alternative: utiliser l'API Management
      const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        },
        body: JSON.stringify({ query: migrationSQL }),
      })

      if (!mgmtResponse.ok) {
        const errorText = await mgmtResponse.text()
        throw new Error(`Erreur HTTP: ${mgmtResponse.status} ${mgmtResponse.statusText}\n${errorText}`)
      }

      const result = await mgmtResponse.json()
      console.log('✅ Migration exécutée avec succès via API Management!\n')
      console.log('Résultat:', JSON.stringify(result, null, 2))
      return
    }

    const result = await response.json()
    if (result.success === false) {
      throw new Error(`Erreur SQL: ${result.error || 'Erreur inconnue'}`)
    }
    console.log('✅ Migration exécutée avec succès via RPC exec_sql!\n')
    console.log('Résultat:', JSON.stringify(result, null, 2))
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'exécution de la migration:', error.message)
    console.log('\n📝 Alternative: Exécutez la migration manuellement via Supabase Dashboard :')
    console.log('   1. Allez dans SQL Editor')
    console.log('   2. Copiez le contenu de supabase/migrations/007_create_invoices.sql')
    console.log('   3. Exécutez le script\n')
    process.exit(1)
  }
}

runMigration().catch((error) => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})

