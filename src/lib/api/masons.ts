import { supabase } from '../supabase';
import { Database } from '../../shared/types/supabase';
import { MasonData } from '../../shared/types/mason';
import { PostgrestError } from '@supabase/supabase-js';

// Define Supabase-specific types based on generated types
type MasonRow = Database['public']['Tables']['masons']['Row'];
type MasonInsert = Database['public']['Tables']['masons']['Insert'];
type MasonUpdate = Database['public']['Tables']['masons']['Update'];

/**
 * Fetches Mason-specific details linked to a customer ID.
 *
 * @param customerId - The UUID of the customer.
 * @returns Promise resolving to the MasonRow object or null if not found/error.
 */
export async function getMasonByCustomerId(customerId: string): Promise<MasonRow | null> {
  if (!customerId) {
    console.error('getMasonByCustomerId called with no customerId.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('masons')
      .select(`
        *,
        lodges (id, name, number)
      `)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`No mason record found for customer ${customerId}.`);
      } else {
        console.error(`Error fetching mason for customer ${customerId}:`, error);
      }
      return null;
    }

    return data as MasonRow | null; // We might need to adjust the type if join changes structure

  } catch (err) {
    console.error(`Unexpected error fetching mason for customer ${customerId}:`, err);
    return null;
  }
}

/**
 * Creates or updates a Mason record linked to a customer ID.
 *
 * @param customerId - The UUID of the associated customer.
 * @param masonDetails - An object containing the mason fields to create/update.
 * @returns Promise resolving to the created/updated MasonRow object or null if error.
 */
export async function createOrUpdateMason(
  customerId: string,
  masonDetails: Partial<Omit<MasonRow, 'id' | 'created_at' | 'customer_id'>>
): Promise<MasonRow | null> {
  if (!customerId || !masonDetails) {
    console.error('createOrUpdateMason called with missing customerId or details.');
    return null;
  }

  try {
    // Check if a mason record already exists for this customer
    const existingMason = await getMasonByCustomerId(customerId);

    let data: MasonRow | null = null;
    let error: PostgrestError | null = null;

    if (existingMason) {
      // Update existing record
      console.log(`Updating mason record for customer ${customerId}`);
      const { data: updateData, error: updateError } = await supabase
        .from('masons')
        .update(masonDetails as MasonUpdate) // Use MasonUpdate type
        .eq('customer_id', customerId)
        .select('*')
        .single();
      data = updateData;
      error = updateError;
    } else {
      // Create new record
      console.log(`Creating new mason record for customer ${customerId}`);
      const insertPayload: MasonInsert = {
        ...masonDetails,
        customer_id: customerId,
      };
      const { data: insertData, error: insertError } = await supabase
        .from('masons')
        .insert(insertPayload)
        .select('*')
        .single();
      data = insertData;
      error = insertError;
    }

    if (error) {
      console.error('Error saving mason details:', error);
      return null;
    }

    console.log(`Mason details saved successfully for customer ${customerId}:`, data);
    return data;

  } catch (err) {
    console.error(`Unexpected error saving mason details for customer ${customerId}:`, err);
    return null;
  }
} 