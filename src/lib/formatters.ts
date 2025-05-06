import { format, parseISO, isValid } from 'date-fns';
import * as EventTypes from '../shared/types/event.ts';
import * as TicketTypes from '../shared/types/ticket.ts';
import * as DayTypes from '../shared/types/day.ts';
import * as SupabaseTypes from '../../supabase/supabase.types.ts'; // Import generated types namespace

// Define types for the raw database row inputs using consistent PascalCase
// These types must match the actual database table names after standardization
type DbEvent = SupabaseTypes.Database['public']['Tables']['Events']['Row'];
type DbTicketDefinition = SupabaseTypes.Database['public']['Tables']['ticket_definitions']['Row'];
// LINTER FIX: Comment out potentially incorrect type/table name
// type DbEventDay = Database['public']['Tables']['event_days']['Row']; 

/**
 * Formats an event object retrieved from the database for frontend display.
 * Converts TIMESTAMPTZ fields (eventStart, eventEnd) into required display formats.
 * 
 * @param dbEvent - The event object directly from the Supabase database.
 * @returns An EventType object suitable for frontend use.
 */
export function formatEventForDisplay(dbEvent: DbEvent): EventTypes.EventType {
  let day: string | undefined = undefined;
  let date: string | undefined = undefined;
  let time: string | undefined = undefined;
  let until: string | undefined = undefined;
  let parsedStartDate: Date | undefined = undefined;
  let parsedEndDate: Date | undefined = undefined;

  // Check if eventStart exists and is valid
  if (dbEvent.eventStart) {
    try {
      parsedStartDate = parseISO(dbEvent.eventStart);
      if (isValid(parsedStartDate)) {
        day = format(parsedStartDate, 'EEEE, d MMMM yy'); // e.g., "Sunday, 27 April 25"
        date = format(parsedStartDate, 'dd-MM-yyyy');       // e.g., "27-04-2025"
        time = format(parsedStartDate, 'hh:mm a');          // e.g., "06:00 PM"
      } else {
        console.error(`Invalid parsed start date for event ${dbEvent.id}: ${dbEvent.eventStart}`);
        parsedStartDate = undefined; // Ensure it's undefined if invalid
      }
    } catch (e) {
      console.error(`Error parsing eventStart for event ${dbEvent.id}: ${dbEvent.eventStart}`, e);
    }
  }

  // Check if eventEnd exists and is valid
  if (dbEvent.eventEnd) {
    try {
      parsedEndDate = parseISO(dbEvent.eventEnd);
      if (isValid(parsedEndDate)) {
        until = format(parsedEndDate, 'hh:mm a'); // e.g., "09:00 PM"
      } else {
         console.error(`Invalid parsed end date for event ${dbEvent.id}: ${dbEvent.eventEnd}`);
        parsedEndDate = undefined; // Ensure it's undefined if invalid
      }
    } catch (e) {
      console.error(`Error parsing eventEnd for event ${dbEvent.id}: ${dbEvent.eventEnd}`, e);
    }
  }

  const imageSrc = dbEvent.imageUrl ?? undefined;

  const formattedEvent: EventTypes.EventType = {
    // Pass through core identifiers and necessary DB fields
    id: dbEvent.id,
    slug: (dbEvent.slug ?? '') as string,
    eventStart: dbEvent.eventStart, // Pass the raw ISO string through
    eventEnd: dbEvent.eventEnd,     // Pass the raw ISO string through (or null)
    title: dbEvent.title,
    description: dbEvent.description,
    // LINTER FIX: Use type assertion for location
    location: (dbEvent.location ?? undefined) as any,
    type: dbEvent.type,
    featured: dbEvent.featured,
    // LINTER FIX: Use type assertion to bypass conflicting errors for now
    imageUrl: (dbEvent.imageUrl ?? undefined) as any, 
    isMultiDay: dbEvent.isMultiDay, // Keep for now, might be derivable
    parentEventId: dbEvent.parentEventId,
    eventIncludes: dbEvent.eventIncludes,
    importantInformation: dbEvent.importantInformation,
    latitude: dbEvent.latitude,
    longitude: dbEvent.longitude,
    isPurchasableIndividually: dbEvent.isPurchasableIndividually,
    createdAt: dbEvent.createdAt,
    
    // Add NEW derived/formatted fields
    day: day,       // Format: "Sunday, 27 April 25"
    date: date,     // Format: "27-04-2025"
    time: time,     // Format: "06:00 PM"
    until: until,   // Format: "09:00 PM"
    
    // Keep imageSrc alias
    // LINTER FIX: Use type assertion to bypass conflicting errors for now
    imageSrc: (dbEvent.imageUrl ?? undefined) as any,
    
    // Deprecated/Removed - check component usage before fully removing these from EventType
    // startTimeFormatted: undefined, 
    // endTimeFormatted: undefined,
  };

  return formattedEvent;
}

/**
 * Parses a frontend time string (e.g., "18:00" or "18:00 - 21:00") 
 * into startTime and endTime for database storage.
 * 
 * @param timeString - The time string from the frontend.
 * @returns An object with optional startTime and endTime (HH:MM format suitable for DB `time` type).
 */
export function parseTimeForDatabase(timeString: string | undefined | null): { startTime?: string, endTime?: string } {
  if (!timeString) return {};
  const parts = timeString.trim().split(/\s*-\s*/);
  if (parts.length === 1 && parts[0]) {
    return { startTime: parts[0] };
  }
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { startTime: parts[0], endTime: parts[1] };
  }
  // Keep this warning log
  console.warn(`Could not parse time string for database: "${timeString}"`);
  return {};
}

// --- Placeholder Formatters for New Types --- 

/**
 * Formats a ticket definition object from the database for frontend display.
 * (Example: formats price)
 * 
 * @param dbTicketDef - The raw ticket definition object from Supabase.
 * @returns A TicketDefinitionType object suitable for frontend use.
 */
export function formatTicketDefinitionForDisplay(dbTicketDef: DbTicketDefinition): TicketTypes.TicketDefinitionType {
  // Basic passthrough for now, add formatting as needed
  const formattedPrice = dbTicketDef.price != null 
    ? `$${dbTicketDef.price.toFixed(2)}` // Example: Format price as $XX.YY
    : undefined;

  return {
    ...dbTicketDef, // Spread raw data
    formattedPrice: formattedPrice, // Add formatted field
  };
}

// LINTER FIX: Comment out function using potentially incorrect DbEventDay type
/*
export function formatEventDayForDisplay(dbEventDay: DbEventDay): DayTypes.EventDayType {
  // Basic passthrough for now, add formatting as needed
  let formattedDate = '';
  if (dbEventDay.date) {
    try {
      formattedDate = format(parseISO(dbEventDay.date), 'MMMM d'); // Example: Format as "September 12"
    } catch (e) {
      // Keep this error log
      console.error(`Error parsing event day date: ${dbEventDay.date}`, e);
    }
  }

  return {
    ...dbEventDay, // Spread raw data
    formattedDate: formattedDate || undefined, // Add formatted field
  };
} 
*/ 