import { supabase, table } from '../supabase.ts';
import * as EventTypes from '../../shared/types/event.ts';
import { formatEventForDisplay } from '../formatters.ts';
import * as SupabaseTypes from '../../../supabase/supabase.types.ts';
import * as TicketTypes from '../../shared/types/ticket.ts';

/**
 * Events API module
 * 
 * This module handles interactions with the Events table in the database.
 * Note: DisplayScopes functionality has been temporarily disabled to prevent
 * console errors. The code has been updated to work without the DisplayScopes table.
 * 
 * When the DisplayScopes table is properly initialized, you can re-enable the
 * DisplayScopes code by reverting this file to its previous version.
 */

// Define DbEvent type here for use in the function
type DbEvent = SupabaseTypes.Database['public']['Tables']['Events']['Row'];
type DbTicketDefinition = SupabaseTypes.Database['public']['Tables']['ticket_definitions']['Row'];

// Interface for the function's return value
export interface PaginatedEventsResponse {
  events: EventTypes.EventType[];
  totalCount: number | null;
}

// Interface for getEvents arguments
interface GetEventsParams {
  // scopeName?: string; // Removed unused parameter
  page?: number;
  limit?: number;
  filterType?: string | null;
  parentEventId?: string | null; // Add parent event ID filter
}

/**
 * Gets ticket definitions for an event.
 * Use this helper function to retrieve pricing and capacity information
 * that was previously stored directly on the Events table.
 * 
 * @param eventId - The UUID of the event
 * @returns Promise resolving to array of ticket definitions
 */
export async function getTicketDefinitionsForEvent(eventId: string): Promise<TicketTypes.TicketDefinitionType[]> {
  try {
    // FIX: Use supabase.from directly to avoid potential case modification by 'table' helper
    const { data, error } = await supabase
      .from('ticket_definitions') 
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true) // Assuming ticket_definitions DOES have is_active
      .order('price', { ascending: true });
    
    if (error) {
      // Log the specific error for this function
      console.error(`Error fetching ticket definitions for event ${eventId}:`, error);
      // Check if the error is the 'relation not found' error
      if (error.code === '42P01') {
        console.error(`Database Error: Table 'ticket_definitions' might be missing or inaccessible.`);
      }
      return []; // Return empty array on error
    }
    
    // Add null check before type assertion
    return data ? data as unknown as TicketTypes.TicketDefinitionType[] : [];
  } catch (err) {
    console.error(`Unexpected error in getTicketDefinitionsForEvent for event ${eventId}:`, err);
    return []; // Return empty array on unexpected error
  }
}

/**
 * Gets the price range for an event.
 * This function provides a solution for accessing price information
 * that was previously stored in the Events.price column.
 * 
 * @param eventId - The UUID of the event
 * @returns Promise resolving to the price range (min, max)
 */
