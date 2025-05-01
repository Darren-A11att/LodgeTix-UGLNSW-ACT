import { supabase } from '../supabase';
import { Database } from '../../shared/types/supabase';
import { Guest, LadyPartnerData, GuestData } from '../../shared/types/guest';
import { PostgrestError } from '@supabase/supabase-js';

// Define Supabase-specific types based on generated types
type GuestRow = Database['public']['Tables']['guests']['Row'];
type GuestInsert = Database['public']['Tables']['guests']['Insert'];
type GuestUpdate = Database['public']['Tables']['guests']['Update'];

/**
 * Maps LadyPartnerData (from form state) to GuestInsert/GuestUpdate (for DB).
 */
function mapPartnerDataToGuestPayload(
    partnerData: LadyPartnerData,
    masonId: string,
    // registrationId?: string | null // Removed: Not a direct column on guests
): Omit<GuestInsert, 'id' | 'created_at'> { 
    return {
        related_mason_id: masonId,
        guest_type: 'partner', 
        title: partnerData.title || null,
        first_name: partnerData.firstName || null,
        last_name: partnerData.lastName || null,
        email: partnerData.email || null,
        phone: partnerData.phone || null,
        dietary_requirements: partnerData.dietary || null,
        special_needs: partnerData.specialNeeds || null,
        partner_relationship: partnerData.relationship || null, 
        contact_preference: partnerData.contactPreference === 'Please Select' ? null : partnerData.contactPreference.toLowerCase(), 
        contact_confirmed: partnerData.contactConfirmed,
        customer_id: null, 
        related_guest_id: null,
        // registration_id: registrationId || null, // Removed
    };
}

/**
 * Maps GuestData (from form state) to GuestInsert/GuestUpdate (for DB).
 */
function mapGuestDataToGuestPayload(
    guestData: GuestData,
    customerId: string | null 
): Omit<GuestInsert, 'id' | 'created_at'> { 
    return {
        related_mason_id: null, 
        related_guest_id: null, 
        guest_type: 'guest', 
        title: guestData.title || null,
        first_name: guestData.firstName || null,
        last_name: guestData.lastName || null,
        email: guestData.email || null,
        phone: guestData.phone || null,
        dietary_requirements: guestData.dietary || null,
        special_needs: guestData.specialNeeds || null,
        partner_relationship: null, 
        contact_preference: guestData.contactPreference === 'Please Select' ? null : guestData.contactPreference.toLowerCase(), 
        contact_confirmed: guestData.contactConfirmed,
        customer_id: customerId, 
    };
}

/**
 * Fetches the partner guest record associated with a specific Mason ID.
 *
 * @param masonId - The UUID of the Mason.
 * @returns Promise resolving to the Guest object (aligned with DB row) or null.
 */
export async function getPartnerForMason(masonId: string): Promise<GuestRow | null> {
    if (!masonId) {
        console.error('getPartnerForMason called with no masonId.');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('guests')
            .select('*')
            .eq('related_mason_id', masonId)
            .eq('guest_type', 'partner')
            .maybeSingle(); // Expect 0 or 1 partner per mason

        if (error) {
            // Don't throw PGRST116 (No rows found)
            if (error.code !== 'PGRST116') {
                console.error(`Error fetching partner for mason ${masonId}:`, error);
                throw error;
            }
            return null; // No partner found
        }
        return data;

    } catch (err) {
        console.error(`Unexpected error fetching partner for mason ${masonId}:`, err);
        return null;
    }
}

/**
 * Fetches all standard guest records associated with a specific Registration ID.
 *
 * @param registrationId - The UUID of the Registration.
 * @returns Promise resolving to an array of GuestRow objects.
 */
export async function getGuestsForRegistration(registrationId: string): Promise<GuestRow[]> {
    if (!registrationId) {
        console.error('getGuestsForRegistration called with no registrationId.');
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('guests')
            .select('*')
            .eq('registration_id', registrationId)
            .eq('guest_type', 'guest'); // Only fetch standard guests

        if (error) {
            console.error(`Error fetching guests for registration ${registrationId}:`, error);
            throw error;
        }
        return data || [];

    } catch (err) {
        console.error(`Unexpected error fetching guests for registration ${registrationId}:`, err);
        throw err; // Re-throw
    }
}

/**
 * Creates or updates a Partner (Guest record) linked to a Mason ID.
 *
 * @param masonId - The UUID of the associated Mason.
 * @param partnerData - The LadyPartnerData object from the form state.
 * @returns Promise resolving to the created/updated GuestRow object or null if error.
 */
