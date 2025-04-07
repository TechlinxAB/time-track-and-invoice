
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

// Determine if we're in production based on hostname
const isProduction = window.location.hostname !== 'localhost';

// Get local Supabase host if specified
const localSupabaseHost = localStorage.getItem('supabase_local_ip') || 'localhost';

// Check if we're in HTTPS but need to use HTTP backend
const isUsingHttpsWithHttpBackend = window.location.protocol === 'https:' && 
  localStorage.getItem('force_http_backend') === 'true';

// For production, always use HTTPS. For local dev, respect the force_http_backend setting
let supabaseUrl;
if (isProduction) {
  // In production, use the configured URL or default to the main domain
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://timetracking.techlinx.se';
} else {
  // For local development
  const protocol = isUsingHttpsWithHttpBackend ? 'http://' : `${window.location.protocol}//`;
  supabaseUrl = `${protocol}${localSupabaseHost}:8000`;
}

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Environment:', isProduction ? 'Production' : 'Development');
console.log('Page is served via:', window.location.protocol);
console.log('Using Supabase URL:', supabaseUrl);
console.log('Using HTTP backend with HTTPS frontend:', isUsingHttpsWithHttpBackend);

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
  protocol: supabaseUrl.split(':')[0],
  usingHttpBackendWithHttpsFrontend: isUsingHttpsWithHttpBackend
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
    pageProtocol: window.location.protocol,
    forceHttpBackend: isUsingHttpsWithHttpBackend
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
