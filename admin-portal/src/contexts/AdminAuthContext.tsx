import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthState } from '../types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

// Session timeout: 8 hours
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000;
// Activity check interval: 1 minute
const ACTIVITY_CHECK_INTERVAL = 60 * 1000;

interface AdminAuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  refreshSession: () => void;
  sessionExpiresAt: number | null;
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    admin: null,
    token: null,
    loading: true,
  });
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);

  // Validate and restore session
  const validateSession = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.success && data.user?.role === 'admin';
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }, []);

  // Clear session data
  const clearSession = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    localStorage.removeItem('admin_session_expires');
    localStorage.removeItem('admin_remember_me');
    sessionStorage.removeItem('admin_last_activity');
    setSessionExpiresAt(null);
    setState({ isAuthenticated: false, admin: null, token: null, loading: false });
  }, []);

  // Refresh session expiry
  const refreshSession = useCallback(() => {
    const rememberMe = localStorage.getItem('admin_remember_me') === 'true';
    if (rememberMe) {
      const newExpiry = Date.now() + SESSION_TIMEOUT;
      localStorage.setItem('admin_session_expires', newExpiry.toString());
      setSessionExpiresAt(newExpiry);
      sessionStorage.setItem('admin_last_activity', Date.now().toString());
    }
  }, []);

  // Check session expiry
  const checkSessionExpiry = useCallback(() => {
    const expiresAt = localStorage.getItem('admin_session_expires');
    if (expiresAt && Date.now() > parseInt(expiresAt)) {
      console.log('Session expired');
      clearSession();
      return false;
    }
    return true;
  }, [clearSession]);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('admin_token');
      const adminData = localStorage.getItem('admin_data');
      const expiresAt = localStorage.getItem('admin_session_expires');

      if (!token || !adminData) {
        setState({ isAuthenticated: false, admin: null, token: null, loading: false });
        return;
      }

      // Check if session expired
      if (expiresAt && Date.now() > parseInt(expiresAt)) {
        console.log('Session expired on init');
        clearSession();
        return;
      }

      try {
        const admin = JSON.parse(adminData);
        
        // Validate token with backend
        const isValid = await validateSession(token);
        
        if (isValid) {
          setState({ isAuthenticated: true, admin, token, loading: false });
          if (expiresAt) {
            setSessionExpiresAt(parseInt(expiresAt));
          }
          refreshSession();
        } else {
          console.log('Invalid session token');
          clearSession();
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        clearSession();
      }
    };

    initSession();
  }, [validateSession, clearSession, refreshSession]);

  // Activity monitoring and session expiry check
  useEffect(() => {
    if (!state.isAuthenticated) return;

    // Check session expiry periodically
    const expiryInterval = setInterval(() => {
      if (!checkSessionExpiry()) {
        clearInterval(expiryInterval);
      }
    }, ACTIVITY_CHECK_INTERVAL);

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      refreshSession();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      clearInterval(expiryInterval);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [state.isAuthenticated, checkSessionExpiry, refreshSession]);

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    const response = await fetch(`${API_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Login failed');

    // Store session data
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_data', JSON.stringify(data.admin));
    localStorage.setItem('admin_remember_me', rememberMe.toString());

    // Set session expiry
    const expiresAt = Date.now() + SESSION_TIMEOUT;
    localStorage.setItem('admin_session_expires', expiresAt.toString());
    setSessionExpiresAt(expiresAt);
    sessionStorage.setItem('admin_last_activity', Date.now().toString());

    setState({ isAuthenticated: true, admin: data.admin, token: data.token, loading: false });
  };

  const logout = (): void => {
    clearSession();
  };

  return (
    <AdminAuthContext.Provider value={{ ...state, login, logout, refreshSession, sessionExpiresAt }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