export async function createOrUpdatePartner(
    masonId: string,
    partnerData: LadyPartnerData,
    // Pass optional registrationId
): Promise<GuestRow | null> { // Return GuestRow
    if (!masonId || !partnerData) {
        console.error('createOrUpdatePartner called with missing masonId or partnerData.');
        return null;
    }

    try {
        // Use partnerData.dbGuestId if available to check existence, otherwise use masonId
        const existingPartnerId = partnerData.dbGuestId;
        const payload = mapPartnerDataToGuestPayload(partnerData, masonId);

        let data: GuestRow | null = null;
        let error: PostgrestError | null = null;

        if (existingPartnerId) {
            // Update existing partner record using its direct ID
            console.log(`Updating partner guest record ${existingPartnerId}`);
            const { data: updateData, error: updateError } = await supabase
                .from('guests')
                .update(payload as GuestUpdate)
                .eq('id', existingPartnerId)
                .select('*')
                .single();
            data = updateData;
            error = updateError;
        } else {
            // Check if partner exists by masonId just in case dbGuestId wasn't populated
            const checkExisting = await getPartnerForMason(masonId);
            if (checkExisting) {
                 console.log(`Updating partner guest record ${checkExisting.id} for mason ${masonId} (found via masonId)`);
                 const { data: updateData, error: updateError } = await supabase
                     .from('guests')
                     .update(payload as GuestUpdate)
                     .eq('id', checkExisting.id)
                     .select('*')
                     .single();
                 data = updateData;
                 error = updateError;
            } else {
                // Create new partner record
                console.log(`Creating new partner guest record for mason ${masonId}`);
                const { data: insertData, error: insertError } = await supabase
                    .from('guests')
                    .insert(payload as GuestInsert)
                    .select('*')
                    .single();
                data = insertData;
                error = insertError;
            }
        }

        if (error) {
            console.error('Error saving partner guest details:', error);
            throw error;
        }

        console.log(`Partner guest details saved successfully for mason ${masonId}:`, data);
        return data;

    } catch (err) {
        console.error(`Unexpected error saving partner guest details for mason ${masonId}:`, err);
        throw err; 
    }
}

/**
 * Creates or updates a standard Guest record linked to a Registration ID.
 *
 * @param registrationId - The UUID of the associated Registration.
 * @param guestData - The GuestData object from the form state.
 * @param customerId - The UUID of the primary customer for the registration.
 * @returns Promise resolving to the created/updated GuestRow object or null if error.
 */
export async function createOrUpdateGuest(
    guestData: GuestData,
    customerId: string | null 
): Promise<GuestRow | null> { 
    if (!guestData) {
        console.error('createOrUpdateGuest called with missing guestData.');
        return null;
    }

    try {
        // Use guestData.dbGuestId if available for update, otherwise it's an insert
        const existingGuestId = guestData.dbGuestId;
        const payload = mapGuestDataToGuestPayload(guestData, customerId);

        let data: GuestRow | null = null;
        let error: PostgrestError | null = null;

        if (existingGuestId) {
            // Update existing guest record
            console.log(`Updating guest record ${existingGuestId}`);
            const { data: updateData, error: updateError } = await supabase
                .from('guests')
                .update(payload as GuestUpdate)
                .eq('id', existingGuestId)
                .select('*')
                .single();
            data = updateData;
            error = updateError;
        } else {
            // Create new guest record (no registrationId needed here)
            console.log(`Creating new guest record...`);
            const { data: insertData, error: insertError } = await supabase
                .from('guests')
                .insert(payload as GuestInsert)
                .select('*')
                .single();
            data = insertData;
            error = insertError;
        }

        if (error) {
            console.error('Error saving guest details:', error);
            throw error;
        }

        console.log(`Guest details saved successfully:`, data);
        return data;

    } catch (err) {
        console.error(`Unexpected error saving guest details:`, err);
        throw err; 
    }
}

/**
 * Deletes a specific Guest record by its ID.
 *
 * @param guestId - The UUID of the guest record to delete.
 * @returns Promise resolving to true if deletion was successful, false otherwise.
 */
export async function deleteGuest(guestId: string): Promise<boolean> {
    if (!guestId) {
        console.error('deleteGuest called with no guestId.');
        // Indicate failure, maybe throw specific error?
        // For now, return false as per original, but consider throwing
        // throw new Error('Guest ID is required for deletion.');
        return false; 
    }

    try {
        console.log(`Attempting to delete guest record ${guestId}`);
        const { error } = await supabase
            .from('guests')
            .delete()
            .eq('id', guestId);

        if (error) {
            console.error(`Error deleting guest ${guestId}:`, error);
            // Re-throw the error instead of returning false
            throw error; 
        }

        console.log(`Guest ${guestId} deleted successfully.`);
        return true;

    } catch (err) {
        console.error(`Unexpected error deleting guest ${guestId}:`, err);
        // Re-throw the error so the caller knows it failed
        throw err; 
    }
} 