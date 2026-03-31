// supabase/functions/get-shared-content/index.ts
// Phase E: Public Edge Function -- no auth required
// Reads lesson, devotional, or series content by share_token
// SSOT: share_token columns on lessons, devotionals, lesson_series tables

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Accept both POST (supabase.functions.invoke) and GET (direct URL)
    let token: string | null = null;
    let type: string | null = null;

    if (req.method === 'POST') {
      const body = await req.json();
      token = body.token ?? null;
      type  = body.type ?? null;
    } else {
      const url = new URL(req.url);
      token = url.searchParams.get('token');
      type  = url.searchParams.get('type');
    }

    if (!token || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing token or type parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (type === 'lesson') {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, original_text, filters, metadata, created_at')
        .eq('share_token', token)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Content not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ type: 'lesson', content: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'devotional') {
      const { data, error } = await supabase
        .from('devotionals')
        .select('id, title, bible_passage, content, created_at')
        .eq('share_token', token)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Content not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ type: 'devotional', content: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'series') {
      const { data: series, error: seriesError } = await supabase
        .from('lesson_series')
        .select('id, series_name, created_at, total_lessons')
        .eq('share_token', token)
        .single();

      if (seriesError || !series) {
        return new Response(
          JSON.stringify({ error: 'Content not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, original_text, series_lesson_number')
        .eq('series_id', series.id)
        .order('series_lesson_number', { ascending: true });

      if (lessonsError) {
        return new Response(
          JSON.stringify({ error: 'Could not load series lessons' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ type: 'series', content: { ...series, lessons: lessons || [] } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid type parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
