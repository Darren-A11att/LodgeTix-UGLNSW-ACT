# Step 10: Guest Attendee Implementation

## Context
After implementing Mason and Mason's Partner attendee types, we now need to implement the regular Guest attendee type. In the LodgeTix system, customers can register guests who are not Masons to attend events.

## Objective
Implement the Guest attendee type, including the API functions to create, retrieve, update, and delete guest records, and the user interface components to manage guest information.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated (Step 2)
- Authentication is implemented (Step 6)
- Customer profile is implemented (Step 7)
- Understanding of the guests table structure in the database

## Analysis Steps

1. Review the guests table structure that we analyzed in Step 9:
   ```typescript
   // The guests table should have columns like:
   // - id
   // - guest_type (we'll use 'guest' for regular guests)
   // - title
   // - first_name
   // - last_name
   // - phone
   // - email
   // - dietary_requirements
   // - special_needs
   // - related_mason_id (null for regular guests)
   // - related_guest_id (null unless this is a guest's partner)
   // - created_at
   // - updated_at
   ```

2. Understand how regular guests are stored and associated with customers:
   ```typescript
   // Check relationship between customers and guests
   async function analyzeCustomerGuestRelationship() {
     try {
       // Get sample data to understand the relationship
       const { data, error } = await supabase
         .from('guests')
         .select('*, customers!inner(*)')
         .eq('guest_type', 'guest')
         .limit(5);
       
       if (error) {
         console.error('Error fetching guest data:', error);
         return;
       }
       
       console.log('Guest sample data with customer relationship:', data);
     } catch (err) {
       console.error('Error analyzing relationships:', err);
     }
   }
   
   analyzeCustomerGuestRelationship();
   ```

## Implementation Steps

1. Create or update Guest interfaces to handle regular guests:
   ```typescript
   // If not already created in Step 9, create src/shared/types/guest.ts
   // Or update the existing file to include these types:
   
   export interface Guest {
     id: string;
     guest_type: string;  // 'lady_partner', 'guest', 'guest_partner', etc.
     title?: string;
     first_name: string;
     last_name: string;
     phone?: string;
     email?: string;
     dietary_requirements?: string;
     special_needs?: string;
     related_mason_id?: string;  // For partners of masons
     related_guest_id?: string;  // For partners of regular guests
     customer_id?: string;       // The customer who registered this guest
     created_at?: string;
     updated_at?: string;
   }
   
   export interface GuestFormData {
     title?: string;
     first_name: string;
     last_name: string;
     phone?: string;
     email?: string;
     dietary_requirements?: string;
     special_needs?: string;
   }
   ```

