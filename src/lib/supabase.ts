
import { createClient } from '@supabase/supabase-js';

// These would come from your environment variables in production
// For self-hosted Supabase, these would be your self-hosted instance URLs and keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Anon Key is missing. Supabase functionality will be limited.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
