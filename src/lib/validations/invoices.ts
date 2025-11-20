import { z } from 'zod'

// Invoice status enum
export const invoiceStatusSchema = z.enum([
  'draft',
  'sent',
  'paid',
  'cancelled',
])

// UUID validation schema
export const uuidSchema = z.string().uuid('Invalid UUID format')

// Date string validation (YYYY-MM-DD format)
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

// Currency code validation (ISO 4217, 3 letters)
export const currencySchema = z
  .string()
  .length(3, 'Currency must be a 3-letter ISO code')
  .regex(/^[A-Z]{3}$/, 'Currency must be uppercase letters only')

// Create invoice input schema
export const createInvoiceSchema = z.object({
  project_id: uuidSchema,
  client_id: uuidSchema,
  label: z.string().min(1, 'Label is required').max(500, 'Label too long'),
  status: invoiceStatusSchema.optional(),
  currency: currencySchema.optional(),
  amount_cents: z
    .number()
    .int('Amount must be an integer')
    .nonnegative('Amount must be positive or zero'),
  billed_minutes: z
    .number()
    .int('Billed minutes must be an integer')
    .nonnegative('Billed minutes must be positive or zero'),
  issue_date: dateStringSchema,
  due_date: dateStringSchema.nullable().optional(),
  notes_internal: z.string().max(10000, 'Notes too long').nullable().optional(),
  notes_client: z.string().max(10000, 'Notes too long').nullable().optional(),
})

// Update invoice input schema
export const updateInvoiceSchema = z.object({
  id: uuidSchema,
  label: z.string().min(1, 'Label is required').max(500, 'Label too long').optional(),
  status: invoiceStatusSchema.optional(),
  currency: currencySchema.optional(),
  amount_cents: z
    .number()
    .int('Amount must be an integer')
    .nonnegative('Amount must be positive or zero')
    .optional(),
  billed_minutes: z
    .number()
    .int('Billed minutes must be an integer')
    .nonnegative('Billed minutes must be positive or zero')
    .optional(),
  issue_date: dateStringSchema.optional(),
  due_date: dateStringSchema.nullable().optional(),
  notes_internal: z.string().max(10000, 'Notes too long').nullable().optional(),
  notes_client: z.string().max(10000, 'Notes too long').nullable().optional(),
})

// Delete invoice input schema
export const deleteInvoiceSchema = z.object({
  invoiceId: uuidSchema,
})

// Fetch project invoices input schema
export const fetchProjectInvoicesSchema = z.object({
  projectId: uuidSchema,
})

