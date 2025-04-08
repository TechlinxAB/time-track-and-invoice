import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Client, 
  Activity, 
  TimeEntry, 
  Invoice, 
  InvoiceItem,
  UserProfile
} from '@/types';
import { 
  fetchClients, 
  createNewClient, 
  updateClient, 
  deleteClient,
  fetchActivities,
  fetchTimeEntries,
  getTimeEntriesByDate,
  getTimeEntriesByDateRange
} from '@/lib/supabase';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const loadClients = async () => {
    const clientsData = await fetchClients();
    setClients(clientsData);
  };

  const addClient = async (client: Omit<Client, "id">) => {
    const newClient = await createNewClient(client);
    if (newClient) {
      setClients(prevClients => [...prevClients, newClient]);
    }
  };

  const updateClient = async (client: Client) => {
    await updateClient(client);
    setClients(prevClients =>
      prevClients.map(c => (c.id === client.id ? client : c))
    );
  };

  const deleteClient = async (id: string) => {
    await deleteClient(id);
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
    setTimeEntries(timeEntriesData);
  };

  const loadTimeEntriesByDateRange = async (startDate: string, endDate: string) => {
    const timeEntriesData = await getTimeEntriesByDateRange(startDate, endDate);
    setTimeEntries(timeEntriesData);
  };

  const loadInvoices = async () => {
    // Implement invoice loading logic here
  };

  useEffect(() => {
    loadClients();
    loadActivities();
    loadTimeEntries();
    loadInvoices();
  }, []);

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
