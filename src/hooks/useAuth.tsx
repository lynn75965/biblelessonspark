import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useInvites } from '@/hooks/useInvites';
import { logAuthEvent, logSecurityEvent } from '@/lib/auditLogger';
import { ROUTES } from "@/constants/routes";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  setUser: (user: User | null) => void;
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
  const { claimInvite } = useInvites();
  // Guards the pending-invite consumer so it fires at most once per mount.
  const pendingInviteHandledRef = useRef(false);

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

  // Consume a pending org invite on authenticated entry.
  //
  // The invited new-user path cannot complete the join inline: with email
  // confirmation ON, the post-signup sign-in fails and the ?invite= token is lost
  // across the email-confirmation redirect (the link lands on
  // emailRedirectTo=/dashboard with no token in the URL). Auth.tsx persists the
  // token to localStorage('bls_pending_invite') instead; this effect claims it the
  // moment a session exists. Hosting it here at the auth layer makes "finish the
  // join" a property of signing in rather than of viewing any one page.
  useEffect(() => {
    if (!user) return;
    // Synchronous guard BEFORE any await, so a re-render mid-claim cannot start a
    // second accept.
    if (pendingInviteHandledRef.current) return;

    let token: string | null = null;
    try { token = localStorage.getItem('bls_pending_invite'); } catch { /* localStorage unavailable (private browsing, disabled) -- safe to ignore */ }
    if (!token) return;

    pendingInviteHandledRef.current = true;

    (async () => {
      const { ok, retryable } = await claimInvite(token);
      if (ok) {
        try { localStorage.removeItem('bls_pending_invite'); } catch { /* localStorage unavailable (private browsing, disabled) -- safe to ignore */ }
        // Hard reload into an org-aware dashboard so every context (org,
        // subscription, sidebar gating) re-initializes from the updated DB.
        // AuthProvider is mounted above the Router, so useNavigate is unavailable
        // here. The short delay lets the success toast render before the reload.
        setTimeout(() => { window.location.assign(ROUTES.DASHBOARD); }, 1200);
      } else if (!retryable) {
        // Definitive failure (already-claimed / invalid / expired). Clear the
        // token so it cannot recur on every future authenticated entry.
        try { localStorage.removeItem('bls_pending_invite'); } catch { /* localStorage unavailable (private browsing, disabled) -- safe to ignore */ }
      }
      // Transient failure: leave the token in place. accept-org-invite is
      // retry-safe (claim stamp written last), so the next authenticated entry
      // (a fresh mount resets the ref) re-attempts the join.
    })();
  }, [user, claimInvite]);

  // Refresh the auth session whenever the tab regains focus.
  //
  // autoRefreshToken relies on a background timer that browsers throttle while a
  // tab is backgrounded. On a long idle/backgrounded session the access token
  // can expire without being refreshed, leaving the PostgREST client holding a
  // stale Authorization header -- every .rpc()/REST call then 401s in a wave,
  // while functions.invoke calls self-heal because they fetch a fresh token via
  // getSession() at call time. Calling getSession() here forces a refresh on
  // wake (it auto-refreshes an expired token), which fires TOKEN_REFRESHED and
  // updates the cached REST header so the first post-return query batch uses a
  // valid token instead of 401ing.
  useEffect(() => {
    const refreshOnFocus = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data: { session: refreshed } } = await supabase.auth.getSession();
      setSession(refreshed);
      setUser(refreshed?.user ?? null);
    };

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, []);

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
    setUser,
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
