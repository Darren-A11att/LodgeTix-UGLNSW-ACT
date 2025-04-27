import { supabase } from '../supabase';
import { EventType } from '../../shared/types/event';
import { formatEventForDisplay } from '../formatters';
import { Database } from '../../shared/types/supabase';
import { EventDayOverviewType } from '../../shared/types/event';

// Define DbEvent type here for use in the function
type DbEvent = Database['public']['Tables']['events']['Row'];

// Interface for the function's return value
export interface PaginatedEventsResponse {
  events: EventType[];
  totalCount: number | null;
}

// Interface for getEvents arguments
interface GetEventsParams {
  // scopeName?: string; // Removed unused parameter
  page?: number;
  limit?: number;
  filterType?: string | null;
}

/**
 * Fetches events based on filters and pagination.
 * @param params - Object containing page, limit, filterType.
 * @returns Promise resolving to PaginatedEventsResponse.
 */
export async function getEvents({
  // scopeName = 'anonymous', // Removed unused parameter
  page = 1,
  limit = 9, // Default limit per page
  filterType = null,
}: GetEventsParams): Promise<PaginatedEventsResponse> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // console.log(`Fetching events: scope=${scopeName}, page=${page}, limit=${limit}, type=${filterType}, range=${from}-${to}`);

  try {
    // 1. Get the ID for the requested scope name (if needed, seems hardcoded now?)
    // Let's assume for now filtering doesn't rely on display_scopes table and uses the public events
    // If scope filtering IS needed, we need to re-introduce fetching scopeId

    // Columns needed for EventCard + formatting
    const selectColumns = `
      id, slug, title, description, event_start, event_end, location, type, price, maxAttendees, imageUrl
    `;

    // Start building the query
    let query = supabase
      .from('events')
      .select(selectColumns, { count: 'exact' })
      // TODO: Review logic for fetching parent/child events if needed
      .not('parent_event_id', 'is', null); 

    // Apply type filter if provided
    if (filterType) {
      query = query.eq('type', filterType);
    }

    // Apply pagination and ordering
    query = query.order('event_start', { ascending: true }).range(from, to);

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error(`Error fetching events:`, error);
      return { events: [], totalCount: 0 };
    }

    // Format events for display
    const formattedEvents = data.map(event => formatEventForDisplay(event as unknown as DbEvent));

    // console.log(`Found ${formattedEvents.length} events on page ${page}, total count: ${count}`);

    return { events: formattedEvents, totalCount: count };

  } catch (err) {
    console.error(`Unexpected error fetching events:`, err);
    return { events: [], totalCount: 0 };
  }
}

/**
 * Fetches featured events for homepage or promotional sections
 * TODO: Does this need scope filtering? Assuming anonymous for now.
 * @param limit Maximum number of events to return
 * @returns Promise resolving to array of formatted featured events
 */
export async function getFeaturedEvents(limit: number = 3): Promise<EventType[]> {
  // console.log(`Fetching featured events`);
  try {
    const { data: scopeData, error: scopeError } = await supabase
      .from('display_scopes')
      .select('id')
      .eq('name', 'anonymous') // Hardcoding anonymous for featured for now
      .single();

    if (scopeError || !scopeData) {
      // Keep this error log
      console.error(`Error fetching display scope ID for 'anonymous' (featured):`, scopeError);
      return [];
    }
    const scopeId = scopeData.id;

    const { data, error } = await supabase
      .from('events')
      // .select('*') // OLD
      // NEW: Explicitly select columns needed for featured display
      .select('id, slug, title, event_start, event_end, location, imageUrl, price, description, type') 
      .not('parent_event_id', 'is', null) // Assuming featured events are also children
      .eq('featured', true)
      .eq('display_scope_id', scopeId) // Filter by anonymous scope
      .order('event_start', { ascending: true })
      .limit(limit);
    
    if (error) {
      // Keep this error log
      console.error('Error fetching featured events:', error);
      return [];
    }
    // console.log(`Found ${data.length} featured events`);
    
    return data.map(event => formatEventForDisplay(event as unknown as DbEvent)); // Add type assertion
  } catch (err) {
    // Keep this error log
    console.error('Unexpected error fetching featured events:', err);
    return [];
  }
}

