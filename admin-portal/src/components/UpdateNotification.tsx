import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { RefreshCw, X } from 'lucide-react';
import { checkVersion, checkRemoteVersion, clearAppCache, updateVersion, APP_VERSION } from '@/utils/version';

const CHECK_INTERVAL = 30000; // Check every 30 seconds

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const checkForUpdate = async () => {
    // First check local version
    const localMatch = checkVersion();
    if (!localMatch) {
      setShowUpdate(true);
      return;
    }

    // Then check remote version
    const remoteMatch = await checkRemoteVersion();
    if (!remoteMatch) {
      setShowUpdate(true);
    }
  };

  useEffect(() => {
    // Check version on mount
    checkForUpdate();

    // Set up periodic checking (every 30 seconds)
    const intervalId = setInterval(() => {
      checkForUpdate();
    }, CHECK_INTERVAL);

    // Check when user returns to the tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdate();
      }
    };

    // Check when window regains focus
    const handleFocus = () => {
      checkForUpdate();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Clear cache
      await clearAppCache();
      
      // Update version
      updateVersion();
      
      // Force reload
      window.location.reload();
    } catch (error) {
      console.error('Update error:', error);
      // Force reload anyway
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    // Update version without clearing cache (not recommended)
    updateVersion();
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 shadow-2xl border-2 border-blue-500">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-2">Update Available</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              A new version of the admin portal is available. Please update to get the latest features and improvements.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              Version: {APP_VERSION}
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Update Now
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={handleDismiss}
                disabled={isUpdating}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
