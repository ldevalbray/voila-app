# Hooks Git

Ce dossier contient les hooks Git versionnés pour le projet.

## Installation

Les hooks sont automatiquement installés lors de `pnpm install` grâce au script `postinstall` dans `package.json`.

Pour installer manuellement les hooks :

```bash
pnpm install-hooks
```

## Hooks disponibles

### pre-commit

Vérifie que toutes les clés de traduction utilisées dans le code existent bien dans `messages/en.json` et `messages/fr.json` avant de permettre le commit.

Si des clés manquent, le commit est bloqué avec un message d'erreur explicite.

## Désactiver temporairement un hook

Si vous devez temporairement contourner un hook (par exemple pour un commit de WIP), utilisez l'option `--no-verify` :

```bash
git commit --no-verify -m "WIP: work in progress"
```

⚠️ **Attention** : Utilisez cette option avec précaution et uniquement si nécessaire.

