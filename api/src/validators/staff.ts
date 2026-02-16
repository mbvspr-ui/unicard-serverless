import { z } from 'zod';

// Phone number validation for Indian mobile numbers
const phoneRegex = /^\+91[6-9][0-9]{9}$/;

// Pincode validation (6 digits)
const pincodeRegex = /^[0-9]{6}$/;

// Staff creation/update validation
export const staffSchema = z.object({
  // Personal Information
  name: z.string().min(1, 'Staff name is required'),
  father_spouse_name: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  phone_number: z
    .string()
    .regex(phoneRegex, 'Phone number must be in format +91XXXXXXXXXX')
    .optional(),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  photo_url: z.string().optional(),
  
  // Employment Information
  employee_id: z.string().optional(),
  staff_type: z.enum(['Teaching', 'Non-Teaching', 'Administrative', 'Support'], {
    required_error: 'Staff type is required',
  }),
  designation: z.string().min(1, 'Designation is required'),
  department: z.string().optional(),
  date_of_joining: z.string().optional(),
  qualification: z.string().optional(),
  
  // Address Information
  address: z.string().optional(),
  state: z.string().min(1, 'State is required'),
  district: z.string().min(1, 'District is required'),
  city: z.string().min(1, 'City is required'),
  pincode: z
    .string()
    .regex(pincodeRegex, 'Pincode must be exactly 6 digits')
    .min(1, 'Pincode is required'),
  
  // Emergency Contact
  emergency_contact_name: z.string().optional(),
  emergency_contact_number: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
});

// Partial schema for updates (all fields optional except required ones)
export const staffUpdateSchema = staffSchema.partial();

// Query parameters for listing staff
export const staffListQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  search: z.string().optional(),
  staff_type: z.string().optional(),
  department: z.string().optional(),
});

export type StaffInput = z.infer<typeof staffSchema>;
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;
export type StaffListQuery = z.infer<typeof staffListQuerySchema>;
