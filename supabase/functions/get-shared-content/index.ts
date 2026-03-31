// supabase/functions/get-shared-content/index.ts
// Phase E: Public Edge Function -- no auth required
// Accepts POST body: { token: string, type: 'lesson'|'devotional'|'series', scope: 'full'|'handout' }
// scope 'handout' returns Section 8 content only (lessons and series)
// scope 'full' returns all content
// SSOT: share_token (full) and share_token_handout columns on lessons, lesson_series tables

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Extract Section 8 / Group Handout content from full lesson text */
function extractHandout(text: string): string {
  if (!text) return '';
  const match = text.match(
    /(?:##?\s*)?(?:Section\s*8[:\s]|GROUP\s+HANDOUT|Group\s+Handout)[^\n]*\n([\s\S]*?)(?=(?:##?\s*)?(?:Section\s*\d|STUDENT\s+TEASER|Student\s+Teaser)|$)/i
  );
  return match ? match[1].trim() : '';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const token = body?.token as string | undefined;
    const type  = body?.type  as string | undefined;
    const scope = (body?.scope as string | undefined) ?? 'full';

    if (!token || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing token or type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (type === 'lesson') {
      // Determine which column to match based on scope
      const tokenColumn = scope === 'handout' ? 'share_token_handout' : 'share_token';

      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, original_text, filters, metadata, created_at')
        .eq(tokenColumn, token)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Content not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const content = scope === 'handout'
        ? { ...data, original_text: extractHandout(data.original_text) }
        : data;

      return new Response(
        JSON.stringify({ type: 'lesson', scope, content }),
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
        JSON.stringify({ type: 'devotional', scope: 'full', content: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'series') {
      const tokenColumn = scope === 'handout' ? 'share_token_handout' : 'share_token';

      const { data: series, error: seriesError } = await supabase
        .from('lesson_series')
        .select('id, series_name, created_at, total_lessons')
        .eq(tokenColumn, token)
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

      const processedLessons = (lessons || []).map(l => ({
        ...l,
        original_text: scope === 'handout'
          ? extractHandout(l.original_text || '')
          : l.original_text,
      }));

      return new Response(
        JSON.stringify({ type: 'series', scope, content: { ...series, lessons: processedLessons } }),
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
