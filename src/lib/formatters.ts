import { format, parseISO, isValid } from 'date-fns';
import { EventType } from '../shared/types/event';
import { TicketDefinitionType } from '../shared/types/ticket';
import { EventDayType } from '../shared/types/day';
import { Database } from '../shared/types/supabase'; // Import generated types

// Define types for the raw database row inputs
type DbEvent = Database['public']['Tables']['events']['Row'];
type DbTicketDefinition = Database['public']['Tables']['ticket_definitions']['Row'];
type DbEventDay = Database['public']['Tables']['event_days']['Row'];

/**
 * Formats an event object retrieved from the database for frontend display.
 * Converts TIMESTAMPTZ fields (event_start, event_end) into required display formats.
 * 
 * @param dbEvent - The event object directly from the Supabase database.
 * @returns An EventType object suitable for frontend use.
 */
export function formatEventForDisplay(dbEvent: DbEvent): EventType {
  let day: string | undefined = undefined;
  let date: string | undefined = undefined;
  let time: string | undefined = undefined;
  let until: string | undefined = undefined;
  let parsedStartDate: Date | undefined = undefined;
  let parsedEndDate: Date | undefined = undefined;

  // Check if event_start exists and is valid
  if (dbEvent.event_start) {
    try {
      parsedStartDate = parseISO(dbEvent.event_start);
      if (isValid(parsedStartDate)) {
        day = format(parsedStartDate, 'EEEE, d MMMM yy'); // e.g., "Sunday, 27 April 25"
        date = format(parsedStartDate, 'dd-MM-yyyy');       // e.g., "27-04-2025"
        time = format(parsedStartDate, 'hh:mm a');          // e.g., "06:00 PM"
      } else {
        console.error(`Invalid parsed start date for event ${dbEvent.id}: ${dbEvent.event_start}`);
        parsedStartDate = undefined; // Ensure it's undefined if invalid
      }
    } catch (e) {
      console.error(`Error parsing event_start for event ${dbEvent.id}: ${dbEvent.event_start}`, e);
    }
  }

  // Check if event_end exists and is valid
  if (dbEvent.event_end) {
    try {
      parsedEndDate = parseISO(dbEvent.event_end);
      if (isValid(parsedEndDate)) {
        until = format(parsedEndDate, 'hh:mm a'); // e.g., "09:00 PM"
      } else {
         console.error(`Invalid parsed end date for event ${dbEvent.id}: ${dbEvent.event_end}`);
        parsedEndDate = undefined; // Ensure it's undefined if invalid
      }
    } catch (e) {
      console.error(`Error parsing event_end for event ${dbEvent.id}: ${dbEvent.event_end}`, e);
    }
  }

  const imageSrc = dbEvent.imageUrl ?? undefined;

  const formattedEvent: EventType = {
    // Pass through core identifiers and necessary DB fields
    id: dbEvent.id,
    slug: dbEvent.slug ?? '',
    event_start: dbEvent.event_start, // Pass the raw ISO string through
    event_end: dbEvent.event_end,     // Pass the raw ISO string through (or null)
    title: dbEvent.title,
    description: dbEvent.description,
    location: dbEvent.location,
    type: dbEvent.type,
    price: dbEvent.price,
    maxAttendees: dbEvent.maxAttendees,
    featured: dbEvent.featured,
    imageUrl: dbEvent.imageUrl,
    is_multi_day: dbEvent.is_multi_day, // Keep for now, might be derivable
    parent_event_id: dbEvent.parent_event_id,
    event_includes: dbEvent.event_includes,
    important_information: dbEvent.important_information,
    latitude: dbEvent.latitude,
    longitude: dbEvent.longitude,
    is_purchasable_individually: dbEvent.is_purchasable_individually,
    created_at: dbEvent.created_at,
    
    // Add NEW derived/formatted fields
    day: day,       // Format: "Sunday, 27 April 25"
    date: date,     // Format: "27-04-2025"
    time: time,     // Format: "06:00 PM"
    until: until,   // Format: "09:00 PM"
    
    // Keep imageSrc alias
    imageSrc: imageSrc,
    
    // Deprecated/Removed - check component usage before fully removing these from EventType
    // startTimeFormatted: undefined, 
    // endTimeFormatted: undefined,
  };

  return formattedEvent;
}

/**
 * Parses a frontend time string (e.g., "18:00" or "18:00 - 21:00") 
 * into start_time and end_time for database storage.
 * 
 * @param timeString - The time string from the frontend.
 * @returns An object with optional start_time and end_time (HH:MM format suitable for DB `time` type).
 */
export function parseTimeForDatabase(timeString: string | undefined | null): { start_time?: string, end_time?: string } {
  if (!timeString) return {};
  const parts = timeString.trim().split(/\s*-\s*/);
  if (parts.length === 1 && parts[0]) {
    return { start_time: parts[0] };
  }
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { start_time: parts[0], end_time: parts[1] };
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
export function formatTicketDefinitionForDisplay(dbTicketDef: DbTicketDefinition): TicketDefinitionType {
  // Basic passthrough for now, add formatting as needed
  const formattedPrice = dbTicketDef.price != null 
    ? `$${dbTicketDef.price.toFixed(2)}` // Example: Format price as $XX.YY
    : undefined;

  return {
    ...dbTicketDef, // Spread raw data
    formattedPrice: formattedPrice, // Add formatted field
  };
}

/**
 * Formats an event day object from the database for frontend display.
 * (Example: formats date)
 * 
 * @param dbEventDay - The raw event day object from Supabase.
 * @returns An EventDayType object suitable for frontend use.
 */
export function formatEventDayForDisplay(dbEventDay: DbEventDay): EventDayType {
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