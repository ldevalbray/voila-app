'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import type { TimeEntryCategory } from '@/lib/time-entries'

export interface CreateTimeEntryInput {
  project_id: string
  task_id?: string | null
  category: TimeEntryCategory
  duration_minutes: number
  date: string
  notes?: string | null
}

export interface UpdateTimeEntryInput {
  id: string
  task_id?: string | null
  category?: TimeEntryCategory
  duration_minutes?: number
  date?: string
  notes?: string | null
}

/**
 * Crée une nouvelle entrée de temps
 */
export async function createTimeEntry(input: CreateTimeEntryInput) {
  try {
    const t = await getTranslations('common')
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    // Vérifier que task_id et project_id sont cohérents si task_id est fourni
    if (input.task_id) {
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('project_id')
        .eq('id', input.task_id)
        .single()

      if (taskError || !task) {
        return { error: 'Task not found' }
      }

      if (task.project_id !== input.project_id) {
        return { error: 'Task does not belong to the specified project' }
      }
    }

    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        project_id: input.project_id,
        task_id: input.task_id || null,
        user_id: session.user.id,
        category: input.category,
        duration_minutes: input.duration_minutes,
        date: input.date,
        notes: input.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating time entry:', error)
      return { error: error.message }
    }

    // Revalider les chemins pertinents
    revalidatePath(`/app/my-time`)
    revalidatePath(`/app/projects/${input.project_id}/time`)
    if (input.task_id) {
      revalidatePath(`/app/projects/${input.project_id}/tasks`)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in createTimeEntry:', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

/**
 * Met à jour une entrée de temps existante
 */
export async function updateTimeEntry(input: UpdateTimeEntryInput) {
  try {
    const t = await getTranslations('common')
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    // Récupérer l'entrée existante pour vérifier les permissions et récupérer project_id
    const { data: existingEntry, error: fetchError } = await supabase
      .from('time_entries')
      .select('project_id, task_id')
      .eq('id', input.id)
      .single()

    if (fetchError || !existingEntry) {
      return { error: 'Time entry not found' }
    }

    // Vérifier la cohérence task_id / project_id si task_id est modifié
    if (input.task_id !== undefined && input.task_id !== existingEntry.task_id) {
      if (input.task_id) {
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .select('project_id')
          .eq('id', input.task_id)
          .single()

        if (taskError || !task) {
          return { error: 'Task not found' }
        }

        if (task.project_id !== existingEntry.project_id) {
          return { error: 'Task does not belong to the project' }
        }
      }
    }

    const updateData: any = {}

    if (input.task_id !== undefined) updateData.task_id = input.task_id
    if (input.category !== undefined) updateData.category = input.category
    if (input.duration_minutes !== undefined)
      updateData.duration_minutes = input.duration_minutes
    if (input.date !== undefined) updateData.date = input.date
    if (input.notes !== undefined) updateData.notes = input.notes

    const { data, error } = await supabase
      .from('time_entries')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating time entry:', error)
      return { error: error.message }
    }

    // Revalider les chemins pertinents
    revalidatePath(`/app/my-time`)
    revalidatePath(`/app/projects/${existingEntry.project_id}/time`)
    if (existingEntry.task_id || input.task_id) {
      revalidatePath(`/app/projects/${existingEntry.project_id}/tasks`)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in updateTimeEntry:', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

/**
 * Récupère le temps total (en minutes) pour une tâche
 */
export async function getTotalTimeByTaskId(taskId: string) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { data: 0, error: null }
    }

    const { data, error } = await supabase
      .from('time_entries')
      .select('duration_minutes')
      .eq('task_id', taskId)

    if (error) {
      console.error('Error fetching total time:', error)
      return { data: 0, error: null }
    }

    if (!data || data.length === 0) {
      return { data: 0, error: null }
    }

    const total = data.reduce((sum, entry) => sum + entry.duration_minutes, 0)
    return { data: total, error: null }
  } catch (error) {
    console.error('Unexpected error in getTotalTimeByTaskId:', error)
    return { data: 0, error: null }
  }
}

/**
 * Supprime une entrée de temps
 */
export async function deleteTimeEntry(timeEntryId: string) {
  try {
    const t = await getTranslations('common')
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    // Récupérer le project_id et task_id avant suppression
    const { data: entry } = await supabase
      .from('time_entries')
      .select('project_id, task_id')
      .eq('id', timeEntryId)
      .single()

    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', timeEntryId)

    if (error) {
      console.error('Error deleting time entry:', error)
      return { error: error.message }
    }

    // Revalider les chemins pertinents
    if (entry) {
      revalidatePath(`/app/my-time`)
      revalidatePath(`/app/projects/${entry.project_id}/time`)
      if (entry.task_id) {
        revalidatePath(`/app/projects/${entry.project_id}/tasks`)
      }
    }

    return { error: null }
  } catch (error) {
    console.error('Unexpected error in deleteTimeEntry:', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

