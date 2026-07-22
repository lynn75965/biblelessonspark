import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "npm:pdf-lib@1.17.1";

// Org Resource Library upload. A leader posts a verbatim PDF (e.g. a
// training booklet) that is stored as-is in the private org-resources
// bucket and made visible to every member of their organization. This
// function runs service-role and therefore BYPASSES the table/storage RLS
// entirely -- it must reimplement is_org_leader()'s own check in
// application code (profiles.organization_id + organization_role) before
// writing anything, since the RLS is never actually evaluated for a
// service-role write.
//
// Storage path convention: {organization_id}/{resource_id}.pdf, where
// resource_id is a freshly generated UUID (not the original filename).
// This is required by the storage RLS quals, which read
// (storage.foldername(name))[1]::uuid as the organization id, and it also
// means every upload gets a brand-new path -- a delete-then-reupload can
// never collide with a stale object, since there is deliberately no
// UPDATE policy on storage.objects for this bucket (replace = delete +
// insert, by design).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_FILE_SIZE = 26214400; // 25MB -- matches the org-resources bucket's file_size_limit exactly
const ALLOWED_MIME = 'application/pdf'; // matches the bucket's allowed_mime_types exactly

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // -- STEP 1: Auth -- resolve caller from their own forwarded JWT --
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    // -- STEP 2: Parse the multipart form --
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string | null)?.trim() ?? "";
    const description = (formData.get("description") as string | null)?.trim() || null;
    const organizationId = formData.get("organization_id") as string | null;

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'organization_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!title) {
      return new Response(JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!file) {
      return new Response(JSON.stringify({ error: 'File is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // -- STEP 3: Authorization -- mirrors is_org_leader(organizationId)'s
    // own SQL exactly (profiles.organization_id = organizationId AND
    // organization_role IN ('leader', 'co-leader')). The RLS never runs
    // for this service-role client, so this check IS the enforcement. --
    const { data: profile } = await adminClient
      .from('profiles')
      .select('organization_id, organization_role')
      .eq('id', user.id)
      .single();

    const isLeader = !!profile
      && profile.organization_id === organizationId
      && (profile.organization_role === 'leader' || profile.organization_role === 'co-leader');

    if (!isLeader) {
      return new Response(JSON.stringify({ error: 'Forbidden - leader role required for this organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // -- STEP 4: Validate the file itself -- matches the bucket's own
    // allowed_mime_types / file_size_limit exactly (not the unrelated
    // 10MB/.pdf+.txt+images constants in src/lib/fileValidation.ts, which
    // were built for a different upload path). --
    if (file.type !== ALLOWED_MIME) {
      return new Response(JSON.stringify({ error: 'Only PDF files are allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'File exceeds 25MB limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // -- STEP 5: Page count -- best-effort via pdf-lib (already a project
    // dependency, used client-side for series PDF export). A malformed PDF
    // that nonetheless passed the MIME check should not fail the whole
    // upload -- page count is metadata, not a correctness gate. --
    let pageCount: number | null = null;
    try {
      const pdfDoc = await PDFDocument.load(bytes);
      pageCount = pdfDoc.getPageCount();
    } catch (pdfError) {
      console.error('Could not parse PDF for page count:', pdfError);
      pageCount = null;
    }

    // -- STEP 6: Write the file, then the row. Path convention:
    // {organization_id}/{resource_id}.pdf --
    const resourceId = crypto.randomUUID();
    const filePath = `${organizationId}/${resourceId}.pdf`;

    const { error: uploadError } = await adminClient.storage
      .from('org-resources')
      .upload(filePath, bytes, { contentType: ALLOWED_MIME, upsert: false });

    if (uploadError) {
      console.error('Storage upload failed:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to store file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: resource, error: insertError } = await adminClient
      .from('org_resources')
      .insert({
        id: resourceId,
        organization_id: organizationId,
        uploaded_by: user.id,
        title,
        description,
        file_path: filePath,
        file_size: file.size,
        page_count: pageCount,
      })
      .select('id, organization_id, uploaded_by, title, description, file_path, file_size, page_count, created_at')
      .single();

    if (insertError) {
      // Never leave an orphaned file behind -- the row is the only thing
      // that makes the file discoverable at all.
      console.error('org_resources insert failed, cleaning up storage object:', insertError);
      const { error: cleanupError } = await adminClient.storage.from('org-resources').remove([filePath]);
      if (cleanupError) {
        console.error('Cleanup of orphaned storage object also failed:', filePath, cleanupError);
      }
      return new Response(JSON.stringify({ error: 'Failed to save resource' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, resource }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Unexpected error in upload-org-resource:', error);
    return new Response(JSON.stringify({ error: (error as { message?: string })?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
