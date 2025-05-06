import { supabase, table, supabaseTables } from '../../supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface SortParams {
  column: string;
  ascending?: boolean;
}

interface FilterParams {
  [key: string]: any;
}

export interface QueryParams {
  pagination?: PaginationParams;
  sort?: SortParams;
  filters?: FilterParams;
  search?: {
    columns: string[];
    query: string;
  }
}

export interface AdminApiResponse<T> {
  data: T | null;
  error: Error | null;
  count?: number;
}

/**
 * Base admin service for CRUD operations
 */
export class AdminApiService {
  protected client: SupabaseClient;
  
  constructor() {
    this.client = supabase;
  }

  /**
   * Get items from a table with pagination, sorting and filtering
   */
  protected async getItems<T>(
    tableName: string, 
    params: QueryParams = {}
  ): Promise<AdminApiResponse<T[]>> {
    try {
      // Normalize the table name using the table helper
      const normalizedTableName = tableName;
      
      // Start building the query
      let query = table(normalizedTableName).select('*', { count: 'exact' });
      
      // Apply filters
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              // Handle array values as IN operator
              query = query.in(key, value);
            } else if (typeof value === 'object') {
              // Handle range filters
              if (value.gt !== undefined) query = query.gt(key, value.gt);
              if (value.gte !== undefined) query = query.gte(key, value.gte);
              if (value.lt !== undefined) query = query.lt(key, value.lt);
              if (value.lte !== undefined) query = query.lte(key, value.lte);
              if (value.eq !== undefined) query = query.eq(key, value.eq);
              if (value.neq !== undefined) query = query.neq(key, value.neq);
              if (value.in !== undefined) query = query.in(key, value.in);
              if (value.is !== undefined) query = query.is(key, value.is);
            } else {
              // Simple equality
              query = query.eq(key, value);
            }
          }
        });
      }
      
      // Apply search across multiple columns
      if (params.search && params.search.query && params.search.columns.length > 0) {
        const searchQuery = params.search.query.trim();
        if (searchQuery) {
          // Apply OR conditions for each column
          // Note: This is a simplified implementation that uses ILIKE for each column
          // For more complex search, consider using full-text search if available
          params.search.columns.forEach((column, index) => {
            const searchValue = `%${searchQuery}%`;
            if (index === 0) {
              query = query.ilike(column, searchValue);
            } else {
              query = query.or(`${column}.ilike.${searchValue}`);
            }
          });
        }
      }
      
      // Apply sorting
      if (params.sort) {
        query = query.order(params.sort.column, { ascending: params.sort.ascending ?? true });
      }
      
      // Apply pagination
      if (params.pagination) {
        const { page = 1, limit = 10 } = params.pagination;
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
      }
      
      // Execute the query
      const { data, error, count } = await query;
      
      if (error) {
        console.error(`Error fetching items from ${tableName}:`, error);
        return { data: null, error: new Error(error.message), count: 0 };
      }
      
      return { 
        data: data as unknown as T[], 
        error: null,
        count: count ?? data.length
      };
    } catch (error: any) {
      console.error(`Unexpected error fetching items from ${tableName}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Get a single item by ID
   */
  protected async getItemById<T>(
    tableName: string, 
    id: string,
    columns: string = '*'
  ): Promise<AdminApiResponse<T>> {
    try {
      const { data, error } = await table(tableName)
        .select(columns)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Error fetching item from ${tableName} with ID ${id}:`, error);
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: data as unknown as T, error: null };
    } catch (error: any) {
      console.error(`Unexpected error fetching item from ${tableName} with ID ${id}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Create a new item
   */
  protected async createItem<T>(
    tableName: string, 
    item: Partial<T>
  ): Promise<AdminApiResponse<T>> {
    try {
      const { data, error } = await table(tableName)
        .insert(item)
        .select()
        .single();
      
      if (error) {
        console.error(`Error creating item in ${tableName}:`, error);
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: data as unknown as T, error: null };
    } catch (error: any) {
      console.error(`Unexpected error creating item in ${tableName}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Update an existing item
   */
  protected async updateItem<T>(
    tableName: string, 
    id: string, 
    updates: Partial<T>
  ): Promise<AdminApiResponse<T>> {
    try {
      const { data, error } = await table(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating item in ${tableName} with ID ${id}:`, error);
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: data as unknown as T, error: null };
    } catch (error: any) {
      console.error(`Unexpected error updating item in ${tableName} with ID ${id}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Delete an item
   */
  protected async deleteItem(
    tableName: string, 
    id: string
  ): Promise<AdminApiResponse<void>> {
    try {
      const { error } = await table(tableName)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Error deleting item from ${tableName} with ID ${id}:`, error);
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: null, error: null };
    } catch (error: any) {
      console.error(`Unexpected error deleting item from ${tableName} with ID ${id}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Execute a custom RPC function
   */
  protected async executeRPC<T>(
    functionName: string,
    params: Record<string, any> = {}
  ): Promise<AdminApiResponse<T>> {
    try {
      const { data, error } = await this.client.rpc(functionName, params);
      
      if (error) {
        console.error(`Error executing RPC function ${functionName}:`, error);
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: data as T, error: null };
    } catch (error: any) {
      console.error(`Unexpected error executing RPC function ${functionName}:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Execute a raw SQL query
   * NOTE: Use with caution, as this bypasses Supabase's security policies
   */
  protected async executeSQL<T>(
    query: string,
    params: any[] = []
  ): Promise<AdminApiResponse<T[]>> {
    try {
      // This is a simplified implementation; in practice you'd want to use
      // Supabase's query builder or RPC functions where possible
      const { data, error } = await this.client.rpc('execute_sql', {
        query_text: query,
        query_params: params
      });
      
      if (error) {
        console.error(`Error executing SQL query:`, error);
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: data as T[], error: null };
    } catch (error: any) {
      console.error(`Unexpected error executing SQL query:`, error);
      return { data: null, error: new Error(error.message || 'Unknown error') };
    }
  }

  /**
   * Check if the current user has admin permissions
   */
  async hasAdminPermission(): Promise<boolean> {
    try {
      const { data: user } = await this.client.auth.getUser();
      
      if (!user) {
        return false;
      }
      
      // Get the user's roles from the user_roles table
      const { data: roles, error } = await this.client
        .from(supabaseTables.userRoles)
        .select('role')
        .eq('user_id', user.user.id);
      
      if (error || !roles) {
        console.error('Error fetching user roles:', error);
        return false;
      }
      
      // Check if the user has an admin role
      return roles.some(r => r.role === 'admin' || r.role === 'system-admin');
    } catch (error) {
      console.error('Error checking admin permission:', error);
      return false;
    }
  }
}