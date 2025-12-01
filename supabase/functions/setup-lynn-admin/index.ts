import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const email = 'eckeberger@gmail.com';
    const password = '3527Raguet#';
    const fullName = 'Lynn Eckeberger';
    const profileId = 'd060b78e-0924-4dc6-9715-c2a47a6a2834';

    console.log('Setting up Lynn Eckeberger admin account...');

    // Check if auth user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email);

    let authUserId: string;

    if (existingUser) {
      console.log('Auth user exists, updating password...');
      
      // Update existing user's password
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { 
          password,
          user_metadata: { full_name: fullName }
        }
      );

      if (updateError) {
        throw new Error(`Failed to update password: ${updateError.message}`);
      }

      authUserId = existingUser.id;
      console.log('Password updated for existing user');
    } else {
      console.log('Creating new auth user...');
      
      // Create new auth user with the specific ID to match the profile
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { full_name: fullName },
        email_confirm: true
      });

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      authUserId = newUser.user.id;
      console.log('New auth user created');
    }

    // Update the profile to link it to the auth user ID
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        id: authUserId,
        full_name: fullName,
        role: 'admin'
      })
      .eq('id', profileId);

    if (profileUpdateError) {
      console.log('Profile update failed, creating new profile...');
      
      // If update fails, try to insert new profile
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUserId,
          full_name: fullName,
          role: 'admin'
        });

      if (insertError) {
        throw new Error(`Failed to create/update profile: ${insertError.message}`);
      }
    }

    // Verify the setup
    const { data: finalProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authUserId)
      .single();

    console.log('Lynn Eckeberger admin setup completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Lynn Eckeberger admin account set up successfully',
      authUserId,
      profile: finalProfile,
      credentials: {
        email,
        password: '***hidden***'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Setup error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check the function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});