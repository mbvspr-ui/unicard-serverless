import { z } from 'zod';

// School status update validation
export const schoolStatusUpdateSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be either approved or rejected' }),
  }),
  reason: z.string().optional(),
});

// Query parameters for listing schools
export const schoolListQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  search: z.string().optional(),
});

// Query parameters for listing all batches (admin)
export const adminBatchListQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  schoolId: z.string().uuid().optional(),
  status: z.enum(['submitted', 'processing', 'completed']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type SchoolStatusUpdate = z.infer<typeof schoolStatusUpdateSchema>;
export type SchoolListQuery = z.infer<typeof schoolListQuerySchema>;
export type AdminBatchListQuery = z.infer<typeof adminBatchListQuerySchema>;
