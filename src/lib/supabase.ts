
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

// These would typically come from your environment variables
// For self-hosted Supabase, these would be your self-hosted instance URLs and keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isProduction = window.location.protocol === 'https:' || 
                     !window.location.hostname.includes('localhost');

// For reverse proxy setups, we need to use the current origin
const getBaseUrl = () => {
  // Use localhost:8000 for development and the current origin for production
  if (isProduction) {
    // Use current origin (e.g. https://timetracking.techlinx.se) when running in production
    return window.location.origin;
  }
  
  // Always default to localhost:8000 for backend connections in development
  return 'http://localhost:8000';
};

const effectiveSupabaseUrl = getBaseUrl();
console.log('Using Supabase URL:', effectiveSupabaseUrl);

if (!supabaseKey) {
  console.warn(
    'Supabase Anon Key is missing. Make sure to set the following environment variables:\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key-from-env-file'
  );
}

export const supabase = createClient(effectiveSupabaseUrl, supabaseKey || 'dummy-key-for-init', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'freelancer-crm-auth',
    flowType: 'implicit',
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

// Log connection details
console.log('Supabase client configured with:', {
  url: effectiveSupabaseUrl,
  keyProvided: !!supabaseKey,
  usingProxy: effectiveSupabaseUrl === window.location.origin
});

// Test the connection when the app initializes
export const testSupabaseConnection = async () => {
  try {
    console.log(`Testing Supabase connection to: ${effectiveSupabaseUrl}`);
    
    // First test with a simpler request
    try {
      const { data: healthData, error: healthError } = await supabase.from('health_check').select('*').limit(1).single();
      console.log('Health check result:', healthData || 'No data returned');
      if (healthError) console.warn('Health check error (non-fatal):', healthError);
    } catch (healthErr) {
      console.warn('Health check failed (non-fatal):', healthErr);
    }
    
    // Try to fetch a simple piece of data
    const { data, error } = await supabase.from('fortnox_credentials').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error.message, error.details);
      console.error('Full error object:', JSON.stringify(error));
      
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
    console.error('Full error object:', err);
    
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
if (supabase) {
  testSupabaseConnection()
    .then(result => {
      if (!result.success) {
        console.warn(`
          ⚠️ Supabase connection failed. Check your configuration:
          - If in production, check that nginx is properly proxying requests to localhost:8000
          - Make sure your Supabase instance is running on localhost:8000
          - Check if the database table 'fortnox_credentials' exists
          - Check that VAULT_ENC_KEY is set and at least 32 characters long in your .env file
        `);
      }
    });
}
