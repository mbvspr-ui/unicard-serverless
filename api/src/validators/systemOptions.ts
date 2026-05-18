import { z } from 'zod';

export const systemOptionTypeSchema = z.enum(['class', 'section'], {
  errorMap: () => ({ message: 'Option type must be either class or section' }),
});

export const createSystemOptionSchema = z.object({
  option_type: systemOptionTypeSchema,
  value: z.string().trim().min(1, 'Option value is required').max(100),
  sort_order: z.number().int().min(0).optional(),
});

export const updateSystemOptionSchema = z.object({
  value: z.string().trim().min(1, 'Option value is required').max(100).optional(),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export type SystemOptionType = z.infer<typeof systemOptionTypeSchema>;
export type CreateSystemOptionInput = z.infer<typeof createSystemOptionSchema>;
export type UpdateSystemOptionInput = z.infer<typeof updateSystemOptionSchema>;
