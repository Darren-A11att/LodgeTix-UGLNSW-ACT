import { supabase } from '../supabase';
import { Database } from '../../shared/types/supabase';
import { LodgeType } from '../../shared/data/lodges';

// Explicitly type based on your Database schema definitions
export type LodgeRow = Database['public']['Tables']['lodges']['Row'];
export type LodgeInsert = Database['public']['Tables']['lodges']['Insert'];
export type LodgeUpdate = Database['public']['Tables']['lodges']['Update'];

/**
 * Fetches lodges filtered by Grand Lodge ID and optionally a search term.
 * Prioritizes exact number match if searchTerm is purely numeric.
 * @param grandLodgeId The UUID of the Grand Lodge.
 * @param searchTerm Optional string for searching.
 * @returns Promise resolving to array of LodgeType objects.
 */
export async function getLodgesByGrandLodgeId(
  grandLodgeId: string,
  searchTerm?: string
): Promise<LodgeType[]> {
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
        return orderedData as LodgeType[]; 
      } else {
      }
    }

    // 2. Perform text search if applicable (not numeric, or numeric yielded no results)
    if (performTextSearch) {
        query = supabase
          .from('lodges')
          .select('*')
          .eq('grand_lodge_id', grandLodgeId);

        if (searchTerm && searchTerm.trim()) {
            const term = `%${searchTerm.trim()}%`;
            query = query.or(
              `name.ilike.${term},` +
              `display_name.ilike.${term},` +
              `district.ilike.${term},` +
              `meeting_place.ilike.${term}`
            );
        } else {
        }
        
        // Apply ordering
        query = query
          .order('display_name', { ascending: true, nullsFirst: false })
          .order('name', { ascending: true });

        const { data, error } = await query;

        if (error) {
          console.error('[getLodgesByGrandLodgeId] Error during text search:', error);
          return [];
        }
        return (data || []) as LodgeType[]; 
    }
    
    // Should not be reached if logic is correct, but return empty array as fallback
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
export async function createLodge(lodgeData: LodgeInsert): Promise<LodgeType | null> {
  if (!lodgeData.grand_lodge_id) {
    console.error('createLodge called without a grand_lodge_id.');
    return null;
  }

  // Generate display_name if not provided
  const displayName = lodgeData.name + (lodgeData.number ? ` No. ${lodgeData.number}` : '');
  const insertData = { ...lodgeData, display_name: displayName }; 

  try {
    const { data, error } = await supabase
      .from('lodges')
      .insert(insertData)
      .select()
      .single(); // Expecting a single row back

    if (error) {
      console.error('Error creating lodge:', error);
      // Check for specific errors like unique constraint violation if needed
      return null;
    }
    // Cast the returned data to LodgeType
    return data as LodgeType;
  } catch (err) {
    console.error('Unexpected error creating lodge:', err);
    return null;
  }
} 