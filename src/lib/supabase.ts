import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

// Always default to direct URL since that's the most reliable method
// We'll detect if we're on the internal network
const useReverseProxy = localStorage.getItem('use_reverse_proxy') === 'true' ? true : false;
const reverseProxyPath = localStorage.getItem('reverse_proxy_path') || '/supabase';

// Get the domain and protocol for detection
const currentDomain = window.location.hostname;
const currentProtocol = window.location.protocol;

// Maximum time to wait for connection in milliseconds
const CONNECTION_TIMEOUT = 5000; // 5 seconds timeout

// Internal network detection
const isLikelyInternalNetwork = () => {
  // If we're on localhost, we're likely on the internal network
  if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
    return true;
  }
  
  // If we're on the same domain as the Supabase instance (techlinx.se), 
  // we might be on the internal network
  if (currentDomain.includes('techlinx.se')) {
    return true;
  }
  
  // Otherwise, assume we're not on the internal network
  return false;
};

// Set the direct Supabase URL as the default
const directSupabaseUrl = 'https://supabase.techlinx.se';

// Determine the Supabase URL based on configuration
let supabaseUrl;

if (useReverseProxy) {
  // Use the reverse proxy path with the current origin
  supabaseUrl = `${window.location.origin}${reverseProxyPath}`;
  console.log('Using reverse proxy for Supabase at:', supabaseUrl);
} else {
  // Use the direct Supabase URL
  supabaseUrl = directSupabaseUrl;
  console.log('Using direct Supabase URL:', supabaseUrl);
}

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Environment:', currentDomain === 'localhost' ? 'Development' : 'Production');
console.log('Page is served via:', currentProtocol);
console.log('Using Supabase URL:', supabaseUrl);
console.log('Using reverse proxy:', useReverseProxy);
console.log('Likely on internal network:', isLikelyInternalNetwork());
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
          // If we're using reverse proxy and got HTML, it indicates a proxy issue
          if (useReverseProxy) {
            throw new Error('Received HTML instead of JSON response. This likely indicates a proxy misconfiguration. Try using direct URL instead.');
          } else {
            throw new Error('Received HTML instead of JSON response. API endpoint may be misconfigured.');
          }
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
      
      // Handle network access issues
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        if (!isLikelyInternalNetwork()) {
          return {
            success: false,
            error: 'Cannot connect to Supabase. This instance appears to be available only on the internal network.',
            timeout: false,
            internalOnly: true
          };
        }
      }
      
      // If we're using the reverse proxy and it failed, suggest trying the direct URL
      if (useReverseProxy) {
        return { 
          success: false, 
          error: `${error.message}. Consider using the direct URL instead of the reverse proxy.`, 
          timeout: false,
          suggestDirectUrl: true
        };
      }
      
      return { success: false, error: error.message, timeout: false };
    } else {
      console.log('Supabase connection successful');
      return { success: true, timeout: false };
    }
  } catch (err) {
    const isTimeout = err instanceof Error && err.message.includes('timed out');
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const isProxyError = errorMessage.includes('proxy misconfiguration');
    const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError');
    
    console.error(`Supabase connection ${isTimeout ? 'timed out' : 'failed'}:`, errorMessage);
    console.error('Full error object:', err);
    
    // Special handling for network access issues
    if (isNetworkError && !isLikelyInternalNetwork()) {
      return {
        success: false,
        error: 'Cannot connect to Supabase. This instance appears to be available only on the internal network.',
        timeout: isTimeout,
        internalOnly: true
      };
    }
    
    return { 
      success: false, 
      error: errorMessage, 
      timeout: isTimeout,
      suggestDirectUrl: isProxyError && useReverseProxy
    };
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
    directUrl: directSupabaseUrl,
    internalOnly: !isLikelyInternalNetwork(),
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
      } else if (result.suggestDirectUrl) {
        message += `\n        - Received proxy error. Consider switching to the direct URL instead`;
        message += '\n        - Go to settings and disable reverse proxy to use https://supabase.techlinx.se directly';
      } else if (result.internalOnly) {
        message += `\n        - Supabase instance appears to be available only on the internal network`;
        message += '\n        - You may need to be on VPN or the internal network to access it';
      } else {
        message += `\n        - Make sure your Supabase instance is running at ${supabaseUrl}`;
        message += '\n        - Check if the database table \'fortnox_credentials\' exists';
      }
      console.warn(message);
    }
  });
