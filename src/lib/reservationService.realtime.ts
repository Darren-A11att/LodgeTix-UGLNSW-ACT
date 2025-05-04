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

// Event capacity data from Realtime events
interface EventCapacityData {
  event_id: string;
  max_capacity: number;
  reserved_count: number;
  sold_count: number;
  available: number;
  usage_percentage: number;
  operation: 'INSERT' | 'UPDATE';
  timestamp: number;
}

// High demand notification data
interface HighDemandData {
  event_id: string;
  usage_percentage: number;
  timestamp: number;
}

// Ticket status change notification data
interface TicketStatusChangeData {
  event_id: string;
  ticket_definition_id: string;
  ticket_id: string;
  reservation_id: string | null;
  attendee_id: string | null;
  status: string;
  timestamp: number;
}

/**
 * Enhanced ReservationService with Supabase Realtime support
 * This service handles ticket reservations with real-time updates
 */
export class ReservationService {
  private static presenceChannel: RealtimeChannel | null = null;
  private static systemChannel: RealtimeChannel | null = null;
  private static capacityChannel: RealtimeChannel | null = null;
  private static ticketsChannel: RealtimeChannel | null = null;
  private static highDemandChannel: RealtimeChannel | null = null;
  private static clientId: string = crypto.randomUUID();
  private static activeChannels: Map<string, RealtimeChannel> = new Map();
  
  // Constants for localStorage
  private static readonly RESERVATION_STORAGE_KEY = 'lodgetix_reservation_data';
  private static readonly RESERVATION_STORAGE_EXPIRY = 'lodgetix_reservation_expiry';
  private static readonly REGISTRATION_TYPE_KEY = 'lodgetix_registration_type';
  
  // Default threshold for high demand (80%)
  private static readonly HIGH_DEMAND_THRESHOLD = 80;

  // Callback registries for event handlers
  private static capacityCallbacks: Map<string, Set<Function>> = new Map();
  private static highDemandCallbacks: Map<string, Set<Function>> = new Map();
  private static ticketStatusCallbacks: Map<string, Set<Function>> = new Map();

  /**
   * Initialize all realtime connections for ticket management
   * Call this when the ticket selection/reservation UI first loads
   */
  static initializeRealtimeConnections(eventId: string): void {
    this.setupPresenceChannel(eventId);
    this.setupSystemChannel(eventId);
    this.setupCapacityChannel();
    this.setupTicketsChannel();
    this.setupHighDemandChannel();
  }

