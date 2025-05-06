import { AdminApiService, AdminApiResponse, QueryParams } from './adminApiService';
import { supabaseTables } from '../../supabase';
import * as TicketTypes from '../../../shared/types/ticket';
import * as SupabaseTypes from '../../../../supabase/supabase.types';

type DbTicketDefinition = SupabaseTypes.Database['public']['Tables']['ticket_definitions']['Row'];
type DbTicketTypePriceTier = SupabaseTypes.Database['public']['Tables']['ticket_type_price_tiers']['Row'];

export interface TicketDefinitionCreateRequest {
  name: string;
  description?: string;
  price: number;
  event_id: string;
  is_active: boolean;
  availability_type?: string;
  eligible_attendee_types?: string[];
  sort_order?: number;
  capacity?: number;
}

export interface PriceTierCreateRequest {
  ticket_definition_id: string;
  price_tier_id: string;
  price: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

/**
 * Admin service for managing ticket definitions and pricing
 */
export class TicketAdminService extends AdminApiService {
  constructor() {
    super();
  }

  /**
   * Get all ticket definitions with filtering and pagination
   */
  async getTicketDefinitions(params: QueryParams = {}): Promise<AdminApiResponse<TicketTypes.TicketDefinitionType[]>> {
    return this.getItems<TicketTypes.TicketDefinitionType>(supabaseTables.ticketDefinitions, params);
  }

  /**
   * Get a single ticket definition by ID
   */
  async getTicketDefinition(id: string): Promise<AdminApiResponse<TicketTypes.TicketDefinitionType>> {
    return this.getItemById<TicketTypes.TicketDefinitionType>(supabaseTables.ticketDefinitions, id);
  }

  /**
   * Create a new ticket definition
   */
  async createTicketDefinition(
    ticketData: TicketDefinitionCreateRequest
  ): Promise<AdminApiResponse<TicketTypes.TicketDefinitionType>> {
    return this.createItem<TicketTypes.TicketDefinitionType>(supabaseTables.ticketDefinitions, ticketData);
  }

  /**
   * Update an existing ticket definition
   */
  async updateTicketDefinition(
    id: string, 
    ticketData: Partial<TicketDefinitionCreateRequest>
  ): Promise<AdminApiResponse<TicketTypes.TicketDefinitionType>> {
    return this.updateItem<TicketTypes.TicketDefinitionType>(supabaseTables.ticketDefinitions, id, ticketData);
  }

  /**
   * Delete a ticket definition
   */
  async deleteTicketDefinition(id: string): Promise<AdminApiResponse<void>> {
    try {
      // Check if there are any ticket assignments using this definition
      const { data: assignments } = await this.client
        .from(supabaseTables.attendeeTicketAssignments)
        .select('id')
        .eq('ticket_definition_id', id);
      
      if (assignments && assignments.length > 0) {
        return { 
          data: null, 
          error: new Error('Cannot delete ticket definition with existing attendee assignments.') 
        };
      }
      
      // Delete price tiers first
      await this.client
        .from(supabaseTables.ticketTypePriceTiers)
        .delete()
        .eq('ticket_definition_id', id);
      
      // Delete the ticket definition
      return this.deleteItem(supabaseTables.ticketDefinitions, id);
    } catch (error: any) {
      console.error(`Error safely deleting ticket definition with ID ${id}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Get price tiers for a ticket definition
   */
  async getTicketPriceTiers(
    ticketDefinitionId: string
  ): Promise<AdminApiResponse<DbTicketTypePriceTier[]>> {
    try {
      const { data, error } = await this.client
        .from(supabaseTables.ticketTypePriceTiers)
        .select(`
          id,
          ticket_definition_id,
          price_tier_id,
          price,
          start_date,
          end_date,
          is_active,
          price_tiers(name, description)
        `)
        .eq('ticket_definition_id', ticketDefinitionId)
        .order('start_date', { ascending: true });
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error(`Error fetching price tiers for ticket definition ${ticketDefinitionId}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Create a new price tier for a ticket definition
   */
  async createPriceTier(tierData: PriceTierCreateRequest): Promise<AdminApiResponse<DbTicketTypePriceTier>> {
    return this.createItem<DbTicketTypePriceTier>(supabaseTables.ticketTypePriceTiers, tierData);
  }

  /**
   * Update an existing price tier
   */
  async updatePriceTier(
    id: string, 
    tierData: Partial<PriceTierCreateRequest>
  ): Promise<AdminApiResponse<DbTicketTypePriceTier>> {
    return this.updateItem<DbTicketTypePriceTier>(supabaseTables.ticketTypePriceTiers, id, tierData);
  }

  /**
   * Delete a price tier
   */
  async deletePriceTier(id: string): Promise<AdminApiResponse<void>> {
    return this.deleteItem(supabaseTables.ticketTypePriceTiers, id);
  }

  /**
   * Get ticket availability
   */
  async getTicketAvailability(
    eventId: string,
    ticketDefinitionId: string
  ): Promise<AdminApiResponse<{
    available: number;
    reserved: number;
    sold: number;
    isHighDemand: boolean;
  }>> {
    try {
      const { data, error } = await this.client.rpc('get_ticket_availability', {
        p_event_id: eventId,
        p_ticket_definition_id: ticketDefinitionId
      });
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      // Check high demand status
      const { data: highDemandData, error: highDemandError } = await this.client.rpc(
        'is_ticket_high_demand',
        {
          p_event_id: eventId,
          p_ticket_definition_id: ticketDefinitionId,
          p_threshold_percent: 80
        }
      );
      
      if (highDemandError) {
        console.error(`Error checking high demand status:`, highDemandError);
      }
      
      return {
        data: {
          available: data.available || 0,
          reserved: data.reserved || 0,
          sold: data.sold || 0,
          isHighDemand: !!highDemandData
        },
        error: null
      };
    } catch (error: any) {
      console.error(`Error fetching ticket availability:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }
}