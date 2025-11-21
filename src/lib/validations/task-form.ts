import { z } from 'zod'
import { taskTypeSchema, taskStatusSchema, taskPrioritySchema, taskEstimateBucketSchema } from './tasks'

// UUID validation schema (nullable for optional fields)
// Accepte string UUID, null, ou undefined
const nullableUuidSchema = z
  .union([z.string().uuid('Format UUID invalide'), z.null()])
  .optional()

// Form schema for TaskForm (client-side, without project_id)
export const taskFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(500, 'Le titre est trop long (max 500 caractères)'),
  description: z.string().max(10000, 'La description est trop longue (max 10000 caractères)').nullable().optional(),
  type: taskTypeSchema,
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  estimate_bucket: taskEstimateBucketSchema.nullable().optional(),
  epic_id: nullableUuidSchema,
  sprint_id: nullableUuidSchema,
  is_client_visible: z.boolean(),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
