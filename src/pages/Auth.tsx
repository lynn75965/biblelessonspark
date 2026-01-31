import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Mail, User, Lock, Eye, EyeOff, ArrowLeft, Church, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useInvites } from '@/hooks/useInvites';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeEmail, sanitizeText } from '@/lib/inputSanitization';
import Footer from '@/components/Footer';
import { SITE } from '@/config/site';
import { BRANDING } from '@/config/branding';
import { validatePassword, PASSWORD_REQUIREMENTS_TEXT } from '@/constants/validation';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { isBetaMode } from '@/constants/systemSettings';
import { LegalModal } from '@/components/LegalModal';
import { BETA_ENROLLMENT_CONFIG, shouldShowPublicBetaEnrollment } from '@/constants/betaEnrollmentConfig';

// Public Beta Organization ID - SSOT: This should match system_settings or be fetched
const PUBLIC_BETA_ORG_ID = '9a5da69e-adf2-4661-8833-197940c255e0';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  
  // Get system settings for platform mode
  const { settings } = useSystemSettings();
  const platformMode = settings.current_phase as string;
  const isPublicBeta = shouldShowPublicBetaEnrollment(platformMode);
  
  const tabFromUrl = searchParams.get('tab');
  // Default to signin for returning visitors, signup for first-timers
  const getDefaultTab = () => {
    if (tabFromUrl === 'signin' || tabFromUrl === 'signup') return tabFromUrl;
    try {
      return localStorage.getItem('bls_has_account') === 'true' ? 'signin' : 'signup';
    } catch {
      return 'signup';
    }
  };
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const [isLoading, setIsLoading] = useState(false);
  const [inviterName, setInviterName] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  // NEW: State for email confirmation blocking
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    churchName: '',
    referralSource: '',
  });

  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const { getInviteByToken, claimInvite } = useInvites();
  const navigate = useNavigate();

  // SSOT: Text from BRANDING.beta, behavior from BETA_ENROLLMENT_CONFIG
  const FORM_TEXT = BRANDING.beta.form;
  const MESSAGES = BRANDING.beta.messages;

  // Handle password reset mode - must check BEFORE auth redirect
  useEffect(() => {
    const resetParam = searchParams.get('reset');
    if (resetParam === 'true') {
      setIsResetMode(true);
    }
  }, [searchParams]);

  // Prevent redirect to dashboard if in reset mode or showing email confirmation
  useEffect(() => {
    const resetParam = searchParams.get('reset');
    if (user && resetParam !== 'true' && !inviteToken && !showEmailConfirmation) {
      navigate('/dashboard');
    }
  }, [user, searchParams, navigate, inviteToken, showEmailConfirmation]);

  // Handle invite token
  // NOTE: toast intentionally excluded from deps to prevent infinite loop
  // (toast reference changes on every render but we only need to run on token change)
  useEffect(() => {
    let isMounted = true;
    
    const handleInvite = async () => {
      if (inviteToken) {
        const invite = await getInviteByToken(inviteToken);
        
        // Prevent state updates if component unmounted
        if (!isMounted) return;
        
        if (invite) {
          setFormData(prev => ({ ...prev, email: invite.email }));
          setActiveTab('signup');

          // Read inviter and org names directly from invite record
          if (invite.inviter_name) {
            setInviterName(invite.inviter_name);
          }
          if (invite.organization_name) {
            setOrganizationName(invite.organization_name);
          }

          toast({
            title: "You've been invited!",
            description: `${invite.inviter_name || 'Someone'} has invited you to join ${invite.organization_name || SITE.name}.`,
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
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteToken, getInviteByToken]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;

    setIsLoading(true);
    try {
      const sanitizedEmail = sanitizeEmail(formData.email);
      const { error, data } = await signIn(sanitizedEmail, formData.password);

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message || "Please check your email and password.",
          variant: "destructive",
        });
      } else {
        // Check if email is confirmed
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData?.user && !userData.user.email_confirmed_at) {
          // Email not confirmed - sign out and show confirmation required message
          setUnconfirmedEmail(sanitizedEmail);
          await supabase.auth.signOut();
          setShowEmailConfirmation(true);
          return;
        }
        
        toast({
          title: "Welcome!",
          description: "You have successfully signed in.",
        });
        // Remember this browser has an account for future visits
        try { localStorage.setItem('bls_has_account', 'true'); } catch {}
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

  // NEW: Handle resending verification email
  const handleResendVerification = async () => {
    if (!unconfirmedEmail) return;
    
    setIsResendingVerification(true);
    try {
      // Sign in temporarily to trigger resend
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: unconfirmedEmail,
        password: formData.password,
      });
      
      if (!signInError) {
        // Trigger verification email
        await supabase.functions.invoke('resend-verification');
        // Sign out again
        await supabase.auth.signOut();
        
        toast({
          title: "Verification email sent!",
          description: "Please check your inbox and spam folder.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to resend verification email. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  // Enroll user in Public Beta organization
  const enrollInPublicBeta = async (userId: string) => {
    try {
      // Add to organization_members
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: PUBLIC_BETA_ORG_ID,
          user_id: userId,
          role: 'member',
        });

      if (memberError && !memberError.message.includes('duplicate')) {
        console.error('Error adding to org members:', memberError);
      }

      // Update profile with organization_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          organization_id: PUBLIC_BETA_ORG_ID,
          church_name: formData.churchName || null,
          referral_source: formData.referralSource || null,
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }
    } catch (error) {
      console.error('Error enrolling in public beta:', error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.fullName) return;

    setIsLoading(true);
    try {
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

      const { error, data } = await signUp(sanitizedEmail, formData.password, sanitizedFullName);

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
        // CHECK FOR EXISTING USER: Supabase returns fake success with empty identities
        // when "Confirm email" is ON and the email already exists (security measure).
        // No email is sent in this case — detect it and redirect to Sign In.
        const isExistingUser = data?.user?.identities?.length === 0;
        
        if (isExistingUser) {
          toast({
            title: "You already have an account!",
            description: "Please sign in with your existing email and password. If you've forgotten your password, use 'Forgot Password' below.",
          });
          setActiveTab('signin');
          // Remember this browser has an account
          try { localStorage.setItem('bls_has_account', 'true'); } catch {}
          setIsLoading(false);
          return;
        }

        // INVITED USERS: Special flow - sign in immediately and go to dashboard
        if (inviteToken) {
          // Sign in the user to establish an active session
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: sanitizedEmail,
            password: formData.password,
          });

          if (signInError) {
            console.error('Failed to sign in after signup:', signInError);
            toast({
              title: "Account created",
              description: "Please sign in with your new credentials.",
            });
            setActiveTab('signin');
            return;
          }

          // Now we have an active session - claim the invite
          await claimInvite(inviteToken);
          
          // Confirm email automatically (they proved ownership via invite link)
          try {
            await supabase.functions.invoke('confirm-invite-email');
          } catch (confirmError) {
            console.error('Failed to auto-confirm email:', confirmError);
          }
          
          // Go directly to dashboard
          toast({
            title: "Welcome!",
            description: "Your account has been created. Taking you to your dashboard...",
          });
          // Remember this browser has an account
          try { localStorage.setItem('bls_has_account', 'true'); } catch {}
          navigate('/dashboard');
          return;
        }

        // Auto-enroll in Public Beta if in public_beta mode and no invite token
        if (isPublicBeta && data?.user?.id) {
          await enrollInPublicBeta(data.user.id);
        }

        // NON-INVITED USERS: Require email verification
        // Trigger verification email
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user && !userData.user.email_confirmed_at) {
            await supabase.functions.invoke('resend-verification');
          }
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
        }

        // Sign out and show email confirmation message
        setUnconfirmedEmail(sanitizedEmail);
        await supabase.auth.signOut();
        setShowEmailConfirmation(true);
        // Remember this browser has an account
        try { localStorage.setItem('bls_has_account', 'true'); } catch {}
        
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account before signing in.",
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
    const processedValue = field === 'email' ? value.toLowerCase() : value;
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  // NEW: Email Confirmation Required View
  if (showEmailConfirmation) {
    return (
      <div className={BRANDING.layout.authPageWrapper}>
        <div className={BRANDING.layout.authFormContainer}>
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-3 sm:mb-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gradient-primary">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold gradient-text">{SITE.name}</span>
            </div>
          </div>

          <Card className="bg-gradient-card shadow-glow">
            <CardHeader className="px-4 sm:px-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-lg sm:text-xl">Check Your Email</CardTitle>
              <CardDescription className="text-sm">
                Please verify your email address to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-4 text-center">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    We sent a verification link to:
                  </p>
                  <p className="font-medium text-foreground">{unconfirmedEmail}</p>
                </div>
                
                <div className="flex items-start gap-2 text-left bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    You must verify your email before you can sign in. Please check your inbox and spam folder.
                  </p>
                </div>

                <div className="pt-2 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleResendVerification}
                    disabled={isResendingVerification}
                  >
                    {isResendingVerification ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setShowEmailConfirmation(false);
                      setUnconfirmedEmail('');
                      setActiveTab('signin');
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  Already verified? Try signing in again after clicking the link in your email.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Reset Password Completion View
  if (isResetMode) {
    return (
      <div className={BRANDING.layout.authPageWrapper}>
        <div className={BRANDING.layout.authFormContainer}>
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
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 sm:pl-10 text-sm sm:text-base"
                      minLength={8}
                      required
                    />
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Password requirements:</p>
                  <ul className="space-y-0.5">
                    {PASSWORD_REQUIREMENTS_TEXT.map((req, i) => (
                      <li key={i}>â€¢ {req}</li>
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
      <div className={BRANDING.layout.authPageWrapper}>
        <div className={BRANDING.layout.authFormContainer}>
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
                        placeholder={FORM_TEXT.emailPlaceholder}
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
    <div className={BRANDING.layout.authPageWrapper}>
      <div className={BRANDING.layout.authFormContainer}>
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-3 sm:mb-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gradient-primary">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold gradient-text">{SITE.name}</span>
          </div>
          <h1 data-tour="signup-welcome" className="text-xl sm:text-2xl font-bold mb-2">
            {organizationName ? `Join ${organizationName} on ${SITE.name}` : (isPublicBeta ? FORM_TEXT.title : `Welcome to ${SITE.name}`)}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {isPublicBeta ? FORM_TEXT.subtitle : SITE.tagline}
          </p>
        </div>

        <Card className="bg-gradient-card shadow-glow">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">
              {inviteToken ? `Invitation from ${inviterName}` : 'Access Your Account'}
            </CardTitle>
            <CardDescription className="text-sm">
              {inviteToken
                ? `Create your account to join ${organizationName || SITE.name}`
                : 'Sign in to enhance your Bible study lessons'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Tabs value={inviteToken ? 'signup' : activeTab} onValueChange={setActiveTab}>
              {/* Hide tabs when invite token present - invited users must sign up */}
              {!inviteToken && (
                <TabsList className="grid w-full grid-cols-2 text-sm">
                  <TabsTrigger value="signin">{FORM_TEXT.signInLink}</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
              )}

              <TabsContent value="signin" className="space-y-3 sm:space-y-4">
                <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm">{FORM_TEXT.emailLabel}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder={FORM_TEXT.emailPlaceholder}
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-9 sm:pl-10 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className="text-sm">{FORM_TEXT.passwordLabel}</Label>
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
                        placeholder={FORM_TEXT.passwordPlaceholder}
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
                    <div className="bg-muted/50 rounded-lg p-2 text-xs text-muted-foreground">
                      <p className="font-medium mb-1">Password requirements:</p>
                      <ul className="space-y-0.5">
                        {PASSWORD_REQUIREMENTS_TEXT.map((req, i) => (
                          <li key={i}>â€¢ {req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full text-sm sm:text-base"
                    variant="hero"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : FORM_TEXT.signInLink}
                  </Button>
                  <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                    Enter your email and password to access your account
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-3 sm:space-y-4">
                <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm">{FORM_TEXT.fullNameLabel}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        placeholder={FORM_TEXT.fullNamePlaceholder}
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="pl-9 sm:pl-10 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm">{FORM_TEXT.emailLabel}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={FORM_TEXT.emailPlaceholder}
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-9 sm:pl-10 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm">{FORM_TEXT.passwordLabel}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? "text" : "password"}
                        placeholder={FORM_TEXT.passwordPlaceholder}
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
                    <div className="bg-muted/50 rounded-lg p-2 text-xs text-muted-foreground">
                      <p className="font-medium mb-1">Password requirements:</p>
                      <ul className="space-y-0.5">
                        {PASSWORD_REQUIREMENTS_TEXT.map((req, i) => (
                          <li key={i}>â€¢ {req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Optional fields for Public Beta mode - behavior from BETA_ENROLLMENT_CONFIG */}
                  {isPublicBeta && BETA_ENROLLMENT_CONFIG.features.collectChurchName && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-church" className="text-sm">{FORM_TEXT.churchNameLabel}</Label>
                      <div className="relative">
                        <Church className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          id="signup-church"
                          placeholder={FORM_TEXT.churchNamePlaceholder}
                          value={formData.churchName}
                          onChange={(e) => handleInputChange('churchName', e.target.value)}
                          className="pl-9 sm:pl-10 text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  )}

                  {isPublicBeta && BETA_ENROLLMENT_CONFIG.features.collectReferralSource && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-referral" className="text-sm">{FORM_TEXT.referralSourceLabel}</Label>
                      <Select 
                        value={formData.referralSource} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, referralSource: value }))}
                      >
                        <SelectTrigger id="signup-referral" className="text-sm sm:text-base">
                          <SelectValue placeholder={FORM_TEXT.referralSourcePlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {BETA_ENROLLMENT_CONFIG.referralSources.map((source) => (
                            <SelectItem key={source.value} value={source.value}>
                              {source.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button
                    data-tour="signup-create-button"
                    type="submit"
                    className="w-full text-sm sm:text-base"
                    variant="hero"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? FORM_TEXT.submittingButton : FORM_TEXT.submitButton}
                  </Button>
                  <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                    {FORM_TEXT.termsText}{' '}
                    <button type="button" onClick={() => setLegalModal('terms')} className="underline hover:text-primary">{FORM_TEXT.termsLink}</button>
                    {' '}and{' '}
                    <button type="button" onClick={() => setLegalModal('privacy')} className="underline hover:text-primary">{FORM_TEXT.privacyLink}</button>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-4 sm:mt-6">
          <Button variant="ghost" onClick={() => navigate('/')} size="sm" className="text-xs sm:text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
      {/* Legal Modal */}
      <LegalModal
        open={legalModal !== null}
        onClose={() => setLegalModal(null)}
        type={legalModal || 'terms'}
      />
    </div>
  );
}
