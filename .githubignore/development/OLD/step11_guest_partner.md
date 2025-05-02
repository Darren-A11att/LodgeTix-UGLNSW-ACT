# Step 11: Guest Partner Implementation

## Context
After implementing the regular Guest attendee type, we now need to implement the Guest's Partner attendee type. Similar to Mason's Partners, a regular Guest may also have a partner who attends events with them.

## Objective
Implement the Guest's Partner attendee type, including the API functions to create, retrieve, update, and delete partner records, and the user interface components to manage partner information.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated (Step 2)
- Authentication is implemented (Step 6)
- Customer profile is implemented (Step 7)
- Regular Guest implementation is complete (Step 10)
- Understanding of the guests table structure in the database

## Analysis Steps

1. Review the guests table structure that we've been working with:
   ```typescript
   // The guests table should have columns including:
   // - id
   // - guest_type (we'll use 'guest_partner' for guest partners)
   // - title
   // - first_name
   // - last_name
   // - phone
   // - email
   // - dietary_requirements
   // - special_needs
   // - related_mason_id (null for guest partners)
   // - related_guest_id (the ID of the regular guest they're partnered with)
   // - customer_id
   // - created_at
   // - updated_at
   ```

2. Understand how guest partners are associated with regular guests:
   ```typescript
   // Check relationship between guests and their partners
   async function analyzeGuestPartnerRelationship() {
     try {
       // Get sample data to understand the relationship
       const { data, error } = await supabase
         .from('guests')
         .select('*, related_guest:related_guest_id(*)')
         .eq('guest_type', 'guest_partner')
         .limit(5);
       
       if (error) {
         console.error('Error fetching guest partner data:', error);
         return;
       }
       
       console.log('Guest partner sample data:', data);
     } catch (err) {
       console.error('Error analyzing relationships:', err);
     }
   }
   
   analyzeGuestPartnerRelationship();
   ```

## Implementation Steps

1. Update the Guest API functions to handle partners:
   ```typescript
   // Update src/lib/api/guests.ts to add partner-related functions
   
   /**
    * Fetches a guest's partner by guest ID
    * @param guestId The guest ID to look up partners for
    * @returns Promise resolving to partner data or null if not found
    */
   export async function getPartnerByGuestId(guestId: string): Promise<Guest | null> {
     try {
       const { data, error } = await supabase
         .from('guests')
         .select('*')
         .eq('related_guest_id', guestId)
         .eq('guest_type', 'guest_partner')
         .maybeSingle();
       
       if (error) {
         console.error('Error fetching guest partner:', error);
         return null;
       }
       
       return data;
     } catch (err) {
       console.error('Unexpected error fetching guest partner:', err);
       return null;
     }
   }
   
   /**
    * Creates a new partner profile linked to a guest
    * @param guestId The guest ID to link to
    * @param customerId The customer ID that owns the guest
    * @param partnerData The partner data to save
    * @returns Promise resolving to the created partner or null on error
    */
   export async function createGuestPartner(
     guestId: string,
     customerId: string,
     partnerData: GuestFormData
   ): Promise<Guest | null> {
     try {
       // Check if partner already exists for this guest
       const { data: existingPartner } = await supabase
         .from('guests')
         .select('id')
         .eq('related_guest_id', guestId)
         .eq('guest_type', 'guest_partner')
         .maybeSingle();
       
       if (existingPartner) {
         console.warn('Partner already exists for this guest');
         return updateGuest(existingPartner.id, partnerData);
       }
       
       // Create new partner
       const { data, error } = await supabase
         .from('guests')
         .insert({
           customer_id: customerId,
           related_guest_id: guestId,
           guest_type: 'guest_partner',
           ...partnerData
         })
         .select()
         .single();
       
       if (error) {
         console.error('Error creating guest partner:', error);
         return null;
       }
       
       return data;
     } catch (err) {
       console.error('Unexpected error creating guest partner:', err);
       return null;
     }
   }
   
   /**
    * Deletes a guest's partner
    * @param partnerId The ID of the partner to delete
    * @returns Promise resolving to success boolean
    */
   export async function deleteGuestPartner(partnerId: string): Promise<boolean> {
     try {
       const { error } = await supabase
         .from('guests')
         .delete()
         .eq('id', partnerId)
         .eq('guest_type', 'guest_partner');
       
       if (error) {
         console.error('Error deleting guest partner:', error);
         return false;
       }
       
       return true;
     } catch (err) {
       console.error('Unexpected error deleting guest partner:', err);
       return false;
     }
   }
   ```

