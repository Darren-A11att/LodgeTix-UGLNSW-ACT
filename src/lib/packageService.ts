import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Package reservation interface
export interface PackageReservation {
  packageId: string;
  reservationId: string;
  expiresAt: string;
  parentEventId: string;
}

export interface PackageReservationResult {
  success: boolean;
  data?: PackageReservation;
  error?: string;
}

/**
 * Service for handling package reservations
 */
export class PackageService {
  private static readonly PACKAGE_RESERVATION_STORAGE_KEY = 'lodgetix_package_reservation_data';
  private static readonly PACKAGE_RESERVATION_STORAGE_EXPIRY = 'lodgetix_package_reservation_expiry';
  private static clientId: string = crypto.randomUUID();
  private static activeChannels: Map<string, RealtimeChannel> = new Map();

  /**
   * Reserve a package
   * Uses the atomic reservation functions to ensure capacity integrity
   */
  static async reservePackage(
    packageId: string
  ): Promise<PackageReservationResult> {
    try {
      if (!packageId || packageId.trim() === '') {
        throw new Error('Package ID is required');
      }
      
      console.log(`PackageService.reservePackage: Reserving package ${packageId}`);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      // First check if we have capacity using the package_capacity table
      const { data: capacityData, error: capacityError } = await supabase
        .rpc('get_package_availability', { package_uuid: packageId });
        
      if (capacityError) {
        console.error('Error checking package capacity:', capacityError);
        return {
          success: false,
          error: `Failed to check package capacity: ${capacityError.message}`
        };
      }
      
      if (!capacityData || !capacityData.available) {
        return {
          success: false,
          error: `No capacity available for package ${packageId}`
        };
      }
      
      // Use the reserve_package function to update capacity atomically
      const { data: reserveResult, error: reserveError } = await supabase
        .rpc('reserve_package', { package_uuid: packageId });
      
      if (reserveError || !reserveResult) {
        console.error('Error reserving package:', reserveError || 'Reservation failed');
        return {
          success: false,
          error: reserveError?.message || 'Failed to reserve package'
        };
      }

      // Now get the package details
      const { data: packageData, error: packageError } = await supabase
        .from('packages')
        .select('id, name, parent_event_id')
        .eq('id', packageId)
        .single();
      
      if (packageError || !packageData) {
        // Release the capacity reservation since we couldn't get package details
        await supabase.rpc('release_package_reservation', { package_uuid: packageId });
        
        return {
          success: false,
          error: packageError?.message || 'Failed to get package details'
        };
      }
      
      // Generate a reservation ID and expiry time (15 minutes from now)
      const reservationId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      
      // Create the reservation object
      const reservation: PackageReservation = {
        packageId,
        reservationId,
        expiresAt,
        parentEventId: packageData.parent_event_id
      };
      
      // Store the reservation for persistence
      this.storeReservationData(reservation);

      return {
        success: true,
        data: reservation
      };
    } catch (error) {
      console.error('Error in reservePackage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Complete package reservation after payment
   */
  static async completePackageReservation(
    packageId: string,
    reservationId: string
  ): Promise<PackageReservationResult> {
    try {
      // Call the confirm_package_purchase function
      const { data: result, error } = await supabase
        .rpc('confirm_package_purchase', { package_uuid: packageId });
      
      if (error || !result) {
        console.error('Error completing package reservation:', error || 'Confirmation failed');
        return {
          success: false,
          error: error?.message || 'Failed to complete package reservation'
        };
      }
      
      // Clear the reservation from storage
      this.clearStoredReservation();
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error in completePackageReservation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Cancel a package reservation
   */
  static async cancelPackageReservation(
    packageId: string
  ): Promise<boolean> {
    try {
      // Call the release_package_reservation function
      const { data: result, error } = await supabase
        .rpc('release_package_reservation', { package_uuid: packageId });
      
      if (error) {
        console.error('Error canceling package reservation:', error);
        return false;
      }
      
      // Clear the reservation from storage
      this.clearStoredReservation();
      
      return result as boolean;
    } catch (error) {
      console.error('Error in cancelPackageReservation:', error);
      return false;
    }
  }

  /**
   * Get package availability
   */
  static async getPackageAvailability(
    packageId: string
  ): Promise<{ available: number; reserved: number; sold: number; max: number }> {
    try {
      if (!packageId) {
        console.error('Package ID is required to get availability');
        return { available: 0, reserved: 0, sold: 0, max: 0 };
      }
      
      // Use the get_package_availability function
      const { data, error } = await supabase
        .rpc('get_package_availability', { package_uuid: packageId });
      
      if (error) {
        console.error('Error getting package availability:', error);
        return { available: 0, reserved: 0, sold: 0, max: 0 };
      }
      
      if (!data) {
        console.warn(`No availability data found for package ${packageId}`);
        return { available: 0, reserved: 0, sold: 0, max: 0 };
      }
      
      return {
        available: data.available_count,
        reserved: data.reserved_count,
        sold: data.sold_count,
        max: data.max_capacity
      };
    } catch (error) {
      console.error('Error in getPackageAvailability:', error);
      return { available: 0, reserved: 0, sold: 0, max: 0 };
    }
  }

  /**
   * Subscribe to package availability changes
   */
  static subscribeToPackageAvailabilityChanges(
    packageId: string,
    callback: (counts: { available: number; reserved: number; sold: number; max: number }) => void
  ): { unsubscribe: () => void } {
    if (!packageId) {
      console.error('Package ID is required to subscribe to availability changes');
      callback({ available: 0, reserved: 0, sold: 0, max: 0 });
      return { unsubscribe: () => {} };
    }
    
    // Create a unique channel key
    const channelKey = `package-availability-${packageId}`;
    
    // First, fetch initial data
    this.getPackageAvailability(packageId)
      .then(data => callback(data))
      .catch(error => {
        console.error(`Error fetching initial package availability for ${packageId}:`, error);
        callback({ available: 0, reserved: 0, sold: 0, max: 0 });
      });
    
    // Create the channel for real-time updates on the package_capacity table
    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'package_capacity',
          filter: `package_id=eq.${packageId}`
        },
        (payload) => {
          // When capacity changes, recalculate available packages
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
            console.warn(`Capacity record for package ${packageId} was deleted`);
            callback({ available: 0, reserved: 0, sold: 0, max: 0 });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Store in active channels
          this.activeChannels.set(channelKey, channel);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to capacity changes for package ${packageId}`);
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
   * Clean up realtime connections
   */
  static cleanupRealtimeConnections(): void {
    // Remove all active channels
    this.activeChannels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.activeChannels.clear();
  }

  /**
   * Store the current package reservation data in localStorage
   */
  static storeReservationData(reservation: PackageReservation): void {
    try {
      // Store reservation data
      localStorage.setItem(this.PACKAGE_RESERVATION_STORAGE_KEY, JSON.stringify(reservation));
      
      // Store expiry timestamp
      const expiryDate = new Date(reservation.expiresAt).getTime();
      localStorage.setItem(this.PACKAGE_RESERVATION_STORAGE_EXPIRY, expiryDate.toString());
    } catch (error) {
      console.error('Error storing package reservation data:', error);
    }
  }
  
  /**
   * Retrieve stored package reservation data if it hasn't expired
   */
  static getStoredReservation(): PackageReservation | null {
    try {
      const storedData = localStorage.getItem(this.PACKAGE_RESERVATION_STORAGE_KEY);
      const expiryTimestamp = localStorage.getItem(this.PACKAGE_RESERVATION_STORAGE_EXPIRY);
      
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
      return JSON.parse(storedData) as PackageReservation;
    } catch (error) {
      console.error('Error retrieving stored package reservation:', error);
      return null;
    }
  }
  
  /**
   * Clear stored package reservation data
   */
  static clearStoredReservation(): void {
    try {
      localStorage.removeItem(this.PACKAGE_RESERVATION_STORAGE_KEY);
      localStorage.removeItem(this.PACKAGE_RESERVATION_STORAGE_EXPIRY);
    } catch (error) {
      console.error('Error clearing stored package reservation:', error);
    }
  }
}