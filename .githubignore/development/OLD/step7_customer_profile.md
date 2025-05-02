# Step 7: Customer Profile Implementation

## Context
Now that we have Supabase authentication working, we need to implement the customer profile functionality. This involves creating and storing additional customer information beyond what is provided by the authentication system. This customer data will be essential for event registrations and ticketing.

## Objective
Implement the customer profile system, including the API functions to create, retrieve, and update customer records, and the user interface components to manage customer information.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated (Step 2)
- Authentication is fully implemented (Step 6)
- Understanding of the customer data model in the database

## Analysis Steps

1. First, examine the customer table structure in the database:
   ```typescript
   // Create a temporary script to analyze customer table structure
   import { supabase } from './lib/supabase';
   
   async function analyzeCustomerTable() {
     try {
       // Get the customer table columns
       const { data, error } = await supabase
         .from('information_schema.columns')
         .select('column_name, data_type, is_nullable')
         .eq('table_name', 'customers')
         .order('ordinal_position');
       
       if (error) {
         console.error('Error fetching customer table schema:', error);
         return;
       }
       
       console.log('Customer table schema:', data);
     } catch (err) {
       console.error('Error analyzing customer table:', err);
     }
   }
   
   analyzeCustomerTable();
   ```

2. Understand the relationships between customers and other tables:
   ```typescript
   // Check foreign keys to understand relationships
   async function analyzeCustomerRelationships() {
     try {
       const { data, error } = await supabase.rpc('get_foreign_keys', { table_name: 'customers' });
       
       if (error) {
         console.error('Error fetching customer relationships:', error);
         return;
       }
       
       console.log('Customer relationships:', data);
     } catch (err) {
       console.error('Error analyzing relationships:', err);
     }
   }
   
   analyzeCustomerRelationships();
   ```

## Implementation Steps

1. Create a Customer interface to match the database schema:
   ```typescript
   // Create a new file at src/shared/types/customer.ts
   
   export interface Customer {
     id: string;
     user_id: string;
     email: string;
     first_name: string;
     last_name: string;
     phone: string;
     address_line1?: string;
     address_line2?: string;
     city?: string;
     state?: string;
     postal_code?: string;
     country?: string;
     created_at?: string;
     updated_at?: string;
   }
   
   export interface CustomerFormData {
     first_name: string;
     last_name: string;
     email: string;
     phone: string;
     address_line1?: string;
     address_line2?: string;
     city?: string;
     state?: string;
     postal_code?: string;
     country?: string;
   }
   ```

2. Create customer API functions:
   ```typescript
   // Create a new file at src/lib/api/customers.ts
   
   import { supabase } from '../supabase';
   import { Customer, CustomerFormData } from '../../shared/types/customer';
   
   /**
    * Gets the customer profile for the current authenticated user
    * @returns Promise resolving to customer data or null if not found
    */
   export async function getCurrentCustomer(): Promise<Customer | null> {
     try {
       // Get current user
       const { data: { user } } = await supabase.auth.getUser();
       
       if (!user) {
         console.warn('No authenticated user found');
         return null;
       }
       
       // Get customer by user_id
       const { data, error } = await supabase
         .from('customers')
         .select('*')
         .eq('user_id', user.id)
         .maybeSingle();
       
       if (error) {
         console.error('Error fetching customer:', error);
         return null;
       }
       
       return data;
     } catch (err) {
       console.error('Unexpected error fetching customer:', err);
       return null;
     }
   }
   
   /**
    * Creates a new customer profile for the current user
    * @param customerData The customer data to save
    * @returns Promise resolving to the created customer or null on error
    */
   export async function createCustomer(customerData: CustomerFormData): Promise<Customer | null> {
     try {
       // Get current user
       const { data: { user } } = await supabase.auth.getUser();
       
       if (!user) {
         console.warn('No authenticated user found');
         return null;
       }
       
       // Check if customer already exists
       const { data: existingCustomer } = await supabase
         .from('customers')
         .select('id')
         .eq('user_id', user.id)
         .maybeSingle();
       
       if (existingCustomer) {
         console.warn('Customer already exists for this user');
         return updateCustomer(existingCustomer.id, customerData);
       }
       
       // Create new customer
       const { data, error } = await supabase
         .from('customers')
         .insert({
           user_id: user.id,
           email: customerData.email || user.email,
           ...customerData
         })
         .select()
         .single();
       
       if (error) {
         console.error('Error creating customer:', error);
         return null;
       }
       
       return data;
     } catch (err) {
       console.error('Unexpected error creating customer:', err);
       return null;
     }
   }
   
   /**
    * Updates an existing customer profile
    * @param customerId The ID of the customer to update
    * @param customerData The customer data to update
    * @returns Promise resolving to the updated customer or null on error
    */
   export async function updateCustomer(
     customerId: string, 
     customerData: Partial<CustomerFormData>
   ): Promise<Customer | null> {
     try {
       // Get current user for verification
       const { data: { user } } = await supabase.auth.getUser();
       
       if (!user) {
         console.warn('No authenticated user found');
         return null;
       }
       
       // Verify customer belongs to current user
       const { data: existingCustomer } = await supabase
         .from('customers')
         .select('*')
         .eq('id', customerId)
         .eq('user_id', user.id)
         .maybeSingle();
       
       if (!existingCustomer) {
         console.warn('Customer not found or does not belong to current user');
         return null;
       }
       
       // Update customer
       const { data, error } = await supabase
         .from('customers')
         .update({
           ...customerData,
           updated_at: new Date().toISOString()
         })
         .eq('id', customerId)
         .select()
         .single();
       
       if (error) {
         console.error('Error updating customer:', error);
         return null;
       }
       
       return data;
     } catch (err) {
       console.error('Unexpected error updating customer:', err);
       return null;
     }
   }
   ```

