
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { Client, Activity, TimeEntry, UserProfile, Invoice, InvoiceItem, ConnectionTestResult, ConnectionDetails } from '@/types';

// Always use direct URL as the default option since the reverse proxy is causing issues
const directSupabaseUrl = 'https://supabase.techlinx.se';

// Maximum time to wait for connection in milliseconds
const CONNECTION_TIMEOUT = 10000; // Increased to 10 seconds timeout

// Use a default API key if none is provided
const defaultSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZ3RlZW50ZXR6Y2F2YmVlcnFvcGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY4OTQzODYyNywic3ViIjoiYW5vbiIsImV4cCI6MjAwNTAxNDYyN30.myN11RHLTXPdShzF3UG-z2Jl3OsEB9QocW7bkLDFP-0';

// Check if we have an API key in the environment or local storage
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const localStorageKey = localStorage.getItem('supabase_anon_key');
const finalSupabaseKey = supabaseKey || localStorageKey || defaultSupabaseKey;

// Always use direct URL by default
const supabaseUrl = directSupabaseUrl;

console.log('Using Supabase URL:', supabaseUrl);
console.log('API Key provided:', !!finalSupabaseKey);

export const supabase = createClient(supabaseUrl, finalSupabaseKey, {
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
export const testSupabaseConnection = async (): Promise<ConnectionTestResult> => {
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
export const getConnectionDetails = (): ConnectionDetails => {
  return {
    url: supabaseUrl,
    environment: window.location.hostname === 'localhost' ? 'Development' : 'Production',
    protocol: supabaseUrl.split(':')[0],
    pageProtocol: window.location.protocol,
    connectionTimeout: CONNECTION_TIMEOUT,
    apiKeyConfigured: true
  };
};

// Helper functions to interact with the database
export const fetchUserProfile = async (): Promise<UserProfile | null> => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData?.user) {
    console.error('Error fetching user:', userError?.message);
    return null;
  }
  
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userData.user.id)
    .single();
  
  if (profileError) {
    console.error('Error fetching profile:', profileError.message);
    return null;
  }
  
  return {
    id: userData.user.id,
    email: userData.user.email || '',
    displayName: profileData?.display_name || userData.user.email || '',
    avatar: profileData?.avatar,
    role: (profileData?.role as any) || 'user',
    created_at: profileData?.created_at,
    updated_at: profileData?.updated_at,
    preferences: profileData?.preferences,
    settings: profileData?.settings
  };
};

export const updateUserProfile = async (profile: Partial<UserProfile>): Promise<boolean> => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData?.user) {
    console.error('Error fetching user:', userError?.message);
    return false;
  }
  
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: profile.displayName,
      avatar: profile.avatar,
      role: profile.role,
      updated_at: new Date().toISOString(),
      preferences: profile.preferences,
      settings: profile.settings
    })
    .eq('id', userData.user.id);
  
  if (error) {
    console.error('Error updating profile:', error.message);
    return false;
  }
  
  return true;
};

// CRUD functions for clients
export const fetchClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching clients:', error.message);
    toast({ 
      title: "Error",
      description: `Failed to load clients: ${error.message}`,
      variant: "destructive" 
    });
    return [];
  }
  
  return data.map(client => ({
    id: client.id,
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    address: client.address,
    postalCode: client.postal_code,
    city: client.city,
    country: client.country,
    vatNumber: client.vat_number,
    organizationNumber: client.organization_number,
    customerNumber: client.customer_number,
    notes: client.notes,
    invoiceAddress: client.invoice_address,
    paymentTerms: client.payment_terms,
    deliveryTerms: client.delivery_terms
  }));
};

// Renamed from createClient to createNewClient to avoid naming conflict
export const createNewClient = async (client: Omit<Client, "id">): Promise<Client | null> => {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      address: client.address,
      postal_code: client.postalCode,
      city: client.city,
      country: client.country,
      vat_number: client.vatNumber,
      organization_number: client.organizationNumber,
      customer_number: client.customerNumber,
      notes: client.notes,
      invoice_address: client.invoiceAddress,
      payment_terms: client.paymentTerms,
      delivery_terms: client.deliveryTerms
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating client:', error.message);
    toast({ 
      title: "Error",
      description: `Failed to create client: ${error.message}`,
      variant: "destructive" 
    });
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    company: data.company,
    email: data.email,
    phone: data.phone,
    address: data.address,
    postalCode: data.postal_code,
    city: data.city,
    country: data.country,
    vatNumber: data.vat_number,
    organizationNumber: data.organization_number,
    customerNumber: data.customer_number,
    notes: data.notes,
    invoiceAddress: data.invoice_address,
    paymentTerms: data.payment_terms,
    deliveryTerms: data.delivery_terms
  };
};

