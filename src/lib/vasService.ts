import { supabase } from './supabase';

/**
 * Value-Added Service Category interface
 */
export interface VasCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Value-Added Service interface
 */
export interface ValueAddedService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: string | null;
  is_active: boolean | null;
  created_at: string;
  category_id: string | null;
  min_quantity: number;
  max_quantity: number;
  display_order: number;
  updated_at: string;
  has_limited_inventory: boolean;
  inventory_quantity: number | null;
}

/**
 * VAS Inventory interface
 */
export interface VasInventory {
  id: string;
  vas_id: string;
  initial_quantity: number;
  current_quantity: number;
  reserved_quantity: number;
  event_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * VAS Eligibility interface
 */
export interface VasEligibility {
  id: string;
  vas_id: string;
  attendee_type: 'Mason' | 'Guest' | 'LadyPartner' | 'GuestPartner';
  created_at: string;
}

/**
 * Service for managing Value-Added Services (VAS)
 */
export class VasService {
  /**
   * Get all VAS categories
   * @returns Promise resolving to array of VasCategory objects
   */
  static async getCategories(): Promise<VasCategory[]> {
    try {
      const { data, error } = await supabase
        .from('vas_categories')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getCategories:', error);
      return [];
    }
  }
  
  /**
   * Get all VAS items, optionally filtered by category
   * @param categoryId Optional category ID to filter by
   * @returns Promise resolving to array of ValueAddedService objects
   */
  static async getValueAddedServices(categoryId?: string): Promise<ValueAddedService[]> {
    try {
      let query = supabase
        .from('value_added_services')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getValueAddedServices:', error);
      return [];
    }
  }
  
  /**
   * Get VAS items available for a specific event
   * @param eventId Event ID to filter by
   * @returns Promise resolving to array of ValueAddedService objects
   */
  static async getEventVasOptions(eventId: string): Promise<ValueAddedService[]> {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      
      const { data, error } = await supabase
        .from('event_vas_options')
        .select(`
          *,
          vas:vas_id (*)
        `)
        .eq('event_id', eventId);
      
      if (error) {
        throw error;
      }
      
      // Transform the result to match the ValueAddedService interface
      return (data || []).map(item => ({
        ...item.vas,
        price_override: item.price_override
      }));
    } catch (error) {
      console.error('Error in getEventVasOptions:', error);
      return [];
    }
  }
  
  /**
   * Get VAS items available for a specific package
   * @param packageId Package ID to filter by
   * @returns Promise resolving to array of ValueAddedService objects
   */
  static async getPackageVasOptions(packageId: string): Promise<ValueAddedService[]> {
    try {
      if (!packageId) {
        throw new Error('Package ID is required');
      }
      
      const { data, error } = await supabase
        .from('package_vas_options')
        .select(`
          *,
          vas:vas_id (*)
        `)
        .eq('package_id', packageId);
      
      if (error) {
        throw error;
      }
      
      // Transform the result to match the ValueAddedService interface
      return (data || []).map(item => ({
        ...item.vas,
        price_override: item.price_override
      }));
    } catch (error) {
      console.error('Error in getPackageVasOptions:', error);
      return [];
    }
  }
  
  /**
   * Get VAS eligibility for a specific VAS
   * @param vasId VAS ID to get eligibility for
   * @returns Promise resolving to array of VasEligibility objects
   */
  static async getVasEligibility(vasId: string): Promise<VasEligibility[]> {
    try {
      if (!vasId) {
        throw new Error('VAS ID is required');
      }
      
      const { data, error } = await supabase
        .from('vas_eligibility')
        .select('*')
        .eq('vas_id', vasId);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getVasEligibility:', error);
      return [];
    }
  }
  
