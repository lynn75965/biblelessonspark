import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Mail, User, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useInvites } from '@/hooks/useInvites';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeEmail, sanitizeText } from '@/lib/inputSanitization';
import Footer from '@/components/Footer';
import { SITE } from '@/config/site';
import { validatePassword, PASSWORD_REQUIREMENTS_TEXT } from '@/constants/validation';
import { getUIConfig } from '@/constants/programConfig';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  
  // Get UI config from SSOT
  const uiConfig = getUIConfig();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'signin' || tabFromUrl === 'signup' ? tabFromUrl : uiConfig.authDefaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const [inviterName, setInviterName] = useState<string>('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const { getInviteByToken, claimInvite } = useInvites();
  const navigate = useNavigate();

  // Handle password reset mode - must check BEFORE auth redirect
  useEffect(() => {
    const resetParam = searchParams.get('reset');
    if (resetParam === 'true') {
      setIsResetMode(true);
    }
  }, [searchParams]);

  // Prevent redirect to dashboard if in reset mode
  useEffect(() => {
    const resetParam = searchParams.get('reset');
    if (user && resetParam !== 'true' && !inviteToken) {
      navigate('/dashboard');
    }
  }, [user, searchParams, navigate, inviteToken]);

  // Handle invite token
  useEffect(() => {
    const handleInvite = async () => {
      if (inviteToken) {
        const invite = await getInviteByToken(inviteToken);
        if (invite) {
          setFormData(prev => ({ ...prev, email: invite.email }));
          setActiveTab('signup');

          // Get inviter name
          const { data: inviterProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', invite.created_by)
            .single();

          if (inviterProfile) {
            setInviterName(inviterProfile.full_name || 'LessonSpark USA');
          }

          toast({
            title: "You've been invited!",
            description: `${inviterProfile?.full_name || 'Someone'} has invited you to join ${SITE.name}.`,
          });
        } else {
          toast({
            title: "Invalid invite",
            description: "This invitation link is invalid or has already been used.",
            variant: "destructive",
          });
        }
      }
    };
    handleInvite();
  }, [inviteToken, getInviteByToken, toast]);

  // Redirect if already authenticated
  // Auth redirect handled above with reset mode check

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;

    setIsLoading(true);
    try {
      // Sanitize email input
      const sanitizedEmail = sanitizeEmail(formData.email);
      const { error } = await signIn(sanitizedEmail, formData.password);

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message || "Please check your email and password.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.fullName) return;

    setIsLoading(true);
    try {
      // Sanitize inputs on submit (not during typing)
      const sanitizedEmail = sanitizeEmail(formData.email);
      const sanitizedFullName = sanitizeText(formData.fullName);

      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        toast({
          title: "Password requirements not met",
          description: passwordValidation.errors[0],
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await signUp(sanitizedEmail, formData.password, sanitizedFullName);

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
          setActiveTab('signin');
        } else {
          toast({
            title: "Sign up failed",
            description: error.message || "Please check your information and try again.",
            variant: "destructive",
          });
        }
      } else {
        // Claim invite if token exists
        if (inviteToken) {
          await claimInvite(inviteToken);
        }

        // Trigger verification email
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user && !userData.user.email_confirmed_at) {
            await supabase.functions.invoke('resend-verification');
          }
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
        }

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const sanitizedEmail = sanitizeEmail(formData.email);
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to send reset email. Please try again.",
          variant: "destructive",
        });
      } else {
        setResetEmailSent(true);
        toast({
          title: "Reset email sent!",
          description: "Check your inbox for password reset instructions.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Password required",
        description: "Please enter and confirm your new password.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      toast({
        title: "Password requirements not met",
        description: validation.errors[0],
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to reset password. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password updated!",
          description: "Your password has been successfully reset.",
        });
        setIsResetMode(false);
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Only lowercase email during typing - all other sanitization happens on submit
    const processedValue = field === 'email' ? value.toLowerCase() : value;
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  // Reset Password Completion View
  if (isResetMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md px-4 sm:px-0">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-3 sm:mb-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gradient-primary">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold gradient-text">{SITE.name}</span>
            </div>
          </div>

          <Card className="bg-gradient-card shadow-glow">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">Set New Password</CardTitle>
              <CardDescription className="text-sm">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-9 sm:pl-10 pr-10 text-sm sm:text-base"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 sm:pl-10 text-sm sm:text-base"
                      minLength={8}
                      required
                    />
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Password requirements:</p>
                  <ul className="space-y-0.5">
                    {PASSWORD_REQUIREMENTS_TEXT.map((req, i) => (
                      <li key={i}>• {req}</li>
                    ))}
                  </ul>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  variant="hero"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md px-4 sm:px-0">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-3 sm:mb-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gradient-primary">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold gradient-text">{SITE.name}</span>
            </div>
          </div>

          <Card className="bg-gradient-card shadow-glow">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">Reset Your Password</CardTitle>
              <CardDescription className="text-sm">
                {resetEmailSent
                  ? "Check your email for reset instructions"
                  : "Enter your email to receive a password reset link"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {resetEmailSent ? (
                <div className="space-y-4 text-center">
                  <div className="flex justify-center">
                    <Mail className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We've sent a password reset link to <strong>{formData.email}</strong>.
                    Please check your inbox and spam folder.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmailSent(false);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="your.email@church.org"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-9 sm:pl-10 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    variant="hero"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md px-4 sm:px-0">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-3 sm:mb-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gradient-primary">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold gradient-text">{SITE.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Welcome to {SITE.name}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {SITE.tagline}
          </p>
        </div>

        <Card className="bg-gradient-card shadow-glow">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">
              {inviteToken ? `Invitation from ${inviterName}` : 'Access Your Account'}
            </CardTitle>
            <CardDescription className="text-sm">
              {inviteToken
                ? `Complete your sign up to join ${SITE.name}`
                : 'Sign in to enhance your Bible study lessons'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 text-sm">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-3 sm:space-y-4">
                <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your.email@church.org"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-9 sm:pl-10 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className="text-sm">Password</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-9 sm:pl-10 pr-10 text-sm sm:text-base"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showSignInPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full text-sm sm:text-base"
                    variant="hero"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                    Enter your email and password to access your account
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-3 sm:space-y-4">
                <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        placeholder="Your full name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="pl-9 sm:pl-10 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@church.org"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-9 sm:pl-10 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-9 sm:pl-10 pr-10 text-sm sm:text-base"
                        minLength={8}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showSignUpPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full text-sm sm:text-base"
                    variant="hero"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                  <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                    By signing up, you agree to our terms of service and privacy policy
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-4 sm:mt-6">
          <Button variant="ghost" onClick={() => navigate('/')} size="sm" className="text-xs sm:text-sm">
            ? Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