2. Create API functions for managing regular guests:
   ```typescript
   // Create a new file at src/lib/api/guests.ts
   
   import { supabase } from '../supabase';
   import { Guest, GuestFormData } from '../../shared/types/guest';
   
   /**
    * Fetches all guests for a customer
    * @param customerId The customer ID to look up guests for
    * @returns Promise resolving to array of guests
    */
   export async function getGuestsByCustomerId(customerId: string): Promise<Guest[]> {
     try {
       const { data, error } = await supabase
         .from('guests')
         .select('*')
         .eq('customer_id', customerId)
         .eq('guest_type', 'guest')
         .is('related_mason_id', null)
         .is('related_guest_id', null)
         .order('created_at', { ascending: false });
       
       if (error) {
         console.error('Error fetching guests:', error);
         return [];
       }
       
       return data || [];
     } catch (err) {
       console.error('Unexpected error fetching guests:', err);
       return [];
     }
   }
   
   /**
    * Creates a new guest profile linked to a customer
    * @param customerId The customer ID to link to
    * @param guestData The guest data to save
    * @returns Promise resolving to the created guest or null on error
    */
   export async function createGuest(
     customerId: string,
     guestData: GuestFormData
   ): Promise<Guest | null> {
     try {
       // Create new guest
       const { data, error } = await supabase
         .from('guests')
         .insert({
           customer_id: customerId,
           guest_type: 'guest',
           related_mason_id: null,
           related_guest_id: null,
           ...guestData
         })
         .select()
         .single();
       
       if (error) {
         console.error('Error creating guest:', error);
         return null;
       }
       
       return data;
     } catch (err) {
       console.error('Unexpected error creating guest:', err);
       return null;
     }
   }
   
   /**
    * Updates an existing guest profile
    * @param guestId The ID of the guest to update
    * @param guestData The guest data to update
    * @returns Promise resolving to the updated guest or null on error
    */
   export async function updateGuest(
     guestId: string,
     guestData: Partial<GuestFormData>
   ): Promise<Guest | null> {
     try {
       const { data, error } = await supabase
         .from('guests')
         .update({
           ...guestData,
           updated_at: new Date().toISOString()
         })
         .eq('id', guestId)
         .select()
         .single();
       
       if (error) {
         console.error('Error updating guest:', error);
         return null;
       }
       
       return data;
     } catch (err) {
       console.error('Unexpected error updating guest:', err);
       return null;
     }
   }
   
   /**
    * Deletes a guest profile
    * @param guestId The ID of the guest to delete
    * @returns Promise resolving to success boolean
    */
   export async function deleteGuest(guestId: string): Promise<boolean> {
     try {
       const { error } = await supabase
         .from('guests')
         .delete()
         .eq('id', guestId);
       
       if (error) {
         console.error('Error deleting guest:', error);
         return false;
       }
       
       return true;
     } catch (err) {
       console.error('Unexpected error deleting guest:', err);
       return false;
     }
   }
   ```

