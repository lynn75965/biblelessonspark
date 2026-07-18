import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey    = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // -- Step 1: Auth header present --
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // -- Step 2: Verify caller JWT, then admin role via has_role RPC --
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: isAdmin, error: roleError } = await authClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden - admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // -- Parse and validate body --
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (user_id === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot impersonate your own admin account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // -- Step 3: Service-role client; fetch target user email --
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    const { data: targetData, error: getUserError } =
      await adminClient.auth.admin.getUserById(user_id);

    if (getUserError || !targetData?.user?.email) {
      console.error('getUserById error:', getUserError);
      return new Response(JSON.stringify({ error: 'Target user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const targetEmail = targetData.user.email;

    // -- Step 4: Generate one-time magic link --
    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: targetEmail,
        options: { redirectTo: 'https://biblelessonspark.com/dashboard' }
      });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('generateLink error:', linkError);
      return new Response(
        JSON.stringify({ error: `Failed to generate magic link: ${linkError?.message || 'unknown'}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${user.id} generated impersonation link for user ${user_id} (${targetEmail})`);

    // -- Step 5: Return link URL --
    return new Response(
      JSON.stringify({ url: linkData.properties.action_link }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: (error as { message?: string })?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
