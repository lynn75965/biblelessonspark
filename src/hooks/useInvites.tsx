import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Invite {
  email: string;
  token: string;
  created_at: string;
  claimed_at: string | null;
  claimed_by: string | null;
  created_by: string;
}

export function useInvites() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendInvite = async (email: string, role: string = 'teacher'): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: { email, role },
      });

      if (error) {
        console.error('Error sending invite:', error);
        toast({
          title: 'Failed to send invite',
          description: error.message || 'Please try again later.',
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

  const revokeInvite = async (token: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('invites')
        .delete()
        .eq('token', token)
        .is('claimed_by', null);

      if (error) {
        console.error('Error revoking invite:', error);
        toast({
          title: 'Failed to revoke invite',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Invite revoked',
        description: 'The invitation has been cancelled.',
      });
      return true;
    } catch (error: any) {
      console.error('Error revoking invite:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while revoking the invite.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const claimInvite = async (token: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign up first to claim this invite.',
          variant: 'destructive',
        });
        return false;
      }

      const { error } = await supabase
        .from('invites')
        .update({ 
          claimed_by: user.id, 
          claimed_at: new Date().toISOString() 
        })
        .eq('token', token)
        .is('claimed_by', null);

      if (error) {
        console.error('Error claiming invite:', error);
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Error claiming invite:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getInviteByToken = async (token: string): Promise<Invite | null> => {
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('token', token)
        .is('claimed_by', null)
        .single();

      if (error) {
        console.error('Error fetching invite:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching invite:', error);
      return null;
    }
  };

  return {
    loading,
    sendInvite,
    getMyInvites,
    revokeInvite,
    claimInvite,
    getInviteByToken,
  };
}
