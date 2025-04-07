
export interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
}

export interface Activity {
  id: string;
  name: string;
  hourlyRate: number;
  isFixedPrice: boolean;
  fixedPrice?: number;
}

export interface TimeEntry {
  id: string;
  clientId: string;
  activityId: string;
  date: string; // ISO string
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  description: string;
  duration: number; // in minutes
  billable: boolean;
  invoiced: boolean;
}

export interface Invoice {
  id: string;
  clientId: string;
  number: string;
  issueDate: string; // ISO string
  dueDate: string; // ISO string
  items: InvoiceItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  totalAmount: number;
}

export interface InvoiceItem {
  id: string;
  timeEntryId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export type DateRange = {
  from: Date | undefined;
  to?: Date | undefined;
};
