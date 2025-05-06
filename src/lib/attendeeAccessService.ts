import { supabase } from './supabase';

/**
 * Attendee Access Record interface
 */
export interface AttendeeAccess {
  id: string;
  attendee_id: string;
  event_id: string;
  access_granted_at: string;
  access_source: 'ticket' | 'package' | 'manual' | 'comp';
  source_id: string | null;
  price_paid: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Service for managing attendee access to events
 */
export class AttendeeAccessService {
  /**
   * Get all access records for an attendee
   * @param attendeeId UUID of the attendee
   * @returns Promise resolving to an array of AttendeeAccess records
   */
  static async getAttendeeAccess(attendeeId: string): Promise<AttendeeAccess[]> {
    try {
      if (!attendeeId) {
        throw new Error('Attendee ID is required');
      }
      
      const { data, error } = await supabase
        .from('attendee_access')
        .select('*')
        .eq('attendee_id', attendeeId)
        .order('access_granted_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAttendeeAccess:', error);
      return [];
    }
  }
  
  /**
   * Get all attendees with access to a specific event
   * @param eventId UUID of the event
   * @returns Promise resolving to an array of AttendeeAccess records
   */
  static async getEventAttendees(eventId: string): Promise<AttendeeAccess[]> {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      
      const { data, error } = await supabase
        .from('attendee_access')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('access_granted_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getEventAttendees:', error);
      return [];
    }
  }
  
  /**
   * Check if an attendee has access to a specific event
   * @param attendeeId UUID of the attendee
   * @param eventId UUID of the event
   * @returns Promise resolving to a boolean indicating access
   */
  static async checkAttendeeEventAccess(
    attendeeId: string,
    eventId: string
  ): Promise<boolean> {
    try {
      if (!attendeeId || !eventId) {
        throw new Error('Both attendee ID and event ID are required');
      }
      
      // Use the database function for efficient checking
      const { data, error } = await supabase.rpc('check_attendee_event_access', {
        p_attendee_id: attendeeId,
        p_event_id: eventId
      });
      
      if (error) {
        throw error;
      }
      
      return !!data; // Convert to boolean
    } catch (error) {
      console.error('Error in checkAttendeeEventAccess:', error);
      return false;
    }
  }
  
  /**
   * Add access for an attendee to events included in a package
   * This function distributes the package price across all included events
   * @param attendeeId UUID of the attendee
   * @param packageId UUID of the package
   * @param pricePaid Total price paid for the package
   * @returns Promise resolving to a boolean indicating success
   */
  static async addPackageAttendeeAccess(
    attendeeId: string,
    packageId: string,
    pricePaid: number
  ): Promise<boolean> {
    try {
      if (!attendeeId || !packageId) {
        throw new Error('Both attendee ID and package ID are required');
      }
      
      // Use the database function to add access records
      const { error } = await supabase.rpc('add_package_attendee_access', {
        p_attendee_id: attendeeId,
        p_package_id: packageId,
        p_price_paid: pricePaid
      });
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error in addPackageAttendeeAccess:', error);
      return false;
    }
  }
  
  /**
   * Grant manual access to an attendee for a specific event
   * @param attendeeId UUID of the attendee
   * @param eventId UUID of the event
   * @param pricePaid Price paid for access (0 for comps)
   * @param source Either 'manual' or 'comp'
   * @returns Promise resolving to the created access record or null on failure
   */
  static async grantManualAccess(
    attendeeId: string,
    eventId: string,
    pricePaid: number = 0,
    source: 'manual' | 'comp' = 'manual'
  ): Promise<AttendeeAccess | null> {
    try {
      if (!attendeeId || !eventId) {
        throw new Error('Both attendee ID and event ID are required');
      }
      
      const { data, error } = await supabase
        .from('attendee_access')
        .upsert({
          attendee_id: attendeeId,
          event_id: eventId,
          access_source: source,
          price_paid: pricePaid,
          is_active: true
        }, {
          onConflict: 'attendee_id,event_id',
          returning: 'representation'
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in grantManualAccess:', error);
      return null;
    }
  }
  
  /**
   * Revoke access for an attendee to a specific event
   * This does not delete the record, but marks it as inactive
   * @param attendeeId UUID of the attendee
   * @param eventId UUID of the event
   * @returns Promise resolving to a boolean indicating success
   */
  static async revokeAccess(
    attendeeId: string,
    eventId: string
  ): Promise<boolean> {
    try {
      if (!attendeeId || !eventId) {
        throw new Error('Both attendee ID and event ID are required');
      }
      
      const { error } = await supabase
        .from('attendee_access')
        .update({ is_active: false })
        .eq('attendee_id', attendeeId)
        .eq('event_id', eventId);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error in revokeAccess:', error);
      return false;
    }
  }
  
  /**
   * Sync all access records from existing ticket data
   * This is a utility function to populate access records from historical data
   * @returns Promise resolving to a boolean indicating success
   */
  static async syncAccessFromTickets(): Promise<boolean> {
    try {
      // Call the database function to sync all access records
      const { error } = await supabase.rpc('sync_attendee_access_from_tickets');
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error in syncAccessFromTickets:', error);
      return false;
    }
  }
}