3. Create a customer profile form component:
   ```tsx
   // Create a new file at src/components/CustomerProfileForm.tsx
   
   import React, { useState } from 'react';
   import { Customer, CustomerFormData } from '../shared/types/customer';
   
   interface CustomerProfileFormProps {
     initialData?: Customer;
     onSubmit: (data: CustomerFormData) => Promise<void>;
     isSubmitting: boolean;
   }
   
   const CustomerProfileForm: React.FC<CustomerProfileFormProps> = ({
     initialData,
     onSubmit,
     isSubmitting
   }) => {
     const [formData, setFormData] = useState<CustomerFormData>({
       first_name: initialData?.first_name || '',
       last_name: initialData?.last_name || '',
       email: initialData?.email || '',
       phone: initialData?.phone || '',
       address_line1: initialData?.address_line1 || '',
       address_line2: initialData?.address_line2 || '',
       city: initialData?.city || '',
       state: initialData?.state || '',
       postal_code: initialData?.postal_code || '',
       country: initialData?.country || ''
     });
     
     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
     
     return (
       <form onSubmit={handleSubmit} className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
               required
               value={formData.email}
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
               required
               value={formData.phone}
               onChange={handleChange}
               className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
             />
           </div>
         </div>
         
         <div className="mt-6">
           <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
           <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
             {/* Address Line 1 */}
             <div className="sm:col-span-2">
               <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700">
                 Address Line 1
               </label>
               <input
                 type="text"
                 id="address_line1"
                 name="address_line1"
                 value={formData.address_line1 || ''}
                 onChange={handleChange}
                 className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
               />
             </div>
             
             {/* Address Line 2 */}
             <div className="sm:col-span-2">
               <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700">
                 Address Line 2
               </label>
               <input
                 type="text"
                 id="address_line2"
                 name="address_line2"
                 value={formData.address_line2 || ''}
                 onChange={handleChange}
                 className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
               />
             </div>
             
             {/* City */}
             <div>
               <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                 City
               </label>
               <input
                 type="text"
                 id="city"
                 name="city"
                 value={formData.city || ''}
                 onChange={handleChange}
                 className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
               />
             </div>
             
             {/* State/Province */}
             <div>
               <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                 State / Province
               </label>
               <input
                 type="text"
                 id="state"
                 name="state"
                 value={formData.state || ''}
                 onChange={handleChange}
                 className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
               />
             </div>
             
             {/* Postal Code */}
             <div>
               <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                 Postal Code
               </label>
               <input
                 type="text"
                 id="postal_code"
                 name="postal_code"
                 value={formData.postal_code || ''}
                 onChange={handleChange}
                 className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
               />
             </div>
             
             {/* Country */}
             <div>
               <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                 Country
               </label>
               <input
                 type="text"
                 id="country"
                 name="country"
                 value={formData.country || ''}
                 onChange={handleChange}
                 className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
               />
             </div>
           </div>
         </div>
         
         <div className="flex justify-end">
           <button
             type="submit"
             disabled={isSubmitting}
             className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
           >
             {isSubmitting ? 'Saving...' : 'Save Profile'}
           </button>
         </div>
       </form>
     );
   };
   
   export default CustomerProfileForm;
   ```

