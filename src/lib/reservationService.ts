import { supabase } from './supabase';
import { User, RealtimeChannel } from '@supabase/supabase-js';

// Ticket interface matching the database schema
export interface TicketRecord {
  ticketId: string;
  attendeeId: string | null;
  eventId: string;               // Required field (non-nullable)
  ticketDefinitionId: string;    // This can be null in database but we require it in our app
  pricePaid: number;             // Required field (non-nullable)
  seatInfo: string | null;
  status: 'available' | 'reserved' | 'sold' | 'used' | 'cancelled';
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
  reservationId: string | null;
  reservationExpiresAt: string | null;
  originalPrice: number | null;
  currency: string | null;
  paymentStatus: string | null; // Added for the new system
  purchasedAt: string | null;   // Added for the new system
}

export interface Reservation {
  ticketId: string;
  reservationId: string;
  expiresAt: string;
  eventId: string;
  ticketDefinitionId: string;
}

export interface ReservationResult {
  success: boolean;
  data?: Reservation[];
  error?: string;
}

// System status broadcast message type
interface TicketSystemStatus {
  type: 'availability_update' | 'high_demand' | 'system_maintenance';
  eventId: string;
  ticketDefinitionId?: string;
  message: string;
  availableCount?: number;
  timestamp: number;
}

// Client presence information
interface ClientPresence {
  clientId: string;
  eventId: string;
  ticketDefinitionId?: string;
  viewingSince: number;
  isReserving: boolean;
}

/**
 * Service for handling ticket reservations with enhanced realtime functionality
 */
export class ReservationService {
  private static presenceChannel: RealtimeChannel | null = null;
  private static systemChannel: RealtimeChannel | null = null;
  private static clientId: string = crypto.randomUUID();
  private static activeChannels: Map<string, RealtimeChannel> = new Map();
  
  // Constants for localStorage
  private static readonly RESERVATION_STORAGE_KEY = 'lodgetix_reservation_data';
  private static readonly RESERVATION_STORAGE_EXPIRY = 'lodgetix_reservation_expiry';
  private static readonly REGISTRATION_TYPE_KEY = 'lodgetix_registration_type';
  
  // Default threshold for high demand (80%)
  private static readonly HIGH_DEMAND_THRESHOLD = 80;

  /**
   * Initialize realtime connections
   * Call this when the ticket selection/reservation UI first loads
   */
  static initializeRealtimeConnections(eventId: string): void {
    this.setupPresenceChannel(eventId);
    this.setupSystemChannel(eventId);
  }

  /**
   * Clean up realtime connections
   * Call this when navigating away from ticket selection/reservation UI
   */
  static cleanupRealtimeConnections(): void {
    // Remove all active channels
    this.activeChannels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.activeChannels.clear();
    this.presenceChannel = null;
    this.systemChannel = null;
  }

