/**
 * Configuration centralisée pour la navigation
 * Utilisée par Sidebar pour afficher les items de navigation
 */

import {
  Home,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  Layers,
  Clock,
  Receipt,
  StickyNote,
  Files,
  Settings,
} from 'lucide-react'

export interface NavItemConfig {
  href: string
  label: string
  exact?: boolean
  icon?: React.ReactNode
}

export interface NavigationConfig {
  global: {
    internal: NavItemConfig[]
    client: NavItemConfig[]
  }
  project: {
    internal: NavItemConfig[]
    client: NavItemConfig[]
  }
}

/**
 * Navigation globale (Internal mode)
 */
export const globalNavInternal: NavItemConfig[] = [
  { href: '/app', label: 'Home', exact: true, icon: <Home className="h-4 w-4" /> },
  { href: '/app/tasks', label: 'My tasks', icon: <CheckSquare className="h-4 w-4" /> },
  { href: '/app/projects', label: 'Projects', icon: <FolderKanban className="h-4 w-4" /> },
]

/**
 * Navigation globale (Client mode)
 */
export const globalNavClient: NavItemConfig[] = [
  { href: '/portal', label: 'Home', exact: true, icon: <Home className="h-4 w-4" /> },
  { href: '/portal/projects', label: 'Projects', icon: <FolderKanban className="h-4 w-4" /> },
]

/**
 * Navigation projet (Internal mode)
 */
export function getProjectNavInternal(projectId: string, basePath: '/app' | '/portal'): NavItemConfig[] {
  return [
    { href: `${basePath}/projects/${projectId}/overview`, label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/tasks`, label: 'Tasks', icon: <CheckSquare className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/epics`, label: 'Epics', icon: <Layers className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/time`, label: 'Time', icon: <Clock className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/invoices`, label: 'Invoices', icon: <Receipt className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/notes`, label: 'Notes', icon: <StickyNote className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/documents`, label: 'Documents', icon: <Files className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/settings`, label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ]
}

/**
 * Navigation projet (Client mode)
 */
export function getProjectNavClient(projectId: string, basePath: '/app' | '/portal'): NavItemConfig[] {
  return [
    { href: `${basePath}/projects/${projectId}/overview`, label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/tasks`, label: 'Tasks', icon: <CheckSquare className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/notes`, label: 'Notes', icon: <StickyNote className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/documents`, label: 'Documents', icon: <Files className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/invoices`, label: 'Invoices', icon: <Receipt className="h-4 w-4" /> },
  ]
}

/**
 * Fonction helper pour obtenir la navigation selon le mode
 */
export function getNavigationConfig(
  mode: 'internal' | 'client',
  basePath: '/app' | '/portal'
): {
  global: NavItemConfig[]
  getProject: (projectId: string) => NavItemConfig[]
} {
  return {
    global: mode === 'internal' ? globalNavInternal : globalNavClient,
    getProject: (projectId: string) =>
      mode === 'internal'
        ? getProjectNavInternal(projectId, basePath)
        : getProjectNavClient(projectId, basePath),
  }
}

