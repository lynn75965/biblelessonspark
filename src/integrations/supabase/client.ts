// Hand-maintained. Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from the
// environment when present (local .env.local can point dev at a different
// project); falls back to the production values below when unset, so a
// Netlify build with no env override behaves exactly as it always has.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const PROD_SUPABASE_URL = "https://hphebzdftpjbiudpfcrs.supabase.co";
const PROD_SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwaGViemRmdHBqYml1ZHBmY3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDk0MjksImV4cCI6MjA3NjM4NTQyOX0.WSNtUrxihquk0ZV0tT7uaad8W3MNjIUwCD4hG0jr-eo";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || PROD_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || PROD_SUPABASE_PUBLISHABLE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
