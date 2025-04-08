
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

// Use direct URL as the default and primary option since the reverse proxy is causing issues
const directSupabaseUrl = 'https://supabase.techlinx.se';

// Maximum time to wait for connection in milliseconds
const CONNECTION_TIMEOUT = 5000; // 5 seconds timeout

// Get the domain and protocol for detection
const currentDomain = window.location.hostname;
const currentProtocol = window.location.protocol;

// Use reverse proxy or direct URL based on user preference
const useReverseProxy = localStorage.getItem('use_reverse_proxy') !== 'false';
const reverseProxyPath = localStorage.getItem('reverse_proxy_path') || '/supabase';

// Determine the URL based on user preference
let supabaseUrl = directSupabaseUrl;
if (useReverseProxy) {
  if (currentDomain !== 'localhost') {
    // In production with reverse proxy enabled
    supabaseUrl = `${currentProtocol}//${currentDomain}${reverseProxyPath}`;
  }
}
console.log('Using Supabase URL:', supabaseUrl);

// Check if we have an API key in the environment
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// If we're in development mode, look for the key in localStorage as fallback
const localStorageKey = localStorage.getItem('supabase_anon_key');
const finalSupabaseKey = supabaseKey || localStorageKey || '';

if (!finalSupabaseKey) {
  console.warn('Supabase Anon Key is missing. Please set your API key in the connection settings.');
  toast({
    title: "Supabase API Key Missing",
    description: "Please configure your API key in the connection settings",
    variant: "destructive"
  });
}

console.log('Environment:', currentDomain === 'localhost' ? 'Development' : 'Production');
console.log('Page is served via:', currentProtocol);
console.log('Using Supabase URL:', supabaseUrl);
console.log('API Key provided:', !!finalSupabaseKey);

export const supabase = createClient(supabaseUrl, finalSupabaseKey || 'dummy-key-for-init', {
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
  keyProvided: !!finalSupabaseKey,
  protocol: supabaseUrl.split(':')[0],
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
      '/rest/v1/',
      '/auth/v1/token',
      '/storage/v1/object',
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
            'apikey': finalSupabaseKey || 'dummy-key-for-init',
            'Authorization': `Bearer ${finalSupabaseKey || 'dummy-key-for-init'}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Path ${path} responded with status: ${response.status}`);
        
        if (response.ok || response.status === 400) {
          // 400 might be returned for valid endpoints that require POST method
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
            return { 
              success: true, 
              path, 
              data, 
              timeout: false,
              suggestReverseProxy: false,
              autoSwitchToDirectUrl: false
            };
          } catch (e) {
            // If it's not JSON but the response was OK, we'll count it as a success
            console.log('Non-JSON but valid response from path:', path);
            return { 
              success: true, 
              path, 
              text, 
              timeout: false,
              suggestReverseProxy: false,
              autoSwitchToDirectUrl: false
            };
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
    const isMissingKey = errorMessage.includes('401') || errorMessage.includes('Invalid authentication credentials');
    
    console.error(`Supabase connection ${isTimeout ? 'timed out' : 'failed'}:`, errorMessage);
    console.error('Full error object:', err);
    
    // Determine if we should suggest switching methods
    const reverseProxyEnabled = localStorage.getItem('use_reverse_proxy') !== 'false';
    
    return { 
      success: false, 
      error: errorMessage, 
      timeout: isTimeout,
      suggestReverseProxy: !reverseProxyEnabled && !isTimeout,
      autoSwitchToDirectUrl: reverseProxyEnabled && !isTimeout,
      missingApiKey: isMissingKey
    };
  }
};

// Run the test if URL is provided, but don't block app initialization
console.log('Testing Supabase connection on startup with URL:', supabaseUrl);
testSupabaseConnection()
  .then(result => {
    if (!result.success) {
      if (result.missingApiKey) {
        console.warn('⚠️ Supabase connection failed: Invalid API key or missing API key');
        toast({
          title: "API Key Required",
          description: "Please enter your Supabase API key in the connection settings",
          variant: "destructive"
        });
      } else {
        let message = '⚠️ Supabase connection failed. Check your configuration:';
        if (result.timeout) {
          message += `\n        - Connection timed out after ${CONNECTION_TIMEOUT/1000} seconds`;
          message += '\n        - Check if Supabase is running and reachable at the configured URL';
        } else {
          message += `\n        - Make sure your Supabase instance is running at ${supabaseUrl}`;
          message += '\n        - Check if the database table \'profiles\' exists';
        }
        console.warn(message);
      }
    } else {
      console.log(`Supabase connection successful using path: ${result.path}`);
      // Toast success message
      toast({
        title: "Connected to Supabase",
        description: "Connection established successfully",
        variant: "default"
      });
    }
  });

// Save API key to localStorage
export const saveApiKey = (key: string) => {
  localStorage.setItem('supabase_anon_key', key);
  window.location.reload();
};

// Simplified connection details function
export const getConnectionDetails = () => {
  const reverseProxy = localStorage.getItem('use_reverse_proxy') !== 'false';
  const reverseProxyPath = localStorage.getItem('reverse_proxy_path') || '/supabase';
  const usingProxy = supabaseUrl.includes(window.location.hostname);
  const apiKey = finalSupabaseKey;
  
  return {
    url: supabaseUrl,
    environment: currentDomain === 'localhost' ? 'Development' : 'Production',
    protocol: supabaseUrl.split(':')[0],
    pageProtocol: window.location.protocol,
    connectionTimeout: CONNECTION_TIMEOUT,
    directUrl: directSupabaseUrl,
    usingProxy: usingProxy,
    reverseProxy: reverseProxy,
    reverseProxyPath: reverseProxyPath,
    apiKeyConfigured: !!apiKey,
    nginx: {
      path: '/var/log/nginx/freelancer-crm-error.log'
    }
  };
};
