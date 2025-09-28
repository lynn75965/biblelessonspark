import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create admin client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface AdminRequest {
  action: 'create_user' | 'update_role' | 'delete_user' | 'reset_password';
  email?: string;
  password?: string;
  full_name?: string;
  role?: string;
  user_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user is admin in profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Insufficient permissions - admin role required');
    }

    const { action, email, password, full_name, role, user_id }: AdminRequest = await req.json();

    console.log(`Admin operation: ${action} by user ${user.id}`);

    switch (action) {
      case 'create_user': {
        if (!email || !password || !full_name) {
          throw new Error('Missing required fields: email, password, full_name');
        }

        // Create auth user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          user_metadata: { full_name },
          email_confirm: true
        });

        if (createError) {
          throw new Error(`Failed to create user: ${createError.message}`);
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: newUser.user.id,
            full_name,
            role: role || 'teacher'
          });

        if (profileError) {
          // If profile creation fails, delete the auth user
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
          throw new Error(`Failed to create profile: ${profileError.message}`);
        }

        console.log(`Created user: ${email} with role: ${role || 'teacher'}`);
        return new Response(JSON.stringify({ success: true, user: newUser.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_role': {
        if (!user_id || !role) {
          throw new Error('Missing required fields: user_id, role');
        }

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ role })
          .eq('id', user_id);

        if (updateError) {
          throw new Error(`Failed to update role: ${updateError.message}`);
        }

        console.log(`Updated user ${user_id} role to: ${role}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete_user': {
        if (!user_id) {
          throw new Error('Missing required field: user_id');
        }

        // Delete auth user (this will cascade to profile via foreign key)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

        if (deleteError) {
          throw new Error(`Failed to delete user: ${deleteError.message}`);
        }

        console.log(`Deleted user: ${user_id}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'reset_password': {
        if (!user_id || !password) {
          throw new Error('Missing required fields: user_id, password');
        }

        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          password
        });

        if (resetError) {
          throw new Error(`Failed to reset password: ${resetError.message}`);
        }

        console.log(`Reset password for user: ${user_id}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Admin management error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check the function logs for more information'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});