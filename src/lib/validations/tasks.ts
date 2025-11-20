import { z } from 'zod'

// Task type enum
export const taskTypeSchema = z.enum(['bug', 'new_feature', 'improvement'])

// Task status enum
export const taskStatusSchema = z.enum([
  'todo',
  'in_progress',
  'blocked',
  'waiting_for_client',
  'done',
])

// Task priority enum
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

// Task estimate bucket enum
export const taskEstimateBucketSchema = z.enum([
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
])

// UUID validation schema
export const uuidSchema = z.string().uuid('Invalid UUID format')

// Create task input schema
export const createTaskSchema = z.object({
  project_id: uuidSchema,
  epic_id: uuidSchema.nullable().optional(),
  sprint_id: uuidSchema.nullable().optional(),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  description: z.string().max(10000, 'Description too long').nullable().optional(),
  type: taskTypeSchema,
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  estimate_bucket: taskEstimateBucketSchema.nullable().optional(),
  is_client_visible: z.boolean(),
})

// Update task input schema
export const updateTaskSchema = z.object({
  id: uuidSchema,
  epic_id: uuidSchema.nullable().optional(),
  sprint_id: uuidSchema.nullable().optional(),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long').optional(),
  description: z.string().max(10000, 'Description too long').nullable().optional(),
  type: taskTypeSchema.optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  estimate_bucket: taskEstimateBucketSchema.nullable().optional(),
  is_client_visible: z.boolean().optional(),
})

// Delete task input schema
export const deleteTaskSchema = z.object({
  taskId: uuidSchema,
})

