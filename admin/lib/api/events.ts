import { supabase } from '../../../src/lib/supabase';

export interface AdminEventListItem {
  id: string;
  title: string;
  slug: string;
  eventStart: string;
  eventEnd: string;
  location: string;
  capacity: number;
  registered: number;
  status: 'draft' | 'published' | 'archived';
  type: string;
}

export interface AdminEventDetail extends AdminEventListItem {
  description: string;
  featuredImageUrl: string;
  importantInformation: string;
  inclusions: string;
  parentEventId: string | null;
  ticketTypes: {
    id: string;
    name: string;
    price: number;
    availableQuantity: number;
    soldQuantity: number;
  }[];
  childEvents: AdminEventListItem[];
}

export const getAdminEvents = async (
  page = 1,
  limit = 10,
  filters: {
    search?: string;
    status?: 'draft' | 'published' | 'archived';
    type?: string;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<{ data: AdminEventListItem[]; count: number }> => {
  try {
    let query = supabase
      .from('events')
      .select('*, event_capacity(*)', { count: 'exact' });

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.startDate) {
      query = query.gte('event_start', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('event_end', filters.endDate);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error, count } = await query
      .order('event_start', { ascending: true })
      .range(from, to);

    if (error) throw error;

    // Transform to AdminEventListItem interface
    const transformedData = data.map(event => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      eventStart: event.event_start,
      eventEnd: event.event_end,
      location: event.location || 'No location',
      capacity: event.event_capacity?.total_capacity || 0,
      registered: event.event_capacity?.confirmed_count || 0,
      status: event.status || 'draft',
      type: event.type || 'Other'
    }));

    return {
      data: transformedData,
      count: count || 0
    };
  } catch (error) {
    console.error('Error fetching admin events:', error);
    throw error;
  }
};

export const getAdminEventById = async (eventId: string): Promise<AdminEventDetail | null> => {
  try {
    // Fetch event details
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        event_capacity(*),
        parent:parent_event_id(id, title, slug)
      `)
      .eq('id', eventId)
      .single();

    if (error) throw error;
    if (!event) return null;

    // Fetch ticket types for the event
    const { data: ticketTypes, error: ticketTypesError } = await supabase
      .from('ticket_definitions')
      .select('*')
      .eq('event_id', eventId);

    if (ticketTypesError) throw ticketTypesError;

    // Fetch child events if this is a parent event
    const { data: childEvents, error: childEventsError } = await supabase
      .from('events')
      .select('*, event_capacity(*)')
      .eq('parent_event_id', eventId);

    if (childEventsError) throw childEventsError;

    // Transform ticket data
    const transformedTickets = ticketTypes?.map(ticket => ({
      id: ticket.id,
      name: ticket.name,
      price: ticket.price,
      availableQuantity: ticket.available_quantity || 0,
      soldQuantity: ticket.sold_quantity || 0
    })) || [];

    // Transform child events data
    const transformedChildEvents = childEvents?.map(child => ({
      id: child.id,
      title: child.title,
      slug: child.slug,
      eventStart: child.event_start,
      eventEnd: child.event_end,
      location: child.location || 'No location',
      capacity: child.event_capacity?.total_capacity || 0,
      registered: child.event_capacity?.confirmed_count || 0,
      status: child.status || 'draft',
      type: child.type || 'Other'
    })) || [];

    // Return formatted event detail
    return {
      id: event.id,
      title: event.title,
      slug: event.slug,
      eventStart: event.event_start,
      eventEnd: event.event_end,
      location: event.location || 'No location',
      capacity: event.event_capacity?.total_capacity || 0,
      registered: event.event_capacity?.confirmed_count || 0,
      status: event.status || 'draft',
      type: event.type || 'Other',
      description: event.description || '',
      featuredImageUrl: event.featured_image_url || '',
      importantInformation: event.important_information || '',
      inclusions: event.inclusions || '',
      parentEventId: event.parent_event_id,
      ticketTypes: transformedTickets,
      childEvents: transformedChildEvents
    };
  } catch (error) {
    console.error('Error fetching admin event details:', error);
    throw error;
  }
};

export const createEvent = async (eventData: Partial<AdminEventDetail>): Promise<string> => {
  try {
    // Insert the event
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: eventData.title,
        slug: eventData.slug,
        description: eventData.description,
        event_start: eventData.eventStart,
        event_end: eventData.eventEnd,
        location: eventData.location,
        featured_image_url: eventData.featuredImageUrl,
        important_information: eventData.importantInformation,
        inclusions: eventData.inclusions,
        status: eventData.status || 'draft',
        type: eventData.type,
        parent_event_id: eventData.parentEventId
      })
      .select('id')
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create event');

    // Create event capacity record
    const { error: capacityError } = await supabase
      .from('event_capacity')
      .insert({
        event_id: data.id,
        total_capacity: eventData.capacity || 0,
        confirmed_count: 0,
        reserved_count: 0,
        available_count: eventData.capacity || 0
      });

    if (capacityError) throw capacityError;

    return data.id;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (
  eventId: string, 
  eventData: Partial<AdminEventDetail>
): Promise<void> => {
  try {
    // Update event data
    const { error } = await supabase
      .from('events')
      .update({
        title: eventData.title,
        slug: eventData.slug,
        description: eventData.description,
        event_start: eventData.eventStart,
        event_end: eventData.eventEnd,
        location: eventData.location,
        featured_image_url: eventData.featuredImageUrl,
        important_information: eventData.importantInformation,
        inclusions: eventData.inclusions,
        status: eventData.status,
        type: eventData.type,
        parent_event_id: eventData.parentEventId
      })
      .eq('id', eventId);

    if (error) throw error;

    // Update capacity if provided
    if (eventData.capacity !== undefined) {
      const { error: capacityError } = await supabase
        .from('event_capacity')
        .update({
          total_capacity: eventData.capacity,
          available_count: eventData.capacity - (eventData.registered || 0)
        })
        .eq('event_id', eventId);

      if (capacityError) throw capacityError;
    }
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    // Check if event has child events
    const { data: childEvents, error: childEventError } = await supabase
      .from('events')
      .select('id')
      .eq('parent_event_id', eventId);

    if (childEventError) throw childEventError;

    // If has child events, don't allow deletion
    if (childEvents && childEvents.length > 0) {
      throw new Error('Cannot delete an event with child events. Delete child events first.');
    }

    // Check if event has registrations
    const { data: registrations, error: registrationError } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', eventId);

    if (registrationError) throw registrationError;

    // If has registrations, archive instead of delete
    if (registrations && registrations.length > 0) {
      const { error } = await supabase
        .from('events')
        .update({ status: 'archived' })
        .eq('id', eventId);

      if (error) throw error;
    } else {
      // If no registrations, delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};