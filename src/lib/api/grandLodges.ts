import { supabase } from '../supabase';
import { Database } from '../../shared/types/supabase';

// Explicitly type based on your Database schema definitions
export type GrandLodgeRow = Database['public']['Tables']['grand_lodges']['Row'];

// Define filter type
interface GrandLodgeFilter {
  countryCode?: string;
}

/**
 * Fetches grand lodges from the database, optionally filtering by country.
 * @param filter Optional filter object (e.g., { countryCode: 'AU' }).
 * @returns Promise resolving to array of GrandLodgeRow objects.
 */
export async function getAllGrandLodges(filter?: GrandLodgeFilter): Promise<GrandLodgeRow[]> {
  try {
    let query = supabase
      .from('grand_lodges')
      .select('*');

    // Apply country filter if provided
    if (filter?.countryCode) {
      query = query.eq('country_code_iso3', filter.countryCode);
    }

    // Always order by name
    query = query.order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching grand lodges:', error);
      return [];
    }
    // console.log(`Fetched ${data?.length || 0} grand lodges`);
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching grand lodges:', err);
    return [];
  }
} 