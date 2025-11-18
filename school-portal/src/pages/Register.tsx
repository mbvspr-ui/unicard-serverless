import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { FormInput } from '../components/ui/form-input';
import { FormTextarea } from '../components/ui/form-textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    principal_name: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        phone: formData.phone,
        principal_name: formData.principal_name || undefined,
      });
      setSuccess(true);
      toast.success('Registration successful! You can now login.');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6 text-center space-y-6">
            {/* UniCraft Logo */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden">
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
            </div>
            
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Registration Successful!</h2>
              <p className="text-muted-foreground">
                Your school has been registered with UniCraft. You can now login and start using the portal!
              </p>
            </div>
            <Button onClick={() => navigate('/login')} className="w-full" size="lg">
              Login Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4">
          {/* UniCraft Logo and Branding */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
              <img 
                src="/unicraft-logo.png" 
                alt="UniCraft Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to SVG logo
                  e.currentTarget.src = '/unicraft-logo.svg';
                }}
              />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                UniCraft
              </h1>
              <p className="text-sm text-muted-foreground mt-1">School Portal</p>
            </div>
          </div>
          
          <div className="text-center pt-2">
            <CardTitle className="text-xl sm:text-2xl">School Registration</CardTitle>
            <CardDescription className="mt-2">
              Step {step} of 2: {step === 1 ? 'Basic Information' : 'Contact Details'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <FormInput
                label="School Name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter school name"
                required
              />

              <FormInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="school@example.com"
                required
                autoComplete="email"
              />

              <FormInput
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="At least 8 characters"
                required
                helperText="Minimum 8 characters"
              />

              <FormInput
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="Re-enter password"
                required
              />

              <Button type="submit" className="w-full" size="lg">
                Next Step
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Login here
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <FormInput
                label="Principal Name"
                value={formData.principal_name}
                onChange={(e) => updateField('principal_name', e.target.value)}
                placeholder="Enter principal's name"
              />

              <FormInput
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+91 9876543210"
                required
              />

              <FormTextarea
                label="School Address"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Enter complete address"
                rows={2}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <FormInput
                  label="City"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="City"
                  required
                />

                <FormInput
                  label="State"
                  value={formData.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  placeholder="State"
                  required
                />
              </div>

              <FormInput
                label="Pincode"
                value={formData.pincode}
                onChange={(e) => updateField('pincode', e.target.value)}
                placeholder="Enter pincode"
                maxLength={6}
                required
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  size="lg"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
