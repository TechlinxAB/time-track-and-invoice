
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Client, 
  Activity, 
  TimeEntry, 
  Invoice, 
  UserProfile
} from '@/types';
import { 
  fetchClients, 
  createNewClient, 
  updateClient as updateClientApi, 
  deleteClient as deleteClientApi,
  fetchActivities,
  fetchTimeEntries,
  getTimeEntriesByDate,
  getTimeEntriesByDateRange,
  createTimeEntry,
  updateTimeEntry as updateTimeEntryApi,
  deleteTimeEntry as deleteTimeEntryApi
} from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext'; // Import Auth context
import { toast } from 'sonner';

interface AppContextType {
  clients: Client[];
  activities: Activity[];
  timeEntries: TimeEntry[];
  invoices: Invoice[];
  userProfile: UserProfile | null;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  loadClients: () => Promise<void>;
  addClient: (client: Omit<Client, "id">) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  loadActivities: () => Promise<void>;
  loadTimeEntries: () => Promise<void>;
  loadTimeEntriesByDate: (date: string) => Promise<void>;
  loadTimeEntriesByDateRange: (startDate: string, endDate: string) => Promise<void>;
  loadInvoices: () => Promise<void>;
  getClientById: (id: string) => Client | undefined;
  getActivityById: (id: string) => Activity | undefined;
  getTimeEntriesForDate: (date: string) => TimeEntry[];
  addTimeEntry: (entry: Omit<TimeEntry, "id">) => Promise<void>;
  updateTimeEntry: (entry: TimeEntry) => Promise<void>;
  deleteTimeEntry: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth(); // Get authenticated user
  const [clients, setClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const loadClients = async () => {
    if (!user) {
      console.log("No authenticated user, skipping client load");
      return;
    }
    
    console.log("Loading clients for user:", user.id);
    const clientsData = await fetchClients();
    console.log(`Loaded ${clientsData.length} clients`);
    setClients(clientsData);
  };

  const addClient = async (client: Omit<Client, "id">) => {
    if (!user) {
      toast.error("You must be logged in to add clients");
      return;
    }
    
    const newClient = await createNewClient(client);
    if (newClient) {
      setClients(prevClients => [...prevClients, newClient]);
    }
  };

  const updateClient = async (client: Client) => {
    if (!user) {
      toast.error("You must be logged in to update clients");
      return;
    }
    
    await updateClientApi(client);
    setClients(prevClients =>
      prevClients.map(c => (c.id === client.id ? client : c))
    );
  };

  const deleteClient = async (id: string) => {
    if (!user) {
      toast.error("You must be logged in to delete clients");
      return;
    }
    
    await deleteClientApi(id);
    setClients(prevClients => prevClients.filter(client => client.id !== id));
  };

  const loadActivities = async () => {
    const activitiesData = await fetchActivities();
    setActivities(activitiesData);
  };

  const loadTimeEntries = async () => {
    const timeEntriesData = await fetchTimeEntries();
    setTimeEntries(timeEntriesData);
  };

  const loadTimeEntriesByDate = async (date: string) => {
    const timeEntriesData = await getTimeEntriesByDate(date);
    // Fix: Store all time entries without filtering out other dates
    setTimeEntries(prevEntries => {
      // Create a new map to store entries with the most recent version for each ID
      const entriesMap = new Map<string, TimeEntry>();
      
      // Add existing entries to the map (except ones for the current date)
      prevEntries.forEach(entry => {
        if (entry.date !== date) {
          entriesMap.set(entry.id, entry);
        }
      });
      
      // Add new entries for the current date, overwriting any with the same ID
      timeEntriesData.forEach(entry => {
        entriesMap.set(entry.id, entry);
      });
      
      // Convert the map back to an array
      return Array.from(entriesMap.values());
    });
  };

  const loadTimeEntriesByDateRange = async (startDate: string, endDate: string) => {
    const timeEntriesData = await getTimeEntriesByDateRange(startDate, endDate);
    setTimeEntries(timeEntriesData);
  };

  const loadInvoices = async () => {
    // Implement invoice loading logic here
    // For now, this is just a placeholder
  };

  const getClientById = (id: string): Client | undefined => {
    return clients.find(client => client.id === id);
  };

  const getActivityById = (id: string): Activity | undefined => {
    return activities.find(activity => activity.id === id);
  };

  const getTimeEntriesForDate = (date: string): TimeEntry[] => {
    return timeEntries.filter(entry => entry.date === date);
  };

  const addTimeEntry = async (entry: Omit<TimeEntry, "id">) => {
    try {
      // Call API to create the entry
      const newEntry = await createTimeEntry(entry);
      
      if (newEntry) {
        // Update local state with the new entry
        setTimeEntries(prev => [...prev, newEntry]);
        return;
      }
    } catch (error) {
      console.error("Error adding time entry:", error);
      // Fallback to local state management if API fails
      const tempEntry: TimeEntry = {
        ...entry,
        id: `temp-${Date.now()}`
      };
      setTimeEntries(prev => [...prev, tempEntry]);
    }
  };

  const updateTimeEntry = async (entry: TimeEntry) => {
    try {
      // Call API to update the entry
      await updateTimeEntryApi(entry);
      
      // Update local state
      setTimeEntries(prev => 
        prev.map(e => e.id === entry.id ? entry : e)
      );
    } catch (error) {
      console.error("Error updating time entry:", error);
    }
  };

  const deleteTimeEntry = async (id: string) => {
    try {
      // Call API to delete the entry
      await deleteTimeEntryApi(id);
      
      // Update local state
      setTimeEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (error) {
      console.error("Error deleting time entry:", error);
    }
  };

  useEffect(() => {
    // Only load data when user is authenticated
    if (user) {
      console.log("User authenticated, loading initial data");
      loadClients();
      loadActivities();
      loadTimeEntries();
      loadInvoices();
    } else {
      console.log("No user authenticated, clearing data");
      setClients([]);
      setActivities([]);
      setTimeEntries([]);
      setInvoices([]);
    }
  }, [user]); // Re-run when user changes (login/logout)

  const value: AppContextType = {
    clients,
    activities,
    timeEntries,
    invoices,
    userProfile,
    selectedDate,
    setSelectedDate,
    loadClients,
    addClient,
    updateClient,
    deleteClient,
    loadActivities,
    loadTimeEntries,
    loadTimeEntriesByDate,
    loadTimeEntriesByDateRange,
    loadInvoices,
    getClientById,
    getActivityById,
    getTimeEntriesForDate,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
