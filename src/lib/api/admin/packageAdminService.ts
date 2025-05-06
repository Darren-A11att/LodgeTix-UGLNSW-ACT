import { AdminApiService, AdminApiResponse, QueryParams } from './adminApiService';
import { supabaseTables } from '../../supabase';
import * as SupabaseTypes from '../../../../supabase/supabase.types';

// Type definitions for package-related operations
type DbPackage = SupabaseTypes.Database['public']['Tables']['packages']['Row'];
type DbPackageEvent = SupabaseTypes.Database['public']['Tables']['package_events']['Row'];
type DbPackageVas = SupabaseTypes.Database['public']['Tables']['package_vas_options']['Row'];
type DbEvent = SupabaseTypes.Database['public']['Tables']['Events']['Row'];

/**
 * Extended package details with related information
 */
export interface AdminPackageDetails extends DbPackage {
  events?: DbEvent[];
  valueAddedServices?: any[];
  capacity?: {
    available: number;
    reserved: number;
    sold: number;
    max: number;
  };
}

/**
 * Package create request
 */
export interface PackageCreateRequest {
  name: string;
  description?: string;
  parent_event_id?: string;
  includes_description?: string[];
}

/**
 * Event addition to package request
 */
export interface PackageEventAddRequest {
  event_id: string;
}

/**
 * Admin service for managing packages
 */
export class PackageAdminService extends AdminApiService {
  constructor() {
    super();
  }

  /**
   * Get all packages with filtering and pagination
   */
  async getPackages(params: QueryParams = {}): Promise<AdminApiResponse<DbPackage[]>> {
    return this.getItems<DbPackage>(supabaseTables.packages, params);
  }

