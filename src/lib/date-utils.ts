
import { format, addDays, subDays, startOfWeek, isSameDay, isToday, isYesterday, parseISO } from "date-fns";
import { TimeEntry } from "@/types";

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDisplayDate(date: Date): string {
  if (isToday(date)) {
    return "Today";
  }
  if (isYesterday(date)) {
    return "Yesterday";
  }
  return format(date, "d MMM");
}

export function getDatesForCurrentWeek(): Date[] {
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday as start of week
  
  return Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));
}

export function getPreviousWeek(currentFirstDay: Date): Date[] {
  const previousWeekStart = subDays(currentFirstDay, 7);
  return Array.from({ length: 7 }).map((_, i) => addDays(previousWeekStart, i));
}

export function getNextWeek(currentFirstDay: Date): Date[] {
  const nextWeekStart = addDays(currentFirstDay, 7);
  return Array.from({ length: 7 }).map((_, i) => addDays(nextWeekStart, i));
}

export function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  return endTotalMinutes >= startTotalMinutes 
    ? endTotalMinutes - startTotalMinutes
    : (24 * 60 - startTotalMinutes) + endTotalMinutes; // Next day
}

export function formatTimeFromMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function getTotalDurationForDay(entries: TimeEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.duration, 0);
}

export function formatTime(time: string): string {
  return time; // Already in HH:MM format, but could add additional formatting if needed
}

export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(amount);
}