/**
 * Fetches events by type (Social, Ceremony, etc.)
 * TODO: Does this need scope filtering? Assuming scope passed in or default anonymous.
 * @param type The event type to filter by
 * @param scopeName The display scope (defaults to 'anonymous')
 * @returns Promise resolving to array of formatted events of the specified type and scope
 */
export async function getEventsByType(type: string, scopeName: string = 'anonymous'): Promise<EventType[]> {
  // console.log(`Fetching events of type '${type}' for scope '${scopeName}'`);
  try {
    const { data: scopeData, error: scopeError } = await supabase
      .from('display_scopes')
      .select('id')
      .eq('name', scopeName)
      .single();

    if (scopeError || !scopeData) {
      // Keep this error log
      console.error(`Error fetching display scope ID for '${scopeName}' (type filter):`, scopeError);
      return [];
    }
    const scopeId = scopeData.id;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .not('parent_event_id', 'is', null) // Assuming type filters apply to child events
      .eq('type', type)
      .eq('display_scope_id', scopeId) // Filter by scope
      .order('event_start', { ascending: true });
    
    if (error) {
      // Keep this error log
      console.error(`Error fetching ${type} events for scope ${scopeName}:`, error);
      return [];
    }
    // console.log(`Found ${data.length} events of type '${type}' for scope '${scopeName}'`);
    
    return data.map(event => formatEventForDisplay(event as unknown as DbEvent)); // Add type assertion
  } catch (err) {
    // Keep this error log
    console.error(`Unexpected error fetching ${type} events for scope ${scopeName}:`, err);
    return [];
  }
}

/**
 * Fetches a single event by its slug.
 * @param slug The URL-friendly slug of the event to fetch.
 * @returns Promise resolving to the formatted event object or null if not found or error.
 */