  /**
   * Get a single package by ID with detailed information
   */
  async getPackage(id: string): Promise<AdminApiResponse<AdminPackageDetails>> {
    try {
      // Get the base package
      const { data: packageData, error } = await this.getItemById<DbPackage>(
        supabaseTables.packages, 
        id
      );
      
      if (error || !packageData) {
        return { data: null, error };
      }
      
      // Get included events
      const { data: packageEvents } = await this.client
        .from(supabaseTables.packageEvents)
        .select('event_id')
        .eq('package_id', id);
      
      // If we have package events, get the full event details
      let events: DbEvent[] = [];
      if (packageEvents && packageEvents.length > 0) {
        const eventIds = packageEvents.map(pe => pe.event_id).filter(Boolean);
        
        if (eventIds.length > 0) {
          const { data: eventsData } = await this.client
            .from(supabaseTables.events)
            .select('*')
            .in('id', eventIds);
            
          if (eventsData) {
            events = eventsData;
          }
        }
      }
      
      // Get value-added services
      const { data: packageVasOptions } = await this.client
        .from(supabaseTables.packageVasOptions)
        .select(`
          id,
          price_override,
          vas_id,
          value_added_services(*)
        `)
        .eq('package_id', id);
      
      // Get package availability using the get_package_availability function
      const { data: capacityData } = await this.client
        .rpc('get_package_availability', { package_uuid: id });
      
      // Combine into detailed response
      const packageDetails: AdminPackageDetails = {
        ...packageData,
        events,
        valueAddedServices: packageVasOptions || [],
        capacity: capacityData ? {
          available: capacityData.available_count,
          reserved: capacityData.reserved_count,
          sold: capacityData.sold_count,
          max: capacityData.max_capacity
        } : undefined
      };
      
      return { data: packageDetails, error: null };
    } catch (error: any) {
      console.error(`Error fetching detailed package with ID ${id}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Create a new package
   */
  async createPackage(packageData: PackageCreateRequest): Promise<AdminApiResponse<DbPackage>> {
    return this.createItem<DbPackage>(supabaseTables.packages, packageData);
  }

  /**
   * Update an existing package
   */
  async updatePackage(id: string, packageData: Partial<PackageCreateRequest>): Promise<AdminApiResponse<DbPackage>> {
    return this.updateItem<DbPackage>(supabaseTables.packages, id, packageData);
  }

  /**
   * Delete a package
   */
  async deletePackage(id: string): Promise<AdminApiResponse<void>> {
    try {
      // First, check if there are any events or VAS options attached to this package
      const { data: packageEvents, error: eventsError } = await this.client
        .from(supabaseTables.packageEvents)
        .select('id')
        .eq('package_id', id);
      
      if (eventsError) {
        return { data: null, error: new Error(`Failed to check package events: ${eventsError.message}`) };
      }
      
      if (packageEvents && packageEvents.length > 0) {
        return { 
          data: null, 
          error: new Error('Cannot delete package with associated events. Remove events first.') 
        };
      }
      
      const { data: packageVas, error: vasError } = await this.client
        .from(supabaseTables.packageVasOptions)
        .select('id')
        .eq('package_id', id);
      
      if (vasError) {
        return { data: null, error: new Error(`Failed to check package VAS options: ${vasError.message}`) };
      }
      
      if (packageVas && packageVas.length > 0) {
        return { 
          data: null, 
          error: new Error('Cannot delete package with associated value-added services. Remove VAS options first.') 
        };
      }

      // Check if there are tickets that reference this package
      const { data: tickets, error: ticketsError } = await this.client
        .from(supabaseTables.ticketDefinitions)
        .select('id')
        .eq('package_id', id);
      
      if (ticketsError) {
        return { data: null, error: new Error(`Failed to check ticket definitions: ${ticketsError.message}`) };
      }
      
      if (tickets && tickets.length > 0) {
        return { 
          data: null, 
          error: new Error('Cannot delete package with associated ticket definitions. Remove ticket definitions first.') 
        };
      }
      
      // Now we can safely delete the package
      return this.deleteItem(supabaseTables.packages, id);
    } catch (error: any) {
      console.error(`Error safely deleting package with ID ${id}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Add an event to a package
   */
  async addEventToPackage(packageId: string, eventData: PackageEventAddRequest): Promise<AdminApiResponse<DbPackageEvent>> {
    try {
      const { data, error } = await this.client
        .from(supabaseTables.packageEvents)
        .insert({
          package_id: packageId,
          event_id: eventData.event_id
        })
        .select()
        .single();
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error(`Error adding event to package ${packageId}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Remove an event from a package
   */
  async removeEventFromPackage(packageId: string, eventId: string): Promise<AdminApiResponse<void>> {
    try {
      const { error } = await this.client
        .from(supabaseTables.packageEvents)
        .delete()
        .eq('package_id', packageId)
        .eq('event_id', eventId);
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: null, error: null };
    } catch (error: any) {
      console.error(`Error removing event from package ${packageId}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Get events in a package
   */
  async getPackageEvents(packageId: string): Promise<AdminApiResponse<DbEvent[]>> {
    try {
      // Get the package event relationships
      const { data: packageEvents, error: eventsError } = await this.client
        .from(supabaseTables.packageEvents)
        .select('event_id')
        .eq('package_id', packageId);
      
      if (eventsError) {
        return { data: null, error: new Error(eventsError.message) };
      }
      
      if (!packageEvents || packageEvents.length === 0) {
        return { data: [], error: null };
      }
      
      // Get the event details
      const eventIds = packageEvents.map(pe => pe.event_id).filter(Boolean);
      
      if (eventIds.length === 0) {
        return { data: [], error: null };
      }
      
      const { data: events, error } = await this.client
        .from(supabaseTables.events)
        .select('*')
        .in('id', eventIds);
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: events || [], error: null };
    } catch (error: any) {
      console.error(`Error fetching events for package ${packageId}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Update package capacity
   */
  async updatePackageCapacity(
    packageId: string, 
    maxCapacity: number
  ): Promise<AdminApiResponse<any>> {
    try {
      // Call the update_package_capacity RPC function
      const { data, error } = await this.client
        .rpc('update_package_capacity', { 
          package_uuid: packageId,
          max_capacity: maxCapacity
        });
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error(`Error updating capacity for package ${packageId}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Get package capacity
   */
  async getPackageCapacity(packageId: string): Promise<AdminApiResponse<{
    available: number;
    reserved: number;
    sold: number;
    max: number;
  }>> {
    try {
      const { data, error } = await this.client
        .rpc('get_package_availability', { package_uuid: packageId });
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      if (!data) {
        return { 
          data: { available: 0, reserved: 0, sold: 0, max: 0 }, 
          error: null 
        };
      }
      
      return { 
        data: {
          available: data.available_count,
          reserved: data.reserved_count,
          sold: data.sold_count,
          max: data.max_capacity
        }, 
        error: null 
      };
    } catch (error: any) {
      console.error(`Error getting capacity for package ${packageId}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }
}