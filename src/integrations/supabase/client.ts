// Hand-maintained. SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are the sole
// source of truth for this project -- no env var override exists, by
// design, so there is exactly one path to configure.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const SUPABASE_URL = "https://hphebzdftpjbiudpfcrs.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_-2ep_VXk9NQPCd72kEF5LA_aYtB5SWW";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
