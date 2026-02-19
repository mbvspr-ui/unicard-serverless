import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { isOnline, onNetworkChange } from '@/utils/pwa';

export default function OfflineIndicator() {
  const [online, setOnline] = useState(isOnline());
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const cleanup = onNetworkChange((status) => {
      setOnline(status);
      setShowNotification(true);

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    });

    return cleanup;
  }, []);

  // Don't show anything if online and no notification
  if (online && !showNotification) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        showNotification ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg ${
          online
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}
      >
        {online ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Back Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">You're Offline</span>
          </>
        )}
      </div>
    </div>
  );
}