2. Create a Guest Partner form component (or reuse the existing GuestProfileForm):
   ```tsx
   // If not already created in Step 10, create a new file at src/components/GuestPartnerForm.tsx
   // This can be similar to the GuestProfileForm from Step 10
   // Or you can reuse the GuestProfileForm if it's generic enough
   
   // For this implementation, we'll assume the GuestProfileForm is reusable
   // and just refer to that component
   ```

3. Update the GuestsPage to include partner management functionality:
   ```tsx
   // Update src/pages/GuestsPage.tsx
   
   // Add imports
   import { getPartnerByGuestId, createGuestPartner, deleteGuestPartner } from '../lib/api/guests';
   
   // Add state for partners
   const [guestPartners, setGuestPartners] = useState<Record<string, Guest | null>>({});
   const [showPartnerForm, setShowPartnerForm] = useState<string | null>(null);
   const [isPartnerSubmitting, setIsPartnerSubmitting] = useState(false);
   const [isPartnerDeleting, setIsPartnerDeleting] = useState(false);
   
   // Update useEffect to fetch partner data for each guest
   useEffect(() => {
     // Fetch partner data for a guest
     async function fetchPartnerData(guestId: string) {
       try {
         const partnerData = await getPartnerByGuestId(guestId);
         setGuestPartners(prev => ({
           ...prev,
           [guestId]: partnerData
         }));
       } catch (err) {
         console.error(`Error loading partner for guest ${guestId}:`, err);
       }
     }
     
     // Once guests are loaded, fetch their partners
     if (guests.length > 0) {
       guests.forEach(guest => {
         fetchPartnerData(guest.id);
       });
     }
   }, [guests]);
   
   // Add handler for partner form submission
   const handlePartnerSubmit = async (guestId: string, formData: GuestFormData) => {
     if (!customerId) {
       setError('Customer profile not found');
       return;
     }
     
     setIsPartnerSubmitting(true);
     setError(null);
     setSuccess(null);
     
     try {
       const partner = await createGuestPartner(guestId, customerId, formData);
       
       if (partner) {
         setGuestPartners(prev => ({
           ...prev,
           [guestId]: partner
         }));
         setShowPartnerForm(null);
         setSuccess('Partner details saved successfully!');
         
         // Clear success message after 3 seconds
         setTimeout(() => setSuccess(null), 3000);
       } else {
         throw new Error('Failed to save partner details');
       }
     } catch (err) {
       console.error('Error saving partner details:', err);
       setError('Failed to save partner information.');
     } finally {
       setIsPartnerSubmitting(false);
     }
   };
   
   // Add handler for partner deletion
   const handlePartnerDelete = async (guestId: string, partnerId: string) => {
     setIsPartnerDeleting(true);
     setError(null);
     setSuccess(null);
     
     try {
       const success = await deleteGuestPartner(partnerId);
       
       if (success) {
         setGuestPartners(prev => ({
           ...prev,
           [guestId]: null
         }));
         setSuccess('Partner removed successfully!');
         
         // Clear success message after 3 seconds
         setTimeout(() => setSuccess(null), 3000);
       } else {
         throw new Error('Failed to remove partner');
       }
     } catch (err) {
       console.error('Error removing partner:', err);
       setError('Failed to remove partner.');
     } finally {
       setIsPartnerDeleting(false);
     }
   };
   
   // Add this to the JSX for each guest in the list
   
   {/* After the guest card content, add this section for partner info */}
   <div className="mt-4 pt-4 border-t border-gray-100">
     <div className="flex justify-between items-center">
       <h4 className="text-md font-medium">Partner</h4>
       {guestPartners[guest.id] ? (
         <button
           onClick={() => setShowPartnerForm(guest.id)}
           className="text-blue-600 hover:text-blue-800 text-sm"
         >
           Edit Partner
         </button>
       ) : (
         <button
           onClick={() => setShowPartnerForm(guest.id)}
           className="text-blue-600 hover:text-blue-800 text-sm"
         >
           Add Partner
         </button>
       )}
     </div>
     
     {showPartnerForm === guest.id ? (
       <div className="mt-2 p-4 bg-gray-50 rounded-md">
         <div className="flex justify-between items-center mb-3">
           <h4 className="font-medium">
             {guestPartners[guest.id] ? 'Edit Partner Details' : 'Add Partner'}
           </h4>
           <button
             onClick={() => setShowPartnerForm(null)}
             className="text-gray-500 hover:text-gray-700 text-sm"
           >
             Cancel
           </button>
         </div>
         <GuestProfileForm
           initialData={guestPartners[guest.id] || undefined}
           onSubmit={(data) => handlePartnerSubmit(guest.id, data)}
           onDelete={guestPartners[guest.id] ? 
             () => handlePartnerDelete(guest.id, guestPartners[guest.id]!.id) : 
             undefined}
           isSubmitting={isPartnerSubmitting}
           isDeleting={isPartnerDeleting}
         />
       </div>
     ) : (
       <div className="mt-2">
         {guestPartners[guest.id] ? (
           <div className="text-sm">
             <p>
               <span className="font-medium">
                 {guestPartners[guest.id]!.title ? `${guestPartners[guest.id]!.title} ` : ''}
                 {guestPartners[guest.id]!.first_name} {guestPartners[guest.id]!.last_name}
               </span>
             </p>
             {guestPartners[guest.id]!.email && (
               <p className="text-gray-600">{guestPartners[guest.id]!.email}</p>
             )}
             {(guestPartners[guest.id]!.dietary_requirements || 
               guestPartners[guest.id]!.special_needs) && (
               <button
                 onClick={() => setShowPartnerForm(guest.id)}
                 className="mt-1 text-xs text-blue-600 hover:text-blue-800"
               >
                 View details
               </button>
             )}
           </div>
         ) : (
           <p className="text-sm text-gray-500 italic">No partner added</p>
         )}
       </div>
     )}
   </div>
   ```

