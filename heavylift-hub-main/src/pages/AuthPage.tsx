import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Construction, HardHat, Building2, ArrowLeft, Loader2 } from 'lucide-react';
import type { UserRole } from '@/types';
import Logo from '@/assets/LOGO_PNG.png';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['contractor', 'owner']),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signIn, signUp, user, role, isLoading: authLoading } = useAuth();
  
  const mode = searchParams.get('mode') || 'login';
  const preselectedRole = searchParams.get('role') as UserRole | null;
  
  const [activeTab, setActiveTab] = useState(mode === 'signup' ? 'signup' : 'login');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: (preselectedRole === 'contractor' || preselectedRole === 'owner') ? preselectedRole : 'contractor',
      acceptTerms: false,
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && role) {
      const redirectPath = role === 'admin' ? '/admin' : role === 'owner' ? '/owner' : '/contractor';
      navigate(redirectPath);
    }
  }, [user, role, navigate]);

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    const { error } = await signIn(data.email, data.password);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsSubmitting(true);
    const { error } = await signUp(data.email, data.password, data.fullName, data.role as UserRole);
    setIsSubmitting(false);

    if (error) {
      let message = error.message;
      if (message.includes('already registered')) {
        message = 'This email is already registered. Please login instead.';
      }
      toast({
        title: 'Signup Failed',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account Created!',
        description: 'Welcome to MachRent. Your account has been created successfully.',
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-secondary-foreground">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-8">
              {/* <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
                <Construction className="h-7 w-7 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">MachRent</span> */}
              <img src={Logo} alt="MachRent" className="h-48" />
            </Link>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              {activeTab === 'login' 
                ? 'Welcome Back!'
                : 'Join Lagos\' Leading Equipment Marketplace'
              }
            </h1>
            <p className="text-lg opacity-80 max-w-md">
              {activeTab === 'login'
                ? 'Access your dashboard to manage rentals, bookings, and more.'
                : 'Connect with verified equipment owners and contractors. Start renting or listing equipment today.'
              }
            </p>
          </div>

          <div className="flex items-center gap-8 text-sm opacity-70">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>Secure & Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                <Construction className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">MachRent</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-2xl">Login to your account</CardTitle>
                    <CardDescription>
                      Enter your credentials to access your dashboard
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          {...loginForm.register('email')}
                        />
                        {loginForm.formState.errors.email && (
                          <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          {...loginForm.register('password')}
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          'Login'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-2xl">Create an account</CardTitle>
                    <CardDescription>
                      Join MachRent to start renting or listing equipment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                      {/* Role Selection */}
                      <div className="space-y-3">
                        <Label>I want to</Label>
                        <RadioGroup
                          value={signupForm.watch('role')}
                          onValueChange={(value) => signupForm.setValue('role', value as 'contractor' | 'owner')}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div>
                            <RadioGroupItem value="contractor" id="contractor" className="peer sr-only" />
                            <Label
                              htmlFor="contractor"
                              className="flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                            >
                              <HardHat className="h-8 w-8 mb-2 text-primary" />
                              <span className="font-medium">Rent Equipment</span>
                              <span className="text-xs text-muted-foreground">I'm a contractor</span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="owner" id="owner" className="peer sr-only" />
                            <Label
                              htmlFor="owner"
                              className="flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                            >
                              <Building2 className="h-8 w-8 mb-2 text-primary" />
                              <span className="font-medium">List Equipment</span>
                              <span className="text-xs text-muted-foreground">I'm an owner</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          placeholder="John Doe"
                          {...signupForm.register('fullName')}
                        />
                        {signupForm.formState.errors.fullName && (
                          <p className="text-sm text-destructive">{signupForm.formState.errors.fullName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          {...signupForm.register('email')}
                        />
                        {signupForm.formState.errors.email && (
                          <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            {...signupForm.register('password')}
                          />
                          {signupForm.formState.errors.password && (
                            <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            {...signupForm.register('confirmPassword')}
                          />
                          {signupForm.formState.errors.confirmPassword && (
                            <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="acceptTerms"
                          checked={signupForm.watch('acceptTerms')}
                          onCheckedChange={(checked) => signupForm.setValue('acceptTerms', checked as boolean)}
                        />
                        <Label htmlFor="acceptTerms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                          I agree to the{' '}
                          <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                          {' '}and{' '}
                          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                        </Label>
                      </div>
                      {signupForm.formState.errors.acceptTerms && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.acceptTerms.message}</p>
                      )}

                      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
