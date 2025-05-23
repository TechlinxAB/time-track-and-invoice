
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

export interface FortnoxCredentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'pending';
}

// Generate a random state for OAuth security
const generateRandomState = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Store the state in localStorage for verification when the user returns
const storeOAuthState = (state: string) => {
  localStorage.setItem('fortnox_oauth_state', state);
  localStorage.setItem('fortnox_oauth_timestamp', Date.now().toString());
};

// Get and validate the stored state
const getStoredOAuthState = () => {
  const state = localStorage.getItem('fortnox_oauth_state');
  const timestamp = Number(localStorage.getItem('fortnox_oauth_timestamp') || '0');
  const now = Date.now();
  
  // State is valid for 10 minutes
  if (state && timestamp && (now - timestamp < 10 * 60 * 1000)) {
    return state;
  }
  
  return null;
};

// Clear stored OAuth state
const clearOAuthState = () => {
  localStorage.removeItem('fortnox_oauth_state');
  localStorage.removeItem('fortnox_oauth_timestamp');
};

// Initiate OAuth flow to connect with Fortnox
export const initiateFortnoxOAuth = (clientId: string, redirectUri: string) => {
  try {
    // Generate and store a random state for security
    const state = generateRandomState();
    storeOAuthState(state);
    
    // For Fortnox, we need to construct the proper authorization URL
    const authUrl = new URL('https://apps.fortnox.se/oauth-v1/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'invoice company customer project article'); // Enhanced scopes
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('response_type', 'code');
    
    // Open the authorization URL in a new tab/window
    window.location.href = authUrl.toString(); // Direct navigation for better mobile experience
    
    return true;
  } catch (error) {
    console.error('Error initiating Fortnox OAuth:', error);
    toast.error('Failed to initiate Fortnox connection');
    return false;
  }
};

// Handle OAuth callback and exchange code for tokens
export const handleFortnoxOAuthCallback = async (
  code: string, 
  state: string, 
  clientId: string, 
  clientSecret: string, 
  redirectUri: string
): Promise<boolean> => {
  try {
    // Verify state matches what we stored
    const storedState = getStoredOAuthState();
    if (!storedState || storedState !== state) {
      toast.error('Invalid OAuth state, please try again');
      return false;
    }
    
    // Clear the stored state
    clearOAuthState();
    
    // Exchange auth code for tokens - this would be better done server-side
    // For frontend demo, we'll simulate the exchange
    // In production, use Supabase Edge Function for this step
    
    const tokenResponse = await fetch('https://apps.fortnox.se/oauth-v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirectUri
      }).toString()
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
    }
    
    const tokenData = await tokenResponse.json();
    
    // Save tokens to Supabase
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      throw new Error('Not authenticated');
    }
    
    const { error } = await supabase.from('fortnox_credentials').upsert(
      { 
        user_id: userData.user.id,
        client_id: clientId,
        client_secret: clientSecret,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        connection_status: 'connected'
      },
      { onConflict: 'user_id' }
    );
    
    if (error) {
      throw new Error(`Failed to save tokens: ${error.message}`);
    }
    
    toast.success('Successfully connected to Fortnox!');
    return true;
  } catch (error) {
    console.error('Error handling Fortnox OAuth callback:', error);
    toast.error('Failed to complete Fortnox connection');
    return false;
  }
};

export const saveFortnoxCredentials = async (credentials: FortnoxCredentials): Promise<boolean> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      console.error('Error getting user:', userError?.message || 'No user found');
      toast.error('You need to be logged in to save credentials');
      return false;
    }
    
    const { error } = await supabase.from('fortnox_credentials').upsert(
      { 
        user_id: userData.user.id,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        access_token: credentials.accessToken || null,
        refresh_token: credentials.refreshToken || null,
        connection_status: credentials.connectionStatus || 'disconnected'
      },
      { onConflict: 'user_id' }
    );
    
    if (error) {
      console.error('Error saving Fortnox credentials:', error);
      toast.error('Failed to save Fortnox credentials');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving Fortnox credentials:', error);
    toast.error('An unexpected error occurred');
    return false;
  }
};

export const getFortnoxCredentials = async (): Promise<FortnoxCredentials | null> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      console.error('Error getting user:', userError?.message || 'No user found');
      return null;
    }
    
    const { data, error } = await supabase
      .from('fortnox_credentials')
      .select('client_id, client_secret, access_token, refresh_token, connection_status')
      .eq('user_id', userData.user.id)
      .single();
    
    if (error || !data) {
      console.error('Error getting Fortnox credentials:', error?.message || 'No data found');
      return null;
    }
    
    return {
      clientId: data.client_id,
      clientSecret: data.client_secret,
      accessToken: data.access_token || undefined,
      refreshToken: data.refresh_token || undefined,
      connectionStatus: data.connection_status || 'disconnected'
    };
  } catch (error) {
    console.error('Error getting Fortnox credentials:', error);
    return null;
  }
};

// Check if the current URL contains OAuth callback parameters
export const checkForOAuthCallback = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const fortnoxParam = urlParams.get('fortnox');
  
  if (code && state && fortnoxParam === 'callback') {
    return { code, state };
  }
  
  return null;
};

// Enhanced Fortnox API integration
export const exportInvoiceToFortnox = async (invoiceData: any): Promise<{ success: boolean; error?: string }> => {
  try {
    // First, try to call the Edge Function if deployed
    try {
      const response = await fetch('/functions/v1/fortnox-export', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(invoiceData),
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, ...data };
      }
    } catch (edgeFunctionError) {
      console.warn('Edge Function not available, falling back to direct API call', edgeFunctionError);
      // Edge Function call failed, continue to fallback
    }
    
    // Fallback: Show a more helpful message
    toast.warning(
      "Direct Fortnox API integration requires server-side processing",
      {
        description: "Please deploy the Edge Function for full Fortnox integration"
      }
    );
    
    return { 
      success: false, 
      error: "Direct API integration with Fortnox requires Edge Functions. Please check documentation." 
    };
  } catch (error) {
    console.error('Error exporting invoice to Fortnox:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Helper functions for handling Fortnox client synchronization
export const checkFortnoxClientExists = async (organizationNumber: string): Promise<boolean> => {
  // This would be implemented in a real app
  console.log(`Checking if client with org number ${organizationNumber} exists in Fortnox`);
  return false;
};

export const createFortnoxClient = async (clientData: any): Promise<boolean> => {
  // This would be implemented in a real app
  console.log('Creating client in Fortnox:', clientData);
  return true;
};

// Helper functions for Fortnox article management
export const syncFortnoxArticle = async (articleData: any): Promise<boolean> => {
  // This would be implemented in a real app
  console.log('Syncing article with Fortnox:', articleData);
  return true;
};
