# Design Tokens - Voila.app

Ce document décrit le système de tokens de design utilisé dans Voila.app.

## Couleurs

### Couleurs Sémantiques

- **Primary** (`--primary`) : Couleur principale de l'application, utilisée pour les actions principales
- **Secondary** (`--secondary`) : Couleur secondaire, utilisée pour les éléments moins importants
- **Accent** (`--accent`) : Couleur d'accent, utilisée pour mettre en évidence certains éléments
- **Muted** (`--muted`) : Couleur atténuée, utilisée pour les arrière-plans subtils
- **Muted Foreground** (`--muted-foreground`) : Texte sur fond muted, avec bon contraste (46% luminosité en light, 80% en dark)

### Couleurs d'État

- **Destructive** (`--destructive`) : Pour les actions destructives (suppression, erreurs)
- **Success** (`--success`) : Pour les messages de succès et confirmations
- **Warning** (`--warning`) : Pour les avertissements
- **Info** (`--info`) : Pour les messages informatifs

### Quand utiliser Secondary vs Accent ?

- **Secondary** : Pour les arrière-plans, les zones moins importantes, les états désactivés
- **Accent** : Pour mettre en évidence des éléments spécifiques, les hover states, les focus states

## Typographie

### Hiérarchie

- **Display** (`text-display`) : 4rem, pour les titres très grands (peu utilisé)
- **H1** (`text-h1`) : 2.5rem, pour les titres de page principaux
- **H2** (`text-h2`) : 2rem, pour les sous-titres de section
- **H3** (`text-h3`) : 1.5rem, pour les sous-titres de sous-section
- **H4** (`text-h4`) : 1.25rem, pour les titres de cartes
- **Body Large** (`text-body-lg`) : 1.125rem, pour le texte important
- **Body** (`text-body`) : 1rem, pour le texte principal
- **Body Small** (`text-body-sm`) : 0.875rem, pour le texte secondaire
- **Caption** (`text-caption`) : 0.75rem, pour les labels et légendes
- **Code** (`text-code`) : 0.875rem, pour le code inline

### Cas d'usage

- **Display** : Réservé pour les pages marketing ou landing
- **H1** : Titre principal d'une page (`PageToolbar`)
- **H2** : Sections principales dans une page
- **H3** : Titres de cartes (`CardTitle`)
- **Body Large** : Texte important dans les cartes, descriptions de section
- **Body** : Contenu principal, paragraphes
- **Body Small** : Descriptions de cartes, métadonnées
- **Caption** : Labels de formulaire, timestamps, badges textuels

## Espacement

Utilisation directe des classes Tailwind pour l'espacement :
- `p-*` : padding
- `m-*` : margin
- `gap-*` : gap dans flex/grid
- `space-y-*` : espacement vertical entre enfants

Conventions :
- **Card padding** : `p-6` (24px)
- **Section spacing** : `space-y-6` (24px) ou `space-y-8` (32px)
- **Form spacing** : `space-y-4` (16px)
- **Button gap** : `gap-2` (8px)

## Animations

### Durées

- **Instant** (`--duration-instant`) : 100ms - pour les micro-interactions
- **Fast** (`--duration-fast`) : 200ms - pour les transitions rapides
- **Base** (`--duration-base`) : 300ms - pour les transitions standard
- **Slow** (`--duration-slow`) : 500ms - pour les transitions lentes

### Easing

- **Ease Out Expo** (`--ease-out-expo`) : `cubic-bezier(0.16, 1, 0.3, 1)` - pour les sorties
- **Ease In Out Expo** (`--ease-in-out-expo`) : `cubic-bezier(0.87, 0, 0.13, 1)` - pour les transitions bidirectionnelles
- **Ease Spring** (`--ease-spring`) : `cubic-bezier(0.34, 1.56, 0.64, 1)` - pour les effets de rebond

### Utilisation

Toujours utiliser les variables CSS plutôt que des durées hardcodées :
```css
transition: all var(--duration-base) var(--ease-out-expo);
```

## Bordures et Rayon

- **Border radius** : `var(--radius)` = 0.5rem (8px)
- **Border color** : `hsl(var(--border))`
- **Border styles** : 
  - Default: `border border-border`
  - Subtle: `border border-border/50`
  - Hover: `hover:border-border` (transition)

## Accessibilité

### Contraste

- Tous les textes respectent WCAG AA minimum
- `muted-foreground` : 46% luminosité (light), 80% (dark) pour un bon contraste
- Vérifier avec un outil (axe DevTools) avant d'ajouter de nouvelles couleurs

### Focus States

- Tous les éléments interactifs ont un focus state visible
- Utiliser `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Couleur de focus : `hsl(var(--ring))`

## Dark Mode

Tous les tokens ont des valeurs différentes pour le dark mode définies dans `.dark { ... }`.

Le dark mode est activé via la classe `dark` sur l'élément `html`.

