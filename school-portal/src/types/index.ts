export interface School {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: 'pending' | 'approved' | 'rejected';
  logo_url: string | null;
  signature_url: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  school: School | null;
  token: string | null;
  loading: boolean;
}

export interface Student {
  id: string;
  school_id: string;
  name: string;
  father_name: string | null;
  mother_name: string;
  class: string;
  section: string | null;
  roll_number: string | null;
  student_id: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  blood_group: string | null;
  address: string | null;
  state: string;
  district: string;
  city: string;
  pincode: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentInput {
  name: string;
  father_name?: string;
  mother_name: string;
  class: string;
  section?: string;
  roll_number?: string;
  student_id?: string;
  date_of_birth?: string;
  gender?: string;
  phone_number?: string;
  blood_group?: string;
  address?: string;
  state: string;
  district: string;
  city: string;
  pincode: string;
}
