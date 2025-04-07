
import { supabase } from '@/lib/supabase';

export interface FortnoxCredentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
}

export const saveFortnoxCredentials = async (credentials: FortnoxCredentials): Promise<boolean> => {
  try {
    const { error } = await supabase.from('fortnox_credentials').upsert(
      { user_id: supabase.auth.getUser().then(({ data }) => data.user?.id), ...credentials },
      { onConflict: 'user_id' }
    );
    
    if (error) {
      console.error('Error saving Fortnox credentials:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving Fortnox credentials:', error);
    return false;
  }
};

export const getFortnoxCredentials = async (): Promise<FortnoxCredentials | null> => {
  try {
    const { data, error } = await supabase
      .from('fortnox_credentials')
      .select('*')
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      clientId: data.clientId,
      clientSecret: data.clientSecret,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch (error) {
    console.error('Error getting Fortnox credentials:', error);
    return null;
  }
};

// This would typically be done in a Supabase Edge Function
export const exportInvoiceToFortnox = async (invoiceData: any): Promise<{ success: boolean; error?: string }> => {
  try {
    // In a real implementation, this would call a Supabase Edge Function
    // that would use the stored credentials to make API calls to Fortnox
    
    // For now, we'll just log the attempt and return success
    console.log('Would export invoice to Fortnox:', invoiceData);
    
    return { success: true };
  } catch (error) {
    console.error('Error exporting invoice to Fortnox:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
