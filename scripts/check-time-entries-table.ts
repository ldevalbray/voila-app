/**
 * Script pour vérifier si la table time_entries existe dans Supabase
 * Usage: npx tsx scripts/check-time-entries-table.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Charger les variables d'environnement depuis .env.local
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
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
  console.warn('⚠️  Impossible de charger .env.local, utilisation des variables d\'environnement système')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définis')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTimeEntriesTable() {
  console.log('🔍 Vérification de la table time_entries...\n')

  try {
    // Essayer de récupérer le schéma de la table
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .limit(0)

    if (error) {
      if (error.code === '42P01') {
        console.error('❌ La table time_entries n\'existe pas dans Supabase!')
        console.error('\n📝 Pour créer la table, exécutez la migration:')
        console.error('   supabase/migrations/006_create_time_entries.sql')
        console.error('\n💡 Dans Supabase Dashboard:')
        console.error('   1. Allez dans SQL Editor')
        console.error('   2. Copiez le contenu de supabase/migrations/006_create_time_entries.sql')
        console.error('   3. Exécutez la requête')
      } else {
        console.error('❌ Erreur lors de la vérification:', error.message)
        console.error('   Code:', error.code)
        console.error('   Détails:', error.details)
        console.error('   Hint:', error.hint)
      }
      process.exit(1)
    } else {
      console.log('✅ La table time_entries existe!')
      
      // Vérifier les colonnes
      console.log('\n📊 Vérification des colonnes...')
      const { data: testData, error: testError } = await supabase
        .from('time_entries')
        .select('id, project_id, task_id, user_id, category, duration_minutes, date, notes, created_at, updated_at')
        .limit(1)
      
      if (testError) {
        console.error('⚠️  Erreur lors de la vérification des colonnes:', testError.message)
      } else {
        console.log('✅ Les colonnes semblent correctes')
      }

      // Compter les entrées
      const { count, error: countError } = await supabase
        .from('time_entries')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.error('⚠️  Erreur lors du comptage:', countError.message)
      } else {
        console.log(`\n📈 Nombre d'entrées de temps: ${count || 0}`)
      }
    }
  } catch (err) {
    console.error('❌ Erreur inattendue:', err)
    process.exit(1)
  }
}

checkTimeEntriesTable()

