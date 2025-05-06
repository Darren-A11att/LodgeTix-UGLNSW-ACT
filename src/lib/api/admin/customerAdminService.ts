import { AdminApiService, AdminApiResponse, QueryParams } from './adminApiService';
import { supabaseTables } from '../../supabase';
import * as SupabaseTypes from '../../../../supabase/supabase.types';

type DbCustomer = SupabaseTypes.Database['public']['Tables']['Customers']['Row'];
type DbRegistration = SupabaseTypes.Database['public']['Tables']['Registrations']['Row'];

export interface CustomerUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface AdminCustomerDetails extends DbCustomer {
  registrations?: DbRegistration[];
  totalSpent?: number;
  registrationCount?: number;
}

/**
 * Admin service for managing customers
 */
export class CustomerAdminService extends AdminApiService {
  constructor() {
    super();
  }

  /**
   * Get all customers with filtering and pagination
   */
  async getCustomers(params: QueryParams = {}): Promise<AdminApiResponse<DbCustomer[]>> {
    return this.getItems<DbCustomer>(supabaseTables.customers, params);
  }

  /**
   * Get a single customer by ID with detailed information
   */
  async getCustomer(id: string): Promise<AdminApiResponse<AdminCustomerDetails>> {
    try {
      // Get the base customer
      const { data: customer, error } = await this.getItemById<DbCustomer>(
        supabaseTables.customers, 
        id
      );
      
      if (error || !customer) {
        return { data: null, error };
      }
      
      // Get registrations for this customer
      const { data: registrations } = await this.client
        .from(supabaseTables.registrations)
        .select('*')
        .eq('customerId', id);
      
      // Calculate total spent
      const totalSpent = registrations?.reduce(
        (sum, reg) => sum + (reg.totalAmountPaid || 0), 
        0
      ) || 0;
      
      // Combine into detailed response
      const customerDetails: AdminCustomerDetails = {
        ...customer,
        registrations: registrations || [],
        totalSpent,
        registrationCount: registrations?.length || 0
      };
      
      return { data: customerDetails, error: null };
    } catch (error: any) {
      console.error(`Error fetching detailed customer with ID ${id}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Update customer information
   */
  async updateCustomer(
    id: string, 
    customerData: CustomerUpdateRequest
  ): Promise<AdminApiResponse<DbCustomer>> {
    return this.updateItem<DbCustomer>(supabaseTables.customers, id, customerData);
  }

  /**
   * Get registrations for a customer
   */
  async getCustomerRegistrations(customerId: string): Promise<AdminApiResponse<DbRegistration[]>> {
    try {
      const { data, error } = await this.client
        .from(supabaseTables.registrations)
        .select('*')
        .eq('customerId', customerId)
        .order('createdAt', { ascending: false });
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error(`Error fetching registrations for customer ${customerId}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Search customers by name or email
   */
  async searchCustomers(query: string): Promise<AdminApiResponse<DbCustomer[]>> {
    try {
      if (!query || query.trim().length < 3) {
        return { data: [], error: null };
      }
      
      const searchTerm = `%${query.trim()}%`;
      
      const { data, error } = await this.client
        .from(supabaseTables.customers)
        .select('*')
        .or(`firstName.ilike.${searchTerm},lastName.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(20);
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error(`Error searching customers with query '${query}':`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(): Promise<AdminApiResponse<{
    totalCustomers: number;
    newCustomersLast30Days: number;
    avgRegistrationsPerCustomer: number;
    avgSpendPerCustomer: number;
  }>> {
    try {
      // Get all customers
      const { data: allCustomers, error: customersError } = await this.client
        .from(supabaseTables.customers)
        .select('*');
      
      if (customersError) {
        return { data: null, error: new Error(customersError.message) };
      }
      
      // Count total customers
      const totalCustomers = allCustomers?.length || 0;
      
      // Count new customers in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const newCustomersLast30Days = allCustomers?.filter(c => 
        c.createdAt && c.createdAt >= thirtyDaysAgo
      ).length || 0;
      
      // Get all registrations
      const { data: registrationData, error: regError } = await this.client
        .from(supabaseTables.registrations)
        .select('customerId, totalAmountPaid');
      
      if (regError) {
        return { data: null, error: new Error(regError.message) };
      }
      
      // Calculate average registrations and spend per customer
      const customerRegistrations: Record<string, { count: number, spent: number }> = {};
      
      registrationData?.forEach(reg => {
        const customerId = reg.customerId;
        if (!customerRegistrations[customerId]) {
          customerRegistrations[customerId] = { count: 0, spent: 0 };
        }
        customerRegistrations[customerId].count++;
        customerRegistrations[customerId].spent += (reg.totalAmountPaid || 0);
      });
      
      const customerCount = Object.keys(customerRegistrations).length || 1; // Avoid division by zero
      const totalRegistrations = Object.values(customerRegistrations).reduce((sum, c) => sum + c.count, 0);
      const totalSpent = Object.values(customerRegistrations).reduce((sum, c) => sum + c.spent, 0);
      
      const avgRegistrationsPerCustomer = totalRegistrations / customerCount;
      const avgSpendPerCustomer = totalSpent / customerCount;
      
      return {
        data: {
          totalCustomers,
          newCustomersLast30Days,
          avgRegistrationsPerCustomer,
          avgSpendPerCustomer
        },
        error: null
      };
    } catch (error: any) {
      console.error('Error fetching customer statistics:', error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }
}