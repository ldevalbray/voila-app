'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'

export interface CreateSprintInput {
  project_id: string
  name: string
  goal?: string | null
  status?: 'planned' | 'active' | 'completed' | 'cancelled' | 'archived'
  start_date?: string | null
  end_date?: string | null
  sort_index?: number | null
}

export interface UpdateSprintInput {
  id: string
  name?: string
  goal?: string | null
  status?: 'planned' | 'active' | 'completed' | 'cancelled' | 'archived'
  start_date?: string | null
  end_date?: string | null
  sort_index?: number | null
}

/**
 * Crée un nouveau sprint
 */
export async function createSprint(input: CreateSprintInput) {
  try {
    const t = await getTranslations('common')
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    // Si le sprint est actif, désactiver les autres sprints actifs du projet
    if (input.status === 'active') {
      await supabase
        .from('sprints')
        .update({ status: 'planned' })
        .eq('project_id', input.project_id)
        .eq('status', 'active')
    }

    const { data, error } = await supabase
      .from('sprints')
      .insert({
        project_id: input.project_id,
        name: input.name,
        goal: input.goal || null,
        status: input.status || 'planned',
        start_date: input.start_date || null,
        end_date: input.end_date || null,
        sort_index: input.sort_index || null,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating sprint:', error)
      return { error: error.message }
    }

    revalidatePath(`/app/projects/${input.project_id}/epics`)
    revalidatePath(`/app/projects/${input.project_id}/overview`)

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in createSprint:', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

/**
 * Met à jour un sprint existant
 */
export async function updateSprint(input: UpdateSprintInput) {
  try {
    const t = await getTranslations('common')
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    // Si le sprint devient actif, désactiver les autres sprints actifs du projet
    if (input.status === 'active') {
      const { data: sprint } = await supabase
        .from('sprints')
        .select('project_id')
        .eq('id', input.id)
        .single()

      if (sprint) {
        await supabase
          .from('sprints')
          .update({ status: 'planned' })
          .eq('project_id', sprint.project_id)
          .eq('status', 'active')
          .neq('id', input.id)
      }
    }

    const updateData: any = {}

    if (input.name !== undefined) updateData.name = input.name
    if (input.goal !== undefined) updateData.goal = input.goal
    if (input.status !== undefined) updateData.status = input.status
    if (input.start_date !== undefined) updateData.start_date = input.start_date
    if (input.end_date !== undefined) updateData.end_date = input.end_date
    if (input.sort_index !== undefined) updateData.sort_index = input.sort_index

    const { data, error } = await supabase
      .from('sprints')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating sprint:', error)
      return { error: error.message }
    }

    // Récupérer le project_id pour revalidation
    const { data: sprint } = await supabase
      .from('sprints')
      .select('project_id')
      .eq('id', input.id)
      .single()

    if (sprint) {
      revalidatePath(`/app/projects/${sprint.project_id}/epics`)
      revalidatePath(`/app/projects/${sprint.project_id}/overview`)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in updateSprint:', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

/**
 * Supprime un sprint
 */
export async function deleteSprint(sprintId: string) {
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
    const { data: sprint } = await supabase
      .from('sprints')
      .select('project_id')
      .eq('id', sprintId)
      .single()

    const { error } = await supabase
      .from('sprints')
      .delete()
      .eq('id', sprintId)

    if (error) {
      console.error('Error deleting sprint:', error)
      return { error: error.message }
    }

    if (sprint) {
      revalidatePath(`/app/projects/${sprint.project_id}/epics`)
      revalidatePath(`/app/projects/${sprint.project_id}/overview`)
    }

    return { error: null }
  } catch (error) {
    console.error('Unexpected error in deleteSprint:', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

