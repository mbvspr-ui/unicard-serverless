import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, Home, Phone, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { SessionTimer } from './SessionTimer';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showHome?: boolean;
}

export const Header = ({ title, showBack = false, showHome = false }: HeaderProps) => {
  const navigate = useNavigate();
  const { school, logout } = useAuth();

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout? Your session will end.')) {
      toast.info('Logging out...');
      logout();
    }
  };

  return (
    <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
      {/* Main Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Section - UniCraft Branding */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="/unicraft-logo.png" 
                  alt="UniCraft" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to SVG logo
                    e.currentTarget.src = '/unicraft-logo.svg';
                  }}
                />
              </div>
              <div>
                <h1 className="text-lg font-bold">UniCraft</h1>
                <p className="text-xs text-blue-100">School Portal</p>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2">
              {/* Session Timer */}
              <SessionTimer />
              
              {/* Profile Button */}
              <Button
                variant="ghost"
                onClick={() => navigate('/profile')}
                className="h-9 text-white hover:bg-white/10"
                title="View profile"
              >
                <User className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Profile</span>
              </Button>

              {/* Logout Button */}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="h-9 text-white hover:bg-red-500/20 hover:text-red-100"
                title="Logout"
              >
                <LogOut className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* School Info Subheader */}
      {school && (
        <div className="bg-gray-50 border-b">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* School Info */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* School Logo */}
                {school.logo_url && (
                  <img 
                    src={school.logo_url} 
                    alt={school.name}
                    className="w-10 h-10 object-contain rounded-lg border border-gray-200"
                  />
                )}
                
                {/* School Details */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{school.name}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-600">
                    {school.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[150px] sm:max-w-none">{school.email}</span>
                      </div>
                    )}
                    {school.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{school.phone}</span>
                      </div>
                    )}
                    {school.address && (
                      <div className="flex items-center gap-1 max-w-[200px] sm:max-w-xs">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{school.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Title Bar */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {showBack && (
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="h-9 w-9 p-0"
                title="Go back"
              >
                ←
              </Button>
            )}
            {showHome && (
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="h-9 w-9 p-0"
                title="Go to dashboard"
              >
                <Home className="w-5 h-5" />
              </Button>
            )}
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
        </div>
      </div>
    </div>
  );
};
