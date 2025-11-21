import { z } from 'zod'
import { uuidSchema } from './tasks'

// Sprint status enum
export const sprintStatusSchema = z.enum(['planned', 'active', 'completed', 'cancelled', 'archived'])

// Date validation (YYYY-MM-DD format)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').nullable().optional()

// Create sprint input schema
export const createSprintSchema = z.object({
  project_id: uuidSchema,
  name: z.string().min(1, 'Le nom est requis').max(200, 'Le nom est trop long'),
  goal: z.string().max(2000, 'L\'objectif est trop long').nullable().optional(),
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

// Update sprint input schema
export const updateSprintSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1, 'Le nom est requis').max(200, 'Le nom est trop long').optional(),
  goal: z.string().max(2000, 'L\'objectif est trop long').nullable().optional(),
  status: sprintStatusSchema.optional(),
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

// Delete sprint input schema
export const deleteSprintSchema = z.object({
  sprintId: uuidSchema,
})