  /**
   * Set up the presence channel to track users viewing/reserving tickets
   */
  private static setupPresenceChannel(eventId: string): void {
    // Create a unique channel for presence tracking
    this.presenceChannel = supabase.channel(`presence-tickets-${eventId}`, {
      config: {
        presence: {
          key: this.clientId,
        },
      },
    });

    // Set up presence handlers
    this.presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = this.presenceChannel?.presenceState() || {};
        console.debug('Presence state synchronized:', state);
        this.notifyPresenceUpdates(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.debug('User joined:', newPresences);
        // Get latest state after join
        const state = this.presenceChannel?.presenceState() || {};
        this.notifyPresenceUpdates(state);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.debug('User left:', leftPresences);
        // Get latest state after leave
        const state = this.presenceChannel?.presenceState() || {};
        this.notifyPresenceUpdates(state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this client's presence viewing this event
          await this.presenceChannel?.track({
            clientId: this.clientId,
            eventId: eventId,
            viewingSince: Date.now(),
            isReserving: false,
          });
          
          // Add to active channels
          if (this.presenceChannel) {
            this.activeChannels.set(`presence-tickets-${eventId}`, this.presenceChannel);
          }
        }
      });
  }

  /**
   * Set up the system channel for ticket system status broadcasts
   */
  private static setupSystemChannel(eventId: string): void {
    this.systemChannel = supabase.channel(`system-tickets-${eventId}`);

    this.systemChannel
      .on('broadcast', { event: 'ticket-system-status' }, (payload) => {
        const statusUpdate = payload.payload as TicketSystemStatus;
        console.debug('Ticket system status update:', statusUpdate);
        
        // Handle different status updates (could trigger UI updates)
        // This happens behind the scenes without user notification
        switch (statusUpdate.type) {
          case 'availability_update':
            // Could update local state with latest counts
            break;
          case 'high_demand':
            // Could set a flag to show high demand indicator
            break;
          case 'system_maintenance':
            // Could show maintenance notice
            break;
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Add to active channels
          if (this.systemChannel) {
            this.activeChannels.set(`system-tickets-${eventId}`, this.systemChannel);
          }
        }
      });
  }

  /**
   * Update presence to indicate this client is starting the reservation process
   */
  private static async updatePresenceToReserving(eventId: string, ticketDefinitionId: string): Promise<void> {
    if (this.presenceChannel) {
      await this.presenceChannel.track({
        clientId: this.clientId,
        eventId,
        ticketDefinitionId,
        viewingSince: Date.now(),
        isReserving: true,
      });
    }
  }

  /**
   * Reserve tickets for an event
   * Uses the new atomic reservation functions to ensure capacity integrity
   * 
   * Note: Both eventId and ticketDefinitionId are now required fields in the database schema
   */
  static async reserveTickets(
    eventId: string,
    ticketDefinitionId: string,
    quantity: number
  ): Promise<ReservationResult> {
    try {
      // Both event_id and ticket_definition_id are now required
      if (!ticketDefinitionId || ticketDefinitionId.trim() === '') {
        throw new Error('Ticket definition ID is required');
      }
      
      if (!eventId || eventId.trim() === '') {
        throw new Error('Event ID is required - no longer optional');
      }
      
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      
      console.log(`ReservationService.reserveTickets: Reserving ${quantity} tickets for event ${eventId}, ticket ${ticketDefinitionId}`);
      
      // Update presence to show we're actively reserving
      await this.updatePresenceToReserving(eventId, ticketDefinitionId);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session exists, create an anonymous session
      if (!session) {
        await this.signInAnonymously();
      }

      // First check if we have enough capacity using the event_capacity table
      const { data: capacityData, error: capacityError } = await supabase
        .from('event_capacity')
        .select('max_capacity, reserved_count, sold_count')
        .eq('event_id', eventId)
        .single();
        
      if (capacityError) {
        console.error('Error checking event capacity:', capacityError);
        return {
          success: false,
          error: `Failed to check event capacity: ${capacityError.message}`
        };
      }
      
      if (!capacityData) {
        return {
          success: false,
          error: `No capacity record found for event ${eventId}`
        };
      }
      
      const availableCapacity = Math.max(0, capacityData.max_capacity - (capacityData.reserved_count + capacityData.sold_count));
      
      if (availableCapacity < quantity) {
        return {
          success: false,
          error: `Not enough tickets available. Requested: ${quantity}, Available: ${availableCapacity}`
        };
      }
      
      // Use the new reserve_ticket function to update capacity atomically
      const reservePromises = [];
      for (let i = 0; i < quantity; i++) {
        reservePromises.push(
          supabase.rpc('reserve_ticket', { event_uuid: eventId })
        );
      }
      
      // Execute all reservation requests in parallel
      const reserveResults = await Promise.all(reservePromises);
      
      // Check if any reservation failed
      const failedReservations = reserveResults.filter(result => !result.data);
      
      if (failedReservations.length > 0) {
        console.error('Error reserving tickets:', failedReservations);
        
        // If any failed, release the successful ones
        for (let i = 0; i < reserveResults.length - failedReservations.length; i++) {
          await supabase.rpc('release_reservation', { event_uuid: eventId });
        }
        
        // Update presence to show we're no longer reserving
        if (this.presenceChannel) {
          await this.presenceChannel.track({
            clientId: this.clientId,
            eventId,
            ticketDefinitionId,
            viewingSince: Date.now(),
            isReserving: false,
          });
        }
        
        return {
          success: false,
          error: 'Could not reserve all tickets'
        };
      }

      // Now that we have reserved capacity, create the ticket records
      const { data, error } = await supabase.rpc('reserve_tickets_simple', {
        p_event_id: eventId,
        p_ticket_definition_id: ticketDefinitionId,
        p_quantity: quantity,
        p_reservation_minutes: 15
      });

      if (error) {
        console.error('Error creating ticket records:', error);
        
        // Release the capacity reservations we made since the ticket creation failed
        for (let i = 0; i < quantity; i++) {
          await supabase.rpc('release_reservation', { event_uuid: eventId });
        }
        
        // Update presence to show we're no longer reserving
        if (this.presenceChannel) {
          await this.presenceChannel.track({
            clientId: this.clientId,
            eventId,
            ticketDefinitionId,
            viewingSince: Date.now(),
            isReserving: false,
          });
        }
        
        return {
          success: false,
          error: error.message
        };
      }

      // Format the response
      const reservations = data.map(item => ({
        ticketId: item.ticket_id,
        reservationId: item.reservation_id,
        expiresAt: item.expires_at,
        eventId,
        ticketDefinitionId
      }));
      
      // Store the first reservation for persistence
      // (They all have the same reservationId)
      if (reservations.length > 0) {
        this.storeReservationData(reservations[0]);
      }

      return {
        success: true,
        data: reservations
      };
    } catch (error) {
      console.error('Error in reserveTickets:', error);
      
      // Update presence to show we're no longer reserving
      if (this.presenceChannel) {
        await this.presenceChannel.track({
          clientId: this.clientId,
          eventId,
          ticketDefinitionId,
          viewingSince: Date.now(),
          isReserving: false,
        });
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Complete ticket reservation after payment
   * Updates both the ticket records and event capacity using atomic functions
   */
  static async completeReservation(
    reservationId: string,
    attendeeId: string
  ): Promise<ReservationResult> {
    try {
      // First, fetch the tickets associated with this reservation to get the event ID
      const { data: tickets, error: ticketsError } = await supabase
        .from('Tickets')
        .select('ticketid, eventid')
        .eq('reservationId', reservationId);
      
      if (ticketsError || !tickets || tickets.length === 0) {
        console.error('Error fetching tickets for reservation:', ticketsError || 'No tickets found');
        return {
          success: false,
          error: ticketsError?.message || 'No tickets found for this reservation'
        };
      }
      
      // Call the complete_reservation_simple function to update ticket records
      const { data, error } = await supabase.rpc('complete_reservation_simple', {
        p_reservation_id: reservationId,
        p_attendee_id: attendeeId
      });

      if (error) {
        console.error('Error completing reservation:', error);
        return {
          success: false,
          error: error.message
        };
      }
      
      // Update event capacity for each ticket's event using the atomic function
      const eventIds = new Set(tickets.map(ticket => ticket.eventid));
      const confirmPromises = Array.from(eventIds).map(eventId => 
        supabase.rpc('confirm_purchase', { event_uuid: eventId })
      );
      
      // Process all event capacity updates in parallel
      const confirmResults = await Promise.all(confirmPromises);
      
      // Check if any capacity updates failed
      const failedUpdates = confirmResults.filter(result => !result.data);
      if (failedUpdates.length > 0) {
        console.warn('Some event capacity updates failed during purchase confirmation:', 
          failedUpdates.length);
        // We don't fail the entire operation if capacity updates have issues
        // The ticket records are already updated, and that's the critical part
      }

      return {
        success: true,
        data: data.map(ticketId => ({
          ticketId,
          reservationId,
          expiresAt: '',
          eventId: tickets.find(t => t.ticketid === ticketId)?.eventid || '',
          ticketDefinitionId: ''
        }))
      };
    } catch (error) {
      console.error('Error in completeReservation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Cancel a reservation
   * Updates both the ticket records and event capacity using atomic functions
   */
  static async cancelReservation(reservationId: string): Promise<boolean> {
    try {
      // First, fetch the tickets associated with this reservation to get the event IDs
      const { data: tickets, error: ticketsError } = await supabase
        .from('Tickets')
        .select('ticketid, eventid')
        .eq('reservationId', reservationId);
      
      if (ticketsError) {
        console.error('Error fetching tickets for reservation:', ticketsError);
        return false;
      }
      
      // If no tickets found, the reservation might already be cancelled
      if (!tickets || tickets.length === 0) {
        console.warn('No tickets found for reservation:', reservationId);
        // Clear local storage anyway
        this.clearStoredReservation();
        return true;
      }
      
      // Call the cancel_reservation_simple function to update ticket records
      const { data, error } = await supabase.rpc('cancel_reservation_simple', {
        p_reservation_id: reservationId
      });

      if (error) {
        console.error('Error canceling reservation in database:', error);
        return false;
      }
      
      // Release capacity reservations for each ticket's event using the atomic function
      const eventIds = new Set(tickets.map(ticket => ticket.eventid));
      const releasePromises = Array.from(eventIds).flatMap(eventId => {
        // Count how many tickets are for this specific event
        const count = tickets.filter(t => t.eventid === eventId).length;
        // Create an array of release operations for this event
        return Array(count).fill(0).map(() => 
          supabase.rpc('release_reservation', { event_uuid: eventId })
        );
      });
      
      // Process all event capacity updates in parallel
      const releaseResults = await Promise.all(releasePromises);
      
      // Check if any capacity updates failed
      const failedReleases = releaseResults.filter(result => !result.data);
      if (failedReleases.length > 0) {
        console.warn('Some event capacity releases failed during cancellation:', 
          failedReleases.length);
        // We don't fail the entire operation if capacity updates have issues
        // The ticket records are already updated, and that's the critical part
      }

      // Clear local storage
      this.clearStoredReservation();
      
      return data as boolean;
    } catch (error) {
      console.error('Error in cancelReservation:', error);
      return false;
    }
  }

  /**
   * Create an anonymous session if not authenticated
   */
  static async signInAnonymously(): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        throw error;
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      return { 
        user: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }

  /**
   * Convert an anonymous user to an authenticated user
   * 
   * @param email Email address for the user
   * @param password Password for the new account
   * @param metadata Additional user metadata
   */
  static async convertAnonymousUser(
    email: string,
    password: string,
    metadata: Record<string, any> = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if this is an anonymous user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user.app_metadata.provider === 'anonymous') {
        return {
          success: false,
          error: 'User is not anonymous'
        };
      }

      // Update the user with email credentials
      const { error } = await supabase.auth.updateUser({
        email,
        password,
        data: metadata
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error converting anonymous user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if an email is already registered
   */
  static async isEmailRegistered(email: string): Promise<boolean> {
    try {
      // Try to get user by email
      const { data, error } = await supabase.auth.admin.listUsers({
        filters: {
          email: email
        }
      });

      if (error) {
        console.error('Error checking email:', error);
        return false;
      }

      return data.users.length > 0;
    } catch (error) {
      console.error('Error in isEmailRegistered:', error);
      return false;
    }
  }

  /**
   * Send a one-time password to the user's email for authentication
   */
  static async sendOneTimePassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending one-time password:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get current ticket availability for an event and ticket type
   * Uses the event_capacity table to get accurate availability information
   * 
   * Note: Both eventId and ticketDefinitionId are now required fields in the database schema
   */
  static async getTicketAvailability(
    eventId: string,
    ticketDefinitionId: string
  ): Promise<{ available: number; reserved: number; sold: number }> {
    try {
      // Validate required parameters
      if (!eventId || !ticketDefinitionId) {
        console.error('Both eventId and ticketDefinitionId are required');
        return { available: 0, reserved: 0, sold: 0 };
      }
      
      // Fetch current capacity information directly from the event_capacity table
      const { data, error } = await supabase
        .from('event_capacity')
        .select('max_capacity, reserved_count, sold_count')
        .eq('event_id', eventId)
        .single();
      
      if (error) {
        console.error('Error fetching event capacity:', error.message);
        return { available: 0, reserved: 0, sold: 0 };
      }
      
      if (!data) {
        console.warn(`No capacity record found for event ${eventId}`);
        return { available: 0, reserved: 0, sold: 0 };
      }
      
      // Calculate available capacity
      const available = Math.max(0, data.max_capacity - (data.reserved_count + data.sold_count));
      
      return {
        available,
        reserved: data.reserved_count,
        sold: data.sold_count
      };
    } catch (error) {
      console.error('Error in getTicketAvailability:', error);
      return { available: 0, reserved: 0, sold: 0 };
    }
  }
  
  /**
   * Calculate and notify about presence updates for an event
   * @param state The current presence state
   */
  private static notifyPresenceUpdates(state: Record<string, ClientPresence[]>): void {
    // Count total users viewing and reserving
    let totalViewers = 0;
    let totalReserving = 0;
    
    // Iterate through all clients
    Object.values(state).forEach(clientList => {
      clientList.forEach(presenceData => {
        if (presenceData) {
          totalViewers++;
          if (presenceData.isReserving) {
            totalReserving++;
          }
        }
      });
    });
    
    // Create a custom event to notify components about presence updates
    const event = new CustomEvent('ticket-presence-update', {
      detail: {
        totalViewers,
        totalReserving,
        timestamp: Date.now()
      }
    });
    
    // Dispatch the event for components to listen to
    window.dispatchEvent(event);
  }
  
  /**
   * Store the registration type in localStorage
   * @param registrationType The registration type to store
   */
  static storeRegistrationType(registrationType: string): void {
    try {
      localStorage.setItem(this.REGISTRATION_TYPE_KEY, registrationType);
    } catch (error) {
      console.error('Error storing registration type:', error);
    }
  }
  
  /**
   * Retrieve the registration type from localStorage
   * @returns The stored registration type or null if not found
   */
  static getStoredRegistrationType(): string | null {
    try {
      return localStorage.getItem(this.REGISTRATION_TYPE_KEY);
    } catch (error) {
      console.error('Error retrieving registration type:', error);
      return null;
    }
  }
  
  /**
   * Store the current reservation data in localStorage
   * @param reservation The reservation data to store
   */
  static storeReservationData(reservation: Reservation): void {
    try {
      // Store reservation data
      localStorage.setItem(this.RESERVATION_STORAGE_KEY, JSON.stringify(reservation));
      
      // Store expiry timestamp
      const expiryDate = new Date(reservation.expiresAt).getTime();
      localStorage.setItem(this.RESERVATION_STORAGE_EXPIRY, expiryDate.toString());
    } catch (error) {
      console.error('Error storing reservation data:', error);
    }
  }
  
  /**
   * Retrieve stored reservation data if it hasn't expired
   * @returns The stored reservation or null if not found or expired
   */
  static getStoredReservation(): Reservation | null {
    try {
      const storedData = localStorage.getItem(this.RESERVATION_STORAGE_KEY);
      const expiryTimestamp = localStorage.getItem(this.RESERVATION_STORAGE_EXPIRY);
      
      if (!storedData || !expiryTimestamp) {
        return null;
      }
      
      // Check if reservation has expired
      const expiryDate = parseInt(expiryTimestamp, 10);
      const now = Date.now();
      
      if (now >= expiryDate) {
        // Reservation has expired, clean up storage
        this.clearStoredReservation();
        return null;
      }
      
      // Reservation is still valid
      return JSON.parse(storedData) as Reservation;
    } catch (error) {
      console.error('Error retrieving stored reservation:', error);
      return null;
    }
  }
  
  /**
   * Clear stored reservation data
   */
  static clearStoredReservation(): void {
    try {
      localStorage.removeItem(this.RESERVATION_STORAGE_KEY);
      localStorage.removeItem(this.RESERVATION_STORAGE_EXPIRY);
    } catch (error) {
      console.error('Error clearing stored reservation:', error);
    }
  }
  
  /**
   * Subscribe to ticket status changes with strong typing
   */
  static subscribeToTicketChanges(
    reservationId: string,
    callback: (ticket: TicketRecord) => void
  ): { unsubscribe: () => void } {
    // Create a unique channel key
    const channelKey = `ticket-updates-${reservationId}`;
    
    // Create the channel
    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Tickets',
          filter: `reservationId=eq.${reservationId}`
        },
        (payload) => {
          // Cast payload.new to the TicketRecord type for type safety
          callback(payload.new as TicketRecord);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Store in active channels
          this.activeChannels.set(channelKey, channel);
        }
      });

    return {
      unsubscribe: () => {
        // Remove from our map of active channels
        this.activeChannels.delete(channelKey);
        supabase.removeChannel(channel);
      }
    };
  }
  
  /**
   * Subscribe to ticket availability changes for an event
   * Uses the event_capacity table for real-time updates with atomic consistency
   * 
   * @param eventId The UUID of the event to monitor
   * @param ticketDefinitionId The UUID of the ticket definition
   * @param callback Function to call with updated capacity data
   * @returns Object with unsubscribe method
   */
  static subscribeToAvailabilityChanges(
    eventId: string,
    ticketDefinitionId: string,
    callback: (counts: { available: number; reserved: number; sold: number; max: number }) => void
  ): { unsubscribe: () => void } {
    if (!eventId) {
      console.error('Event ID is required to subscribe to availability changes');
      callback({ available: 0, reserved: 0, sold: 0, max: 0 });
      return { unsubscribe: () => {} };
    }
    
    // Create a unique channel key
    const channelKey = `availability-${eventId}-${ticketDefinitionId}`;
    
    // First, fetch initial data directly from event_capacity table
    supabase
      .from('event_capacity')
      .select('max_capacity, reserved_count, sold_count')
      .eq('event_id', eventId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error(`Error fetching initial capacity for event ${eventId}:`, error.message);
          callback({ available: 0, reserved: 0, sold: 0, max: 0 });
          return;
        }
        
        if (data) {
          // Calculate available capacity
          const available = Math.max(0, data.max_capacity - (data.reserved_count + data.sold_count));
          
          callback({
            available,
            reserved: data.reserved_count,
            sold: data.sold_count,
            max: data.max_capacity
          });
        } else {
          console.warn(`No capacity record found for event ${eventId}`);
          callback({ available: 0, reserved: 0, sold: 0, max: 0 });
        }
      })
      .catch(error => {
        console.error(`Error fetching initial capacity for event ${eventId}:`, error);
        callback({ available: 0, reserved: 0, sold: 0, max: 0 });
      });
    
    // Create the channel for real-time updates on the event_capacity table
    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'event_capacity',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          // When capacity changes, recalculate available tickets
          const record = payload.new as any;
          if (record) {
            const available = Math.max(0, record.max_capacity - (record.reserved_count + record.sold_count));
            callback({
              available,
              reserved: record.reserved_count,
              sold: record.sold_count,
              max: record.max_capacity
            });
          } else if (payload.eventType === 'DELETE') {
            // Handle case where record was deleted
            console.warn(`Capacity record for event ${eventId} was deleted`);
            callback({ available: 0, reserved: 0, sold: 0, max: 0 });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Store in active channels
          this.activeChannels.set(channelKey, channel);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to capacity changes for event ${eventId}`);
        }
      });

    return {
      unsubscribe: () => {
        // Remove from our map of active channels
        this.activeChannels.delete(channelKey);
        supabase.removeChannel(channel);
      }
    };
  }
  
  /**
   * Check if a ticket is in high demand by analyzing the event_capacity table
   * High demand is determined by the percentage of capacity already sold or reserved
   * @param eventId The event ID to check
   * @param ticketDefinitionId The ticket definition ID to check
   * @param thresholdPercent Optional custom threshold percentage (default is 80%)
   * @returns Promise<boolean> True if the ticket is in high demand
   */
  static async isTicketHighDemand(
    eventId: string,
    ticketDefinitionId: string,
    thresholdPercent: number = this.HIGH_DEMAND_THRESHOLD
  ): Promise<boolean> {
    try {
      // Validate required parameters
      if (!eventId || !ticketDefinitionId) {
        console.error('Both eventId and ticketDefinitionId are required');
        return false;
      }
      
      // First try to use the database function if it exists
      try {
        const { data, error } = await supabase.rpc('is_ticket_high_demand', {
          p_event_id: eventId,
          p_ticket_definition_id: ticketDefinitionId,
          p_threshold_percent: thresholdPercent
        });
        
        if (!error && data !== null) {
          return !!data; // Convert to boolean
        }
      } catch (rpcError) {
        console.warn('RPC function not available, falling back to direct calculation:', rpcError);
        // Fall through to the direct calculation below
      }
      
      // If RPC failed, calculate directly using the event_capacity table
      const { data, error } = await supabase
        .from('event_capacity')
        .select('max_capacity, reserved_count, sold_count')
        .eq('event_id', eventId)
        .single();
      
      if (error) {
        console.error('Error fetching event capacity:', error.message);
        return false;
      }
      
      if (!data) {
        console.warn(`No capacity record found for event ${eventId}`);
        return false;
      }
      
      // Calculate usage percentage
      const totalUsed = data.reserved_count + data.sold_count;
      const maxCapacity = data.max_capacity;
      
      if (maxCapacity <= 0) return false; // Avoid division by zero
      
      const usagePercent = (totalUsed / maxCapacity) * 100;
      
      // Consider high demand if usage percentage exceeds threshold
      return usagePercent >= thresholdPercent;
    } catch (error) {
      console.error('Error in isTicketHighDemand:', error);
      return false;
    }
  }
  
  /**
   * Helper method to check remaining capacity for an event
   * Uses the event_capacity table directly for accurate capacity information
   * 
   * @param eventId The event ID to check
   * @returns Promise<{max: number, available: number, percentage: number}> Capacity information
   */
  static async getEventCapacity(eventId: string): Promise<{
    max: number;
    available: number;
    reserved: number;
    sold: number;
    percentage: number;
  }> {
    try {
      if (!eventId) {
        console.error('Event ID is required to get capacity');
        return {
          max: 0,
          available: 0,
          reserved: 0,
          sold: 0,
          percentage: 0
        };
      }
      
      // Fetch current capacity information directly from the event_capacity table
      const { data, error } = await supabase
        .from('event_capacity')
        .select('max_capacity, reserved_count, sold_count')
        .eq('event_id', eventId)
        .single();
      
      if (error) {
        console.error(`Error fetching capacity for event ${eventId}:`, error.message);
        return {
          max: 0,
          available: 0,
          reserved: 0,
          sold: 0,
          percentage: 0
        };
      }
      
      if (!data) {
        console.warn(`No capacity record found for event ${eventId}`);
        return {
          max: 0,
          available: 0,
          reserved: 0,
          sold: 0,
          percentage: 0
        };
      }
      
      // Calculate available capacity and usage percentage
      const available = Math.max(0, data.max_capacity - (data.reserved_count + data.sold_count));
      const percentage = data.max_capacity > 0 
        ? Math.round(((data.reserved_count + data.sold_count) / data.max_capacity) * 100) 
        : 0;
      
      return {
        max: data.max_capacity,
        available,
        reserved: data.reserved_count,
        sold: data.sold_count,
        percentage
      };
    } catch (error) {
      console.error(`Error in getEventCapacity for event ${eventId}:`, error);
      return {
        max: 0,
        available: 0,
        reserved: 0,
        sold: 0,
        percentage: 0
      };
    }
  }
}