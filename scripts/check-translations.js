#!/usr/bin/env node
/**
 * Script de vérification des traductions
 * 
 * Vérifie que toutes les clés de traduction utilisées dans le code
 * existent bien dans les fichiers messages/en.json et messages/fr.json
 */

const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')

// Fonction pour obtenir une valeur dans un objet avec un chemin
function getValue(obj, keyPath) {
  const parts = keyPath.split('.')
  let current = obj
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part]
    } else {
      return undefined
    }
  }
  return current
}

// Fonction pour obtenir toutes les clés d'un objet
function getAllKeys(obj, prefix = '') {
  const keys = []
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

// Fonction pour lire récursivement tous les fichiers TypeScript
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Ignorer node_modules, .next, etc.
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        getAllTsFiles(filePath, fileList)
      }
    } else if (file.match(/\.(ts|tsx)$/)) {
      fileList.push(filePath)
    }
  })

  return fileList
}

// Fonction pour extraire les clés de traduction utilisées dans un fichier
function extractTranslationKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const usages = []
  const lines = content.split('\n')

  // Map pour stocker les namespaces par variable et par ligne
  const namespaceMap = new Map() // Map<lineIndex, { varName, namespace }>

  // Trouver tous les namespaces déclarés
  lines.forEach((line, index) => {
    // Pattern pour useTranslations('namespace') ou getTranslations('namespace')
    const namespaceMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:useTranslations|getTranslations)\s*\(\s*['"]([^'"]+)['"]\s*\)/)
    if (namespaceMatch) {
      const varName = namespaceMatch[1]
      const namespace = namespaceMatch[2]
      namespaceMap.set(index, { varName, namespace })
    }
  })

  // Trouver tous les appels t('key') ou t("key")
  lines.forEach((line, lineIndex) => {
    // Chercher les appels t('key') ou t("key")
    const tCallPattern = /\b(\w+)\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    let match

    while ((match = tCallPattern.exec(line)) !== null) {
      const varName = match[1]
      const key = match[2]

      // Ignorer les clés qui sont clairement des chemins ou autres
      if (
        key.startsWith('/') ||
        key.startsWith('@') ||
        key.includes('NEXT_LOCALE') ||
        key.match(/^[A-Z_]+$/) ||
        key.length === 0
      ) {
        continue
      }

      // Trouver le namespace associé à cette variable
      // On cherche dans les lignes précédentes (jusqu'à 100 lignes avant)
      let namespace = null
      for (let i = lineIndex; i >= 0 && i >= lineIndex - 100; i--) {
        const nsInfo = namespaceMap.get(i)
        if (nsInfo && nsInfo.varName === varName) {
          namespace = nsInfo.namespace
          break
        }
      }

      if (namespace) {
        const fullPath = `${namespace}.${key}`
        usages.push({
          namespace,
          key,
          fullPath,
          file: path.relative(rootDir, filePath),
          line: lineIndex + 1,
        })
      }
    }
  })

  return usages
}

// Fonction principale
function main() {
  console.log('🔍 Vérification des traductions...\n')

  // Charger les fichiers de traduction
  const enPath = path.join(rootDir, 'messages', 'en.json')
  const frPath = path.join(rootDir, 'messages', 'fr.json')

  if (!fs.existsSync(enPath) || !fs.existsSync(frPath)) {
    console.error('❌ Fichiers de traduction introuvables')
    process.exit(1)
  }

  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
  const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'))

  // Obtenir toutes les clés définies
  const enKeys = new Set(getAllKeys(en))
  const frKeys = new Set(getAllKeys(fr))

  // Extraire toutes les clés utilisées dans le code
  const srcDir = path.join(rootDir, 'src')
  const tsFiles = getAllTsFiles(srcDir)
  const allUsages = []

  console.log(`📁 Analyse de ${tsFiles.length} fichiers...`)

  tsFiles.forEach((file) => {
    try {
      const usages = extractTranslationKeys(file)
      allUsages.push(...usages)
    } catch (error) {
      console.warn(`⚠️  Erreur lors de l'analyse de ${file}:`, error.message)
    }
  })

  // Dédupliquer les usages (même clé peut être utilisée plusieurs fois)
  const uniqueUsages = new Map()
  allUsages.forEach((usage) => {
    const key = usage.fullPath
    if (!uniqueUsages.has(key)) {
      uniqueUsages.set(key, usage)
    }
  })

  console.log(`📝 ${uniqueUsages.size} clés de traduction uniques trouvées\n`)

  // Vérifier les clés manquantes
  const missingInEn = []
  const missingInFr = []

  uniqueUsages.forEach((usage) => {
    const enValue = getValue(en, usage.fullPath)
    const frValue = getValue(fr, usage.fullPath)

    if (!enValue || typeof enValue !== 'string') {
      missingInEn.push(usage)
    }
    if (!frValue || typeof frValue !== 'string') {
      missingInFr.push(usage)
    }
  })

  // Afficher les résultats
  let hasErrors = false

  if (missingInEn.length > 0) {
    hasErrors = true
    console.log('❌ Clés manquantes dans messages/en.json:')
    missingInEn.forEach((usage) => {
      console.log(`   - ${usage.fullPath}`)
      console.log(`     Fichier: ${usage.file}:${usage.line}`)
    })
    console.log()
  }

  if (missingInFr.length > 0) {
    hasErrors = true
    console.log('❌ Clés manquantes dans messages/fr.json:')
    missingInFr.forEach((usage) => {
      console.log(`   - ${usage.fullPath}`)
      console.log(`     Fichier: ${usage.file}:${usage.line}`)
    })
    console.log()
  }

  // Vérifier aussi les clés définies mais non utilisées (optionnel, pour info)
  const usedKeys = new Set(Array.from(uniqueUsages.values()).map((u) => u.fullPath))
  const unusedInEn = [...enKeys].filter((k) => !usedKeys.has(k))
  const unusedInFr = [...frKeys].filter((k) => !usedKeys.has(k))

  if (unusedInEn.length > 0 || unusedInFr.length > 0) {
    console.log('ℹ️  Clés définies mais non utilisées (info):')
    if (unusedInEn.length > 0) {
      console.log(`   - ${unusedInEn.length} clés dans en.json`)
    }
    if (unusedInFr.length > 0) {
      console.log(`   - ${unusedInFr.length} clés dans fr.json`)
    }
    console.log()
  }

  // Résumé
  if (!hasErrors) {
    console.log('✅ Toutes les clés de traduction sont présentes dans les deux langues!')
    process.exit(0)
  } else {
    console.log('❌ Des clés de traduction manquent. Veuillez les ajouter.')
    process.exit(1)
  }
}

// Exécuter le script
main()

