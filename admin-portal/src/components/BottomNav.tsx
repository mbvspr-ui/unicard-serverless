import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Package, LogOut } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'sonner';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard',
    },
    {
      icon: Building2,
      label: 'Schools',
      path: '/schools',
    },
    {
      icon: Package,
      label: 'Batches',
      path: '/batches',
    },
    {
      icon: LogOut,
      label: 'Logout',
      action: handleLogout,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.path ? isActive(item.path) : false;

          return (
            <button
              key={item.label}
              onClick={() => (item.action ? item.action() : navigate(item.path!))}
              className={`flex flex-col items-center justify-center py-2 px-3 min-h-[60px] flex-1 transition-colors ${
                active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-xs mt-1 ${active ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