  /**
   * Check if an attendee type is eligible for a specific VAS
   * @param vasId VAS ID to check
   * @param attendeeType Attendee type to check
   * @returns Promise resolving to boolean indicating eligibility
   */
  static async isAttendeeTypeEligible(
    vasId: string,
    attendeeType: 'Mason' | 'Guest' | 'LadyPartner' | 'GuestPartner'
  ): Promise<boolean> {
    try {
      if (!vasId || !attendeeType) {
        throw new Error('VAS ID and attendee type are required');
      }
      
      // First check if there are any eligibility records for this VAS
      const { data: eligibilityRecords, error: eligibilityError } = await supabase
        .from('vas_eligibility')
        .select('id')
        .eq('vas_id', vasId);
      
      if (eligibilityError) {
        throw eligibilityError;
      }
      
      // If no eligibility records, all attendee types are eligible
      if (!eligibilityRecords || eligibilityRecords.length === 0) {
        return true;
      }
      
      // Otherwise, check if this attendee type is specifically eligible
      const { data, error } = await supabase
        .from('vas_eligibility')
        .select('id')
        .eq('vas_id', vasId)
        .eq('attendee_type', attendeeType);
      
      if (error) {
        throw error;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error in isAttendeeTypeEligible:', error);
      return false;
    }
  }
  
  /**
   * Get VAS inventory for a specific VAS
   * @param vasId VAS ID to get inventory for
   * @param eventId Optional event ID to filter by
   * @returns Promise resolving to VasInventory object
   */
  static async getVasInventory(
    vasId: string,
    eventId?: string
  ): Promise<VasInventory | null> {
    try {
      if (!vasId) {
        throw new Error('VAS ID is required');
      }
      
      let query = supabase
        .from('vas_inventory')
        .select('*')
        .eq('vas_id', vasId);
      
      if (eventId) {
        query = query.eq('event_id', eventId);
      } else {
        query = query.is('event_id', null);
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No data found, not an error for our purpose
          return null;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getVasInventory:', error);
      return null;
    }
  }
  
  /**
   * Reserve VAS inventory
   * @param vasId VAS ID to reserve
   * @param eventId Event ID (can be null for global inventory)
   * @param quantity Quantity to reserve
   * @returns Promise resolving to boolean indicating success
   */
  static async reserveVasInventory(
    vasId: string,
    eventId: string | null,
    quantity: number = 1
  ): Promise<boolean> {
    try {
      if (!vasId) {
        throw new Error('VAS ID is required');
      }
      
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      
      const { data, error } = await supabase.rpc('reserve_vas_inventory', {
        p_vas_id: vasId,
        p_event_id: eventId,
        p_quantity: quantity
      });
      
      if (error) {
        throw error;
      }
      
      return !!data; // Convert to boolean
    } catch (error) {
      console.error('Error in reserveVasInventory:', error);
      return false;
    }
  }
  
  /**
   * Release VAS inventory reservation
   * @param vasId VAS ID to release reservation for
   * @param eventId Event ID (can be null for global inventory)
   * @param quantity Quantity to release
   * @returns Promise resolving to boolean indicating success
   */
  static async releaseVasReservation(
    vasId: string,
    eventId: string | null,
    quantity: number = 1
  ): Promise<boolean> {
    try {
      if (!vasId) {
        throw new Error('VAS ID is required');
      }
      
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      
      const { data, error } = await supabase.rpc('release_vas_reservation', {
        p_vas_id: vasId,
        p_event_id: eventId,
        p_quantity: quantity
      });
      
      if (error) {
        throw error;
      }
      
      return !!data; // Convert to boolean
    } catch (error) {
      console.error('Error in releaseVasReservation:', error);
      return false;
    }
  }
  
  /**
   * Confirm VAS purchase
   * @param vasId VAS ID to confirm purchase for
   * @param eventId Event ID (can be null for global inventory)
   * @param quantity Quantity purchased
   * @returns Promise resolving to boolean indicating success
   */
  static async confirmVasPurchase(
    vasId: string,
    eventId: string | null,
    quantity: number = 1
  ): Promise<boolean> {
    try {
      if (!vasId) {
        throw new Error('VAS ID is required');
      }
      
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      
      const { data, error } = await supabase.rpc('confirm_vas_purchase', {
        p_vas_id: vasId,
        p_event_id: eventId,
        p_quantity: quantity
      });
      
      if (error) {
        throw error;
      }
      
      return !!data; // Convert to boolean
    } catch (error) {
      console.error('Error in confirmVasPurchase:', error);
      return false;
    }
  }
  
  /**
   * Add a VAS item to a registration
   * @param registrationId Registration ID to add VAS to
   * @param vasId VAS ID to add
   * @param quantity Quantity to add
   * @param priceAtPurchase Price at time of purchase
   * @returns Promise resolving to the created registration_vas record
   */
  static async addVasToRegistration(
    registrationId: string,
    vasId: string,
    quantity: number = 1,
    priceAtPurchase: number
  ): Promise<any> {
    try {
      if (!registrationId || !vasId) {
        throw new Error('Registration ID and VAS ID are required');
      }
      
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      
      const { data, error } = await supabase
        .from('registration_vas')
        .insert({
          registration_id: registrationId,
          vas_id: vasId,
          quantity: quantity,
          price_at_purchase: priceAtPurchase
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in addVasToRegistration:', error);
      return null;
    }
  }
}