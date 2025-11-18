import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

const TOKEN_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

export const SessionTimer = () => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const loginTime = localStorage.getItem('login_time');
      if (!loginTime) {
        setTimeRemaining('');
        return;
      }

      const loginTimestamp = parseInt(loginTime, 10);
      const currentTime = Date.now();
      const elapsed = currentTime - loginTimestamp;
      const remaining = TOKEN_EXPIRY_MS - elapsed;

      if (remaining <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      // Show warning color if less than 10 minutes remaining
      setIsWarning(remaining < 10 * 60 * 1000);

      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 30000); // Update every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  if (!timeRemaining) return null;

  return (
    <div 
      className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium ${
        isWarning 
          ? 'bg-red-50 text-red-700 border border-red-200' 
          : 'bg-white/10 text-white'
      }`}
      title={`Session expires in ${timeRemaining}`}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>{timeRemaining}</span>
    </div>
  );
};
