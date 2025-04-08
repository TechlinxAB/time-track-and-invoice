
export interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  organizationNumber?: string; // Swedish company ID
  customerNumber?: string; // Fortnox customer number
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  invoiceAddress?: string; // Can be different from regular address
  paymentTerms?: number; // Days until payment is due
  deliveryTerms?: string;
}

export interface Activity {
  id: string;
  name: string;
  hourlyRate: number;
  isFixedPrice: boolean;
  fixedPrice?: number;
  accountNumber?: string; // Swedish booking account number
  vatRate?: number; // VAT percentage
  articleNumber?: string; // Fortnox article number
  type: 'service' | 'product';
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  accountNumber?: string; // For Swedish Fortnox kontnummer
  unit?: string; // e.g., pcs, hours, etc.
  sku?: string; // Stock Keeping Unit
  inStock?: number;
  vatRate?: number; // VAT percentage
  articleNumber?: string; // Fortnox article number
}

export interface TimeEntry {
  id: string;
  clientId: string;
  activityId: string;
  productId?: string; // For product entries instead of activities
  date: string; // ISO string
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  description: string;
  duration: number; // in minutes
  quantity?: number; // For product entries
  billable: boolean;
  invoiced: boolean;
  entryType: 'service' | 'product';
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
  vatAmount?: number;
}

export interface InvoiceItem {
  id: string;
  timeEntryId?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  vatRate?: number;
  accountNumber?: string;
  articleNumber?: string;
}

export type DateRange = {
  from: Date | undefined;
  to?: Date | undefined;
};

export interface FortnoxCredentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'pending';
}

export interface FortnoxInvoice {
  client: Client | undefined;
  dateRange: DateRange;
  entries: TimeEntry[];
  notes: string;
  totalAmount: number;
}

export interface FortnoxApiResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  notifications?: {
    email?: boolean;
    app?: boolean;
  };
}

export type UserRole = 'admin' | 'manager' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatar?: string;
  settings?: UserSettings;
}
