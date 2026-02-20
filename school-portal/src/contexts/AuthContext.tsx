import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, School } from '../types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
const TOKEN_EXPIRY_HOURS = 2;
const TOKEN_EXPIRY_MS = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000; // 2 hours in milliseconds

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshSchool: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to check if token is expired
const isTokenExpired = (loginTime: string | null): boolean => {
  if (!loginTime) return true;
  const loginTimestamp = parseInt(loginTime, 10);
  const currentTime = Date.now();
  return currentTime - loginTimestamp > TOKEN_EXPIRY_MS;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    school: null,
    token: null,
    loading: true,
  });

  // Check authentication on mount and page refresh
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      const schoolData = localStorage.getItem('school_data');
      const loginTime = localStorage.getItem('login_time');

      // Check if token exists and is not expired
      if (token && schoolData && !isTokenExpired(loginTime)) {
        try {
          const school = JSON.parse(schoolData);
          setState({ isAuthenticated: true, school, token, loading: false });
        } catch (error) {
          console.error('Failed to parse school data:', error);
          clearAuthData();
          setState({ isAuthenticated: false, school: null, token: null, loading: false });
        }
      } else {
        // Token expired or missing
        clearAuthData();
        setState({ isAuthenticated: false, school: null, token: null, loading: false });
      }
    };

    checkAuth();

    // Set up periodic token expiry check (every minute)
    const intervalId = setInterval(() => {
      const loginTime = localStorage.getItem('login_time');
      if (isTokenExpired(loginTime)) {
        clearAuthData();
        setState({ isAuthenticated: false, school: null, token: null, loading: false });
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, []);

  // Clear all auth data from localStorage
  const clearAuthData = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('school_data');
    localStorage.removeItem('login_time');
  };

  const login = async (email: string, password: string): Promise<void> => {
    const response = await fetch(`${API_URL}/api/auth/school/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Login failed');

    // Store auth data with login timestamp
    const loginTime = Date.now().toString();
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('school_data', JSON.stringify(data.school));
    localStorage.setItem('login_time', loginTime);
    
    // Store must change password flag
    if (data.mustChangePassword) {
      localStorage.setItem('must_change_password', 'true');
    } else {
      localStorage.removeItem('must_change_password');
    }
    
    setState({ isAuthenticated: true, school: data.school, token: data.token, loading: false });
  };

  const register = async (registerData: any): Promise<void> => {
    const response = await fetch(`${API_URL}/api/auth/school/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Registration failed');
  };

  const logout = (): void => {
    clearAuthData();
    setState({ isAuthenticated: false, school: null, token: null, loading: false });
    // Force reload to clear any cached state
    window.location.href = '/login';
  };

  const refreshSchool = async (): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      // Use the auth/me endpoint to get updated school data
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem('school_data', JSON.stringify(data.data));
        setState(prev => ({ ...prev, school: data.data }));
      }
    } catch (error) {
      console.error('Failed to refresh school data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshSchool }}>
      {children}
    </AuthContext.Provider>
  );
};
