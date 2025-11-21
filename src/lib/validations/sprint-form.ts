import { z } from 'zod'
import { sprintStatusSchema } from './sprints'

// Date validation (YYYY-MM-DD format)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').nullable().optional()

// Form schema for SprintForm (client-side, without project_id)
export const sprintFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200, 'Le nom est trop long (max 200 caractères)'),
  goal: z.string().max(2000, 'L\'objectif est trop long (max 2000 caractères)').nullable().optional(),
  status: sprintStatusSchema,
  start_date: dateSchema,
  end_date: dateSchema,
}).refine((data) => {
  // Si les deux dates sont présentes, end_date doit être après start_date
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) >= new Date(data.start_date)
  }
  return true
}, {
  message: 'La date de fin doit être postérieure à la date de début',
  path: ['end_date'],
})

export type SprintFormValues = z.infer<typeof sprintFormSchema>

