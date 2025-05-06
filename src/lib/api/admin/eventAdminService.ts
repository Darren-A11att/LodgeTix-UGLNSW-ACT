import { AdminApiService, AdminApiResponse, QueryParams } from './adminApiService';
import { supabaseTables } from '../../supabase';
import * as EventTypes from '../../../shared/types/event';
import * as TicketTypes from '../../../shared/types/ticket';
import * as SupabaseTypes from '../../../../supabase/supabase.types';

// Define types for admin operations
type DbEvent = SupabaseTypes.Database['public']['Tables']['Events']['Row'];
type DbTicketDefinition = SupabaseTypes.Database['public']['Tables']['ticket_definitions']['Row'];
type DbEventCapacity = SupabaseTypes.Database['public']['Tables']['event_capacity']['Row'];

export interface AdminEventDetails extends DbEvent {
  capacity?: DbEventCapacity;
  ticketDefinitions?: DbTicketDefinition[];
  childEvents?: DbEvent[];
}

export interface EventCapacityUpdate {
  maxCapacity: number;
}

export interface EventCreateRequest {
  title: string;
  slug: string;
  description?: string;
  eventStart: string; // ISO date string
  eventEnd: string;   // ISO date string
  location?: string;
  latitude?: number;
  longitude?: number;
  type?: string;
  imageUrl?: string;
  isMultiDay?: boolean;
  parentEventId?: string | null;
  eventIncludes?: string[] | null;
  importantInformation?: string | null;
  isPurchasableIndividually?: boolean;
  featured?: boolean;
}

/**
 * Admin service for managing events
 */
export class EventAdminService extends AdminApiService {
  constructor() {
    super();
  }

  /**
   * Get all events with filtering and pagination
   */
  async getEvents(params: QueryParams = {}): Promise<AdminApiResponse<EventTypes.EventType[]>> {
    return this.getItems<EventTypes.EventType>(supabaseTables.events, params);
  }

  /**
   * Get a single event by ID with detailed information
   */
  async getEvent(id: string): Promise<AdminApiResponse<AdminEventDetails>> {
    try {
      // Get the base event
      const { data: event, error } = await this.getItemById<DbEvent>(supabaseTables.events, id);
      
      if (error || !event) {
        return { data: null, error };
      }
      
      // Get capacity information
      const { data: capacity } = await this.client
        .from('event_capacity')
        .select('*')
        .eq('event_id', id)
        .maybeSingle();
      
      // Get ticket definitions
      const { data: ticketDefinitions } = await this.client
        .from(supabaseTables.ticketDefinitions)
        .select('*')
        .eq('event_id', id);
      
      // Get child events if this is a parent event
      const { data: childEvents } = await this.client
        .from(supabaseTables.events)
        .select('*')
        .eq('parentEventId', id);
      
      // Combine into detailed response
      const eventDetails: AdminEventDetails = {
        ...event,
        capacity: capacity || undefined,
        ticketDefinitions: ticketDefinitions || [],
        childEvents: childEvents || []
      };
      
      return { data: eventDetails, error: null };
    } catch (error: any) {
      console.error(`Error fetching detailed event with ID ${id}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Create a new event
   */
  async createEvent(eventData: EventCreateRequest): Promise<AdminApiResponse<DbEvent>> {
    // Generate a slug if not provided
    if (!eventData.slug) {
      eventData.slug = this.generateSlug(eventData.title);
    }
    
    return this.createItem<DbEvent>(supabaseTables.events, eventData);
  }

  /**
   * Update an existing event
   */
  async updateEvent(id: string, eventData: Partial<EventCreateRequest>): Promise<AdminApiResponse<DbEvent>> {
    // If title changes, regenerate slug if not explicitly provided
    if (eventData.title && !eventData.slug) {
      eventData.slug = this.generateSlug(eventData.title);
    }
    
    return this.updateItem<DbEvent>(supabaseTables.events, id, eventData);
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<AdminApiResponse<void>> {
    try {
      // First, check if this is a parent event with children
      const { data: childEvents } = await this.client
        .from(supabaseTables.events)
        .select('id')
        .eq('parentEventId', id);
      
      if (childEvents && childEvents.length > 0) {
        return { 
          data: null, 
          error: new Error('Cannot delete event with child events. Delete child events first or update their parentEventId.') 
        };
      }
      
      // Check if there are ticket definitions
      const { data: tickets } = await this.client
        .from(supabaseTables.ticketDefinitions)
        .select('id')
        .eq('event_id', id);
      
      if (tickets && tickets.length > 0) {
        return { 
          data: null, 
          error: new Error('Cannot delete event with ticket definitions. Delete ticket definitions first.') 
        };
      }
      
      // Now we can safely delete the event
      return this.deleteItem(supabaseTables.events, id);
    } catch (error: any) {
      console.error(`Error safely deleting event with ID ${id}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Get event capacity details
   */
  async getEventCapacity(eventId: string): Promise<AdminApiResponse<DbEventCapacity>> {
    try {
      const { data, error } = await this.client
        .from('event_capacity')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      if (!data) {
        // Create default capacity record if none exists
        return this.createEventCapacity(eventId, { maxCapacity: 0 });
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error(`Error fetching capacity for event ${eventId}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Create event capacity record
   */
  private async createEventCapacity(
    eventId: string, 
    capacityData: EventCapacityUpdate
  ): Promise<AdminApiResponse<DbEventCapacity>> {
    try {
      const { data, error } = await this.client
        .from('event_capacity')
        .insert({
          event_id: eventId,
          max_capacity: capacityData.maxCapacity,
          reserved_count: 0,
          sold_count: 0
        })
        .select()
        .single();
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error(`Error creating capacity for event ${eventId}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Update event capacity
   */
  async updateEventCapacity(
    eventId: string, 
    capacityData: EventCapacityUpdate
  ): Promise<AdminApiResponse<DbEventCapacity>> {
    try {
      // Check if capacity record exists
      const { data: existingCapacity } = await this.getEventCapacity(eventId);
      
      if (!existingCapacity) {
        // Create new capacity record
        return this.createEventCapacity(eventId, capacityData);
      }
      
      // Update existing capacity record
      const { data, error } = await this.client
        .from('event_capacity')
        .update({ max_capacity: capacityData.maxCapacity })
        .eq('event_id', eventId)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error(`Error updating capacity for event ${eventId}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Get ticket definitions for an event
   */
  async getEventTicketDefinitions(eventId: string): Promise<AdminApiResponse<TicketTypes.TicketDefinitionType[]>> {
    try {
      const { data, error } = await this.client
        .from(supabaseTables.ticketDefinitions)
        .select('*')
        .eq('event_id', eventId);
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: data as unknown as TicketTypes.TicketDefinitionType[], error: null };
    } catch (error: any) {
      console.error(`Error fetching ticket definitions for event ${eventId}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Helper method to generate a URL-friendly slug from a title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
}