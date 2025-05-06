import { AdminApiService, AdminApiResponse, QueryParams } from './adminApiService';
import { supabaseTables } from '../../supabase';
import * as SupabaseTypes from '../../../../supabase/supabase.types';

type DbRegistration = SupabaseTypes.Database['public']['Tables']['Registrations']['Row'];
type DbAttendee = SupabaseTypes.Database['public']['Tables']['Attendees']['Row'];
type DbTicket = SupabaseTypes.Database['public']['Tables']['Tickets']['Row'];

export interface RegistrationStatusUpdateRequest {
  status: string;
  paymentStatus?: string;
}

export interface AdminRegistrationDetails extends DbRegistration {
  customer?: any;
  attendees?: DbAttendee[];
  tickets?: DbTicket[];
  paymentRecords?: any[];
}

/**
 * Admin service for managing registrations
 */
export class RegistrationAdminService extends AdminApiService {
  constructor() {
    super();
  }

  /**
   * Get all registrations with filtering and pagination
   */
  async getRegistrations(params: QueryParams = {}): Promise<AdminApiResponse<DbRegistration[]>> {
    return this.getItems<DbRegistration>(supabaseTables.registrations, params);
  }

  /**
   * Get a single registration by ID with detailed information
   */
  async getRegistration(id: string): Promise<AdminApiResponse<AdminRegistrationDetails>> {
    try {
      // Get the base registration
      const { data: registration, error } = await this.getItemById<DbRegistration>(
        supabaseTables.registrations, 
        id
      );
      
      if (error || !registration) {
        return { data: null, error };
      }
      
      // Get the customer details
      const { data: customer } = await this.client
        .from(supabaseTables.customers)
        .select('*')
        .eq('id', registration.customerId)
        .maybeSingle();
      
      // Get attendees for this registration
      const { data: attendees } = await this.client
        .from(supabaseTables.attendees)
        .select(`
          *,
          people(*),
          MasonicProfiles(*)
        `)
        .eq('registrationId', id);
      
      // Get tickets for this registration
      const { data: tickets } = await this.client
        .from(supabaseTables.tickets)
        .select(`
          *,
          ticket_definitions(*)
        `)
        .eq('registrationId', id);
      
      // Get payment records (from Stripe schema)
      const { data: paymentRecords } = await this.client
        .from('stripe.payment_records')
        .select('*')
        .eq('registration_id', id);
      
      // Combine into detailed response
      const registrationDetails: AdminRegistrationDetails = {
        ...registration,
        customer: customer || undefined,
        attendees: attendees || [],
        tickets: tickets || [],
        paymentRecords: paymentRecords || []
      };
      
      return { data: registrationDetails, error: null };
    } catch (error: any) {
      console.error(`Error fetching detailed registration with ID ${id}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Update registration status
   */
  async updateRegistrationStatus(
    id: string, 
    statusData: RegistrationStatusUpdateRequest
  ): Promise<AdminApiResponse<DbRegistration>> {
    return this.updateItem<DbRegistration>(supabaseTables.registrations, id, statusData);
  }

  /**
   * Get attendees for a registration
   */
  async getRegistrationAttendees(registrationId: string): Promise<AdminApiResponse<DbAttendee[]>> {
    try {
      const { data, error } = await this.client
        .from(supabaseTables.attendees)
        .select(`
          *,
          people(*),
          MasonicProfiles(*)
        `)
        .eq('registrationId', registrationId);
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error(`Error fetching attendees for registration ${registrationId}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Get tickets for a registration
   */
  async getRegistrationTickets(registrationId: string): Promise<AdminApiResponse<DbTicket[]>> {
    try {
      const { data, error } = await this.client
        .from(supabaseTables.tickets)
        .select(`
          *,
          ticket_definitions(*)
        `)
        .eq('registrationId', registrationId);
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error(`Error fetching tickets for registration ${registrationId}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Get payment records for a registration
   */
  async getRegistrationPayments(registrationId: string): Promise<AdminApiResponse<any[]>> {
    try {
      const { data, error } = await this.client
        .from('stripe.payment_records')
        .select('*')
        .eq('registration_id', registrationId);
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error(`Error fetching payment records for registration ${registrationId}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Cancel a registration
   */
  async cancelRegistration(id: string, reason: string): Promise<AdminApiResponse<DbRegistration>> {
    try {
      // Update registration status
      const { data, error } = await this.client
        .from(supabaseTables.registrations)
        .update({
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      // Release reserved tickets
      try {
        await this.client.rpc('release_registration_tickets', { p_registration_id: id });
      } catch (releaseError) {
        console.error('Error releasing tickets for cancelled registration:', releaseError);
        // Continue with the cancellation even if ticket release fails
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error(`Error cancelling registration ${id}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Get registration statistics
   */
  async getRegistrationStats(): Promise<AdminApiResponse<{
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    totalRevenue: number;
  }>> {
    try {
      // Get all registrations from the last 90 days and count them manually
      // This avoids using the group function which isn't available in all Supabase versions
      const { data: registrations, error: registrationsError } = await this.client
        .from(supabaseTables.registrations)
        .select('*')
        .gt('createdAt', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // Last 90 days
      
      if (registrationsError) {
        return { data: null, error: new Error(registrationsError.message) };
      }
      
      // Count registrations by status
      let completed = 0;
      let pending = 0;
      let cancelled = 0;
      let totalRevenue = 0;
      
      if (registrations) {
        for (const reg of registrations) {
          // Count by status
          if (reg.status === 'completed') completed++;
          else if (reg.status === 'pending') pending++;
          else if (reg.status === 'cancelled') cancelled++;
          
          // Add up revenue for completed registrations
          if (reg.paymentStatus === 'completed' && reg.totalAmountPaid) {
            totalRevenue += reg.totalAmountPaid;
          }
        }
      }
      
      const total = completed + pending + cancelled;
      
      return {
        data: {
          total,
          completed,
          pending,
          cancelled,
          totalRevenue
        },
        error: null
      };
    } catch (error: any) {
      console.error('Error fetching registration statistics:', error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }
}