export const updateClient = async (client: Client): Promise<boolean> => {
  const { error } = await supabase
    .from('clients')
    .update({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      address: client.address,
      postal_code: client.postalCode,
      city: client.city,
      country: client.country,
      vat_number: client.vatNumber,
      organization_number: client.organizationNumber,
      customer_number: client.customerNumber,
      notes: client.notes,
      invoice_address: client.invoiceAddress,
      payment_terms: client.paymentTerms,
      delivery_terms: client.deliveryTerms,
      updated_at: new Date().toISOString()
    })
    .eq('id', client.id);
  
  if (error) {
    console.error('Error updating client:', error.message);
    toast({ 
      title: "Error",
      description: `Failed to update client: ${error.message}`,
      variant: "destructive" 
    });
    return false;
  }
  
  return true;
};

export const deleteClient = async (id: string): Promise<boolean> => {
  // First, check if the client has any time entries
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('id')
    .eq('client_id', id)
    .limit(1);
  
  if (timeEntries && timeEntries.length > 0) {
    toast({ 
      title: "Error",
      description: "Cannot delete client with time entries",
      variant: "destructive" 
    });
    return false;
  }
  
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting client:', error.message);
    toast({ 
      title: "Error",
      description: `Failed to delete client: ${error.message}`,
      variant: "destructive" 
    });
    return false;
  }
  
  return true;
};

// Similar CRUD functions for activities
export const fetchActivities = async (): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching activities:', error.message);
    toast({ 
      title: "Error",
      description: `Failed to load activities: ${error.message}`,
      variant: "destructive" 
    });
    return [];
  }
  
  return data.map(activity => ({
    id: activity.id,
    name: activity.name,
    hourlyRate: activity.hourly_rate,
    isFixedPrice: activity.is_fixed_price,
    fixedPrice: activity.fixed_price,
    type: activity.type,
    accountNumber: activity.account_number,
    vatPercentage: activity.vat_percentage,
    articleNumber: activity.article_number
  }));
};

// CRUD functions for time entries
export const fetchTimeEntries = async (): Promise<TimeEntry[]> => {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching time entries:', error.message);
    toast({ 
      title: "Error",
      description: `Failed to load time entries: ${error.message}`,
      variant: "destructive" 
    });
    return [];
  }
  
  return data.map(entry => ({
    id: entry.id,
    clientId: entry.client_id,
    activityId: entry.activity_id,
    date: entry.date,
    startTime: entry.start_time,
    endTime: entry.end_time,
    duration: entry.duration,
    description: entry.description,
    billable: entry.billable,
    invoiced: entry.invoiced,
    entryType: entry.entry_type,
    quantity: entry.quantity,
    unitPrice: entry.unit_price
  }));
};

export const getTimeEntriesByDate = async (date: string): Promise<TimeEntry[]> => {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('date', date)
    .order('start_time', { ascending: true });
  
  if (error) {
    console.error(`Error fetching time entries for date ${date}:`, error.message);
    return [];
  }
  
  return data.map(entry => ({
    id: entry.id,
    clientId: entry.client_id,
    activityId: entry.activity_id,
    date: entry.date,
    startTime: entry.start_time,
    endTime: entry.end_time,
    duration: entry.duration,
    description: entry.description,
    billable: entry.billable,
    invoiced: entry.invoiced,
    entryType: entry.entry_type,
    quantity: entry.quantity,
    unitPrice: entry.unit_price
  }));
};

export const getTimeEntriesByDateRange = async (startDate: string, endDate: string): Promise<TimeEntry[]> => {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });
  
  if (error) {
    console.error(`Error fetching time entries for date range ${startDate} to ${endDate}:`, error.message);
    return [];
  }
  
  return data.map(entry => ({
    id: entry.id,
    clientId: entry.client_id,
    activityId: entry.activity_id,
    date: entry.date,
    startTime: entry.start_time,
    endTime: entry.end_time,
    duration: entry.duration,
    description: entry.description,
    billable: entry.billable,
    invoiced: entry.invoiced,
    entryType: entry.entry_type,
    quantity: entry.quantity,
    unitPrice: entry.unit_price
  }));
};
