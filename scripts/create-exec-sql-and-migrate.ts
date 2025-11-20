#!/usr/bin/env tsx
/**
 * Script pour créer exec_sql puis exécuter la migration time_entries
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { Client } from 'pg'
import { lookup } from 'dns/promises'

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
const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'A#3sHJa4G4hBPAiD'

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL n\'est pas défini')
  process.exit(1)
}

async function createExecSqlAndMigrate() {
  // Extraire le project ref
  const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
  if (!projectRefMatch) {
    console.error('❌ Impossible d\'extraire le project ref de l\'URL')
    process.exit(1)
  }
  const projectRef = projectRefMatch[1]

  // Résoudre le hostname en IPv4
  const hostname = `db.${projectRef}.supabase.co`
  console.log(`🔍 Résolution DNS pour ${hostname}...`)
  const addresses = await lookup(hostname, { family: 4 })
  const ipv4Address = addresses.address
  console.log(`✅ Adresse IPv4: ${ipv4Address}\n`)

  // Créer la connexion PostgreSQL avec l'adresse IPv4
  const client = new Client({
    host: ipv4Address,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
  })

  try {
    console.log('🔌 Connexion à la base de données...')
    await client.connect()
    console.log('✅ Connecté à la base de données\n')

    // Vérifier si exec_sql existe
    console.log('🔍 Vérification de la fonction exec_sql...')
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'exec_sql'
      );
    `)

    if (!checkResult.rows[0].exists) {
      console.log('📝 Création de la fonction exec_sql...')
      const execSqlPath = join(process.cwd(), 'supabase/migrations/000_create_exec_sql_function.sql')
      const execSqlSQL = readFileSync(execSqlPath, 'utf-8')
      await client.query(execSqlSQL)
      console.log('✅ Fonction exec_sql créée avec succès!\n')
    } else {
      console.log('✅ La fonction exec_sql existe déjà\n')
    }

    // Exécuter la migration time_entries
    console.log('📝 Exécution de la migration 006_create_time_entries.sql...')
    const migrationPath = join(process.cwd(), 'supabase/migrations/006_create_time_entries.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    await client.query(migrationSQL)
    console.log('✅ Migration exécutée avec succès!\n')

    // Vérifier que la table existe
    console.log('🔍 Vérification de la table time_entries...')
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'time_entries'
      ORDER BY ordinal_position;
    `)

    if (result.rows.length > 0) {
      console.log('✅ Table time_entries créée avec succès!')
      console.log(`   Colonnes: ${result.rows.length}`)
      result.rows.forEach((row) => {
        console.log(`   - ${row.column_name} (${row.data_type})`)
      })
    } else {
      console.log('⚠️  La table time_entries n\'a pas été trouvée')
    }

    // Vérifier les politiques RLS
    const policiesResult = await client.query(`
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'time_entries';
    `)
    console.log(`\n✅ Politiques RLS: ${policiesResult.rows.length} trouvées`)
    policiesResult.rows.forEach((row) => {
      console.log(`   - ${row.policyname}`)
    })

  } catch (error: any) {
    if (error.code === '28P01') {
      console.error('❌ Erreur d\'authentification: Le mot de passe est incorrect')
      console.error('   Vérifiez que le mot de passe fourni est correct')
      console.error('   Vous pouvez aussi l\'ajouter dans .env.local: SUPABASE_DB_PASSWORD=votre_mot_de_passe')
    } else {
      console.error('❌ Erreur:', error.message)
      if (error.code) {
        console.error(`   Code d'erreur: ${error.code}`)
      }
    }
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Connexion fermée')
  }
}

createExecSqlAndMigrate().catch((error) => {
  console.error('❌ Erreur:', error)
  process.exit(1)
})

