'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'

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
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: input.project_id,
        epic_id: input.epic_id || null,
        sprint_id: input.sprint_id || null,
        title: input.title,
        description: input.description || null,
        type: input.type,
        status: input.status,
        priority: input.priority,
        estimate_bucket: input.estimate_bucket || null,
        is_client_visible: input.is_client_visible,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return { error: error.message }
    }

    revalidatePath(`/app/projects/${input.project_id}/tasks`)
    revalidatePath(`/app/projects/${input.project_id}/overview`)

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in createTask:', error)
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
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    const updateData: any = {
      updated_by: session.user.id,
    }

    if (input.epic_id !== undefined) updateData.epic_id = input.epic_id
    if (input.sprint_id !== undefined) updateData.sprint_id = input.sprint_id
    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.type !== undefined) updateData.type = input.type
    if (input.status !== undefined) updateData.status = input.status
    if (input.priority !== undefined) updateData.priority = input.priority
    if (input.estimate_bucket !== undefined) updateData.estimate_bucket = input.estimate_bucket
    if (input.is_client_visible !== undefined) updateData.is_client_visible = input.is_client_visible

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return { error: error.message }
    }

    // Récupérer le project_id pour revalidation
    const { data: task } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', input.id)
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
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    // Récupérer le project_id avant suppression
    const { data: task } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', taskId)
      .single()

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

