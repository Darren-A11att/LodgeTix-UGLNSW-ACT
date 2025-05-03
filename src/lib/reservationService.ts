import { supabase } from './supabase';
import { User, RealtimeChannel } from '@supabase/supabase-js';

// Ticket interface matching the database schema
export interface TicketRecord {
  ticketid: string;
  attendeeid: string | null;
  eventid: string;
  ticketdefinitionid: string;
  pricepaid: number;
  seatinfo: string | null;
  status: 'available' | 'reserved' | 'sold' | 'used' | 'cancelled';
  checkedinat: string | null;
  createdat: string;
  updatedat: string;
  reservation_id: string | null;
  reservation_expires_at: string | null;
  original_price: number | null;
  currency: string | null;
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
   */
  static async reserveTickets(
    eventId: string,
    ticketDefinitionId: string,
    quantity: number
  ): Promise<ReservationResult> {
    try {
      // We need at least the ticket definition ID
      if (!ticketDefinitionId || ticketDefinitionId.trim() === '') {
        throw new Error('Ticket definition ID is required');
      }
      
      // Use ticket ID as event ID if none provided (events.map allows this)
      if (!eventId || eventId.trim() === '') {
        console.log(`No event ID provided, using ticket ID ${ticketDefinitionId} as event ID`);
        eventId = ticketDefinitionId;
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

      // Call the reserve_tickets function
      const { data, error } = await supabase.rpc('reserve_tickets', {
        p_event_id: eventId,
        p_ticket_definition_id: ticketDefinitionId,
        p_quantity: quantity,
        p_reservation_minutes: 15
      });

      if (error) {
        console.error('Error reserving tickets:', error);
        
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
      // (They all have the same reservation_id)
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
   */
  static async completeReservation(
    reservationId: string,
    attendeeId: string
  ): Promise<ReservationResult> {
    try {
      const { data, error } = await supabase.rpc('complete_reservation', {
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

      return {
        success: true,
        data: data.map(ticketId => ({
          ticketId,
          reservationId,
          expiresAt: '',
          eventId: '',
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
   */
  static async getTicketAvailability(
    eventId: string,
    ticketDefinitionId: string
  ): Promise<{ available: number; reserved: number; sold: number }> {
    try {
      const { data, error } = await supabase.rpc('get_ticket_availability', {
        p_event_id: eventId,
        p_ticket_definition_id: ticketDefinitionId
      });

      if (error) {
        console.error('Error getting ticket availability:', error);
        return { available: 0, reserved: 0, sold: 0 };
      }

      return {
        available: data.available || 0,
        reserved: data.reserved || 0,
        sold: data.sold || 0
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
          table: 'tickets',
          filter: `reservation_id=eq.${reservationId}`
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
   * Subscribe to ticket availability changes for an event/ticket definition
   */
  static subscribeToAvailabilityChanges(
    eventId: string,
    ticketDefinitionId: string,
    callback: (counts: { available: number; reserved: number; sold: number }) => void
  ): { unsubscribe: () => void } {
    // Create a unique channel key
    const channelKey = `availability-${eventId}-${ticketDefinitionId}`;
    
    // Create the channel
    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for any changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tickets',
          filter: `eventid=eq.${eventId} AND ticketdefinitionid=eq.${ticketDefinitionId}`
        },
        async () => {
          // When any ticket change happens, fetch the current counts
          const counts = await this.getTicketAvailability(eventId, ticketDefinitionId);
          callback(counts);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Store in active channels
          this.activeChannels.set(channelKey, channel);
          
          // Get initial counts
          this.getTicketAvailability(eventId, ticketDefinitionId)
            .then(counts => callback(counts));
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
}