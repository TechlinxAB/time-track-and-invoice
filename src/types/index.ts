
import { ReactNode } from "react";

export type UserRole = "admin" | "manager" | "user";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
  preferences?: Record<string, any>;
  settings?: Record<string, any>;
}

export type ActivityType = "service" | "product";
export type EntryType = "service" | "product";

export interface Activity {
  id: string;
  name: string;
  hourlyRate: number;
  isFixedPrice: boolean;
  fixedPrice?: number;
  type: ActivityType;
  accountNumber?: string;
  vatPercentage?: number;
  articleNumber?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  vatNumber?: string;
  organizationNumber?: string;
  customerNumber?: string;
  notes?: string;
  // Add the missing fields for Swedish invoice requirements
  invoiceAddress?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
}

export interface TimeEntry {
  id: string;
  clientId: string;
  activityId: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration: number;
  description?: string;
  billable: boolean;
  invoiced: boolean;
  entryType: EntryType;
  quantity?: number;
  unitPrice?: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  termsAndConditions?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
  timeEntryId?: string;
  activityId?: string;
}

export interface FortnoxCredentials {
  accessToken: string;
  refreshToken: string;
  scope: string;
  expiresAt: number;
}

export interface FortnoxAuthResponse {
  access_token: string;
  refresh_token: string;
  scope: string;
  expires_in: number;
}

export interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  id?: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

// Modified DateRange interface that's compatible with react-day-picker
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}
