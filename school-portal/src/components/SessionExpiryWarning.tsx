import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

const TOKEN_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
const WARNING_BEFORE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes before expiry

export const SessionExpiryWarning = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const checkSessionExpiry = () => {
      const loginTime = localStorage.getItem('login_time');
      if (!loginTime) return;

      const loginTimestamp = parseInt(loginTime, 10);
      const currentTime = Date.now();
      const timeElapsed = currentTime - loginTimestamp;
      const timeRemaining = TOKEN_EXPIRY_MS - timeElapsed;

      // Show warning 5 minutes before expiry
      if (timeRemaining <= WARNING_BEFORE_EXPIRY_MS && timeRemaining > 0) {
        if (!showWarning) {
          setShowWarning(true);
          const minutesRemaining = Math.ceil(timeRemaining / 60000);
          toast.warning(
            `Your session will expire in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`,
            {
              duration: 10000,
              icon: <AlertCircle className="w-5 h-5" />,
            }
          );
        }
      }

      // Session expired
      if (timeRemaining <= 0) {
        toast.error('Your session has expired. Please login again.');
        logout();
        navigate('/login');
      }
    };

    // Check immediately
    checkSessionExpiry();

    // Check every 30 seconds
    const intervalId = setInterval(checkSessionExpiry, 30000);

    return () => clearInterval(intervalId);
  }, [showWarning, logout, navigate]);

  return null; // This is a utility component with no UI
};
