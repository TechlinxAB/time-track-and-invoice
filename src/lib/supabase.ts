
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

// Always use reverse proxy by default
const useReverseProxy = localStorage.getItem('use_reverse_proxy') === 'false' ? false : true;
const reverseProxyPath = localStorage.getItem('reverse_proxy_path') || '/supabase';

// Get the domain and protocol for production use
const currentDomain = window.location.hostname;
const currentProtocol = window.location.protocol;

// Maximum time to wait for connection in milliseconds
const CONNECTION_TIMEOUT = 5000; // 5 seconds timeout

// Determine the Supabase URL based on environment and configuration
let supabaseUrl;

if (useReverseProxy) {
  // Use the reverse proxy path with the current origin
  supabaseUrl = `${window.location.origin}${reverseProxyPath}`;
  console.log('Using reverse proxy for Supabase at:', supabaseUrl);
} else if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
  // For local development
  supabaseUrl = 'http://localhost:8000';
} else {
  // Use the new backend URL for production
  supabaseUrl = 'https://supabase.techlinx.se';
  console.log('Using external Supabase URL:', supabaseUrl);
}

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Environment:', currentDomain === 'localhost' ? 'Development' : 'Production');
console.log('Page is served via:', currentProtocol);
console.log('Using Supabase URL:', supabaseUrl);
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
  usingReverseProxy: useReverseProxy
});

// Function to detect if we're receiving HTML instead of JSON (likely a proxy issue)
const isHtmlResponse = (response: any) => {
  if (typeof response === 'string' && response.trim().startsWith('<!DOCTYPE html>')) {
    return true;
  }
  return false;
};

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
        const response = await fetch(`${supabaseUrl}/rest/v1/health_check?select=*&limit=1`, {
          headers: {
            'apikey': supabaseKey || 'dummy-key-for-init',
            'Authorization': `Bearer ${supabaseKey || 'dummy-key-for-init'}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const text = await response.text();
        
        // Check if we received HTML instead of JSON (likely a proxy/CORS issue)
        if (isHtmlResponse(text)) {
          throw new Error('Received HTML instead of JSON response. This likely indicates a proxy misconfiguration.');
        }
        
        try {
          const data = JSON.parse(text);
          return data;
        } catch (e) {
          throw new Error(`Failed to parse JSON response: ${text.substring(0, 100)}...`);
        }
      } catch (healthErr) {
        throw healthErr;
      }
    };
    
    // Race the health check against the timeout
    const healthData = await Promise.race([healthCheck(), timeout]);
    console.log('Health check result:', healthData || 'No data returned');
    
    // If health check passed, let's try a simple query
    const { data, error } = await supabase.from('fortnox_credentials').select('count').limit(1);
      
    if (error) {
      console.error('Supabase connection test failed:', error.message, error.details);
      console.error('Full error object:', JSON.stringify(error));
      
      return { success: false, error: error.message, timeout: false };
    } else {
      console.log('Supabase connection successful');
      return { success: true, timeout: false };
    }
  } catch (err) {
    const isTimeout = err instanceof Error && err.message.includes('timed out');
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    console.error(`Supabase connection ${isTimeout ? 'timed out' : 'failed'}:`, errorMessage);
    console.error('Full error object:', err);
    
    return { success: false, error: errorMessage, timeout: isTimeout };
  }
};

// Update Index page to show more helpful connection info
export const getConnectionDetails = () => {
  return {
    url: supabaseUrl,
    environment: currentDomain === 'localhost' ? 'Development' : 'Production',
    usingProxy: useReverseProxy,
    protocol: supabaseUrl.split(':')[0],
    pageProtocol: window.location.protocol,
    reverseProxy: useReverseProxy,
    reverseProxyPath: useReverseProxy ? reverseProxyPath : null,
    connectionTimeout: CONNECTION_TIMEOUT,
    nginxPath: currentDomain === 'timetracking.techlinx.se' ? '/var/log/nginx/freelancer-crm-error.log' : null
  };
};

// Run the test if URL is provided, but don't block app initialization
console.log('Testing Supabase connection on startup with URL:', supabaseUrl);
testSupabaseConnection()
  .then(result => {
    if (!result.success) {
      let message = '⚠️ Supabase connection failed. Check your configuration:';
      if (result.timeout) {
        message += `\n        - Connection timed out after ${CONNECTION_TIMEOUT/1000} seconds`;
        message += '\n        - Check if Supabase is running and reachable at the configured URL';
      } else {
        message += `\n        - Make sure your Supabase instance is running at ${supabaseUrl}`;
        message += '\n        - Check if the database table \'fortnox_credentials\' exists';
      }
      console.warn(message);
    }
  });
