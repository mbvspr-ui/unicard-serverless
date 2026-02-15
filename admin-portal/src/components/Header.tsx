import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { LogOut, User, Clock, Shield } from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();
  const { admin, logout, sessionExpiresAt } = useAdminAuth();
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!sessionExpiresAt) return;

    const updateTimeRemaining = () => {
      const now = Date.now();
      const remaining = sessionExpiresAt - now;

      if (remaining <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [sessionExpiresAt]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  if (!admin) return null;

  return (
    <div className="hidden md:flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img src="/samiul-graphics-logo.svg" alt="Samiul Graphics" className="w-8 h-8" />
          <div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Samiul Graphics</span>
            <p className="text-xs text-muted-foreground -mt-1">Admin Portal</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {sessionExpiresAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Session: {timeRemaining}</span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-medium">{admin.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{admin.role.replace('_', ' ')}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{admin.email}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {admin.role.replace('_', ' ')}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sessionExpiresAt && (
              <>
                <DropdownMenuItem disabled>
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-xs">Session expires in {timeRemaining}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
              <LogOut className="w-4 h-4 mr-2" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
