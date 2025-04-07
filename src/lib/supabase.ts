
import { createClient } from '@supabase/supabase-js';

// These would typically come from your environment variables
// For self-hosted Supabase, these would be your self-hosted instance URLs and keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Anon Key is missing. Supabase functionality will be limited.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection when the app initializes
const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('fortnox_credentials').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error.message);
    } else {
      console.log('Supabase connection successful');
    }
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
  }
};

// Run the test if both URL and key are provided
if (supabaseUrl && supabaseKey) {
  testSupabaseConnection();
}

