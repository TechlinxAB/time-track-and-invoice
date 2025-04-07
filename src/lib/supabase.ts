
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

// Determine if we're in production based on hostname
const isProduction = window.location.hostname !== 'localhost';

// Check if user has specified a custom local IP/host and protocol preference
const localSupabaseHost = localStorage.getItem('supabase_local_ip') || 'localhost';
const preferredProtocol = localStorage.getItem('supabase_protocol') || 'http';

// Determine the proper protocol to use
const currentPageProtocol = window.location.protocol;
const useSecureProtocol = isProduction 
  ? currentPageProtocol === 'https:' 
  : preferredProtocol === 'https';

// Build the proper protocol string
const protocolString = useSecureProtocol ? 'https://' : 'http://';

// Select appropriate Supabase URL and key based on environment
const supabaseUrl = isProduction 
  ? (import.meta.env.VITE_SUPABASE_URL || 'https://timetracking.techlinx.se')
  : `${protocolString}${localSupabaseHost}:8000`;

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Environment:', isProduction ? 'Production' : 'Development');
console.log('Protocol being used:', protocolString);
console.log('Page is served via:', currentPageProtocol);
console.log('Using Supabase URL:', supabaseUrl);

if (!supabaseKey) {
  console.warn(
    'Supabase Anon Key is missing. Using dummy key for initialization.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey || 'dummy-key-for-init', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'freelancer-crm-auth',
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
  url: supabaseUrl,
  keyProvided: !!supabaseKey,
  usingProxy: supabaseUrl === window.location.origin,
  protocol: supabaseUrl.split(':')[0]
});

// Test the connection when the app initializes
export const testSupabaseConnection = async () => {
  try {
    console.log(`Testing Supabase connection to: ${supabaseUrl}`);
    
    // First test with a simpler request
    try {
      const { data: healthData, error: healthError } = await supabase.from('health_check').select('*').limit(1);
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
    
    // Check for specific mixed content error
    const errorString = String(err);
    const isMixedContentError = 
      errorString.includes('Mixed Content') || 
      errorString.includes('blocked:mixed-content');
      
    if (isMixedContentError) {
      console.error('MIXED CONTENT ERROR DETECTED: Your browser is blocking HTTP requests from HTTPS page');
      
      if (!isProduction) {
        // Suggest switching to HTTPS for local development
        toast({
          title: "Protocol Mismatch",
          description: "Your page is using HTTPS but trying to connect to Supabase over HTTP. Try switching to HTTPS protocol.",
          variant: "destructive"
        });
      }
    }
    
    // Show toast notification for connection error
    toast({
      title: "Connection Error",
      description: `Unable to reach Supabase: ${errorMessage}`,
      variant: "destructive"
    });
    
    return { success: false, error: errorMessage };
  }
};

// Update Index page to show more helpful connection info
export const getConnectionDetails = () => {
  return {
    url: supabaseUrl,
    environment: isProduction ? 'Production' : 'Development',
    usingProxy: supabaseUrl === window.location.origin,
    localHost: isProduction ? null : localSupabaseHost,
    protocol: supabaseUrl.split(':')[0],
    pageProtocol: window.location.protocol
  };
};

// Run the test if both URL and key are provided
console.log('Testing Supabase connection on startup with URL:', supabaseUrl);
testSupabaseConnection()
  .then(result => {
    if (!result.success) {
      console.warn(`
        ⚠️ Supabase connection failed. Check your configuration:
        - Make sure your Supabase instance is running on ${localSupabaseHost}:8000
        - Check if the database table 'fortnox_credentials' exists
        - Check that VAULT_ENC_KEY is set and at least 32 characters long in your .env file
      `);
    }
  });
