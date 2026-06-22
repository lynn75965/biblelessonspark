import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Invite {
  id: string;
  email: string;
  token: string;
  created_at: string;
  claimed_at: string | null;
  claimed_by: string | null;
  created_by: string;
  organization_id: string | null;
  inviter_name: string | null;
  organization_name: string | null;
}

interface SendInviteOptions {
  email: string;
  role?: string;
  organization_id?: string;
}

export function useInvites() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendInvite = useCallback(async (options: SendInviteOptions): Promise<boolean> => {
    const { email, role = 'teacher', organization_id } = options;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: { email, role, organization_id },
      });

      if (error) {
        console.error('Error sending invite:', error);
        
        // Extract error message from Edge Function response
        // supabase.functions.invoke puts non-2xx response body in error.context
        let errorMessage = 'Please try again later.';
        
        if (error.context) {
          try {
            // error.context is the Response object for non-2xx status codes
            const responseBody = await error.context.json();
            errorMessage = responseBody.error || responseBody.message || errorMessage;
          } catch {
            errorMessage = error.message || errorMessage;
          }
        } else {
          errorMessage = error.message || errorMessage;
        }
        
        toast({
          title: 'Failed to send invite',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }

      if (data?.error) {
        toast({
          title: 'Failed to send invite',
          description: data.error,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Invitation sent!',
        description: `An invitation email has been sent to ${email}`,
      });
      return true;
    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while sending the invite.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Legacy support: string email parameter
  const sendInviteLegacy = useCallback(async (email: string, role: string = 'teacher'): Promise<boolean> => {
    return sendInvite({ email, role });
  }, [sendInvite]);

  const getInviteByToken = useCallback(async (token: string): Promise<Invite | null> => {
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('token', token)
        .is('claimed_at', null)
        .single();

      if (error) {
        console.error('Error fetching invite:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching invite:', error);
      return null;
    }
  }, []);

  // Returns { ok, retryable }. retryable distinguishes a transient failure (no
  // HTTP response or 5xx -- keep the pending token and retry on the next
  // authenticated entry) from a definitive one (4xx already-claimed/invalid/
  // expired, or a 200 body that still carries data.error -- clear the token so it
  // cannot recur). The AuthProvider consumer relies on this distinction.
  const claimInvite = useCallback(async (token: string): Promise<{ ok: boolean; retryable: boolean }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        // No session yet -- transient: keep the token and retry once signed in.
        return { ok: false, retryable: true };
      }

      // Server-side accept: the accept-org-invite Edge Function runs under service
      // role and performs every privileged write -- stamp the invite claimed, set
      // profiles.organization_id + organization_role = ORG_ROLES.member, and insert
      // the organization_members row. RLS forbids that member insert from the client,
      // so it MUST happen server-side.
      const { data, error } = await supabase.functions.invoke('accept-org-invite', {
        body: { token },
      });

      if (error || data?.error) {
        let errorMessage = 'Failed to accept the invitation. Please try again.';
        let retryable = false;
        if (error?.context) {
          // error.context is the Response object for non-2xx status codes. Its
          // status classifies the failure: 5xx (or missing) is transient; 4xx is
          // definitive.
          const status = error.context.status;
          retryable = !status || status >= 500;
          try {
            const responseBody = await error.context.json();
            errorMessage = responseBody.error || responseBody.message || errorMessage;
          } catch {
            errorMessage = error.message || errorMessage;
          }
        } else if (data?.error) {
          // 200 response carrying an error -> the function ran and rejected the
          // request. Definitive, never retryable.
          errorMessage = data.error;
          retryable = false;
        } else if (error) {
          // Transport/network error with no HTTP response -> transient.
          errorMessage = error.message || errorMessage;
          retryable = true;
        }

        console.error('Error accepting invite:', error || data?.error);
        toast({
          title: 'Could not join organization',
          description: errorMessage,
          variant: 'destructive',
        });
        return { ok: false, retryable };
      }

      toast({
        title: 'Welcome to the team!',
        description: "You've joined the organization.",
      });
      return { ok: true, retryable: false };
    } catch (error) {
      console.error('Error claiming invite:', error);
      // Thrown/network failure -> transient.
      return { ok: false, retryable: true };
    }
  }, [toast]);

  const getMyInvites = useCallback(async (): Promise<Invite[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invites:', error);
        toast({
          title: 'Failed to load invites',
          description: error.message,
          variant: 'destructive',
        });
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('Error fetching invites:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading invites.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getOrgInvites = useCallback(async (organizationId: string): Promise<Invite[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching org invites:', error);
        toast({
          title: 'Failed to load invites',
          description: error.message,
          variant: 'destructive',
        });
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('Error fetching org invites:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading invites.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const cancelInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId);

      if (error) {
        console.error('Error canceling invite:', error);
        toast({
          title: 'Failed to cancel invite',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Invite canceled',
        description: 'The invitation has been canceled.',
      });
      return true;
    } catch (error: any) {
      console.error('Error canceling invite:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resendInvite = useCallback(async (invite: Invite): Promise<boolean> => {
    return sendInvite({
      email: invite.email,
      organization_id: invite.organization_id || undefined
    });
  }, [sendInvite]);

  return {
    loading,
    sendInvite,
    sendInviteLegacy,
    getInviteByToken,
    claimInvite,
    getMyInvites,
    getOrgInvites,
    cancelInvite,
    resendInvite,
  };
}
