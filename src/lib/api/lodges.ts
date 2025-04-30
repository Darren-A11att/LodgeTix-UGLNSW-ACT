import { supabase } from '../supabase';
import { Database } from '../../shared/types/supabase';
import { LodgeType } from '../../shared/data/lodges';

// Explicitly type based on your Database schema definitions
export type LodgeRow = Database['public']['Tables']['lodges']['Row'];
export type LodgeInsert = Database['public']['Tables']['lodges']['Insert'];
export type LodgeUpdate = Database['public']['Tables']['lodges']['Update'];

/**
 * Fetches lodges filtered by a specific Grand Lodge ID.
 * @param grandLodgeId The UUID of the Grand Lodge to filter by.
 * @returns Promise resolving to array of LodgeRow objects.
 */
export async function getLodgesByGrandLodgeId(grandLodgeId: string): Promise<LodgeType[]> {
  if (!grandLodgeId) {
    console.warn('getLodgesByGrandLodgeId called with no grandLodgeId.');
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('lodges')
      .select('*')
      .eq('grand_lodge_id', grandLodgeId)
      .order('display_name', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching lodges:', error);
      return [];
    }
    // Cast the data to LodgeType[] to align with the shared type
    return (data || []) as LodgeType[]; 
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