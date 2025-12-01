import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// SSOT Import
import { ORG_ROLES } from '@/constants/accessControl';

interface Invite {
  id: string;
  email: string;
  token: string;
  created_at: string;
  claimed_at: string | null;
  claimed_by: string | null;
  created_by: string;
  organization_id: string | null;
}

interface SendInviteOptions {
  email: string;
  role?: string;
  organization_id?: string;
}

export function useInvites() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendInvite = async (options: SendInviteOptions): Promise<boolean> => {
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
  };

  // Legacy support: string email parameter
  const sendInviteLegacy = async (email: string, role: string = 'teacher'): Promise<boolean> => {
    return sendInvite({ email, role });
  };

  const getInviteByToken = async (token: string): Promise<Invite | null> => {
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
  };

  const claimInvite = async (token: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return false;
      }

      // Get the invite details first
      const { data: invite, error: fetchError } = await supabase
        .from('invites')
        .select('*')
        .eq('token', token)
        .is('claimed_at', null)
        .single();

      if (fetchError || !invite) {
        console.error('Error fetching invite to claim:', fetchError);
        return false;
      }

      // Mark invite as claimed
      const { error: claimError } = await supabase
        .from('invites')
        .update({
          claimed_at: new Date().toISOString(),
          claimed_by: user.id,
        })
        .eq('id', invite.id);

      if (claimError) {
        console.error('Error claiming invite:', claimError);
        return false;
      }

      // If invite has organization_id, add user to organization
      if (invite.organization_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            organization_id: invite.organization_id,
            organization_role: ORG_ROLES.member, // New members join as 'member'
          })
          .eq('id', user.id);

        if (profileError) {
          console.error('Error joining organization:', profileError);
          toast({
            title: 'Partial success',
            description: 'Account created but failed to join organization. Contact your organization leader.',
            variant: 'destructive',
          });
        } else {
          // Get org name for toast
          const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', invite.organization_id)
            .single();

          toast({
            title: 'Welcome to the team!',
            description: `You've joined ${org?.name || 'the organization'}.`,
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error claiming invite:', error);
      return false;
    }
  };

  const getMyInvites = async (): Promise<Invite[]> => {
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
  };

  const getOrgInvites = async (organizationId: string): Promise<Invite[]> => {
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
  };

  const cancelInvite = async (inviteId: string): Promise<boolean> => {
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
  };

  const resendInvite = async (invite: Invite): Promise<boolean> => {
    return sendInvite({
      email: invite.email,
      organization_id: invite.organization_id || undefined
    });
  };

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
