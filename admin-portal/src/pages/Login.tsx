import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, Shield, Download, Fingerprint, Loader2 } from 'lucide-react';
import { 
  isBiometricAvailable, 
  isBiometricRegistered, 
  authenticateWithBiometric,
  registerBiometric 
} from '@/utils/biometric';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [biometricRegistering, setBiometricRegistering] = useState(false);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Check biometric availability
  useEffect(() => {
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      
      if (available) {
        const registered = isBiometricRegistered();
        setBiometricRegistered(registered);
      }
    };
    
    checkBiometric();
  }, []);

  // PWA Install prompt handler
  useEffect(() => {
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

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    
    try {
      // Authenticate with biometric
      const authenticated = await authenticateWithBiometric();
      
      if (authenticated) {
        // Get stored credentials
        const storedEmail = localStorage.getItem('admin_biometric_email');
        const storedPassword = localStorage.getItem('admin_biometric_password');
        
        if (storedEmail && storedPassword) {
          await login(storedEmail, storedPassword, false);
          toast.success('Login successful!');
          navigate('/dashboard', { replace: true });
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

    setBiometricRegistering(true);
    try {
      const registered = await registerBiometric(email);
      
      if (registered) {
        // Store credentials securely (in production, use more secure storage)
        localStorage.setItem('admin_biometric_email', email);
        localStorage.setItem('admin_biometric_password', password);
        
        setBiometricRegistered(true);
        setShowBiometricPrompt(false);
        toast.success('Biometric authentication enabled! You can now use fingerprint/face to login.');
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to enable biometric authentication');
    } finally {
      setBiometricRegistering(false);
    }
  };

  const handleSkipBiometric = () => {
    setShowBiometricPrompt(false);
    navigate('/dashboard', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
      toast.success('Login successful!');
      
      // Show biometric registration dialog after successful login
      if (biometricAvailable && !biometricRegistered) {
        setTimeout(() => {
          setShowBiometricPrompt(true);
        }, 500);
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg p-3">
              <img src="/samiul-graphics-logo.svg" alt="Samiul Graphics" className="w-full h-full" />
            </div>
          </div>
          <CardTitle className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Samiul Graphics
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Admin Portal - Manage schools and ID card orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12 text-base"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 text-base pr-12"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Remember me for 8 hours
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </>
              )}
            </Button>

            {/* Biometric Login Button - Enhanced */}
            {biometricAvailable && biometricRegistered && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-30 animate-pulse"></div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 relative bg-white border-2 border-purple-500 hover:bg-purple-50 hover:border-purple-600 transition-all duration-300"
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

            {/* Install Mobile App Button */}
            {showInstallButton && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base font-semibold"
                onClick={handleInstallClick}
              >
                <Download className="w-5 h-5 mr-2" />
                Install Mobile App
              </Button>
            )}
          </form>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <p>Secure admin access with session management</p>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Admin access only. Unauthorized access is prohibited.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Biometric Registration Prompt Dialog */}
      <Dialog open={showBiometricPrompt} onOpenChange={setShowBiometricPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="relative">
                {/* Animated gradient circle */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 via-pink-500 to-blue-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                  <Fingerprint className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              Enable Quick Login
            </DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              Use your fingerprint or face to login instantly next time. No need to type your password!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Benefits List */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Lightning Fast</p>
                  <p className="text-sm text-gray-600">Login in under 2 seconds</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Super Secure</p>
                  <p className="text-sm text-gray-600">Your biometric data never leaves your device</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Easy & Convenient</p>
                  <p className="text-sm text-gray-600">No more remembering passwords</p>
                </div>
              </div>
            </div>

            {/* Privacy Note */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 text-center">
                <span className="font-semibold">🔒 Privacy Protected:</span> Your fingerprint/face data is stored securely on your device only and is never sent to our servers.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRegisterBiometric}
              disabled={biometricRegistering}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {biometricRegistering ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-5 w-5" />
                  Enable Quick Login
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkipBiometric}
              disabled={biometricRegistering}
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
