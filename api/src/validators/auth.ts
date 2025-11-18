import { z } from 'zod';

// School registration validation
export const schoolRegisterSchema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  phone: z.string().min(1, 'Phone number is required'),
  principal_name: z.string().optional(),
});

// School login validation
export const schoolLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Admin login validation
export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SchoolRegisterInput = z.infer<typeof schoolRegisterSchema>;
export type SchoolLoginInput = z.infer<typeof schoolLoginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
