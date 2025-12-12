import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Organization, OrganizationMember } from "@/constants/contracts";

// Re-export for backward compatibility
export type { Organization, OrganizationMember };

export function useOrganization() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserOrganization = async () => {
      if (!user) {
        setOrganization(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        // Get user's profile to find their organization
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('organization_id, organization_role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setLoading(false);
          return;
        }

        if (!profile?.organization_id) {
          setOrganization(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

        // Get organization details
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single();

        if (orgError) {
          console.error('Error fetching organization:', orgError);
        } else {
          // SECURITY FIX: Mask sensitive contact information for non-admin users
          // This provides defense-in-depth even though RLS policies should handle this
          const isAdmin = ['owner', 'admin'].includes(profile.organization_role || '');
          const maskedOrg = {
            ...org,
            email: isAdmin ? org.email : '***@***.***',
            phone: isAdmin ? org.phone : '***-***-****',
            address: isAdmin ? org.address : '*** *** ***'
          };
          setOrganization(maskedOrg);
        }

        setUserRole(profile.organization_role);
      } catch (error) {
        console.error('Error in fetchUserOrganization:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrganization();
  }, [user]);

  const createOrganization = async (orgData: Partial<Organization> & { name: string }) => {
    if (!user) throw new Error('User not authenticated');

    // Validate and refresh session before database operation
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      // Try to refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshedSession) {
        throw new Error('Authentication session expired. Please log in again.');
      }
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        ...orgData,
        created_by: user.id
      }])
      .select()
      .single();

    if (orgError) {
      if (orgError.message?.includes('row-level security policy')) {
        throw new Error('Authentication session not properly synchronized. Please log out and log back in.');
      }
      throw orgError;
    }

    // Add user as organization owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner'
      });

    if (memberError) throw memberError;

    // Update user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        organization_id: org.id,
        organization_role: 'owner'
      })
      .eq('id', user.id);

    if (profileError) throw profileError;

    setOrganization(org);
    setUserRole('owner');
    return org;
  };

  const joinOrganization = async (organizationId: string) => {
    if (!user) throw new Error('User not authenticated');

    // Add user to organization
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        role: 'member'
      });

    if (memberError) throw memberError;

    // Update user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        organization_id: organizationId,
        organization_role: 'member'
      })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // Fetch the organization details
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single();

        if (orgError) throw orgError;

        // SECURITY FIX: Mask sensitive contact information for new members (non-admin users)
        const maskedOrg = {
          ...org,
          email: '***@***.***', // Members don't see contact info
          phone: '***-***-****',
          address: '*** *** ***'
        };
        setOrganization(maskedOrg);
        setUserRole('member');
    return org;
  };

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!organization) throw new Error('No organization to update');
    if (!['owner', 'admin'].includes(userRole || '')) {
      throw new Error('Insufficient permissions');
    }

    const { data: updated, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organization.id)
      .select()
      .single();

    if (error) throw error;

    setOrganization(updated);
    return updated;
  };

  return {
    organization,
    userRole,
    loading,
    createOrganization,
    joinOrganization,
    updateOrganization,
    isAdmin: ['owner', 'admin'].includes(userRole || ''),
    hasOrganization: !!organization
  };
}
