export interface Admin {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
}

export interface AuthState {
  isAuthenticated: boolean;
  admin: Admin | null;
  token: string | null;
  loading: boolean;
}

export interface Staff {
  id: string;
  school_id: string;
  name: string;
  father_spouse_name: string | null;
  date_of_birth: string | null;
  gender: 'Male' | 'Female' | 'Other' | null;
  phone_number: string | null;
  blood_group: string | null;
  photo_url: string | null;
  employee_id: string | null;
  staff_type: 'Teaching' | 'Non-Teaching' | 'Administrative' | 'Support';
  designation: string;
  department: string | null;
  date_of_joining: string | null;
  qualification: string | null;
  address: string | null;
  state: string;
  district: string;
  city: string;
  pincode: string;
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  emergency_contact_relationship: string | null;
  created_at: string;
  updated_at: string;
}