3. Create a Guest profile form component:
   ```tsx
   // Create a new file at src/components/GuestProfileForm.tsx
   // This can be similar to the PartnerProfileForm from Step 9
   
   import React, { useState } from 'react';
   import { Guest, GuestFormData } from '../shared/types/guest';
   
   interface GuestProfileFormProps {
     initialData?: Guest;
     onSubmit: (data: GuestFormData) => Promise<void>;
     onDelete?: () => Promise<void>;
     isSubmitting: boolean;
     isDeleting?: boolean;
   }
   
   const GuestProfileForm: React.FC<GuestProfileFormProps> = ({
     initialData,
     onSubmit,
     onDelete,
     isSubmitting,
     isDeleting = false
   }) => {
     const [formData, setFormData] = useState<GuestFormData>({
       title: initialData?.title || '',
       first_name: initialData?.first_name || '',
       last_name: initialData?.last_name || '',
       phone: initialData?.phone || '',
       email: initialData?.email || '',
       dietary_requirements: initialData?.dietary_requirements || '',
       special_needs: initialData?.special_needs || ''
     });
     
     const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
     
     const handleChange = (
       e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
     ) => {
       const { name, value } = e.target;
       setFormData(prev => ({
         ...prev,
         [name]: value
       }));
     };
     
     const handleSubmit = (e: React.FormEvent) => {
       e.preventDefault();
       onSubmit(formData);
     };
     
     const handleDeleteClick = () => {
       if (showDeleteConfirm && onDelete) {
         onDelete();
       } else {
         setShowDeleteConfirm(true);
       }
     };
     
     const handleCancelDelete = () => {
       setShowDeleteConfirm(false);
     };
     
     return (
       <form onSubmit={handleSubmit} className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Title */}
           <div>
             <label htmlFor="title" className="block text-sm font-medium text-gray-700">
               Title
             </label>
             <select
               id="title"
               name="title"
               value={formData.title || ''}
               onChange={handleChange}
               className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
             >
               <option value="">Select a title</option>
               <option value="Mr">Mr</option>
               <option value="Mrs">Mrs</option>
               <option value="Miss">Miss</option>
               <option value="Ms">Ms</option>
               <option value="Dr">Dr</option>
               <option value="Other">Other</option>
             </select>
           </div>
           
           {/* Empty div for grid alignment */}
           <div></div>
           
           {/* First Name */}
           <div>
             <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
               First Name
             </label>
             <input
               type="text"
               id="first_name"
               name="first_name"
               required
               value={formData.first_name}
               onChange={handleChange}
               className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
             />
           </div>
           
           {/* Last Name */}
           <div>
             <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
               Last Name
             </label>
             <input
               type="text"
               id="last_name"
               name="last_name"
               required
               value={formData.last_name}
               onChange={handleChange}
               className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
             />
           </div>
           
           {/* Email */}
           <div>
             <label htmlFor="email" className="block text-sm font-medium text-gray-700">
               Email
             </label>
             <input
               type="email"
               id="email"
               name="email"
               value={formData.email || ''}
               onChange={handleChange}
               className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
             />
           </div>
           
           {/* Phone */}
           <div>
             <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
               Phone
             </label>
             <input
               type="tel"
               id="phone"
               name="phone"
               value={formData.phone || ''}
               onChange={handleChange}
               className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
             />
           </div>
         </div>
         
         {/* Dietary Requirements */}
         <div>
           <label htmlFor="dietary_requirements" className="block text-sm font-medium text-gray-700">
             Dietary Requirements
           </label>
           <textarea
             id="dietary_requirements"
             name="dietary_requirements"
             rows={2}
             value={formData.dietary_requirements || ''}
             onChange={handleChange}
             className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
             placeholder="E.g., vegetarian, gluten-free, allergies"
           />
         </div>
         
         {/* Special Needs */}
         <div>
           <label htmlFor="special_needs" className="block text-sm font-medium text-gray-700">
             Special Needs
           </label>
           <textarea
             id="special_needs"
             name="special_needs"
             rows={2}
             value={formData.special_needs || ''}
             onChange={handleChange}
             className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
             placeholder="E.g., wheelchair access, hearing assistance"
           />
         </div>
         
         <div className="flex justify-between">
           {/* Delete button (if guest already exists) */}
           {initialData && onDelete && (
             <div>
               {showDeleteConfirm ? (
                 <div className="flex items-center space-x-2">
                   <span className="text-sm text-red-600">Confirm delete?</span>
                   <button
                     type="button"
                     onClick={handleDeleteClick}
                     disabled={isDeleting}
                     className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                   >
                     {isDeleting ? 'Deleting...' : 'Yes, delete'}
                   </button>
                   <button
                     type="button"
                     onClick={handleCancelDelete}
                     className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                   >
                     Cancel
                   </button>
                 </div>
               ) : (
                 <button
                   type="button"
                   onClick={handleDeleteClick}
                   className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                 >
                   Remove Guest
                 </button>
               )}
             </div>
           )}
           
           {/* Save button */}
           <button
             type="submit"
             disabled={isSubmitting}
             className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
           >
             {isSubmitting ? 'Saving...' : initialData ? 'Update Guest' : 'Add Guest'}
           </button>
         </div>
       </form>
     );
   };
   
   export default GuestProfileForm;
   ```

