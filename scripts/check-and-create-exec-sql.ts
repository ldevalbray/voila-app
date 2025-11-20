#!/usr/bin/env tsx
/**
 * Script pour vérifier si exec_sql existe et la créer si nécessaire
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
      const output = execSync(`npx supabase projects api-keys --project-ref ${projectRef}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      })
      const serviceRoleMatch = output.match(/service_role\s+\|\s+([^\s]+)/)
      if (serviceRoleMatch) {
        supabaseServiceRoleKey = serviceRoleMatch[1].trim()
      }
    }
  } catch (error: any) {
    // Ignorer
  }
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
  process.exit(1)
}

async function checkAndCreateExecSql() {
  console.log('🔍 Vérification de l\'existence de la fonction exec_sql...\n')

  // Vérifier si exec_sql existe
  const checkResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceRoleKey,
      'Authorization': `Bearer ${supabaseServiceRoleKey}`,
    },
    body: JSON.stringify({ sql: 'SELECT 1' }),
  })

  if (checkResponse.status === 404) {
    console.log('⚠️  La fonction exec_sql n\'existe pas encore.\n')
    console.log('📝 Pour la créer, exécutez ce SQL dans Supabase SQL Editor :\n')
    console.log('─'.repeat(80))
    console.log()
    
    const execSqlPath = join(process.cwd(), 'supabase/migrations/000_create_exec_sql_function.sql')
    const execSqlSQL = readFileSync(execSqlPath, 'utf-8')
    console.log(execSqlSQL)
    console.log()
    console.log('─'.repeat(80))
    console.log()
    console.log('✅ Une fois créée, vous pourrez exécuter les migrations automatiquement.')
    process.exit(1)
  } else if (checkResponse.ok) {
    console.log('✅ La fonction exec_sql existe déjà!\n')
    return true
  } else {
    const errorText = await checkResponse.text()
    console.log('⚠️  Erreur lors de la vérification:', checkResponse.status, errorText)
    console.log('📝 Essayez de créer la fonction exec_sql manuellement dans Supabase SQL Editor.')
    process.exit(1)
  }
}

checkAndCreateExecSql().catch((error) => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})

