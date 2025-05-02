import { supabase } from '../supabase';
import { Database } from '../../shared/types/supabase';

// Explicitly type based on your Database schema definitions
export type GrandLodgeRow = Database['public']['Tables']['grand_lodges']['Row'];

// Define filter type
interface GrandLodgeFilter {
  searchTerm?: string;
}

/**
 * Fetches grand lodges from the database, optionally filtering by a search term
 * across multiple relevant fields.
 * @param filter Optional filter object containing searchTerm.
 * @returns Promise resolving to array of GrandLodgeRow objects.
 */
export async function getAllGrandLodges(filter?: GrandLodgeFilter): Promise<GrandLodgeRow[]> {
  try {
    let query = supabase
      .from('grand_lodges')
      .select('*');

    // Apply search term filter if provided
    if (filter?.searchTerm && filter.searchTerm.trim()) {
      const searchTerm = filter.searchTerm.trim();
      // Use 'or' condition with 'ilike' for case-insensitive partial matching
      // Search only available columns based on GrandLodgeRow type
      query = query.or(
        `name.ilike.%${searchTerm}%,` +
        `abbreviation.ilike.%${searchTerm}%,` +
        `country.ilike.%${searchTerm}%` // Use country based on type
        // Removed region/region_code as they are not in the inferred type
      );
    }

    // Always order by name
    query = query.order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('[getAllGrandLodges] Error fetching grand lodges:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('[getAllGrandLodges] Unexpected error:', err);
    return [];
  }
} 