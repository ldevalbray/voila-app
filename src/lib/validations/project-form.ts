import { z } from 'zod'

// UUID validation schema (nullable for optional fields)
const nullableUuidSchema = z
  .union([z.string().uuid('Format UUID invalide'), z.null()])
  .optional()

// Status schema for projects
const projectStatusSchema = z.enum(['active', 'on_hold', 'completed', 'archived'], {
  errorMap: () => ({ message: 'Statut invalide' }),
})

// Form schema for ProjectForm (client-side)
export const projectFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(500, 'Le nom est trop long (max 500 caractères)'),
  description: z.string().max(10000, 'La description est trop longue (max 10000 caractères)').nullable().optional(),
  status: projectStatusSchema,
  client_id: nullableUuidSchema,
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>

