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
