import { z } from 'zod';

// Phone number validation for Indian mobile numbers
const phoneRegex = /^\+91[6-9][0-9]{9}$/;

// Pincode validation (6 digits)
const pincodeRegex = /^[0-9]{6}$/;

// Student creation/update validation
export const studentSchema = z.object({
  name: z.string().min(1, 'Student name is required'),
  father_name: z.string().optional(),
  mother_name: z.string().min(1, 'Mother name is required'),
  class: z.string().min(1, 'Class is required'),
  section: z.string().optional(),
  roll_number: z.string().optional(),
  student_id: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  phone_number: z
    .string()
    .regex(phoneRegex, 'Phone number must be in format +91XXXXXXXXXX')
    .optional(),
  blood_group: z.string().optional(),
  address: z.string().optional(),
  state: z.string().min(1, 'State is required'),
  district: z.string().min(1, 'District is required'),
  city: z.string().min(1, 'City is required'),
  pincode: z
    .string()
    .regex(pincodeRegex, 'Pincode must be exactly 6 digits')
    .min(1, 'Pincode is required'),
  photo_url: z.string().optional(),
});

// Partial schema for updates (all fields optional except required ones)
export const studentUpdateSchema = studentSchema.partial();

// Query parameters for listing students
export const studentListQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  search: z.string().optional(),
  class: z.string().optional(),
  section: z.string().optional(),
});

export type StudentInput = z.infer<typeof studentSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
export type StudentListQuery = z.infer<typeof studentListQuerySchema>;
