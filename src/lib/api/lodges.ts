import { supabase } from '../supabase';
import { Database } from '../../supabase.types';

// Explicitly type based on your Database schema definitions
export type LodgeRow = Database['public']['Tables']['lodges']['Row'];
export type LodgeInsert = Database['public']['Tables']['lodges']['Insert'];
export type LodgeUpdate = Database['public']['Tables']['lodges']['Update'];

/**
 * Fetches lodges filtered by Grand Lodge ID and optionally a search term.
 * Prioritizes exact number match if searchTerm is purely numeric.
 * @param grandLodgeId The UUID of the Grand Lodge.
 * @param searchTerm Optional string for searching.
 * @returns Promise resolving to array of LodgeRow objects.
 */
export async function getLodgesByGrandLodgeId(
  grandLodgeId: string,
  searchTerm?: string
): Promise<LodgeRow[]> {
  if (!grandLodgeId) {
    console.warn('getLodgesByGrandLodgeId called with no grandLodgeId.');
    return [];
  }

  try {
    let query;
    let performTextSearch = true; // Flag to control fallback

    // 1. Check for purely numeric search term for exact number match
    if (searchTerm && searchTerm.trim().match(/^\d+$/)) {
      const searchNumber = searchTerm.trim();
      query = supabase
        .from('lodges')
        .select('*')
        .eq('grand_lodge_id', grandLodgeId)
        .eq('number', searchNumber);
        
      const { data: numberMatchData, error: numberMatchError } = await query;

      if (numberMatchError) {
        console.error('[getLodgesByGrandLodgeId] Error during exact number match:', numberMatchError);
      } else if (numberMatchData && numberMatchData.length > 0) {
        performTextSearch = false;
        const orderedData = numberMatchData.sort((a, b) => 
            (a.display_name || a.name).localeCompare(b.display_name || b.name)
        );
        return orderedData as LodgeRow[];
      } else {
      }
    }

    // 2. Perform text search if applicable (not numeric, or numeric yielded no results)
    if (performTextSearch) {
        try {
            query = supabase
              .from('lodges')
              .select('*')
              .eq('grand_lodge_id', grandLodgeId);

            if (searchTerm && searchTerm.trim()) {
                const term = `%${searchTerm.trim()}%`;
                query = query.or(
                  `name.ilike.${term},display_name.ilike.${term},district.ilike.${term},meeting_place.ilike.${term}`
                );
                
                if (searchTerm.trim().match(/^\d+/)) {
                  query = query.or(`number::text.ilike.${term}`);
                }
            }
            
            query = query
              .order('display_name', { ascending: true, nullsFirst: false })
              .order('name', { ascending: true });

            const { data, error } = await query;

            if (error) {
              console.error('[getLodgesByGrandLodgeId] Error during text search:', error);
              return [];
            }
            
            const safeData = data?.map(lodge => ({
              ...lodge,
              name: lodge.name || '',
              number: lodge.number || null,
              display_name: lodge.display_name || '',
              district: lodge.district || '',
              meeting_place: lodge.meeting_place || ''
            })) || [];
            
            return safeData as LodgeRow[];
        } catch (err) {
            console.error('[getLodgesByGrandLodgeId] Unexpected error in text search:', err);
            return [];
        }
    }
    
    return [];

  } catch (err) {
    console.error('Unexpected error fetching lodges:', err);
    return [];
  }
}

/**
 * Creates a new lodge in the database.
 * @param lodgeData The data for the new lodge.
 * @returns Promise resolving to the created LodgeRow object or null.
 */
export async function createLodge(lodgeData: LodgeInsert): Promise<LodgeRow | null> {
  if (!lodgeData.grand_lodge_id) {
    console.error('createLodge called without a grand_lodge_id.');
    return null;
  }

  const displayName = lodgeData.name + (lodgeData.number ? ` No. ${lodgeData.number}` : '');
  const insertData = { ...lodgeData, display_name: displayName }; 

  try {
    const { data, error } = await supabase
      .from('lodges')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating lodge:', error);
      return null;
    }
    return data as LodgeRow;
  } catch (err) {
    console.error('Unexpected error creating lodge:', err);
    return null;
  }
}

/**
 * Searches all lodges based on a search term across name, number, display name, and meeting place.
 * @param searchTerm The string to search for.
 * @param limit Optional limit for the number of results. Default 10.
 * @returns Promise resolving to array of LodgeRow objects.
 */
export async function searchAllLodges(searchTerm: string, limit: number = 10): Promise<LodgeRow[]> {
  if (!searchTerm || !searchTerm.trim()) {
    return [];
  }

  try {
    // Switch back to named arguments, ensuring keys match the function definition
    const { data, error } = await supabase.rpc('search_all_lodges', { 
      search_term: searchTerm.trim(), 
      result_limit: limit 
    });

    if (error) {
      console.error('[searchAllLodges] Error calling RPC function:', error);
      return [];
    }

    return (data || []) as LodgeRow[];

  } catch (err) {
    console.error('Unexpected error during global lodge search:', err);
    return [];
  }
}

/**
 * Fetches lodges filtered by state/region code.
 * @param regionCode The state/region code (e.g., 'NSW').
 * @returns Promise resolving to array of LodgeRow objects.
 */
export async function getLodgesByStateRegionCode(regionCode: string): Promise<LodgeRow[]> {
  if (!regionCode) return [];
  console.log(`[API] Fetching lodges for region code: ${regionCode}`); // DEBUG
  try {
    const { data, error } = await supabase
      .from('lodges')
      .select('*')
      .eq('state_region', regionCode); // Ensure querying state_region column

    if (error) {
      console.error(`[getLodgesByStateRegionCode] Error fetching lodges for region code ${regionCode}:`, error);
      return [];
    }
    console.log(`[API] Found ${data?.length ?? 0} lodges for region code ${regionCode}`); // DEBUG
    return data || [];
  } catch (err) {
    console.error(`[getLodgesByStateRegionCode] Unexpected error for region code ${regionCode}:`, err);
    return [];
  }
} 