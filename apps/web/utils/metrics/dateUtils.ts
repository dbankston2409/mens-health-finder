// Import Firebase client SDK
import { Timestamp as ClientTimestamp } from 'firebase/firestore';

// Use client SDK Timestamp
const Timestamp = ClientTimestamp;

/**
 * Get the start of the current month as a Firestore Timestamp
 * 
 * @param date Optional date to use instead of current date
 * @returns Firestore Timestamp representing the start of the month
 */
export function getStartOfMonth(date: Date = new Date()): typeof Timestamp {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(startOfMonth);
}

/**
 * Get the start of the current year as a Firestore Timestamp
 * 
 * @param date Optional date to use instead of current date
 * @returns Firestore Timestamp representing the start of the year
 */
export function getStartOfYear(date: Date = new Date()): typeof Timestamp {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  startOfYear.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(startOfYear);
}

/**
 * Get the date X days ago as a Firestore Timestamp
 * 
 * @param daysAgo Number of days to go back
 * @param date Optional date to use instead of current date
 * @returns Firestore Timestamp representing the date X days ago
 */
export function getDateDaysAgo(daysAgo: number, date: Date = new Date()): typeof Timestamp {
  const pastDate = new Date(date);
  pastDate.setDate(pastDate.getDate() - daysAgo);
  pastDate.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(pastDate);
}

/**
 * Get a date range as Firestore Timestamps
 * 
 * @param daysAgo Number of days ago to start range
 * @param date Optional end date (defaults to current date)
 * @returns Object with startDate and endDate as Timestamps
 */
export function getDateRange(daysAgo: number, date: Date = new Date()): { startDate: typeof Timestamp, endDate: typeof Timestamp } {
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  
  return {
    startDate: getDateDaysAgo(daysAgo, date),
    endDate: Timestamp.fromDate(endDate)
  };
}

/**
 * Format a Firestore Timestamp or Date as YYYY-MM-DD
 * 
 * @param date Date or Timestamp to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | typeof Timestamp): string {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return dateObj.toISOString().split('T')[0];
}

/**
 * Get a readable month name from a date
 * 
 * @param date Date to get month from
 * @returns Month name (e.g., "January")
 */
export function getMonthName(date: Date | typeof Timestamp): string {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return dateObj.toLocaleString('default', { month: 'long' });
}

/**
 * Group a timestamp by month for aggregation
 * 
 * @param timestamp Firestore Timestamp
 * @returns String in format "YYYY-MM" for grouping
 */
export function getMonthKey(timestamp: typeof Timestamp): string {
  const date = timestamp.toDate();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Helper to determine if a timestamp is from the current month
 */
export function isCurrentMonth(timestamp: typeof Timestamp): boolean {
  const now = new Date();
  const date = timestamp.toDate();
  return date.getMonth() === now.getMonth() && 
         date.getFullYear() === now.getFullYear();
}

/**
 * Helper to determine if a timestamp is from the current year
 */
export function isCurrentYear(timestamp: typeof Timestamp): boolean {
  const now = new Date();
  const date = timestamp.toDate();
  return date.getFullYear() === now.getFullYear();
}