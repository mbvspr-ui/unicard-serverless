import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AuthState } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AdminAuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    admin: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const adminData = localStorage.getItem('admin_data');

    if (token && adminData) {
      try {
        const admin = JSON.parse(adminData);
        setState({ isAuthenticated: true, admin, token, loading: false });
      } catch (error) {
        localStorage.clear();
        setState({ isAuthenticated: false, admin: null, token: null, loading: false });
      }
    } else {
      setState({ isAuthenticated: false, admin: null, token: null, loading: false });
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await fetch(`${API_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Login failed');

    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_data', JSON.stringify(data.admin));
    setState({ isAuthenticated: true, admin: data.admin, token: data.token, loading: false });
  };

  const logout = (): void => {
    localStorage.clear();
    setState({ isAuthenticated: false, admin: null, token: null, loading: false });
  };

  return (
    <AdminAuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
