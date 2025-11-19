import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

// Show warning 5 minutes before expiry
const WARNING_THRESHOLD = 5 * 60 * 1000;

export default function SessionExpiryWarning() {
  const navigate = useNavigate();
  const { sessionExpiresAt, refreshSession, logout } = useAdminAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!sessionExpiresAt) return;

    const checkExpiry = () => {
      const now = Date.now();
      const remaining = sessionExpiresAt - now;
      setTimeRemaining(remaining);

      // Show warning if less than 5 minutes remaining
      if (remaining > 0 && remaining <= WARNING_THRESHOLD && !showWarning) {
        setShowWarning(true);
      }

      // Auto logout if expired
      if (remaining <= 0) {
        handleExpired();
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [sessionExpiresAt, showWarning]);

  const handleExpired = () => {
    setShowWarning(false);
    logout();
    navigate('/login', { replace: true });
  };

  const handleContinue = () => {
    refreshSession();
    setShowWarning(false);
  };

  const handleLogout = () => {
    setShowWarning(false);
    logout();
    navigate('/login', { replace: true });
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
            </div>
            <DialogTitle className="text-xl">Session Expiring Soon</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Your session will expire in <span className="font-semibold text-yellow-600 dark:text-yellow-500">{formatTime(timeRemaining)}</span>.
            <br />
            Would you like to continue your session?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full sm:w-auto"
          >
            Logout Now
          </Button>
          <Button
            onClick={handleContinue}
            className="w-full sm:w-auto"
          >
            Continue Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
