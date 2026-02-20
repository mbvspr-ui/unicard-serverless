import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { FormInput } from '../components/ui/form-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { schoolApi } from '../lib/api';
import { toast } from 'sonner';
import { Loader2, Download, Fingerprint } from 'lucide-react';
import { 
  isBiometricAvailable, 
  isBiometricRegistered, 
  authenticateWithBiometric,
  registerBiometric 
} from '../utils/biometric';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Check biometric availability
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      
      if (available) {
        const registered = isBiometricRegistered();
        setBiometricRegistered(registered);
      }
    };
    
    checkBiometric();

    // PWA install handler
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.info('App is already installed or not available for installation');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success('App installed successfully!');
      setShowInstallButton(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      
      // Offer to register biometric after successful login
      if (biometricAvailable && !biometricRegistered) {
        setTimeout(() => {
          toast.info('Enable fingerprint/face login for faster access', {
            action: {
              label: 'Enable',
              onClick: () => handleRegisterBiometric(),
            },
            duration: 10000,
          });
        }, 1000);
      }
      
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    
    try {
      // Authenticate with biometric
      const authenticated = await authenticateWithBiometric();
      
      if (authenticated) {
        // Get stored credentials
        const storedEmail = localStorage.getItem('biometric_email');
        const storedPassword = localStorage.getItem('biometric_password');
        
        if (storedEmail && storedPassword) {
          await login(storedEmail, storedPassword);
          toast.success('Login successful!');
          navigate('/dashboard');
        } else {
          toast.error('Stored credentials not found. Please login with email and password.');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Biometric authentication failed');
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleRegisterBiometric = async () => {
    if (!email || !password) {
      toast.error('Please login first to enable biometric authentication');
      return;
    }

    try {
      const registered = await registerBiometric(email);
      
      if (registered) {
        // Store credentials securely (in production, use more secure storage)
        localStorage.setItem('biometric_email', email);
        localStorage.setItem('biometric_password', password);
        
        setBiometricRegistered(true);
        toast.success('Biometric authentication enabled! You can now use fingerprint/face to login.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to enable biometric authentication');
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setSendingReset(true);
    try {
      const response = await schoolApi.forgotPassword(forgotEmail);
      if (response.success) {
        toast.success('Password reset instructions sent to your email!');
        setShowForgotPassword(false);
        setForgotEmail('');
      } else {
        toast.error(response.error?.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4">
          {/* Samiul Graphics Logo and Branding */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center p-3 shadow-lg">
              <img 
                src="/samiul-graphics-logo.svg" 
                alt="Samiul Graphics Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Samiul Graphics
              </h1>
              <p className="text-sm text-muted-foreground mt-1">School Portal</p>
            </div>
          </div>
          
          <div className="text-center pt-2">
            <CardTitle className="text-xl sm:text-2xl">Welcome Back</CardTitle>
            <CardDescription className="mt-2">
              Enter your credentials to access your school portal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="school@example.com"
              required
              autoComplete="email"
            />

            <FormInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>

            {/* Biometric Login Button - Enhanced */}
            {biometricAvailable && biometricRegistered && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-30 animate-pulse"></div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full relative bg-white border-2 border-purple-500 hover:bg-purple-50 hover:border-purple-600 transition-all duration-300"
                  size="lg"
                  onClick={handleBiometricLogin}
                  disabled={biometricLoading}
                >
                  {biometricLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin text-purple-600" />
                      <span className="text-purple-600 font-semibold">Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <div className="mr-2 h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                        <Fingerprint className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-purple-600 font-semibold">Quick Login</span>
                        <span className="text-xs text-gray-500">Use Fingerprint or Face ID</span>
                      </div>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </div>

            {/* Install Mobile App Button */}
            {showInstallButton && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                onClick={handleInstallClick}
              >
                <Download className="mr-2 h-4 w-4" />
                Install Mobile App
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you instructions to reset your password.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <FormInput
              label="Email Address"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Enter your email address"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowForgotPassword(false);
                setForgotEmail('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleForgotPassword}
              disabled={sendingReset || !forgotEmail}
              className="flex-1"
            >
              {sendingReset ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Email'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
