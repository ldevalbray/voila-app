'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import {
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
} from '@/lib/validations/tasks'
import { checkInternalProjectRole } from '@/lib/auth-helpers'
import { defaultRateLimiter } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export interface CreateTaskInput {
  project_id: string
  epic_id?: string | null
  sprint_id?: string | null
  title: string
  description?: string | null
  type: 'bug' | 'new_feature' | 'improvement'
  status: 'todo' | 'in_progress' | 'blocked' | 'waiting_for_client' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimate_bucket?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | null
  is_client_visible: boolean
}

export interface UpdateTaskInput {
  id: string
  epic_id?: string | null
  sprint_id?: string | null
  title?: string
  description?: string | null
  type?: 'bug' | 'new_feature' | 'improvement'
  status?: 'todo' | 'in_progress' | 'blocked' | 'waiting_for_client' | 'done'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  estimate_bucket?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | null
  is_client_visible?: boolean
}

/**
 * Crée une nouvelle tâche
 */
export async function createTask(input: CreateTaskInput) {
  try {
    const t = await getTranslations('common')
    
    // Validation avec Zod
    const validationResult = createTaskSchema.safeParse(input)
    if (!validationResult.success) {
      logger.warn('Invalid task creation input', {
        issues: validationResult.error.issues,
      })
      return {
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      }
    }

    const validatedInput = validationResult.data

    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      logger.warn('Unauthenticated task creation attempt')
      return { error: t('error') }
    }

    // Rate limiting
    const rateLimitResult = await defaultRateLimiter(`task:create:${session.user.id}`)
    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for task creation', {
        userId: session.user.id,
        retryAfter: rateLimitResult.retryAfter,
      })
      return {
        error: `Rate limit exceeded. Please try again in ${rateLimitResult.retryAfter} seconds.`,
      }
    }

    // Vérification d'autorisation explicite
    const { hasAccess } = await checkInternalProjectRole(validatedInput.project_id)
    if (!hasAccess) {
      return { error: 'Unauthorized: You do not have permission to create tasks in this project' }
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: validatedInput.project_id,
        epic_id: validatedInput.epic_id || null,
        sprint_id: validatedInput.sprint_id || null,
        title: validatedInput.title,
        description: validatedInput.description || null,
        type: validatedInput.type,
        status: validatedInput.status,
        priority: validatedInput.priority,
        estimate_bucket: validatedInput.estimate_bucket || null,
        is_client_visible: validatedInput.is_client_visible,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating task', error, {
        projectId: validatedInput.project_id,
        userId: session.user.id,
      })
      return { error: error.message }
    }

    logger.info('Task created successfully', {
      taskId: data.id,
      projectId: validatedInput.project_id,
      userId: session.user.id,
    })

    revalidatePath(`/app/projects/${validatedInput.project_id}/tasks`)
    revalidatePath(`/app/projects/${validatedInput.project_id}/overview`)

    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error in createTask', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

/**
 * Met à jour une tâche existante
 */
export async function updateTask(input: UpdateTaskInput) {
  try {
    const t = await getTranslations('common')
    
    // Validation avec Zod
    const validationResult = updateTaskSchema.safeParse(input)
    if (!validationResult.success) {
      return {
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      }
    }

    const validatedInput = validationResult.data

    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    // Récupérer le project_id pour vérification d'autorisation
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', validatedInput.id)
      .single()

    if (taskError || !task) {
      return { error: 'Task not found' }
    }

    // Vérification d'autorisation explicite
    const { hasAccess } = await checkInternalProjectRole(task.project_id)
    if (!hasAccess) {
      return { error: 'Unauthorized: You do not have permission to update tasks in this project' }
    }

    const updateData: any = {
      updated_by: session.user.id,
    }

    if (validatedInput.epic_id !== undefined) updateData.epic_id = validatedInput.epic_id
    if (validatedInput.sprint_id !== undefined) updateData.sprint_id = validatedInput.sprint_id
    if (validatedInput.title !== undefined) updateData.title = validatedInput.title
    if (validatedInput.description !== undefined) updateData.description = validatedInput.description
    if (validatedInput.type !== undefined) updateData.type = validatedInput.type
    if (validatedInput.status !== undefined) updateData.status = validatedInput.status
    if (validatedInput.priority !== undefined) updateData.priority = validatedInput.priority
    if (validatedInput.estimate_bucket !== undefined) updateData.estimate_bucket = validatedInput.estimate_bucket
    if (validatedInput.is_client_visible !== undefined) updateData.is_client_visible = validatedInput.is_client_visible

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', validatedInput.id)
      .select()
      .single()

    if (task) {
      revalidatePath(`/app/projects/${task.project_id}/tasks`)
      revalidatePath(`/app/projects/${task.project_id}/overview`)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in updateTask:', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

/**
 * Supprime une tâche
 */
export async function deleteTask(taskId: string) {
  try {
    const t = await getTranslations('common')
    
    // Validation avec Zod
    const validationResult = deleteTaskSchema.safeParse({ taskId })
    if (!validationResult.success) {
      return {
        error: validationResult.error.issues.map((e) => e.message).join(', '),
      }
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    // Récupérer le project_id avant suppression pour vérification d'autorisation
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return { error: 'Task not found' }
    }

    // Vérification d'autorisation explicite
    const { hasAccess } = await checkInternalProjectRole(task.project_id)
    if (!hasAccess) {
      return { error: 'Unauthorized: You do not have permission to delete tasks in this project' }
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error('Error deleting task:', error)
      return { error: error.message }
    }

    if (task) {
      revalidatePath(`/app/projects/${task.project_id}/tasks`)
      revalidatePath(`/app/projects/${task.project_id}/overview`)
    }

    return { error: null }
  } catch (error) {
    console.error('Unexpected error in deleteTask:', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

/**
 * Récupère les tâches du backlog pour un projet (action serveur)
 * Backlog = tâches avec sprint_id IS NULL et status != 'done'
 */
export async function getBacklogTasksAction(projectId: string) {
  try {
    const { getBacklogTasks } = await import('@/lib/tasks')
    const tasks = await getBacklogTasks(projectId)
    return { data: tasks, error: null }
  } catch (error) {
    const t = await getTranslations('common')
    console.error('Error in getBacklogTasksAction:', error)
    return { data: [], error: t('error') }
  }
}

