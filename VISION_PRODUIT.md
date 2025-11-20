# Voila.app — Product Vision Reference

This document captures the global vision, product principles, and architectural guardrails that guide Voila.app.  
It serves as the north star for designers, engineers, and product contributors when evaluating scope decisions or onboarding new collaborators.

## 1. Mission & Target Users

- **Audience**: freelance collectives, individual freelancers, and solo operators who collaborate with changing partners or clients on a project basis.
- **Core promise**: a project-centric cockpit that lets people assemble the right collaborators per project, keep client communication clean, and run time/budget tracking without heavy “tenant” constructs.

## 2. Dual Experiences

| Experience | Audience | Capabilities |
|------------|----------|--------------|
| **Internal App (`app`)** | freelancers, internal teammates | full project cockpit (epics, sprints, tasks, time, billing, notes, documents, members, settings). Access à toutes les données internes + outils d’orchestration. |
| **Client Portal (`portal`)** | client-side users (`project_client`) | vue restreinte : uniquement contenu flaggé `is_client_visible`, indicateurs temps/budget simplifiés, factures du projet. Aucun accès aux tâches internes, commentaires privés ou réglages projet. |

A single user can be internal on some projects and a client on others. Access is always scoped by **project memberships**.

## 3. Product Principles

- **Project-centric model**: projects are the primary scope, with memberships defining per-project roles (`project_admin`, `project_participant`, `project_client`).
- **Structured work hierarchy**: Projects → Epics → Tasks, with Sprints as project-level time boxes. Tasks can belong to both an epic and a sprint (or none).
- **Visibility flags**: any task/note/document can be marked `is_client_visible` to surface (or hide) information in the client portal.
- **Navigation cohérente**: un **project switcher global** permet de conserver le type de vue lors d’un changement de projet (ex. rester sur Tasks quand on passe du projet A au projet B). La navigation interne se recentre toujours sur le contexte projet.
- **Future-ready UX**: task details should open in side panels; data-heavy views need filtering/search roadmaps; realtime collaboration is a future addition but should not be blocked.
- **i18n posture**: copy should be centralized to ease later localization. Default language is English.

## 4. Technical Stack & Architecture

- **Frontend**: Next.js 14+ (App Router), TypeScript strict mode.
- **UI components**: Supabase UI first; fall back to shadcn/ui when needed. Wrap shared primitives in `components/ui/` (e.g., `AppButton`, `AppSheet`) to keep styling consistent.
- **Styling**: Tailwind CSS across Supabase UI and shadcn primitives.
- **Backend & data**: Supabase (PostgreSQL, Auth, Storage) with Row Level Security (RLS) for all project data.
- **Forms & validation**: React Hook Form + Zod (client) plus server-side validation.
- **Deployment**: Vercel for the Next.js app; Supabase for backend services.
- **Project layout** (high-level):
  - `app/(marketing)/` public site
  - `app/(auth)/` auth flows
  - `app/(app)/` internal workspace
  - `app/(portal)/` client portal
  - `components/ui/`, `components/layout/`, `components/{domain}` for reusable pieces
  - `lib/` (supabase client, auth, db helpers), `types/`, `styles/`, `scripts/`

## 5. Security & Access Guardrails

- **Authentication**: Supabase Auth (email/password by default). All `(app)` and `(portal)` routes require authentication; unauthenticated users are redirected to login. Authenticated users hitting `/` get redirected to `/app`.
- **Authorization**: RLS policies ensure users only see data for projects they belong to. Client users only retrieve `is_client_visible` records plus limited project metrics.
- **Secrets**: never embed secrets in client bundles; use environment variables managed via Vercel/Supabase.
- **Validation**: enforce Zod schemas on inputs and replicate critical checks server-side.

## 6. Conceptual Data Model (summary)

- **Users**: profiles on top of `auth.users` (name, avatar, timestamps).
- **Organizations**: client companies; projects may reference one.
- **Projects**: central entity with status, creator, optional organization.
- **Project memberships**: join table with per-project role and future notification prefs; base for RLS.
- **Epics**: project-scoped thematic workstreams.
- **Sprints**: project-scoped time boxes; one may be “active”.
- **Tasks**: belong to a project (plus optional epic/sprint), include type, status, priority, estimation bucket (XS → XXL), assignees, tags, description, `is_client_visible`.
- **Time entries**: user/project/scopes with date, duration (minutes), billable flag, category, optional task/sprint linkage.
- **Billing & invoices**: support time-based (linked to time entries) and fixed-fee modes; track amount, currency, status. Les factures T&M référencent un ensemble d’entrées de temps pour permettre le calcul de ratios/marges; les factures forfaitaires doivent quand même pouvoir être rapprochées du temps réel pour l’analyse.
- **Notes & documents**: project-scoped, optionally linked to sprints/tasks, with `is_client_visible`.
- **Comments & notifications**: task comments with mentions; notification feed for mentions, assignments, etc. Les préférences de notification (mentions, assignations, événements critiques) sont stockées sur les memberships pour rester compatibles avec la RLS.

Exact schema, enums, migrations, and RLS policies will be defined per implementation step.

## 7. Navigation & Client Portal Guardrails

- **Global project switcher**: accessible depuis toutes les vues internes, il conserve le type de page quand on change de projet (Tasks → Tasks, Time → Time) et évite de “perdre” le contexte utilisateur.
- **Context persistence**: filtres clés (sprint actif, epic sélectionnée) doivent être conservés lors d’un changement de route au sein d’un même projet pour éviter des rechargements inutiles.
- **Client portal visibility**: seules les entités flaggées `is_client_visible` sont synchronisées vers `(portal)`. Les commentaires internes, documents non partagés, métriques sensibles ou réglages projet sont exclus par défaut.
- **Client KPIs**: exposer des indicateurs “digestes” (progression globale, temps consommé vs budget, statut des factures) sans fuite d’infos internes.
- **Future realtime/i18n readiness**: centraliser les chaînes de texte utilisées des deux côtés (app/portal) et éviter des patterns empêchant l’ajout de Supabase Realtime (ex. couches d’accès sans événements).

## 8. Delivery Principles

1. Each implementation prompt follows: **plan (3–5 bullets) → code/migrations → recap (changes, assumptions, open questions)**.
2. Ask clarifying questions only when a choice has major architectural impact; otherwise, make a reasonable assumption and document it.
3. Keep UI components reusable and composable; avoid scattering business copy to stay i18n-ready.
4. Leave room for realtime features (e.g., avoid patterns that prevent Supabase Realtime subscriptions later).

## 9. Next Steps

This README is a living artifact—update it when product decisions evolve (new roles, data entities, UX pillars, etc.).  
Concrete implementation tracks (e.g., “Step 1 – Auth & basic schema”) will link back here to ensure changes stay aligned with the global vision.


