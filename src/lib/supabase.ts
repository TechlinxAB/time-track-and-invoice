
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

// Always use direct URL as the default option since the reverse proxy is causing issues
const directSupabaseUrl = 'https://supabase.techlinx.se';

// Maximum time to wait for connection in milliseconds
const CONNECTION_TIMEOUT = 10000; // Increased to 10 seconds timeout

// Check if we have an API key in the environment or local storage
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const localStorageKey = localStorage.getItem('supabase_anon_key');
const finalSupabaseKey = supabaseKey || localStorageKey || '';

// Always use direct URL by default
let supabaseUrl = directSupabaseUrl;

console.log('Using Supabase URL:', supabaseUrl);
console.log('API Key provided:', !!finalSupabaseKey);

if (!finalSupabaseKey) {
  console.warn('Supabase Anon Key is missing. Please set your API key in the connection settings.');
  toast({
    title: "Supabase API Key Missing",
    description: "Please configure your API key in the login page",
    variant: "destructive"
  });
}

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
    
    // Try a simple API call to test connection
    const connectionTest = fetch(`${supabaseUrl}/rest/v1/?apikey=${finalSupabaseKey}`, {
      method: 'GET',
      headers: {
        'apikey': finalSupabaseKey,
        'Authorization': `Bearer ${finalSupabaseKey}`,
        'Content-Type': 'application/json'
      }
    }).then(async response => {
      if (response.ok) {
        const text = await response.text();
        if (isHtmlResponse(text)) {
          throw new Error('Received HTML instead of JSON, likely a proxy issue');
        }
        return { success: true };
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    });
    
    // Race the connection test against the timeout
    const result = await Promise.race([connectionTest, timeout]) as { success: boolean };
    return { success: result.success, timeout: false };
    
  } catch (err) {
    const isTimeout = err instanceof Error && err.message.includes('timed out');
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const isMissingKey = errorMessage.includes('401') || errorMessage.includes('Invalid authentication credentials');
    
    console.error(`Supabase connection ${isTimeout ? 'timed out' : 'failed'}:`, errorMessage);
    
    return { 
      success: false, 
      error: errorMessage, 
      timeout: isTimeout,
      missingApiKey: isMissingKey
    };
  }
};

// Save API key to localStorage
export const saveApiKey = (key: string) => {
  localStorage.setItem('supabase_anon_key', key);
  window.location.reload();
};

// Simplified connection details function
export const getConnectionDetails = () => {
  const apiKey = finalSupabaseKey;
  
  return {
    url: supabaseUrl,
    environment: window.location.hostname === 'localhost' ? 'Development' : 'Production',
    protocol: supabaseUrl.split(':')[0],
    pageProtocol: window.location.protocol,
    connectionTimeout: CONNECTION_TIMEOUT,
    apiKeyConfigured: !!apiKey
  };
};