## Testing Steps

1. Create test cases for Guest Partner functionality:
   ```typescript
   /* Test Cases
    * 1. Partner Display
    *    - Verify "Add Partner" button shows when no partner exists
    *    - Verify partner info shows when partner already exists
    *
    * 2. Add Partner
    *    - Click "Add Partner" button
    *    - Fill out partner form with required fields
    *    - Submit and verify creation
    *    - Check database for the new partner record
    *
    * 3. Edit Partner
    *    - Click "Edit Partner" button
    *    - Modify fields in the partner form
    *    - Submit and verify updates
    *    - Check database for the updated partner record
    *
    * 4. Delete Partner
    *    - Click "Remove Partner" button
    *    - Confirm deletion
    *    - Verify partner is removed
    *    - Check database to confirm deletion
    *
    * 5. Form Validation
    *    - Test required fields (first name, last name)
    *    - Test email format validation (if implemented)
    */
   ```

2. Test the partner display:
   - Create a guest without a partner
   - Verify that the "Add Partner" button is displayed
   - Create a guest with a partner
   - Verify that the partner information is displayed correctly

3. Test partner creation:
   - Click the "Add Partner" button
   - Fill out the required fields (first name, last name)
   - Submit the form
   - Verify success message appears
   - Verify the partner information now appears
   - Check database for the created partner record

4. Test partner updates:
   - Click the "Edit Partner" button
   - Modify some fields in the partner form
   - Submit the form
   - Verify success message appears
   - Verify the partner information is updated
   - Check database for the updated partner record

5. Test partner deletion:
   - In the partner edit form, click the "Remove Partner" button
   - Confirm deletion if prompted
   - Verify success message appears
   - Verify the partner information is removed
   - Check database to ensure the partner record is deleted

6. Test form validation:
   - Try submitting with required fields empty
   - Try submitting with invalid email format (if validation is implemented)

7. Test state management:
   - Ensure that partner state is correctly maintained when switching between guests
   - Test adding partners to multiple guests
   - Test editing partners for multiple guests

## Verification Checklist

Before moving to the next step, verify:

- [ ] Partner section displays correctly based on whether a partner exists
- [ ] "Add Partner" and "Edit Partner" buttons show in appropriate contexts
- [ ] Partner form loads and displays correctly
- [ ] Form pre-fills with existing partner data
- [ ] Create operation works correctly
- [ ] Update operation works correctly
- [ ] Delete operation works correctly with confirmation
- [ ] Required field validation works
- [ ] Error messages are displayed appropriately
- [ ] Success messages are displayed after successful operations
- [ ] Loading states show during data fetching and submission
- [ ] UI is responsive and accessible
- [ ] Partner information is displayed clearly and appropriately

## Common Errors and Solutions

1. **Permission errors**
   - Check Row Level Security (RLS) policies on the guests table
   - Ensure authenticated users can read/write their own data

2. **State management issues**
   - Ensure partner state is stored and updated correctly
   - Verify that partner forms open/close correctly for each guest
   - Test switching between guests to ensure partner data doesn't mix

3. **Foreign key constraints**
   - Ensure the related_guest_id exists before creating a partner
   - Check cascade delete settings if a guest is deleted

4. **UI/UX consistency**
   - Ensure error and success messages are consistent
   - Make sure loading states are handled consistently

5. **Guest type issues**
   - Ensure 'guest_type' is always set to 'guest_partner'
   - Verify filtering by guest_type works correctly

6. **Race conditions**
   - Be careful about asynchronous updates to the partner state
   - Make sure UI updates properly reflect the latest data

After completing all verifications, clean up any temporary test code and commit your changes before moving on to the next step.