4. Create a Guests management page:
   ```tsx
   // Create a new file at src/pages/GuestsPage.tsx
   
   import React, { useEffect, useState } from 'react';
   import { useAuth } from '../context/AuthContext';
   import { getCurrentCustomer } from '../lib/api/customers';
   import { getGuestsByCustomerId, createGuest, updateGuest, deleteGuest } from '../lib/api/guests';
   import { Guest, GuestFormData } from '../shared/types/guest';
   import GuestProfileForm from '../components/GuestProfileForm';
   import { UserPlus, Edit2, Trash2 } from 'lucide-react';
   
   const GuestsPage: React.FC = () => {
     const { user } = useAuth();
     const [customerId, setCustomerId] = useState<string | null>(null);
     const [guests, setGuests] = useState<Guest[]>([]);
     const [loading, setLoading] = useState(true);
     const [showAddForm, setShowAddForm] = useState(false);
     const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [isDeleting, setIsDeleting] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const [success, setSuccess] = useState<string | null>(null);
     
     useEffect(() => {
       // Fetch customer and guests data when component mounts
       async function fetchData() {
         if (!user) return;
         
         try {
           setLoading(true);
           
           // First get the customer ID
           const customer = await getCurrentCustomer();
           
           if (!customer) {
             setError('Please complete your customer profile first');
             setLoading(false);
             return;
           }
           
           setCustomerId(customer.id);
           
           // Then get guests data
           const guestsData = await getGuestsByCustomerId(customer.id);
           setGuests(guestsData);
         } catch (err) {
           console.error('Error loading guests:', err);
           setError('Failed to load guests information.');
         } finally {
           setLoading(false);
         }
       }
       
       fetchData();
     }, [user]);
     
     const handleAddGuest = async (formData: GuestFormData) => {
       if (!customerId) {
         setError('Customer profile not found');
         return;
       }
       
       setIsSubmitting(true);
       setError(null);
       setSuccess(null);
       
       try {
         const newGuest = await createGuest(customerId, formData);
         
         if (newGuest) {
           setGuests(prev => [newGuest, ...prev]);
           setShowAddForm(false);
           setSuccess('Guest added successfully!');
           
           // Clear success message after 3 seconds
           setTimeout(() => setSuccess(null), 3000);
         } else {
           throw new Error('Failed to add guest');
         }
       } catch (err) {
         console.error('Error adding guest:', err);
         setError('Failed to add guest.');
       } finally {
         setIsSubmitting(false);
       }
     };
     
     const handleUpdateGuest = async (guestId: string, formData: GuestFormData) => {
       setIsSubmitting(true);
       setError(null);
       setSuccess(null);
       
       try {
         const updatedGuest = await updateGuest(guestId, formData);
         
         if (updatedGuest) {
           setGuests(prev => prev.map(guest => 
             guest.id === guestId ? updatedGuest : guest
           ));
           setEditingGuestId(null);
           setSuccess('Guest updated successfully!');
           
           // Clear success message after 3 seconds
           setTimeout(() => setSuccess(null), 3000);
         } else {
           throw new Error('Failed to update guest');
         }
       } catch (err) {
         console.error('Error updating guest:', err);
         setError('Failed to update guest.');
       } finally {
         setIsSubmitting(false);
       }
     };
     
     const handleDeleteGuest = async (guestId: string) => {
       setIsDeleting(true);
       setError(null);
       setSuccess(null);
       
       try {
         const success = await deleteGuest(guestId);
         
         if (success) {
           setGuests(prev => prev.filter(guest => guest.id !== guestId));
           setEditingGuestId(null);
           setSuccess('Guest removed successfully!');
           
           // Clear success message after 3 seconds
           setTimeout(() => setSuccess(null), 3000);
         } else {
           throw new Error('Failed to remove guest');
         }
       } catch (err) {
         console.error('Error removing guest:', err);
         setError('Failed to remove guest.');
       } finally {
         setIsDeleting(false);
       }
     };
     
     const resetForms = () => {
       setShowAddForm(false);
       setEditingGuestId(null);
     };
     
     if (loading) {
       return (
         <div className="container-custom py-8">
           <div className="max-w-4xl mx-auto">
             <div className="animate-pulse">
               <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
               <div className="space-y-4">
                 <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                 <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                 <div className="h-4 bg-slate-200 rounded w-5/6"></div>
               </div>
             </div>
           </div>
         </div>
       );
     }
     
     return (
       <div className="container-custom py-8">
         <div className="max-w-4xl mx-auto">
           <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold">Manage Guests</h1>
             {!showAddForm && editingGuestId === null && (
               <button
                 onClick={() => setShowAddForm(true)}
                 className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
               >
                 <UserPlus className="w-4 h-4 mr-2" />
                 Add Guest
               </button>
             )}
           </div>
           
           {error && (
             <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
               <div className="flex">
                 <div className="ml-3">
                   <p className="text-red-700">{error}</p>
                 </div>
               </div>
             </div>
           )}
           
           {success && (
             <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4">
               <div className="flex">
                 <div className="ml-3">
                   <p className="text-green-700">{success}</p>
                 </div>
               </div>
             </div>
           )}
           
           {!customerId && (
             <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
               <div className="flex">
                 <div className="ml-3">
                   <p className="text-yellow-700">
                     Please complete your customer profile before managing guests.
                   </p>
                   <div className="mt-2">
                     <a href="/profile" className="text-yellow-700 underline font-medium">
                       Go to customer profile
                     </a>
                   </div>
                 </div>
               </div>
             </div>
           )}
           
           {/* Add Guest Form */}
           {showAddForm && customerId && (
             <div className="bg-white shadow-md rounded-lg p-6 mb-8">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold">Add New Guest</h2>
                 <button
                   onClick={() => setShowAddForm(false)}
                   className="text-gray-500 hover:text-gray-700"
                 >
                   Cancel
                 </button>
               </div>
               <GuestProfileForm
                 onSubmit={handleAddGuest}
                 isSubmitting={isSubmitting}
               />
             </div>
           )}
           
           {/* Existing Guests */}
           {customerId && (
             <div className="space-y-6">
               {guests.length === 0 && !showAddForm ? (
                 <div className="bg-gray-50 p-8 text-center rounded-lg">
                   <p className="text-gray-600 mb-4">You haven't added any guests yet.</p>
                   <button
                     onClick={() => setShowAddForm(true)}
                     className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                   >
                     <UserPlus className="w-4 h-4 mr-2" />
                     Add Your First Guest
                   </button>
                 </div>
               ) : (
                 guests.map(guest => (
                   <div key={guest.id} className="bg-white shadow-md rounded-lg p-6">
                     {editingGuestId === guest.id ? (
                       <div>
                         <div className="flex justify-between items-center mb-4">
                           <h2 className="text-xl font-bold">Edit Guest</h2>
                           <button
                             onClick={() => setEditingGuestId(null)}
                             className="text-gray-500 hover:text-gray-700"
                           >
                             Cancel
                           </button>
                         </div>
                         <GuestProfileForm
                           initialData={guest}
                           onSubmit={(data) => handleUpdateGuest(guest.id, data)}
                           onDelete={() => handleDeleteGuest(guest.id)}
                           isSubmitting={isSubmitting}
                           isDeleting={isDeleting}
                         />
                       </div>
                     ) : (
                       <div>
                         <div className="flex justify-between">
                           <h3 className="text-lg font-bold">
                             {guest.title ? `${guest.title} ` : ''}
                             {guest.first_name} {guest.last_name}
                           </h3>
                           <div className="flex space-x-2">
                             <button
                               onClick={() => {
                                 resetForms();
                                 setEditingGuestId(guest.id);
                               }}
                               className="text-blue-600 hover:text-blue-800"
                               title="Edit guest"
                             >
                               <Edit2 className="w-4 h-4" />
                             </button>
                             <button
                               onClick={() => handleDeleteGuest(guest.id)}
                               className="text-red-600 hover:text-red-800"
                               title="Remove guest"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                         
                         <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                           {guest.email && (
                             <div>
                               <span className="font-medium">Email:</span> {guest.email}
                             </div>
                           )}
                           {guest.phone && (
                             <div>
                               <span className="font-medium">Phone:</span> {guest.phone}
                             </div>
                           )}
                         </div>
                         
                         {(guest.dietary_requirements || guest.special_needs) && (
                           <div className="mt-4 pt-4 border-t border-gray-100">
                             {guest.dietary_requirements && (
                               <div className="mb-2">
                                 <span className="font-medium">Dietary Requirements:</span>{' '}
                                 {guest.dietary_requirements}
                               </div>
                             )}
                             {guest.special_needs && (
                               <div>
                                 <span className="font-medium">Special Needs:</span>{' '}
                                 {guest.special_needs}
                               </div>
                             )}
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                 ))
               )}
             </div>
           )}
         </div>
       </div>
     );
   };
   
   export default GuestsPage;
   ```

