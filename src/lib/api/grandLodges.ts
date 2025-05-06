import { supabase } from '../supabase';
import { Database } from '../../../supabase/supabase.types';

// Explicitly type based on your Database schema definitions
export type GrandLodgeRow = Database['public']['Tables']['grand_lodges']['Row'];

// Define filter type
interface GrandLodgeFilter {
  searchTerm?: string;
  countryName?: string; // Add specific country filter
}

/**
 * Fetches grand lodges from the database, optionally filtering by country
 * or a general search term across multiple relevant fields.
 * @param filter Optional filter object containing searchTerm or countryName.
 * @returns Promise resolving to array of GrandLodgeRow objects.
 */
export async function getAllGrandLodges(filter?: GrandLodgeFilter): Promise<GrandLodgeRow[]> {
  try {
    let query = supabase
      .from('grand_lodges')
      .select('*');

    // Apply specific country filter if provided
    if (filter?.countryName && filter.countryName.trim()) {
      console.log(`[getAllGrandLodges] Filtering by country: ${filter.countryName}`); // DEBUG
      query = query.eq('country', filter.countryName.trim());
    } 
    // Apply general search term filter if provided (and country filter wasn't)
    else if (filter?.searchTerm && filter.searchTerm.trim()) {
      const searchTerm = filter.searchTerm.trim();
      console.log(`[getAllGrandLodges] Filtering by searchTerm: ${searchTerm}`); // DEBUG
      query = query.or(
        `name.ilike.%${searchTerm}%,` +
        `abbreviation.ilike.%${searchTerm}%,` +
        `country.ilike.%${searchTerm}%` 
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