/**
 * Configuration centralisée pour la navigation
 * Utilisée par Sidebar pour afficher les items de navigation
 */

import { Settings } from 'lucide-react'

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
  { href: '/app', label: 'Home', exact: true },
  { href: '/app/tasks', label: 'My tasks' },
  { href: '/app/projects', label: 'Projects' },
]

/**
 * Navigation globale (Client mode)
 */
export const globalNavClient: NavItemConfig[] = [
  { href: '/portal', label: 'Home', exact: true },
  { href: '/portal/projects', label: 'Projects' },
]

/**
 * Navigation projet (Internal mode)
 */
export function getProjectNavInternal(projectId: string, basePath: '/app' | '/portal'): NavItemConfig[] {
  return [
    { href: `${basePath}/projects/${projectId}/overview`, label: 'Overview' },
    { href: `${basePath}/projects/${projectId}/tasks`, label: 'Tasks' },
    { href: `${basePath}/projects/${projectId}/epics`, label: 'Epics' },
    { href: `${basePath}/projects/${projectId}/time`, label: 'Time' },
    { href: `${basePath}/projects/${projectId}/invoices`, label: 'Invoices' },
    { href: `${basePath}/projects/${projectId}/notes`, label: 'Notes' },
    { href: `${basePath}/projects/${projectId}/documents`, label: 'Documents' },
    { href: `${basePath}/projects/${projectId}/settings`, label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ]
}

/**
 * Navigation projet (Client mode)
 */
export function getProjectNavClient(projectId: string, basePath: '/app' | '/portal'): NavItemConfig[] {
  return [
    { href: `${basePath}/projects/${projectId}/overview`, label: 'Overview' },
    { href: `${basePath}/projects/${projectId}/tasks`, label: 'Tasks' },
    { href: `${basePath}/projects/${projectId}/notes`, label: 'Notes' },
    { href: `${basePath}/projects/${projectId}/documents`, label: 'Documents' },
    { href: `${basePath}/projects/${projectId}/invoices`, label: 'Invoices' },
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

