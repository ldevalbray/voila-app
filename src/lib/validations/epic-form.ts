import { z } from 'zod'
import { epicStatusSchema } from './epics'

// Form schema for EpicForm (client-side, without project_id)
export const epicFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(500, 'Le titre est trop long (max 500 caractères)'),
  description: z.string().max(10000, 'La description est trop longue (max 10000 caractères)').nullable().optional(),
  status: epicStatusSchema,
})

export type EpicFormValues = z.infer<typeof epicFormSchema>

