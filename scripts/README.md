# Scripts de vérification

## check-translations.js

Script de vérification automatique des traductions qui s'assure que toutes les clés de traduction utilisées dans le code existent bien dans les fichiers `messages/en.json` et `messages/fr.json`.

### Utilisation

```bash
pnpm check-translations
```

### Fonctionnalités

- ✅ Analyse tous les fichiers TypeScript/TSX dans le dossier `src/`
- ✅ Détecte automatiquement les namespaces utilisés avec `useTranslations()` ou `getTranslations()`
- ✅ Extrait toutes les clés de traduction utilisées avec `t('key')`
- ✅ Vérifie que chaque clé existe dans les deux fichiers de traduction (en.json et fr.json)
- ✅ Affiche les clés manquantes avec leur emplacement dans le code
- ℹ️  Affiche également les clés définies mais non utilisées (information)

### Exemple de sortie

```
🔍 Vérification des traductions...

📁 Analyse de 140 fichiers...
📝 178 clés de traduction uniques trouvées

✅ Toutes les clés de traduction sont présentes dans les deux langues!
```

En cas d'erreur :

```
❌ Clés manquantes dans messages/en.json:
   - projects.deleteSprint
     Fichier: src/components/sprints/sprints-list.tsx:170
```

### Intégration dans le workflow

#### Option 1: Hook pre-commit (recommandé et installé)

Le hook pre-commit est automatiquement installé lors de `pnpm install` grâce au script `postinstall`.

Pour installer manuellement les hooks :

```bash
pnpm install-hooks
```

Le hook vérifie automatiquement les traductions avant chaque commit et bloque le commit si des clés manquent.

#### Option 2: CI/CD

Ajouter dans votre pipeline CI/CD (GitHub Actions, GitLab CI, etc.) :

```yaml
- name: Check translations
  run: pnpm check-translations
```

#### Option 3: Script de build

Ajouter dans `package.json` :

```json
{
  "scripts": {
    "prebuild": "pnpm check-translations",
    "build": "next build"
  }
}
```

### Notes

- Le script ignore automatiquement les clés qui sont clairement des chemins (commençant par `/` ou `@`)
- Le script ignore les constantes en majuscules (comme `NEXT_LOCALE`)
- Les clés non utilisées sont affichées à titre informatif uniquement (ne bloquent pas l'exécution)

