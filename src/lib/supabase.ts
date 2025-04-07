
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';

// These would typically come from your environment variables
// For self-hosted Supabase, these would be your self-hosted instance URLs and keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isProduction = window.location.protocol === 'https:' || 
                     !window.location.hostname.includes('localhost');

// For reverse proxy setups, we may need to use the current origin
const getBaseUrl = () => {
  if (!supabaseUrl) return '';
  
  // If we're behind a reverse proxy, use the current origin for API requests
  if (isProduction && supabaseUrl.includes('your-server-ip')) {
    return window.location.origin;
  }
  
  return supabaseUrl;
};

const effectiveSupabaseUrl = getBaseUrl();

if (!effectiveSupabaseUrl || !supabaseKey) {
  console.warn(
    'Supabase URL or Anon Key is missing. Make sure to set the following environment variables in your .env.local file:\n' +
    'VITE_SUPABASE_URL=http://your-server-ip:8000\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key-from-env-file'
  );
}

export const supabase = createClient(effectiveSupabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'freelancer-crm'
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test the connection when the app initializes
export const testSupabaseConnection = async () => {
  try {
    console.log(`Testing Supabase connection to: ${effectiveSupabaseUrl}`);
    
    const { data, error } = await supabase.from('fortnox_credentials').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      
      // Show toast notification for connection error
      toast({
        title: "Connection Error",
        description: `Failed to connect to database: ${error.message}`,
        variant: "destructive"
      });
      
      return { success: false, error: error.message };
    } else {
      console.log('Supabase connection successful');
      return { success: true };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to connect to Supabase:', errorMessage);
    
    // Show toast notification for connection error
    toast({
      title: "Connection Error",
      description: `Unable to reach Supabase: ${errorMessage}`,
      variant: "destructive"
    });
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Alternative approach for direct function calls without using Edge Functions
 * This can be used when you can't deploy Edge Functions to your self-hosted Supabase
 */
export const callFortnoxAPI = async (invoiceData: any, accessToken: string) => {
  try {
    // In a real implementation, you would directly call the Fortnox API here
    // using the provided access token
    console.log('Calling Fortnox API with:', { invoiceData, accessToken });
    
    // This is just a simulation - in reality you would call the actual API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return { 
      success: true, 
      message: 'Invoice exported to Fortnox (direct API call)' 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};

// Run the test if both URL and key are provided
if (effectiveSupabaseUrl && supabaseKey) {
  testSupabaseConnection()
    .then(result => {
      if (!result.success) {
        console.warn(`
          ⚠️ Supabase connection failed. Check your configuration:
          - Ensure VITE_SUPABASE_URL is correct (e.g., http://your-server-ip:8000)
          - Verify VITE_SUPABASE_ANON_KEY is correct
          - Make sure your Supabase instance is running
          - Check if the database table 'fortnox_credentials' exists
          - Check that VAULT_ENC_KEY is set and at least 32 characters long in your .env file
        `);
      }
    });
}
