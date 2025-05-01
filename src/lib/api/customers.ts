import { supabase } from '../supabase';
import { PostgrestError } from '@supabase/supabase-js';
import { CustomerProfile } from '../../shared/types/customer'; // Assuming this type exists/will be created

/**
 * Fetches the customer profile linked to a specific auth user ID.
 *
 * @param userId - The UUID of the authenticated user (auth.users.id).
 * @returns Promise resolving to the customer profile object or null if not found/error.
 */
export async function getCustomerForUser(userId: string): Promise<CustomerProfile | null> {
  if (!userId) {
    console.error('getCustomerForUser called with no userId.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*') // Select all customer fields
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle as a user might not have a customer record yet

    if (error) {
      // Log PGRST116 (No rows found) differently as it might be expected
      if (error.code === 'PGRST116') {
        console.log(`No customer record found for user ${userId}.`);
      } else {
        console.error(`Error fetching customer for user ${userId}:`, error);
      }
      return null; // Return null on error or not found
    }

    return data as CustomerProfile | null;

  } catch (err) {
    console.error(`Unexpected error fetching customer for user ${userId}:`, err);
    return null;
  }
}

/**
 * Creates a new customer profile record, typically linked to an auth user.
 *
 * @param customerData - Object containing customer details (firstName, lastName, email, phone, address, etc.).
 * @param userId - The UUID of the authenticated user to link the customer record to.
 * @returns Promise resolving to the created customer profile object or null if error.
 */
export async function createCustomer(
  customerData: Partial<CustomerProfile>, 
  userId: string
): Promise<CustomerProfile | null> {
   if (!userId || !customerData || !customerData.email) { // Basic validation
     console.error('Missing required fields for creating customer.');
     return null;
   }
   
   try {
     const { data, error } = await supabase
      .from('customers')
      .insert({
        ...customerData,
        user_id: userId, // Link to the authenticated user
      })
      .select('*')
      .single();
      
    if (error) {
      console.error('Error creating customer:', error);
      return null;
    }
    
    return data as CustomerProfile | null;
    
   } catch (err) {
     console.error('Unexpected error creating customer:', err);
     return null;
   }
}


/**
 * Updates an existing customer profile.
 *
 * @param customerId - The UUID of the customer profile to update.
 * @param customerData - Object containing fields to update.
 * @returns Promise resolving to the updated customer profile object or null if error.
 */
export async function updateCustomer(
  customerId: string, 
  customerData: Partial<CustomerProfile>
): Promise<CustomerProfile | null> {
  if (!customerId || !customerData) {
    console.error('Missing required fields for updating customer.');
    return null;
  }

  try {
    // Ensure user_id and id are not accidentally included in the update payload
    const { id, user_id, created_at, ...updatePayload } = customerData;
    
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...updatePayload,
        updated_at: new Date().toISOString(), // Manually set updated_at
      })
      .eq('id', customerId)
      .select('*')
      .single();

    if (error) {
      console.error(`Error updating customer ${customerId}:`, error);
      return null;
    }

    return data as CustomerProfile | null;

  } catch (err) {
    console.error(`Unexpected error updating customer ${customerId}:`, err);
    return null;
  }
} 