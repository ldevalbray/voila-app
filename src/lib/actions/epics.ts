'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'

export interface CreateEpicInput {
  project_id: string
  title: string
  description?: string | null
  status?: 'open' | 'in_progress' | 'done' | 'archived'
}

export interface UpdateEpicInput {
  id: string
  title?: string
  description?: string | null
  status?: 'open' | 'in_progress' | 'done' | 'archived'
}

/**
 * Crée un nouvel epic
 */
export async function createEpic(input: CreateEpicInput) {
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
      .from('epics')
      .insert({
        project_id: input.project_id,
        title: input.title,
        description: input.description || null,
        status: input.status || 'open',
        created_by: session.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating epic:', error)
      return { error: error.message }
    }

    revalidatePath(`/app/projects/${input.project_id}/epics`)
    revalidatePath(`/app/projects/${input.project_id}/overview`)

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in createEpic:', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

/**
 * Met à jour un epic existant
 */
export async function updateEpic(input: UpdateEpicInput) {
  try {
    const t = await getTranslations('common')
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { error: t('error') }
    }

    const updateData: any = {}

    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.status !== undefined) updateData.status = input.status

    const { data, error } = await supabase
      .from('epics')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating epic:', error)
      return { error: error.message }
    }

    // Récupérer le project_id pour revalidation
    const { data: epic } = await supabase
      .from('epics')
      .select('project_id')
      .eq('id', input.id)
      .single()

    if (epic) {
      revalidatePath(`/app/projects/${epic.project_id}/epics`)
      revalidatePath(`/app/projects/${epic.project_id}/overview`)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in updateEpic:', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

/**
 * Supprime un epic
 */
export async function deleteEpic(epicId: string) {
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
    const { data: epic } = await supabase
      .from('epics')
      .select('project_id')
      .eq('id', epicId)
      .single()

    const { error } = await supabase
      .from('epics')
      .delete()
      .eq('id', epicId)

    if (error) {
      console.error('Error deleting epic:', error)
      return { error: error.message }
    }

    if (epic) {
      revalidatePath(`/app/projects/${epic.project_id}/epics`)
      revalidatePath(`/app/projects/${epic.project_id}/overview`)
    }

    return { error: null }
  } catch (error) {
    console.error('Unexpected error in deleteEpic:', error)
    const t = await getTranslations('common')
    return { error: t('error') }
  }
}

