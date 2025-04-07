
import { supabase, callFortnoxAPI } from '@/lib/supabase';
import { toast } from "sonner";

export interface FortnoxCredentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
}

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
        refresh_token: credentials.refreshToken || null
      },
      { onConflict: 'user_id' }
    );
    
    if (error) {
      console.error('Error saving Fortnox credentials:', error);
      toast.error('Failed to save Fortnox credentials');
      return false;
    }
    
    toast.success('Fortnox credentials saved successfully');
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
      .select('client_id, client_secret, access_token, refresh_token')
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
    };
  } catch (error) {
    console.error('Error getting Fortnox credentials:', error);
    return null;
  }
};

// This function will try to use Edge Functions if available, otherwise fall back to direct API calls
export const exportInvoiceToFortnox = async (invoiceData: any): Promise<{ success: boolean; error?: string }> => {
  try {
    // First, try to call the Edge Function if deployed
    try {
      const response = await fetch('/functions/v1/fortnox-export', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession().then(res => res.data.session?.access_token)}`
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
    
    // Fallback: Direct API call
    console.log('Using fallback: direct API call to Fortnox');
    
    // Get credentials
    const credentials = await getFortnoxCredentials();
    if (!credentials || !credentials.accessToken) {
      return { 
        success: false, 
        error: 'Fortnox access token not found. Please configure your Fortnox integration in Settings.' 
      };
    }
    
    // Make direct API call
    const result = await callFortnoxAPI(invoiceData, credentials.accessToken);
    return result;
    
  } catch (error) {
    console.error('Error exporting invoice to Fortnox:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
