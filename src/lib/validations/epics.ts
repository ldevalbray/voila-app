import { z } from 'zod'
import { uuidSchema } from './tasks'

// Epic status enum
export const epicStatusSchema = z.enum(['open', 'in_progress', 'done', 'archived'])

// Create epic input schema
export const createEpicSchema = z.object({
  project_id: uuidSchema,
  title: z.string().min(1, 'Le titre est requis').max(500, 'Le titre est trop long'),
  description: z.string().max(10000, 'La description est trop longue').nullable().optional(),
  status: epicStatusSchema,
})

// Update epic input schema
export const updateEpicSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1, 'Le titre est requis').max(500, 'Le titre est trop long').optional(),
  description: z.string().max(10000, 'La description est trop longue').nullable().optional(),
  status: epicStatusSchema.optional(),
})

// Delete epic input schema
export const deleteEpicSchema = z.object({
  epicId: uuidSchema,
})