5. Update the routing in App.tsx to include the Guests page:
   ```tsx
   // In src/App.tsx
   
   // Add import
   import GuestsPage from './pages/GuestsPage';
   
   // Add to routes
   <Route path="/guests" element={
     <ProtectedRoute>
       <GuestsPage />
     </ProtectedRoute>
   } />
   ```

6. Add a navigation link to the Guests page:
   ```tsx
   // In the account dropdown menu in src/components/Header.tsx
   
   <Link
     to="/guests"
     className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
     onClick={() => setIsAccountMenuOpen(false)}
   >
     Manage Guests
   </Link>
   ```

## Testing Steps

1. Create test cases for Guest functionality:
   ```typescript
   /* Test Cases
    * 1. Guest List Display
    *    - Verify empty state shows when no guests exist
    *    - Verify list shows when guests exist
    *
    * 2. Add Guest
    *    - Click "Add Guest" button
    *    - Fill out guest form with required fields
    *    - Submit and verify creation
    *    - Check database for the new guest record
    *
    * 3. Edit Guest
    *    - Click edit button on a guest
    *    - Modify fields in the guest form
    *    - Submit and verify updates
    *    - Check database for the updated guest record
    *
    * 4. Delete Guest
    *    - Click delete button on a guest
    *    - Confirm deletion (if confirmation is implemented)
    *    - Verify guest is removed from the list
    *    - Check database to confirm deletion
    *
    * 5. Form Validation
    *    - Test required fields (first name, last name)
    *    - Test email format validation (if implemented)
    */
   ```