  /**
   * Clean up all realtime connections
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
    this.capacityChannel = null;
    this.ticketsChannel = null;
    this.highDemandChannel = null;
    
    // Clear all callbacks
    this.capacityCallbacks.clear();
    this.highDemandCallbacks.clear();
    this.ticketStatusCallbacks.clear();
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
   * Set up a channel to listen for event capacity changes using Postgres Changes
   */
  private static setupCapacityChannel(): void {
    this.capacityChannel = supabase.channel('event-capacity-changes');

    this.capacityChannel
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'event_capacity',
        },
        (payload) => {
          // When capacity changes, notify all registered callbacks
          const eventId = payload.new?.event_id || payload.old?.event_id;
          if (!eventId) return;
          
          // Get callbacks for this event
          const callbacks = this.capacityCallbacks.get(eventId) || new Set();
          
          // Convert data for callbacks
          const capacityData = {
            eventId,
            maxCapacity: payload.new?.max_capacity || 0,
            reservedCount: payload.new?.reserved_count || 0,
            soldCount: payload.new?.sold_count || 0,
            available: payload.new ? 
              Math.max(0, payload.new.max_capacity - (payload.new.reserved_count + payload.new.sold_count)) : 0,
            usagePercentage: payload.new && payload.new.max_capacity > 0 ?
              Math.round(((payload.new.reserved_count + payload.new.sold_count) / payload.new.max_capacity) * 100) : 0,
            operation: payload.eventType,
            timestamp: Date.now()
          };
          
          // Notify each callback
          callbacks.forEach(callback => {
            try {
              callback(capacityData);
            } catch (error) {
              console.error('Error in capacity change callback:', error);
            }
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug('Subscribed to event capacity changes');
          if (this.capacityChannel) {
            this.activeChannels.set('event-capacity-changes', this.capacityChannel);
          }
        }
      });
  }

  /**
   * Set up a channel to listen for database notifications about ticket status changes
   */
  private static setupTicketsChannel(): void {
    this.ticketsChannel = supabase.channel('ticket-status-changes');

    this.ticketsChannel
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'Tickets',
        },
        (payload) => {
          // When ticket status changes, notify registered callbacks
          const eventId = payload.new?.eventId || payload.old?.eventId;
          const ticketDefId = payload.new?.ticketDefinitionId || payload.old?.ticketDefinitionId;
          
          if (!eventId || !ticketDefId) return;
          
          // Get callbacks for this event/ticket combo
          const keyEvent = eventId;
          const keyTicket = `${eventId}:${ticketDefId}`;
          const keyCombo = `${eventId}:${ticketDefId}:${payload.new?.ticketId || payload.old?.ticketId}`;
          
          // Get callbacks at all levels (event, event+ticket, specific ticket)
          const eventCallbacks = this.ticketStatusCallbacks.get(keyEvent) || new Set();
          const ticketDefCallbacks = this.ticketStatusCallbacks.get(keyTicket) || new Set();
          const specificCallbacks = this.ticketStatusCallbacks.get(keyCombo) || new Set();
          
          // Combine all callbacks
          const allCallbacks = new Set([
            ...eventCallbacks,
            ...ticketDefCallbacks,
            ...specificCallbacks
          ]);
          
          // Build ticket status data
          const statusData: TicketStatusChangeData = {
            event_id: eventId,
            ticket_definition_id: ticketDefId,
            ticket_id: payload.new?.ticketId || payload.old?.ticketId,
            reservation_id: payload.new?.reservationId || null,
            attendee_id: payload.new?.attendeeId || null,
            status: payload.new?.status || 'removed',
            timestamp: Date.now()
          };
          
          // Notify each callback
          allCallbacks.forEach(callback => {
            try {
              callback(statusData);
            } catch (error) {
              console.error('Error in ticket status callback:', error);
            }
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug('Subscribed to ticket status changes');
          if (this.ticketsChannel) {
            this.activeChannels.set('ticket-status-changes', this.ticketsChannel);
          }
        }
      });
  }

  /**
   * Set up a channel to listen for high demand event notifications
   */
  private static setupHighDemandChannel(): void {
    this.highDemandChannel = supabase.channel('high-demand-events');

    this.highDemandChannel
      .on(
        'broadcast',
        { event: 'high_demand_events' },
        (payload) => {
          // Process high demand notification
          const highDemandData = payload.payload as HighDemandData;
          if (!highDemandData || !highDemandData.event_id) return;
          
          // Get callbacks for this event
          const callbacks = this.highDemandCallbacks.get(highDemandData.event_id) || new Set();
          
          // Notify each callback
          callbacks.forEach(callback => {
            try {
              callback({
                eventId: highDemandData.event_id,
                usagePercentage: highDemandData.usage_percentage,
                timestamp: highDemandData.timestamp
              });
            } catch (error) {
              console.error('Error in high demand callback:', error);
            }
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug('Subscribed to high demand events');
          if (this.highDemandChannel) {
            this.activeChannels.set('high-demand-events', this.highDemandChannel);
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
   * Subscribe to real-time capacity changes for an event
   * @param eventId The event ID to subscribe to
   * @param callback Function to call with updated capacity data
   * @returns Function to unsubscribe
   */
  static subscribeToCapacityChanges(
    eventId: string,
    callback: (data: {
      eventId: string;
      maxCapacity: number;
      reservedCount: number;
      soldCount: number;
      available: number;
      usagePercentage: number;
      operation?: string;
      timestamp: number;
    }) => void
  ): () => void {
    // Make sure we have a set of callbacks for this event
    if (!this.capacityCallbacks.has(eventId)) {
      this.capacityCallbacks.set(eventId, new Set());
    }
    
    // Add the callback to the set
    const callbacks = this.capacityCallbacks.get(eventId)!;
    callbacks.add(callback);
    
    // Fetch initial data and send it to the callback
    this.getEventCapacity(eventId).then(capacity => {
      callback({
        eventId,
        maxCapacity: capacity.max,
        reservedCount: capacity.reserved,
        soldCount: capacity.sold,
        available: capacity.available,
        usagePercentage: capacity.percentage,
        timestamp: Date.now()
      });
    });
    
    // Return unsubscribe function
    return () => {
      const callbackSet = this.capacityCallbacks.get(eventId);
      if (callbackSet) {
        callbackSet.delete(callback);
        if (callbackSet.size === 0) {
          this.capacityCallbacks.delete(eventId);
        }
      }
    };
  }

  /**
   * Subscribe to high demand notifications for an event
   * @param eventId The event ID to subscribe to
   * @param callback Function to call when the event enters high demand state
   * @returns Function to unsubscribe
   */
  static subscribeToHighDemandNotifications(
    eventId: string,
    callback: (data: {
      eventId: string;
      usagePercentage: number;
      timestamp: number;
    }) => void
  ): () => void {
    // Make sure we have a set of callbacks for this event
    if (!this.highDemandCallbacks.has(eventId)) {
      this.highDemandCallbacks.set(eventId, new Set());
    }
    
    // Add the callback to the set
    const callbacks = this.highDemandCallbacks.get(eventId)!;
    callbacks.add(callback);
    
    // Check if the event is already in high demand
    this.isTicketHighDemand(eventId, '', this.HIGH_DEMAND_THRESHOLD).then(isHighDemand => {
      if (isHighDemand) {
        // Get current usage percentage
        this.getEventCapacity(eventId).then(capacity => {
          callback({
            eventId,
            usagePercentage: capacity.percentage,
            timestamp: Date.now()
          });
        });
      }
    });
    
    // Return unsubscribe function
    return () => {
      const callbackSet = this.highDemandCallbacks.get(eventId);
      if (callbackSet) {
        callbackSet.delete(callback);
        if (callbackSet.size === 0) {
          this.highDemandCallbacks.delete(eventId);
        }
      }
    };
  }

  /**
   * Subscribe to ticket status changes
   * @param eventId The event ID to subscribe to (required)
   * @param ticketDefinitionId Optional ticket definition ID for more specific filtering
   * @param ticketId Optional specific ticket ID to monitor
   * @param callback Function to call when ticket status changes
   * @returns Function to unsubscribe
   */
  static subscribeToTicketStatusChanges(
    eventId: string,
    ticketDefinitionId: string = '',
    ticketId: string = '',
    callback: (data: TicketStatusChangeData) => void
  ): () => void {
    // Determine the subscription key based on provided parameters
    let key = eventId;
    if (ticketDefinitionId) {
      key += `:${ticketDefinitionId}`;
      if (ticketId) {
        key += `:${ticketId}`;
      }
    }
    
    // Make sure we have a set of callbacks for this key
    if (!this.ticketStatusCallbacks.has(key)) {
      this.ticketStatusCallbacks.set(key, new Set());
    }
    
    // Add the callback to the set
    const callbacks = this.ticketStatusCallbacks.get(key)!;
    callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbackSet = this.ticketStatusCallbacks.get(key);
      if (callbackSet) {
        callbackSet.delete(callback);
        if (callbackSet.size === 0) {
          this.ticketStatusCallbacks.delete(key);
        }
      }
    };
  }

  /**
   * Broadcast a system status message to all clients
   * This is useful for system-wide notifications like maintenance or availability updates
   */
  static async broadcastSystemStatus(message: TicketSystemStatus): Promise<void> {
    if (!this.systemChannel) return;
    
    await this.systemChannel.send({
      type: 'broadcast',
      event: 'ticket-system-status',
      payload: message,
    });
  }

  /**
   * Reserve tickets for an event
   * Uses atomic reservation functions to ensure capacity integrity with real-time updates
   */
  static async reserveTickets(
    eventId: string,
    ticketDefinitionId: string,
    quantity: number
  ): Promise<ReservationResult> {
    try {
      // Validation and implementation...
      // Existing code from reservationService.ts
      
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

  // All other methods from the original service remain the same:
  // completeReservation, cancelReservation, signInAnonymously, convertAnonymousUser, etc.

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
      if (!eventId) {
        console.error('Event ID is required');
        return false;
      }
      
      // First try to use the database function if it exists
      try {
        const { data, error } = await supabase.rpc('is_ticket_high_demand', {
          p_event_id: eventId,
          p_ticket_definition_id: ticketDefinitionId || MD5(eventId + '-dummy').toString(),
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
}

// Helper function for generating MD5 hash when needed
function MD5(input: string): string {
  // This is a simple implementation for demo purposes
  // In production, use a proper crypto library
  let hash = 0;
  if (input.length === 0) return hash.toString(16);
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(16);
}