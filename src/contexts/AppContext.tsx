
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Activity, Client, TimeEntry, DateRange } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { formatDate } from "@/lib/date-utils";
import { mockActivities, mockClients, mockTimeEntries } from "@/data/mockData";
import { format } from "date-fns";
import { toast } from "sonner";

interface AppContextType {
  // Data
  clients: Client[];
  activities: Activity[];
  timeEntries: TimeEntry[];
  selectedDate: Date;
  
  // Actions
  setSelectedDate: (date: Date) => void;
  addClient: (client: Omit<Client, "id">) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  addActivity: (activity: Omit<Activity, "id">) => void;
  updateActivity: (activity: Activity) => void;
  deleteActivity: (id: string) => void;
  addTimeEntry: (timeEntry: Omit<TimeEntry, "id" | "duration">) => void;
  updateTimeEntry: (timeEntry: TimeEntry) => void;
  deleteTimeEntry: (id: string) => void;
  getTimeEntriesForDate: (date: string) => TimeEntry[];
  getTimeEntriesForDateRange: (startDate: string, endDate: string) => TimeEntry[];
  getTimeEntriesForClient: (clientId: string) => TimeEntry[];
  getClientById: (id: string) => Client | undefined;
  getActivityById: (id: string) => Activity | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(mockTimeEntries);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Client operations - memoized with useCallback
  const addClient = useCallback((client: Omit<Client, "id">) => {
    const newClient = { ...client, id: uuidv4() };
    setClients(prevClients => [...prevClients, newClient]);
    toast.success("Client added successfully");
  }, []);

  const updateClient = useCallback((client: Client) => {
    setClients(prevClients => prevClients.map(c => c.id === client.id ? client : c));
    toast.success("Client updated successfully");
  }, []);

  const deleteClient = useCallback((id: string) => {
    // Check if there are time entries for this client
    setClients(prevState => {
      // We need to check timeEntries before deleting
      const hasEntries = timeEntries.some(entry => entry.clientId === id);
      if (hasEntries) {
        toast.error("Cannot delete client with time entries");
        return prevState;
      }
      
      toast.success("Client deleted successfully");
      return prevState.filter(client => client.id !== id);
    });
  }, [timeEntries]);

  // Activity operations - memoized with useCallback
  const addActivity = useCallback((activity: Omit<Activity, "id">) => {
    const newActivity = { ...activity, id: uuidv4() };
    setActivities(prevActivities => [...prevActivities, newActivity]);
    toast.success("Activity added successfully");
  }, []);

  const updateActivity = useCallback((activity: Activity) => {
    setActivities(prevActivities => 
      prevActivities.map(a => a.id === activity.id ? activity : a)
    );
    toast.success("Activity updated successfully");
  }, []);

  const deleteActivity = useCallback((id: string) => {
    setActivities(prevState => {
      // Check if there are time entries for this activity
      const hasEntries = timeEntries.some(entry => entry.activityId === id);
      if (hasEntries) {
        toast.error("Cannot delete activity with time entries");
        return prevState;
      }
      
      toast.success("Activity deleted successfully");
      return prevState.filter(activity => activity.id !== id);
    });
  }, [timeEntries]);

  // Time entry operations - memoized with useCallback
  const addTimeEntry = useCallback((timeEntry: Omit<TimeEntry, "id" | "duration">) => {
    const { startTime, endTime } = timeEntry;
    
    // Calculate duration in minutes
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    const duration = endTotalMinutes >= startTotalMinutes 
      ? endTotalMinutes - startTotalMinutes
      : (24 * 60 - startTotalMinutes) + endTotalMinutes; // Next day
    
    const newTimeEntry = { 
      ...timeEntry, 
      id: uuidv4(), 
      duration,
      billable: true,
      invoiced: false
    };
    
    setTimeEntries(prevEntries => [...prevEntries, newTimeEntry]);
    toast.success("Time entry added successfully");
  }, []);

  const updateTimeEntry = useCallback((timeEntry: TimeEntry) => {
    setTimeEntries(prevEntries => 
      prevEntries.map(entry => entry.id === timeEntry.id ? timeEntry : entry)
    );
    toast.success("Time entry updated successfully");
  }, []);

  const deleteTimeEntry = useCallback((id: string) => {
    setTimeEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
    toast.success("Time entry deleted successfully");
  }, []);

  // Query operations - memoized using useMemo
  const getTimeEntriesForDate = useCallback((date: string) => {
    return timeEntries.filter(entry => entry.date === date);
  }, [timeEntries]);

  const getTimeEntriesForDateRange = useCallback((startDate: string, endDate: string) => {
    return timeEntries.filter(entry => entry.date >= startDate && entry.date <= endDate);
  }, [timeEntries]);

  const getTimeEntriesForClient = useCallback((clientId: string) => {
    return timeEntries.filter(entry => entry.clientId === clientId);
  }, [timeEntries]);

  const getClientById = useCallback((id: string) => {
    return clients.find(client => client.id === id);
  }, [clients]);

  const getActivityById = useCallback((id: string) => {
    return activities.find(activity => activity.id === id);
  }, [activities]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    clients,
    activities,
    timeEntries,
    selectedDate,
    setSelectedDate,
    addClient,
    updateClient,
    deleteClient,
    addActivity,
    updateActivity,
    deleteActivity,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    getTimeEntriesForDate,
    getTimeEntriesForDateRange,
    getTimeEntriesForClient,
    getClientById,
    getActivityById,
  }), [
    clients, activities, timeEntries, selectedDate,
    addClient, updateClient, deleteClient,
    addActivity, updateActivity, deleteActivity,
    addTimeEntry, updateTimeEntry, deleteTimeEntry,
    getTimeEntriesForDate, getTimeEntriesForDateRange, getTimeEntriesForClient,
    getClientById, getActivityById
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
