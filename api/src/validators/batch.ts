import { z } from 'zod';

// Batch submission creation validation
export const batchSubmissionSchema = z.object({
  studentIds: z
    .array(z.string().uuid('Invalid student ID format'))
    .optional()
    .default([]),
  staffIds: z
    .array(z.string().uuid('Invalid staff ID format'))
    .optional()
    .default([]),
}).refine(
  (data) => (data.studentIds?.length || 0) + (data.staffIds?.length || 0) > 0,
  { message: 'At least one student or staff member must be selected' }
).refine(
  (data) => (data.studentIds?.length || 0) + (data.staffIds?.length || 0) <= 1000,
  { message: 'Maximum 1000 members per batch' }
);

// Query parameters for listing batches
export const batchListQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  status: z.enum(['submitted', 'processing', 'completed']).optional(),
});

export type BatchSubmissionInput = z.infer<typeof batchSubmissionSchema>;
export type BatchListQuery = z.infer<typeof batchListQuerySchema>;
