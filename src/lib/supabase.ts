
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

// Connection strategy
// 1. Try reverse proxy first (works internally behind firewalls) - this is our default strategy
// 2. Fall back to direct connection to Supabase URL (only works externally if properly configured)
const useReverseProxy = localStorage.getItem('use_reverse_proxy') !== 'false'; // Default to true unless explicitly set to false
const reverseProxyPath = localStorage.getItem('reverse_proxy_path') || '/supabase';

// Force reverse proxy to true by default if not explicitly set
if (localStorage.getItem('use_reverse_proxy') === null) {
  localStorage.setItem('use_reverse_proxy', 'true');
}

// Get the domain and protocol for detection
const currentDomain = window.location.hostname;
const currentProtocol = window.location.protocol;

// Maximum time to wait for connection in milliseconds
const CONNECTION_TIMEOUT = 5000; // 5 seconds timeout

// Always use direct URL as fallback option
const directSupabaseUrl = 'https://supabase.techlinx.se';

// Determine the Supabase URL based on configuration
let supabaseUrl;

// Use reverse proxy by default
if (useReverseProxy !== false) {
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
console.log('Using reverse proxy:', useReverseProxy !== false);
if (useReverseProxy !== false) console.log('Reverse proxy path:', reverseProxyPath);

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
  usingReverseProxy: useReverseProxy !== false
});

// Function to detect if we're receiving HTML instead of JSON (likely a proxy issue)
const isHtmlResponse = (response: any) => {
  if (typeof response === 'string' && response.trim().startsWith('<!DOCTYPE html>')) {
    return true;
  }
  return false;
};

// Test the connection with a timeout, trying multiple endpoints
export const testSupabaseConnection = async () => {
  try {
    console.log(`Testing Supabase connection to: ${supabaseUrl}`);
    
    // Create a promise that rejects after a timeout
    const timeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Connection timed out after ${CONNECTION_TIMEOUT/1000} seconds`));
      }, CONNECTION_TIMEOUT);
    });
    
    // Array of paths to try for health check in order
    const healthCheckPaths = [
      '/rest/v1/health_check', 
      '/rest/v1/',
      '/auth/v1/health',
      '/storage/v1/health',
      '/'
    ];
    
    let lastError = null;
    
    // Try each path in sequence until one works
    for (const path of healthCheckPaths) {
      try {
        console.log(`Trying health check path: ${path}`);
        const healthCheckUrl = `${supabaseUrl}${path}`;
        
        const response = await fetch(healthCheckUrl, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey || 'dummy-key-for-init',
            'Authorization': `Bearer ${supabaseKey || 'dummy-key-for-init'}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Path ${path} responded with status: ${response.status}`);
        
        if (response.ok) {
          const text = await response.text();
          
          // Check if we received HTML instead of JSON (likely a proxy/CORS issue)
          if (isHtmlResponse(text)) {
            console.warn(`Received HTML response from ${path} - likely a proxy issue`);
            continue;
          }
          
          try {
            // Try to parse as JSON but don't fail if it's not valid JSON
            const data = text.trim() ? JSON.parse(text) : {};
            console.log('Health check successful with path:', path);
            return { success: true, path, data, timeout: false };
          } catch (e) {
            // If it's not JSON but the response was OK, we'll count it as a success
            console.log('Non-JSON but valid response from path:', path);
            return { success: true, path, text, timeout: false };
          }
        }
        
        lastError = new Error(`HTTP error! Status: ${response.status}`);
      } catch (err) {
        console.warn(`Path ${path} check failed:`, err);
        lastError = err;
        continue; // Try next path
      }
    }
    
    // If we get here, all paths failed
    throw lastError || new Error('All health check paths failed');
    
  } catch (err) {
    const isTimeout = err instanceof Error && err.message.includes('timed out');
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    console.error(`Supabase connection ${isTimeout ? 'timed out' : 'failed'}:`, errorMessage);
    console.error('Full error object:', err);
    
    if (useReverseProxy !== false && !localStorage.getItem('tried_direct')) {
      // If using reverse proxy and haven't tried direct URL yet, try direct URL
      localStorage.setItem('tried_direct', 'true');
      return { 
        success: false, 
        error: `${errorMessage}. Trying direct URL automatically...`, 
        timeout: isTimeout,
        autoSwitchToDirectUrl: true
      };
    } else if (useReverseProxy === false && localStorage.getItem('tried_direct') === 'true') {
      // If direct URL failed and we've tried it, suggest reverse proxy
      localStorage.setItem('tried_direct', 'false');
      return { 
        success: false, 
        error: `${errorMessage}. Consider using the reverse proxy.`, 
        timeout: isTimeout,
        suggestReverseProxy: true
      };
    }
    
    return { success: false, error: errorMessage, timeout: isTimeout };
  }
};

// Update Index page to show more helpful connection info
export const getConnectionDetails = () => {
  return {
    url: supabaseUrl,
    environment: currentDomain === 'localhost' ? 'Development' : 'Production',
    usingProxy: useReverseProxy !== false,
    protocol: supabaseUrl.split(':')[0],
    pageProtocol: window.location.protocol,
    reverseProxy: useReverseProxy !== false,
    reverseProxyPath: useReverseProxy !== false ? reverseProxyPath : null,
    connectionTimeout: CONNECTION_TIMEOUT,
    directUrl: directSupabaseUrl,
    internalOnly: false,
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
      } else if (result.autoSwitchToDirectUrl) {
        message += `\n        - Automatically trying direct URL instead of reverse proxy`;
        setTimeout(() => {
          localStorage.setItem('use_reverse_proxy', 'false');
          window.location.reload();
        }, 1500);
      } else if (result.suggestReverseProxy) {
        message += `\n        - Direct URL failed. Consider switching to reverse proxy`;
        message += '\n        - Go to settings and enable reverse proxy';
      } else {
        message += `\n        - Make sure your Supabase instance is running at ${supabaseUrl}`;
        message += '\n        - Check if the database table \'fortnox_credentials\' exists';
      }
      console.warn(message);
    } else {
      console.log(`Supabase connection successful using path: ${result.path}`);
    }
  });