export async function getEventById(slug: string): Promise<EventType | null> {
  // console.log(`Fetching event with slug: ${slug}`);
  if (!slug) {
    console.error('getEventById called with no slug.');
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        slug, 
        title,
        description,
        event_start, 
        event_end,
        location,
        latitude, 
        longitude,
        type,
        imageUrl,
        maxAttendees,
        price,
        is_multi_day,
        parent_event_id,
        created_at,
        featured
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching event with slug ${slug}:`, error);
      return null;
    }

    if (!data) {
      // console.log(`No event found with slug: ${slug}`);
      return null;
    }
    
    // Ensure formatEventForDisplay handles the slug field correctly
    return formatEventForDisplay(data as unknown as DbEvent);
  } catch (err) {
    console.error(`Unexpected error fetching event with slug ${slug}:`, err);
    return null;
  }
}

/**
 * Fetches child events for a given parent event ID.
 * @param parentEventId The UUID of the parent event.
 * @returns Promise resolving to an array of formatted child event objects.
 */
export async function getChildEvents(parentEventId: string): Promise<EventType[]> {
  // console.log(`Fetching child events for parent ID: ${parentEventId}`);
  if (!parentEventId) {
    // Keep this error log
    console.error('getChildEvents called with no parent ID.');
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('parent_event_id', parentEventId) // Filter by parent_event_id
      .order('event_start', { ascending: true }) // Order child events by date

    if (error) {
      // Keep this error log
      console.error(`Error fetching child events for parent ID ${parentEventId}:`, error);
      return [];
    }

    if (!data || data.length === 0) {
      // console.log(`No child events found for parent ID: ${parentEventId}`);
      return [];
    }
    
    // console.log(`Found ${data.length} child events for parent ID: ${parentEventId}`);
    return data.map(event => formatEventForDisplay(event as unknown as DbEvent)); // Add type assertion
  } catch (err) {
    // Keep this error log
    console.error(`Unexpected error fetching child events for parent ID ${parentEventId}:`, err);
    return [];
  }
}

/**
 * Fetches related events occurring on the same date as the given event.
 * Excludes the event itself and any potential child events if the main event is multi-day.
 * @param eventId The UUID of the current event.
 * @param eventDate The date string (YYYY-MM-DD) of the current event.
 * @param limit The maximum number of related events to return (default: 3).
 * @returns Promise resolving to an array of formatted related event objects.
 */
export async function getRelatedEvents(
  eventId: string, 
  eventDate: string, 
  limit: number = 3
): Promise<EventType[]> {
  // console.log(`Fetching related events for event ID: ${eventId} on date: ${eventDate}`);
  if (!eventId || !eventDate) {
    // Keep this error log
    console.error('getRelatedEvents called with missing event ID or date.');
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      // .eq('date', eventDate) // OLD: Match the date column
      // NEW: Filter where the date part of event_start matches eventDate
      // We assume eventDate is YYYY-MM-DD. We cast event_start to date in the DB timezone.
      // Note: Using .filter() with DB functions is generally preferred over .rpc() for simple selects.
      .filter('event_start', 'gte', `${eventDate}T00:00:00`) // Greater than or equal to start of day
      .filter('event_start', 'lt', `${eventDate}T23:59:59`) // Less than end of day (adjust timezone if needed)
      .neq('id', eventId) // Exclude the event itself
      .is('parent_event_id', null) // Exclude child events (assuming parent_event_id is null for main/single events)
      .order('event_start', { ascending: true })
      .limit(limit);

    if (error) {
      // Keep this error log
      console.error(`Error fetching related events for ID ${eventId} on date ${eventDate}:`, error);
      return [];
    }

    if (!data || data.length === 0) {
      // console.log(`No related events found for ID: ${eventId} on date ${eventDate}`);
      return [];
    }

    // console.log(`Found ${data.length} related events`);
    return data.map(event => formatEventForDisplay(event as unknown as DbEvent)); // Add type assertion
  } catch (err) {
    // Keep this error log
    console.error(`Unexpected error fetching related events for ID ${eventId} on date ${eventDate}:`, err);
    return [];
  }
}

/**
 * Fetches event day overview data.
 * @returns Promise resolving to array of formatted EventDayOverviewType.
 */
export async function getEventDaysOverview(): Promise<EventDayOverviewType[]> {
  try {
    const { data, error } = await supabase
      .from('event_days')
      .select('id, date, name, featured_events_summary')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching event days overview:', error);
      return [];
    }

    // Optionally format the date here, or do it in the component
    const formattedData = data.map(day => ({
        ...day,
        // Example formatting (can be done in component instead)
        // formattedDate: format(parseISO(day.date), 'EEEE, MMMM d') 
    }));

    return formattedData as EventDayOverviewType[]; // Type assertion

  } catch (err) {
    console.error('Unexpected error fetching event days overview:', err);
    return [];
  }
}

/**
 * Fetches the main parent event (assumed to be the one with parent_event_id IS NULL).
 * Selects fields needed for HomePage display.
 * @returns Promise resolving to the formatted parent event object or null if not found.
 */
export async function getParentEvent(): Promise<EventType | null> {
  console.log("Fetching parent event...");
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        slug,
        title,
        event_start,
        event_end,
        location,
        maxAttendees
      `)
      .is('parent_event_id', null) // Key filter for parent event
      .maybeSingle(); // Expecting only one top-level parent event

    if (error) {
      console.error('Error fetching parent event:', error);
      return null;
    }

    if (!data) {
      console.warn('No parent event found (parent_event_id is NULL).');
      return null;
    }

    console.log("Parent event found:", data.title);
    return formatEventForDisplay(data as unknown as DbEvent);

  } catch (err) {
    console.error('Unexpected error fetching parent event:', err);
    return null;
  }
}

// --- TEMPORARY FOR CONSOLE TESTING --- 
// Update interface for the functions we are attaching
/*
interface TestApiFunctions {
  getEvents: (scopeName?: string) => Promise<EventType[]>;
  getFeaturedEvents: (limit?: number) => Promise<EventType[]>;
  getEventsByType: (type: string, scopeName?: string) => Promise<EventType[]>;
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Extend the Window interface (safer than using 'any')
  interface WindowWithTestApi extends Window {
    testAPI?: TestApiFunctions;
  }
  (window as WindowWithTestApi).testAPI = {
    getEvents,
    getFeaturedEvents,
    getEventsByType
  };
  console.log('Event API functions attached to window.testAPI for testing.');
}
// --- END TEMPORARY ---
*/ 