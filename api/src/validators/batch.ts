import { z } from 'zod';

// Batch submission creation validation
export const batchSubmissionSchema = z.object({
  studentIds: z
    .array(z.string().uuid('Invalid student ID format'))
    .min(1, 'At least one student must be selected')
    .max(1000, 'Maximum 1000 students per batch'),
});

// Query parameters for listing batches
export const batchListQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  status: z.enum(['submitted', 'processing', 'completed']).optional(),
});

export type BatchSubmissionInput = z.infer<typeof batchSubmissionSchema>;
export type BatchListQuery = z.infer<typeof batchListQuerySchema>;
