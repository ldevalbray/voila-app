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
  Settings as SettingsIcon,
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
export function getGlobalNavInternal(t: (key: string) => string): NavItemConfig[] {
  return [
    { href: '/app', label: t('home'), exact: true, icon: <Home className="h-4 w-4" /> },
    { href: '/app/tasks', label: t('myTasks'), icon: <CheckSquare className="h-4 w-4" /> },
    { href: '/app/my-time', label: t('myTime'), icon: <Clock className="h-4 w-4" /> },
    { href: '/app/projects', label: t('projects'), icon: <FolderKanban className="h-4 w-4" /> },
  ]
}

/**
 * Navigation globale (Client mode)
 */
export function getGlobalNavClient(t: (key: string) => string): NavItemConfig[] {
  return [
    { href: '/portal', label: t('home'), exact: true, icon: <Home className="h-4 w-4" /> },
    { href: '/portal/projects', label: t('projects'), icon: <FolderKanban className="h-4 w-4" /> },
  ]
}

/**
 * Navigation projet (Internal mode)
 */
export function getProjectNavInternal(
  projectId: string,
  basePath: '/app' | '/portal',
  t: (key: string) => string
): NavItemConfig[] {
  return [
    { href: `${basePath}/projects/${projectId}/overview`, label: t('overview'), icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/tasks`, label: t('tasks'), icon: <CheckSquare className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/epics`, label: t('epicsAndSprints'), icon: <Layers className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/time`, label: t('time'), icon: <Clock className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/invoices`, label: t('invoices'), icon: <Receipt className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/notes`, label: t('notes'), icon: <StickyNote className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/documents`, label: t('documents'), icon: <Files className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/settings`, label: t('settings'), icon: <SettingsIcon className="h-4 w-4" /> },
  ]
}

/**
 * Navigation projet (Client mode)
 */
export function getProjectNavClient(
  projectId: string,
  basePath: '/app' | '/portal',
  t: (key: string) => string
): NavItemConfig[] {
  return [
    { href: `${basePath}/projects/${projectId}/overview`, label: t('overview'), icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/tasks`, label: t('tasks'), icon: <CheckSquare className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/notes`, label: t('notes'), icon: <StickyNote className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/documents`, label: t('documents'), icon: <Files className="h-4 w-4" /> },
    { href: `${basePath}/projects/${projectId}/invoices`, label: t('invoices'), icon: <Receipt className="h-4 w-4" /> },
  ]
}

/**
 * Fonction helper pour obtenir la navigation selon le mode
 */
export function getNavigationConfig(
  mode: 'internal' | 'client',
  basePath: '/app' | '/portal',
  t: (key: string) => string
): {
  global: NavItemConfig[]
  getProject: (projectId: string) => NavItemConfig[]
} {
  return {
    global: mode === 'internal' ? getGlobalNavInternal(t) : getGlobalNavClient(t),
    getProject: (projectId: string) =>
      mode === 'internal'
        ? getProjectNavInternal(projectId, basePath, t)
        : getProjectNavClient(projectId, basePath, t),
  }
}

