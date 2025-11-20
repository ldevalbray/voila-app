#!/usr/bin/env tsx
/**
 * Script pour créer la fonction exec_sql puis exécuter la migration time_entries
 * 
 * Usage: npx tsx scripts/setup-exec-sql-and-run-migration.ts
 * 
 * Ce script :
 * 1. Crée d'abord la fonction RPC exec_sql (si elle n'existe pas)
 * 2. Utilise ensuite cette fonction pour exécuter la migration time_entries
 */

import { readFileSync } from 'fs'
import { join } from 'path'

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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définis')
  process.exit(1)
}

async function setupAndRunMigration() {
  console.log('🚀 Configuration et exécution de la migration time_entries...\n')

  // Lire la fonction exec_sql
  const execSqlPath = join(process.cwd(), 'supabase/migrations/000_create_exec_sql_function.sql')
  let execSqlFunction: string
  try {
    execSqlFunction = readFileSync(execSqlPath, 'utf-8')
  } catch {
    // Si le fichier n'existe pas, utiliser la définition inline
    execSqlFunction = `
CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE sql;
  RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;
`
  }

  // Lire la migration time_entries
  const migrationPath = join(process.cwd(), 'supabase/migrations/006_create_time_entries.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  console.log('📝 Instructions :')
  console.log('   1. Exécutez d\'abord cette requête dans Supabase SQL Editor pour créer la fonction exec_sql :\n')
  console.log('─'.repeat(80))
  console.log(execSqlFunction)
  console.log('─'.repeat(80))
  console.log('\n   2. Ensuite, exécutez cette migration :\n')
  console.log('─'.repeat(80))
  console.log(migrationSQL)
  console.log('─'.repeat(80))
  console.log('\n   3. OU réexécutez ce script après avoir créé la fonction exec_sql\n')
  console.log('   Il essaiera alors d\'exécuter automatiquement la migration.\n')

  // Essayer d'utiliser exec_sql si elle existe déjà
  try {
    console.log('🔍 Vérification si exec_sql existe déjà...\n')
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ sql: 'SELECT 1' }),
    })

    if (testResponse.ok) {
      console.log('✅ La fonction exec_sql existe! Exécution de la migration...\n')
      
      const migrationResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ sql: migrationSQL }),
      })

      if (migrationResponse.ok) {
        const result = await migrationResponse.json()
        if (result.success !== false) {
          console.log('✅ Migration exécutée avec succès!\n')
          console.log('Résultat:', JSON.stringify(result, null, 2))
          console.log('\n🔍 Vérification...')
          
          // Vérifier que la table existe
          const checkScript = join(process.cwd(), 'scripts/check-time-entries-table.ts')
          const { exec } = await import('child_process')
          exec(`npx tsx ${checkScript}`, (error, stdout, stderr) => {
            if (error) {
              console.error('⚠️  Erreur lors de la vérification:', error.message)
            } else {
              console.log(stdout)
            }
          })
          return
        } else {
          throw new Error(result.error || 'Erreur inconnue')
        }
      } else {
        const errorText = await migrationResponse.text()
        throw new Error(`HTTP ${migrationResponse.status}: ${errorText}`)
      }
    } else {
      console.log('⚠️  La fonction exec_sql n\'existe pas encore.\n')
      console.log('   Créez-la d\'abord avec le SQL ci-dessus, puis réexécutez ce script.\n')
    }
  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
  }

  process.exit(1)
}

setupAndRunMigration().catch((error) => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})

