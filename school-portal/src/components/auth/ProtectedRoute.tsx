import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/loading-spinner';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Show message if user was redirected due to expired session
    if (!loading && !isAuthenticated && location.pathname !== '/login') {
      const loginTime = localStorage.getItem('login_time');
      if (loginTime) {
        toast.error('Your session has expired. Please login again.');
      }
    }
  }, [isAuthenticated, loading, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Verifying session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check if user must change password
  const mustChangePassword = localStorage.getItem('must_change_password') === 'true';
  console.log('ProtectedRoute - mustChangePassword:', mustChangePassword, 'pathname:', location.pathname);
  
  if (mustChangePassword && location.pathname !== '/change-password') {
    console.log('Redirecting to change password page');
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
};
