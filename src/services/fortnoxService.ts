
import { supabase } from '@/lib/supabase';
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
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        accessToken: credentials.accessToken || null,
        refreshToken: credentials.refreshToken || null
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
      .select('clientId, clientSecret, accessToken, refreshToken')
      .eq('user_id', userData.user.id)
      .single();
    
    if (error || !data) {
      console.error('Error getting Fortnox credentials:', error?.message || 'No data found');
      return null;
    }
    
    return {
      clientId: data.clientId,
      clientSecret: data.clientSecret,
      accessToken: data.accessToken || undefined,
      refreshToken: data.refreshToken || undefined,
    };
  } catch (error) {
    console.error('Error getting Fortnox credentials:', error);
    return null;
  }
};

// This function should be called from a Supabase Edge Function for proper security
export const exportInvoiceToFortnox = async (invoiceData: any): Promise<{ success: boolean; error?: string }> => {
  try {
    // In a real implementation, we would call a Supabase Edge Function
    // that would use the stored credentials to make API calls to Fortnox
    
    // For testing purposes, we'll make a direct call to a dummy endpoint
    const response = await fetch('/api/fortnox/export-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.message || 'Failed to export invoice' 
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error exporting invoice to Fortnox:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

