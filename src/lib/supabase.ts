
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

// Determine if we're in production based on hostname
const isProduction = window.location.hostname !== 'localhost';

// Get local Supabase host if specified
const localSupabaseHost = localStorage.getItem('supabase_local_ip') || 'localhost';

// Check if we're using a reverse proxy path
const useReverseProxy = localStorage.getItem('use_reverse_proxy') === 'true';
const reverseProxyPath = localStorage.getItem('reverse_proxy_path') || '/supabase';

// Check if we're in HTTPS but need to use HTTP backend
const isUsingHttpsWithHttpBackend = window.location.protocol === 'https:' && 
  localStorage.getItem('force_http_backend') === 'true';

// Maximum time to wait for connection in milliseconds
const CONNECTION_TIMEOUT = 5000; // 5 seconds timeout

// Determine the Supabase URL based on environment and configuration
let supabaseUrl;

if (useReverseProxy) {
  // Use the reverse proxy path with the current origin
  supabaseUrl = `${window.location.origin}${reverseProxyPath}`;
  console.log('Using reverse proxy for Supabase at:', supabaseUrl);
} else if (isProduction) {
  if (isUsingHttpsWithHttpBackend) {
    // Use HTTP for backend even when frontend is HTTPS (user explicitly enabled this)
    supabaseUrl = `http://${localSupabaseHost}:8000`;
  } else {
    // In production, try to use the same protocol as the frontend
    supabaseUrl = `${window.location.protocol}//${localSupabaseHost}:8000`;
  }
} else {
  // For local development
  const protocol = isUsingHttpsWithHttpBackend ? 'http://' : `${window.location.protocol}//`;
  supabaseUrl = `${protocol}${localSupabaseHost}:8000`;
}

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Environment:', isProduction ? 'Production' : 'Development');
console.log('Protocol being used:', window.location.protocol);
console.log('Page is served via:', window.location.protocol);
console.log('Using Supabase URL:', supabaseUrl);
console.log('Using HTTP backend with HTTPS frontend:', isUsingHttpsWithHttpBackend);
console.log('Using reverse proxy:', useReverseProxy);
if (useReverseProxy) console.log('Reverse proxy path:', reverseProxyPath);

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
  usingHttpBackendWithHttpsFrontend: isUsingHttpsWithHttpBackend,
  usingReverseProxy: useReverseProxy
});

// Test the connection with a timeout
export const testSupabaseConnection = async () => {
  try {
    console.log(`Testing Supabase connection to: ${supabaseUrl}`);
    
    // Create a promise that rejects after a timeout
    const timeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Connection timed out after ${CONNECTION_TIMEOUT/1000} seconds`));
      }, CONNECTION_TIMEOUT);
    });
    
    // Try the simple health check with timeout
    const healthCheck = async () => {
      try {
        const { data: healthData, error: healthError } = await supabase.from('health_check').select('*').limit(1);
        if (healthError) throw healthError;
        return healthData;
      } catch (healthErr) {
        throw healthErr;
      }
    };
    
    // Race the health check against the timeout
    const healthData = await Promise.race([healthCheck(), timeout]);
    console.log('Health check result:', healthData || 'No data returned');
    
    // If we get here, the health check was successful, try the main query
    try {
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
        
        return { success: false, error: error.message, timeout: false };
      } else {
        console.log('Supabase connection successful');
        return { success: true, timeout: false };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to connect to Supabase:', errorMessage);
      console.error('Full error object:', err);
      
      toast({
        title: "Connection Error",
        description: `Unable to reach Supabase: ${errorMessage}`,
        variant: "destructive"
      });
      
      return { success: false, error: errorMessage, timeout: false };
    }
  } catch (err) {
    const isTimeout = err instanceof Error && err.message.includes('timed out');
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    console.error(`Supabase connection ${isTimeout ? 'timed out' : 'failed'}:`, errorMessage);
    console.error('Full error object:', err);
    
    // Show toast notification for connection error
    toast({
      title: isTimeout ? "Connection Timeout" : "Connection Error",
      description: isTimeout ? 
        `Connection timed out after ${CONNECTION_TIMEOUT/1000} seconds. Supabase might be unreachable.` :
        `Unable to reach Supabase: ${errorMessage}`,
      variant: "destructive"
    });
    
    return { success: false, error: errorMessage, timeout: isTimeout };
  }
};

// Update Index page to show more helpful connection info
export const getConnectionDetails = () => {
  return {
    url: supabaseUrl,
    environment: isProduction ? 'Production' : 'Development',
    usingProxy: useReverseProxy,
    localHost: isProduction ? null : localSupabaseHost,
    protocol: supabaseUrl.split(':')[0],
    pageProtocol: window.location.protocol,
    forceHttpBackend: isUsingHttpsWithHttpBackend,
    reverseProxy: useReverseProxy,
    reverseProxyPath: useReverseProxy ? reverseProxyPath : null,
    connectionTimeout: CONNECTION_TIMEOUT
  };
};

// Run the test if both URL and key are provided, but don't block app initialization
console.log('Testing Supabase connection on startup with URL:', supabaseUrl);
testSupabaseConnection()
  .then(result => {
    if (!result.success) {
      let message = '⚠️ Supabase connection failed. Check your configuration:';
      if (result.timeout) {
        message += `\n        - Connection timed out after ${CONNECTION_TIMEOUT/1000} seconds`;
        message += '\n        - Check if Supabase is running and reachable at the configured URL';
      } else {
        message += `\n        - Make sure your Supabase instance is running on ${localSupabaseHost}:8000`;
        message += '\n        - Check if the database table \'fortnox_credentials\' exists';
        message += '\n        - Check that VAULT_ENC_KEY is set and at least 32 characters long in your .env file';
      }
      console.warn(message);
    }
  });
