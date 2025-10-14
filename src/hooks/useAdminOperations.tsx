import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export function useAdminOperations() {
  const [loading, setLoading] = useState(false);

  const createUser = async (userData: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
  }) => {
    setLoading(true);
    try {
      // Get current session to pass JWT token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: {
          action: 'create_user',
          ...userData
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success('User created successfully');
      return data;
    } catch (error: any) {
      toast.error(`Failed to create user: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    setLoading(true);
    try {
      // Get current session to pass JWT token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: {
          action: 'update_role',
          user_id: userId,
          role
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success('User role updated successfully');
      return data;
    } catch (error: any) {
      toast.error(`Failed to update role: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    setLoading(true);
    try {
      // Get current session to pass JWT token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: {
          user_id: userId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Check for error in response body
      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('User deleted successfully');
      return data;
    } catch (error: any) {
      toast.error(`Failed to delete user: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (userId: string, password: string) => {
    setLoading(true);
    try {
      // Get current session to pass JWT token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: {
          action: 'reset_password',
          user_id: userId,
          password
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Password reset successfully');
      return data;
    } catch (error: any) {
      toast.error(`Failed to reset password: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const setupLynnAdmin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-lynn-admin');

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Lynn Eckeberger admin account set up successfully');
      return data;
    } catch (error: any) {
      toast.error(`Failed to setup admin: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createUser,
    updateUserRole,
    deleteUser,
    resetPassword,
    setupLynnAdmin,
    loading
  };
}