import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logAuthEvent, logSecurityEvent } from '@/lib/auditLogger';
import { ROUTES } from "@/constants/routes";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
  isSessionExpired: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const { toast } = useToast();

  // Session timeout (30 minutes of inactivity)
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Track user activity for session timeout
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    setIsSessionExpired(false);
  }, []);

  // Check for session expiration
  useEffect(() => {
    if (!session || !user) return;

    const checkSession = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        setIsSessionExpired(true);
        logSecurityEvent('session_timeout', user.id);
        signOut();
        toast({
          title: "Session Expired",
          description: "Your session has expired due to inactivity. Please sign in again.",
          variant: "destructive",
        });
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [session, user, lastActivity, toast]);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const activityHandler = () => updateActivity();
    
    events.forEach(event => {
      document.addEventListener(event, activityHandler, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, activityHandler, true);
      });
    };
  }, [updateActivity]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Log auth events
        if (event === 'SIGNED_IN' && session?.user) {
          logAuthEvent('login', session.user.id);
          updateActivity();
        } else if (event === 'SIGNED_OUT') {
          // Don't log signout if we don't have a user (already logged)
          setIsSessionExpired(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        updateActivity();
      }
    });

    return () => subscription.unsubscribe();
  }, [updateActivity]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error) {
        // Log successful login attempt
      }
      
      return { error };
    } catch (error) {
      logSecurityEvent('login_error', 'unknown', { email, error: error.message });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${ROUTES.DASHBOARD}`,
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (!error && data.user) {
        logAuthEvent('signup', data.user.id, { email });
      }
      
      return { error };
    } catch (error) {
      logSecurityEvent('signup_error', 'unknown', { email, error: error.message });
      return { error };
    }
  };

  const signOut = async () => {
    const currentUser = user;
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else if (currentUser) {
      logAuthEvent('logout', currentUser.id);
    }
  };

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
    isSessionExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
