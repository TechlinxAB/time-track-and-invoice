
import { Activity, Client, TimeEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { addMinutes, format, subDays } from "date-fns";

// Generate sample clients
export const mockClients: Client[] = [
  {
    id: uuidv4(),
    name: "Nordstrom Tech",
    email: "contact@nordstromtech.com",
    company: "Nordstrom Technology AB",
    phone: "+46701234567",
  },
  {
    id: uuidv4(),
    name: "Stockholm Digital",
    email: "info@stockholmdigital.se",
    company: "Stockholm Digital Solutions",
    phone: "+46701234568",
  },
  {
    id: uuidv4(),
    name: "Göteborg Web",
    email: "contact@goteborgweb.se",
    company: "Göteborg Web Design",
    phone: "+46701234569",
  },
];

// Generate sample activities
export const mockActivities: Activity[] = [
  {
    id: uuidv4(),
    name: "Web Development",
    hourlyRate: 1200,
    isFixedPrice: false,
    type: "service", // Added required type property
  },
  {
    id: uuidv4(),
    name: "UI/UX Design",
    hourlyRate: 1400,
    isFixedPrice: false,
    type: "service", // Added required type property
  },
  {
    id: uuidv4(),
    name: "Server Maintenance",
    hourlyRate: 1100,
    isFixedPrice: false,
    type: "service", // Added required type property
  },
  {
    id: uuidv4(),
    name: "Website Redesign",
    hourlyRate: 0,
    isFixedPrice: true,
    fixedPrice: 45000,
    type: "service", // Added required type property
  },
];

// Generate sample time entries for past days
const generateTimeEntries = (): TimeEntry[] => {
  const entries: TimeEntry[] = [];
  
  // Generate time entries for the past 7 days
  for (let i = 0; i < 7; i++) {
    const date = subDays(new Date(), i);
    const formattedDate = format(date, "yyyy-MM-dd");
    
    // Generate 0-3 entries per day
    const entriesCount = Math.floor(Math.random() * 4);
    
    for (let j = 0; j < entriesCount; j++) {
      const client = mockClients[Math.floor(Math.random() * mockClients.length)];
      const activity = mockActivities[Math.floor(Math.random() * mockActivities.length)];
      
      const startHour = 8 + Math.floor(Math.random() * 8); // Between 8 and 16
      const startMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
      
      const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
      
      // Random duration between 30 minutes and 4 hours (in 15-min increments)
      const durationMinutes = (Math.floor(Math.random() * 16) + 2) * 15;
      
      const endTimeDate = addMinutes(
        new Date(
          date.getFullYear(),
          date.getMonth(), 
          date.getDate(), 
          startHour, 
          startMinute
        ), 
        durationMinutes
      );
      
      const endTime = format(endTimeDate, "HH:mm");
      
      entries.push({
        id: uuidv4(),
        clientId: client.id,
        activityId: activity.id,
        date: formattedDate,
        startTime,
        endTime,
        description: `Work on ${activity.name.toLowerCase()} for ${client.name}`,
        duration: durationMinutes,
        billable: true,
        invoiced: false,
        entryType: "service", // Added required entryType property
      });
    }
  }
  
  return entries;
};

export const mockTimeEntries: TimeEntry[] = generateTimeEntries();

// Helper function to find client by ID
export function getClientById(id: string): Client | undefined {
  return mockClients.find(client => client.id === id);
}

// Helper function to find activity by ID
export function getActivityById(id: string): Activity | undefined {
  return mockActivities.find(activity => activity.id === id);
}

// Helper function to get time entries for a specific date
export function getTimeEntriesByDate(date: string): TimeEntry[] {
  return mockTimeEntries.filter(entry => entry.date === date);
}