2. Test the guest list display:
   - Log in with a user who has no guests
   - Verify that the empty state message is displayed
   - Add a guest and verify that the list now shows the guest
   - Log in with a user who already has guests
   - Verify that the list shows all existing guests

3. Test guest creation:
   - Click the "Add Guest" button
   - Fill out the required fields (first name, last name)
   - Submit the form
   - Verify success message appears
   - Verify the new guest appears in the list
   - Check database for the created guest record

4. Test guest updates:
   - Click the edit button for an existing guest
   - Modify some fields in the guest form
   - Submit the form
   - Verify success message appears
   - Verify the guest in the list is updated
   - Check database for the updated guest record

5. Test guest deletion:
   - Click the delete button for an existing guest
   - Confirm deletion if prompted
   - Verify success message appears
   - Verify the guest is removed from the list
   - Check database to ensure the guest record is deleted

6. Test form validation:
   - Try submitting with required fields empty
   - Try submitting with invalid email format (if validation is implemented)

## Verification Checklist

Before moving to the next step, verify:

- [ ] Guest list displays correctly based on whether guests exist
- [ ] Add Guest form works properly
- [ ] Guest data is correctly saved to the database
- [ ] Edit Guest form loads and displays correctly
- [ ] Form pre-fills with existing guest data
- [ ] Create operation works correctly
- [ ] Update operation works correctly
- [ ] Delete operation works correctly
- [ ] Required field validation works
- [ ] Error messages are displayed appropriately
- [ ] Success messages are displayed after successful operations
- [ ] Loading states show during data fetching and submission
- [ ] UI is responsive and accessible
- [ ] Navigation to the Guests page works correctly

## Common Errors and Solutions

1. **Permission errors**
   - Check Row Level Security (RLS) policies on the guests table
   - Ensure authenticated users can read/write their own data

2. **Form state management**
   - Verify guest list updates correctly after adding, editing, or deleting
   - Test toggling between add and edit forms

3. **Foreign key constraints**
   - Ensure the customer_id exists before creating a guest record
   - Check for cascade delete settings if needed

4. **UI/UX consistency**
   - Ensure error and success messages are consistent with other parts of the application
   - Make sure loading states are handled consistently

5. **Guest type issues**
   - Ensure 'guest_type' is always set to 'guest'
   - Verify filtering by guest_type works correctly

After completing all verifications, clean up any temporary test code and commit your changes before moving on to the next step.