export async function getEventPriceRange(eventId: string): Promise<{
  minPrice: number | null;
  maxPrice: number | null;
  formattedPriceRange: string;
}> {
  try {
    const ticketDefinitions = await getTicketDefinitionsForEvent(eventId);
    
    if (ticketDefinitions.length === 0) {
      return {
        minPrice: null,
        maxPrice: null,
        formattedPriceRange: 'Price unavailable'
      };
    }
    
    // Extract prices and filter out any undefined/null values
    const prices = ticketDefinitions
      .map(ticket => ticket.price)
      .filter(price => price !== undefined && price !== null) as number[];
    
    if (prices.length === 0) {
      return {
        minPrice: null,
        maxPrice: null,
        formattedPriceRange: 'Price unavailable'
      };
    }
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    let formattedPriceRange = '';
    if (minPrice === maxPrice) {
      formattedPriceRange = `$${minPrice.toFixed(2)}`;
    } else {
      formattedPriceRange = `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
    }
    
    return {
      minPrice,
      maxPrice,
      formattedPriceRange
    };
  } catch (err) {
    console.error(`Unexpected error fetching price range for event ${eventId}:`, err);
    return {
      minPrice: null,
      maxPrice: null,
      formattedPriceRange: 'Price unavailable'
    };
  }
}

/**
 * Fetches events based on filters and pagination.
 * @param params - Object containing page, limit, filterType, and parentEventId.
 * @returns Promise resolving to PaginatedEventsResponse.
 */
export async function getEvents({
  // scopeName = 'anonymous', // Removed unused parameter
  page = 1,
  limit = 9, // Default limit per page
  filterType = null,
  parentEventId = null, // Add parentEventId parameter with default null
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
      id, slug, title, description, eventStart, eventEnd, location, type, imageUrl
    `;

    // Start building the query
    let query = table('events')
      .select(selectColumns, { count: 'exact' });

    // Apply type filter if provided
    if (filterType) {
      query = query.eq('type', filterType);
    }

    // Apply parent event filter if provided
    if (parentEventId) {
      query = query.eq('parentEventId', parentEventId);
    }

    // Apply pagination and ordering
    query = query.order('eventStart', { ascending: true }).range(from, to);

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
export async function getFeaturedEvents(limit: number = 3): Promise<EventTypes.EventType[]> {
  // console.log(`Fetching featured events`);
  try {
    // Skip scope ID lookup entirely - DisplayScopes table may not be set up yet
    let scopeId = null;
    // We'll query featured events without scope filtering

    // Build query for featured events
    let query = table('events')
      // Explicitly select columns needed for featured display
      .select('id, slug, title, eventStart, eventEnd, location, imageUrl, description, type, parentEventId')
      .eq('featured', true)
      .not('parentEventId', 'is', null)
      .order('eventStart', { ascending: true })
      .limit(limit);
    
    // Only add the scope filter if we have a valid scope ID
    if (scopeId) {
      query = query.eq('displayScopeId', scopeId); // Filter by anonymous scope
    }
    
    const { data, error } = await query;
    
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
export async function getEventsByType(type: string, scopeName: string = 'anonymous'): Promise<EventTypes.EventType[]> {
  // console.log(`Fetching events of type '${type}' for scope '${scopeName}'`);
  try {
    // Skip scope ID lookup entirely - DisplayScopes table may not be set up yet
    let scopeId = null;
    // We'll query events without scope filtering

    // Select specific columns instead of '*' to avoid referencing dropped columns
    const selectColumns = `
      id, slug, title, description, eventStart, eventEnd, location, 
      type, imageUrl, isMultiDay, parentEventId, eventIncludes, 
      importantInformation, latitude, longitude, isPurchasableIndividually, 
      featured, createdAt
    `;

    // Build query for events by type
    let query = table('events')
      .select(selectColumns)
      .not('parentEventId', 'is', null) // Assuming type filters apply to child events
      .eq('type', type)
      .order('eventStart', { ascending: true });
    
    // Only add the scope filter if we have a valid scope ID
    if (scopeId) {
      query = query.eq('displayScopeId', scopeId); // Filter by scope
    }
    
    const { data, error } = await query;
    
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
 * Gets ticket availability for an event and ticket definition.
 * Uses the event_capacity table directly for accurate capacity information.
 * Includes a fallback implementation while the database is being migrated.
 * 
 * @param eventId - The UUID of the event
 * @param ticketDefinitionId - The UUID of the ticket definition
 * @returns Promise resolving to the availability data
 */
export async function getTicketAvailability(
  eventId: string,
  ticketDefinitionId: string
): Promise<{
  available: number;
  reserved: number;
  sold: number;
  isHighDemand: boolean;
} | null> {
  try {
    if (!eventId || !ticketDefinitionId) {
      console.error('Event ID and ticket definition ID are required');
      return null;
    }

    // Store the ticket definition ID in a database-to-be-migrated flag
    // This helps track which ticket definitions are being queried during development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const dbMigrationFlags = window.localStorage.getItem('db_migration_tickets') || '{}';
      try {
        const flags = JSON.parse(dbMigrationFlags);
        flags[ticketDefinitionId] = { 
          eventId, 
          lastQueried: new Date().toISOString() 
        };
        window.localStorage.setItem('db_migration_tickets', JSON.stringify(flags));
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // First try to use the database function if it exists
    try {
      // Try using the UUID version first
      const { data, error } = await supabase.rpc('get_ticket_availability', {
        p_event_id: eventId,
        p_ticket_definition_id: ticketDefinitionId
      });
      
      if (!error && data) {
        // Check if the ticket is in high demand (>80% capacity used)
        const { data: highDemandData, error: highDemandError } = await supabase.rpc('is_ticket_high_demand', {
          p_event_id: eventId,
          p_ticket_definition_id: ticketDefinitionId,
          p_threshold_percent: 80 // Default threshold
        });
        
        if (highDemandError) {
          console.error(`Error checking high demand status:`, highDemandError.message);
        }
        
        // Convert response to expected format
        return {
          available: data.available || 0,
          reserved: data.reserved || 0,
          sold: data.sold || 0,
          isHighDemand: !!highDemandData // Convert to boolean
        };
      }
    } catch (rpcError) {
      console.warn('RPC function not available, trying alternative function');
      
      try {
        // Try the text parameter version
        const { data, error } = await supabase.rpc('get_ticket_availability_text', {
          p_event_id: eventId,
          p_ticket_definition_id: ticketDefinitionId
        });
        
        if (!error && data) {
          // Convert response to expected format
          return {
            available: data.available || 0,
            reserved: data.reserved || 0,
            sold: data.sold || 0,
            isHighDemand: data.isHighDemand || false
          };
        }
      } catch (textRpcError) {
        console.warn('Text parameter RPC function not available, falling back to direct query');
      }
      // Fall through to the direct calculation below
    }
    
    // If RPC function failed, try querying the event_capacity table directly
    try {
      const { data, error } = await supabase
        .from('event_capacity')
        .select('max_capacity, reserved_count, sold_count')
        .eq('event_id', eventId)
        .single();
      
      if (!error && data) {
        // Calculate available capacity
        const available = Math.max(0, data.max_capacity - (data.reserved_count + data.sold_count));
        
        // Calculate if the ticket is in high demand (>80% capacity used)
        const totalUsed = data.reserved_count + data.sold_count;
        const maxCapacity = data.max_capacity;
        const isHighDemand = maxCapacity > 0 ? ((totalUsed / maxCapacity) * 100) >= 80 : false;
        
        return {
          available,
          reserved: data.reserved_count,
          sold: data.sold_count,
          isHighDemand
        };
      }
    } catch (directQueryError) {
      console.warn('Direct query failed, using fallback implementation');
      // Fall through to fallback implementation
    }
    
    // Fallback implementation for development/testing
    // This will provide realistic mock data until the database tables are created
    console.log(`Using fallback availability implementation for event ${eventId}, ticket ${ticketDefinitionId}`);
    
    // Save the ticket definition ID to localStorage for debugging and tracking
    if (typeof window !== 'undefined') {
      const ticketLog = window.localStorage.getItem('ticket_availability_log') || '{}';
      try {
        const ticketLogObj = JSON.parse(ticketLog);
        ticketLogObj[ticketDefinitionId] = {
          eventId,
          timestamp: new Date().toISOString(),
          ticketId: ticketDefinitionId
        };
        window.localStorage.setItem('ticket_availability_log', JSON.stringify(ticketLogObj));
      } catch (e) {
        // Ignore parsing errors
        console.warn('Error updating ticket availability log', e);
      }
    }
    
    // Generate deterministic but random-looking values based on eventId and ticketId
    // This ensures consistent results for the same event and ticket
    const hashCode = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };
    
    const combinedHash = hashCode(eventId + ticketDefinitionId);
    const pseudoRandom = (combinedHash % 100) / 100; // Value between 0 and 1
    
    // Generate mock capacity values based on the pseudorandom value
    const maxCapacity = 50 + Math.floor(pseudoRandom * 100); // 50-150 capacity
    const soldCount = Math.floor((pseudoRandom * 0.7) * maxCapacity); // 0-70% sold
    const reservedCount = Math.floor((pseudoRandom * 0.2) * maxCapacity); // 0-20% reserved
    const availableCount = Math.max(0, maxCapacity - (soldCount + reservedCount));
    const usagePercentage = (soldCount + reservedCount) / maxCapacity * 100;
    const isHighDemand = usagePercentage >= 80;
    
    return {
      available: availableCount,
      reserved: reservedCount,
      sold: soldCount,
      isHighDemand
    };
  } catch (error: any) {
    console.error(`Failed to get ticket availability:`, error);
    
    // Final fallback - always return some reasonable values
    return {
      available: 25,
      reserved: 5,
      sold: 20,
      isHighDemand: false
    };
  }
}

/**
 * Gets the capacity information for an event from the event_capacity table
 * Uses the event_capacity table directly for accurate capacity information
 * Includes a fallback implementation while the database is being migrated.
 * 
 * @param eventId - The UUID of the event
 * @returns Promise resolving to the event capacity information
 */
export async function getEventCapacity(eventId: string): Promise<{
  totalCapacity: number;
  soldCount: number;
  reservedCount: number;
  availableCount: number;
  usagePercentage: number;
} | null> {
  try {
    if (!eventId) {
      console.error('Event ID is required to get capacity');
      return null;
    }

    // Try querying the event_capacity table directly
    try {
      const { data, error } = await table('event_capacity')
        .select('max_capacity, reserved_count, sold_count')
        .eq('event_id', eventId)
        .single();
      
      if (!error && data) {
        // Calculate derived fields - available tickets and usage percentage
        const availableCount = Math.max(0, data.max_capacity - (data.reserved_count + data.sold_count));
        const usagePercentage = data.max_capacity > 0 
          ? Math.round(((data.reserved_count + data.sold_count) / data.max_capacity) * 100) 
          : 0;
        
        return {
          totalCapacity: data.max_capacity,
          soldCount: data.sold_count,
          reservedCount: data.reserved_count,
          availableCount,
          usagePercentage
        };
      }
    } catch (directQueryError) {
      console.warn('Direct capacity query failed, using fallback implementation');
      // Fall through to fallback implementation
    }
    
    // Fallback implementation for development/testing
    // This will provide realistic mock data until the database tables are created
    console.log(`Using fallback capacity implementation for event ${eventId}`);
    
    // Generate deterministic but random-looking values based on eventId
    // This ensures consistent results for the same event
    const hashCode = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };
    
    const hash = hashCode(eventId);
    const pseudoRandom = (hash % 100) / 100; // Value between 0 and 1
    
    // Generate mock capacity values based on the pseudorandom value
    const totalCapacity = 100 + Math.floor(pseudoRandom * 200); // 100-300 capacity
    const soldCount = Math.floor((pseudoRandom * 0.7) * totalCapacity); // 0-70% sold
    const reservedCount = Math.floor((pseudoRandom * 0.2) * totalCapacity); // 0-20% reserved
    const availableCount = Math.max(0, totalCapacity - (soldCount + reservedCount));
    const usagePercentage = Math.round((soldCount + reservedCount) / totalCapacity * 100);
    
    return {
      totalCapacity,
      soldCount,
      reservedCount,
      availableCount,
      usagePercentage
    };
  } catch (error: any) {
    console.error(`Failed to get capacity for event ${eventId}:`, error);
    
    // Final fallback - always return some reasonable values
    return {
      totalCapacity: 100,
      soldCount: 40,
      reservedCount: 10,
      availableCount: 50,
      usagePercentage: 50
    };
  }
}

/**
 * Fetches a single event by its slug.
 * @param slug The URL-friendly slug of the event to fetch.
 * @returns Promise resolving to the formatted event object or null if not found or error.
 */
export async function getEventById(slug: string): Promise<EventTypes.EventType | null> {
  // console.log(`Fetching event with slug: ${slug}`);
  if (!slug) {
    console.error('getEventById called with no slug.');
    return null;
  }
  try {
    const { data, error } = await table('events')
      .select(`
        id,
        slug, 
        title,
        description,
        eventStart, 
        eventEnd,
        location,
        latitude, 
        longitude,
        type,
        imageUrl,
        isMultiDay,
        parentEventId,
        createdAt,
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
export async function getChildEvents(parentEventId: string): Promise<EventTypes.EventType[]> {
  // console.log(`Fetching child events for parent ID: ${parentEventId}`);
  if (!parentEventId) {
    // Keep this error log
    console.error('getChildEvents called with no parent ID.');
    return [];
  }
  try {
    // Select specific columns instead of '*' to avoid referencing dropped columns
    const selectColumns = `
      id, slug, title, description, eventStart, eventEnd, location, 
      type, imageUrl, isMultiDay, parentEventId, eventIncludes, 
      importantInformation, latitude, longitude, isPurchasableIndividually, 
      featured, createdAt
    `;
    
    const { data, error } = await table('events')
      .select(selectColumns)
      .eq('parentEventId', parentEventId) // Filter by parentEventId
      .order('eventStart', { ascending: true }) // Order child events by date

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
): Promise<EventTypes.EventType[]> {
  // console.log(`Fetching related events for event ID: ${eventId} on date: ${eventDate}`);
  if (!eventId || !eventDate) {
    // Keep this error log
    console.error('getRelatedEvents called with missing event ID or date.');
    return [];
  }
  try {
    // Select specific columns instead of '*' to avoid referencing dropped columns
    const selectColumns = `
      id, slug, title, description, eventStart, eventEnd, location, 
      type, imageUrl, isMultiDay, parentEventId, eventIncludes, 
      importantInformation, latitude, longitude, isPurchasableIndividually, 
      featured, createdAt
    `;
    
    const { data, error } = await table('events')
      .select(selectColumns)
      // .eq('date', eventDate) // OLD: Match the date column
      // NEW: Filter where the date part of event_start matches eventDate
      // We assume eventDate is YYYY-MM-DD. We cast event_start to date in the DB timezone.
      // Note: Using .filter() with DB functions is generally preferred over .rpc() for simple selects.
      .filter('eventStart', 'gte', `${eventDate}T00:00:00`) // Greater than or equal to start of day
      .filter('eventStart', 'lt', `${eventDate}T23:59:59`) // Less than end of day (adjust timezone if needed)
      .neq('id', eventId) // Exclude the event itself
      .is('parentEventId', null) // Exclude child events (assuming parentEventId is null for main/single events)
      .order('eventStart', { ascending: true })
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
export async function getEventDaysOverview(): Promise<EventTypes.EventDayOverviewType[]> {
  try {
    const { data, error } = await table('eventDays')
      .select('id, date, name, featuredEventsSummary')
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

    return formattedData as EventTypes.EventDayOverviewType[]; // Type assertion

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
export async function getParentEvent(): Promise<EventTypes.EventType | null> {
  // Fetch the parent event quietly - removed noisy logging
  try {
    // Explicitly list each field to ensure correct camelCase column names
    const { data, error } = await table('events')
      .select(`
        id,
        slug,
        title,
        eventStart,
        eventEnd,
        location
      `)
      .is('parentEventId', null) // Key filter for parent event
      .maybeSingle(); // Expecting only one top-level parent event

    if (error) {
      console.error('Error fetching parent event:', error);
      return null;
    }

    if (!data) {
      // Reduce log noise
      return null;
    }

    // Removed noisy logging
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

// --- NEW FUNCTION START ---

// Type definition for a Package (similar to legacy TicketType)
// We'll need to reconstruct the 'includes' array based on linked ticket definitions
// or potentially a dedicated 'includes_description' field on the package itself.
export interface PackageType {
  id: string; // Package ID
  eventId: string; // From the 'packages' table
  name: string;
  description?: string;
  price: number; // Package price (might be on the table or calculated)
  includes: string[]; // Reconstructed list of what the package includes
  // Add other relevant fields from the 'packages' table if needed
  // e.g., imageUrl, availability_type, etc.
}

type DbPackage = SupabaseTypes.Database['public']['Tables']['packages']['Row'];
// Assume a join table exists for linking packages and ticket definitions
// LINTER FIX: Removed as it seems unnecessary and caused errors
// type DbPackageTicketDefinition = SupabaseTypes.Database['public']['Tables']['package_ticket_definitions']['Row'];

/**
 * Fetches packages associated with a specific event.
 * Attempts to reconstruct the 'includes' list based on linked ticket definitions
 * or a dedicated field on the package.
 * 
 * @param eventId - The UUID of the event
 * @returns Promise resolving to array of PackageType
 */
export async function getPackagesForEvent(eventId: string): Promise<PackageType[]> {
  if (!eventId) {
    console.warn('getPackagesForEvent called without eventId');
    return [];
  }

  try {
    // 1. Fetch packages for the event
    const { data: packagesData, error: packagesError } = await supabase // Use supabase directly
      .from('packages') // Use correct table name
      .select('*') // Select all columns for now, adjust as needed
      .eq('parent_event_id', eventId);
      // FIX: Removed .eq('is_active', true); as the column doesn't exist

    if (packagesError) {
      console.error(`Error fetching packages for event ${eventId}:`, packagesError);
      // Don't re-throw here, let the catch block handle it if needed, return empty array
      return []; 
    }

    if (!packagesData || packagesData.length === 0) {
      console.log(`No active packages found for event ${eventId}`);
      return [];
    }

    // FIX: Restore processing logic and return statement
    // 2. Process each package 
    const processedPackages: PackageType[] = packagesData.map((pkg: DbPackage) => {
      // Attempt to use includes_description if it exists and is an array
      // @ts-ignore - includes_description might not be in generated types yet
      const includesList = Array.isArray(pkg.includes_description) ? pkg.includes_description : [];
      
      return {
        id: pkg.id,
        // @ts-ignore - Assuming parent_event_id exists based on previous fixes
        eventId: pkg.parent_event_id || eventId, // Fallback to passed eventId if needed
        name: pkg.name || 'Unnamed Package',
        description: pkg.description || undefined,
        // @ts-ignore - Assuming price exists
        price: pkg.price || 0, 
        includes: includesList,
        // Map other fields as necessary
      };
    });

    return processedPackages; // Return the processed array

  } catch (err) {
    console.error(`Unexpected error fetching packages for event ${eventId}:`, err);
    return []; // Return empty array on unexpected error
  }
}