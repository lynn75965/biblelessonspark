import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Mail, User, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useInvites } from '@/hooks/useInvites';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeEmail, sanitizeText } from '@/lib/inputSanitization';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  
  const [activeTab, setActiveTab] = useState('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [inviterName, setInviterName] = useState<string>('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const { getInviteByToken, claimInvite } = useInvites();
  const navigate = useNavigate();

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
            description: `${inviterProfile?.full_name || 'Someone'} has invited you to join LessonSpark USA.`,
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
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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
      // Sanitize inputs
      const sanitizedEmail = sanitizeEmail(formData.email);
      const sanitizedFullName = sanitizeText(formData.fullName);
      
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

  const handleInputChange = (field: string, value: string) => {
    // Basic input sanitization on change
    const sanitizedValue = field === 'email' ? value.toLowerCase().trim() : 
                          field === 'fullName' ? sanitizeText(value) : value;
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md px-4 sm:px-0">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-3 sm:mb-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gradient-primary">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold gradient-text">LessonSpark USA</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Welcome to LessonSpark USA</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Baptist Bible Study Enhancement Platform
          </p>
        </div>

        <Card className="bg-gradient-card shadow-glow">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">
              {inviteToken ? `Invitation from ${inviterName}` : 'Access Your Account'}
            </CardTitle>
            <CardDescription className="text-sm">
              {inviteToken 
                ? 'Complete your sign up to join LessonSpark USA' 
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
                    <Label htmlFor="signin-password" className="text-sm">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-9 sm:pl-10 text-sm sm:text-base"
                        required
                      />
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
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-9 sm:pl-10 text-sm sm:text-base"
                        minLength={6}
                        required
                      />
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
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}