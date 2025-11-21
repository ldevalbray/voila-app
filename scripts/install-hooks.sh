#!/bin/sh
#
# Script d'installation des hooks Git
# Copie les hooks depuis scripts/hooks/ vers .git/hooks/
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
HOOKS_SOURCE_DIR="$SCRIPT_DIR/hooks"

echo "🔧 Installation des hooks Git..."

# Créer le dossier .git/hooks s'il n'existe pas
mkdir -p "$GIT_HOOKS_DIR"

# Copier tous les hooks
for hook in "$HOOKS_SOURCE_DIR"/*; do
  if [ -f "$hook" ]; then
    hook_name=$(basename "$hook")
    target="$GIT_HOOKS_DIR/$hook_name"
    
    echo "  📝 Installation de $hook_name..."
    cp "$hook" "$target"
    chmod +x "$target"
  fi
done

echo "✅ Hooks Git installés avec succès!"
echo ""
echo "Les hooks suivants sont maintenant actifs:"
ls -1 "$GIT_HOOKS_DIR"/* 2>/dev/null | grep -v sample | xargs -n1 basename | sed 's/^/  - /' || echo "  (aucun hook actif)"

