import { format } from 'date-fns-tz';
import { addHours } from 'date-fns';

// Interface for the event data expected by the utility functions
// Expects Date objects for start/end times for easier manipulation
export interface CalendarEventData {
  title: string;
  description: string;
  location: string;
  startDateTime: Date;
  endDateTime?: Date; // Optional: if not provided, might default duration
  timeZone?: string; // Add optional timezone (e.g., 'Australia/Sydney')
  // Optional: Add other fields like a URL for the event itself if needed
}

// Helper function to format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
const formatGoogleDate = (date: Date): string => {
  // Format the date as UTC
  return format(date, "yyyyMMdd'T'HHmmss'Z'", { timeZone: 'UTC' });
};

/**
 * Generates a Google Calendar URL.
 * @param event - The event data.
 * @returns The Google Calendar event URL.
 */
export function generateGoogleCalendarUrl(event: CalendarEventData): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const tz = event.timeZone || 'UTC'; // Default to UTC if no timezone provided
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.startDateTime)}/${formatGoogleDate(event.endDateTime || addHours(event.startDateTime, 1))}`,
    details: event.description,
    location: event.location,
    ctz: tz // Optionally pass timezone hint to Google
  });
  return `${baseUrl}?${params.toString()}`;
}

// --- Add other generator functions below --- 