4. Create a profile page to manage customer information:
   ```tsx
   // Create a new file at src/pages/ProfilePage.tsx
   
   import React, { useEffect, useState } from 'react';
   import { useAuth } from '../context/AuthContext';
   import CustomerProfileForm from '../components/CustomerProfileForm';
   import { Customer, CustomerFormData } from '../shared/types/customer';
   import { getCurrentCustomer, createCustomer, updateCustomer } from '../lib/api/customers';
   
   const ProfilePage: React.FC = () => {
     const { user } = useAuth();
     const [customer, setCustomer] = useState<Customer | null>(null);
     const [loading, setLoading] = useState(true);
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const [success, setSuccess] = useState<string | null>(null);
     
     useEffect(() => {
       // Fetch customer data when component mounts
       async function fetchCustomerData() {
         if (!user) return;
         
         try {
           setLoading(true);
           const customerData = await getCurrentCustomer();
           setCustomer(customerData);
         } catch (err) {
           console.error('Error loading customer profile:', err);
           setError('Failed to load your profile information.');
         } finally {
           setLoading(false);
         }
       }
       
       fetchCustomerData();
     }, [user]);
     
     const handleSubmit = async (formData: CustomerFormData) => {
       setIsSubmitting(true);
       setError(null);
       setSuccess(null);
       
       try {
         let updatedCustomer;
         
         if (customer) {
           // Update existing customer
           updatedCustomer = await updateCustomer(customer.id, formData);
         } else {
           // Create new customer
           updatedCustomer = await createCustomer(formData);
         }
         
         if (updatedCustomer) {
           setCustomer(updatedCustomer);
           setSuccess('Profile saved successfully!');
           
           // Clear success message after 3 seconds
           setTimeout(() => setSuccess(null), 3000);
         } else {
           throw new Error('Failed to save profile');
         }
       } catch (err) {
         console.error('Error saving profile:', err);
         setError('Failed to save your profile information.');
       } finally {
         setIsSubmitting(false);
       }
     };
     
     if (loading) {
       return (
         <div className="container-custom py-8">
           <div className="max-w-3xl mx-auto">
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
         <div className="max-w-3xl mx-auto">
           <h1 className="text-3xl font-bold mb-6">My Profile</h1>
           
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
           
           <div className="bg-white shadow-md rounded-lg p-6">
             <CustomerProfileForm 
               initialData={customer || undefined}
               onSubmit={handleSubmit}
               isSubmitting={isSubmitting}
             />
           </div>
         </div>
       </div>
     );
   };
   
   export default ProfilePage;
   ```

5. Add a link to the profile page in the header component:
   ```tsx
   // In the account dropdown menu in src/components/Header.tsx
   
   <Link
     to="/profile"
     className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
     onClick={() => setIsAccountMenuOpen(false)}
   >
     My Profile
   </Link>
   ```

## Testing Steps

1. Create test cases for customer profile functionality:
   ```typescript
   /* Test Cases
    * 1. First-time User
    *    - Log in with a new user account
    *    - Navigate to the profile page
    *    - Verify the form is empty
    *    - Fill out and submit the form
    *    - Verify the customer is created in the database
    *
    * 2. Existing User
    *    - Log in with an existing user account
    *    - Navigate to the profile page
    *    - Verify the form is pre-filled with existing data
    *    - Update some fields and submit
    *    - Verify the changes are saved to the database
    *
    * 3. Form Validation
    *    - Test required fields (first name, last name, email, phone)
    *    - Test email format validation
    *    - Test phone format validation (if implemented)
    *
    * 4. Error Handling
    *    - Test network error handling
    *    - Test unauthorized access handling
    */
   ```

2. Create a test user account:
   - Sign up with a new account
   - Log in with the new account

3. Test profile creation flow:
   - Navigate to the profile page
   - Fill out the customer profile form
   - Submit the form
   - Verify success message
   - Check the database for the new customer record

4. Test profile update flow:
   - Navigate back to the profile page
   - Verify form is pre-filled with customer data
   - Update some fields
   - Submit the form
   - Verify success message
   - Check the database for the updated customer record

5. Test form validation:
   - Try submitting with required fields empty
   - Try submitting with invalid email format
   - Try submitting with invalid phone format (if validation is implemented)

## Verification Checklist

Before moving to the next step, verify:

- [ ] Customer profile data is correctly saved to the database
- [ ] Profile form loads and displays correctly
- [ ] Form pre-fills with existing customer data
- [ ] Create and update operations work correctly
- [ ] Required field validation works
- [ ] Error messages are displayed appropriately
- [ ] Success messages are displayed after successful operations
- [ ] Loading states show during data fetching and submission
- [ ] UI is responsive and accessible
- [ ] Navigation to the profile page works from the header menu

## Common Errors and Solutions

1. **Permission errors**
   - Check Row Level Security (RLS) policies on the customers table
   - Ensure the authenticated user has permission to read/write their own data

2. **Form state issues**
   - Verify form state is correctly initialized with customer data
   - Check that form updates handle both empty and null values correctly

3. **TypeScript errors**
   - Ensure interfaces match the database schema
   - Handle nullable types correctly (customer may be null)

4. **API error handling**
   - Provide meaningful error messages to users
   - Log detailed errors for debugging purposes

5. **Timing issues**
   - Handle loading states correctly to prevent flashing content
   - Add debounce to form submissions if necessary

After completing all verifications, clean up any temporary test code and commit your changes.
