# Step 8: Mason Attendee Implementation

## Context
Now that we have the customer profile system in place, we need to implement the Mason attendee type. In the context of LodgeTix, a Mason is a specific type of attendee with additional information such as rank, lodge, and other Masonic-specific details.

## Objective
Implement the Mason attendee type, including the API functions to create, retrieve, and update Mason records, and the user interface components to manage Mason information.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated (Step 2)
- Authentication is implemented (Step 6)
- Customer profile is implemented (Step 7)
- Understanding of the Mason data model in the database

## Analysis Steps

1. First, examine the mason table structure in the database:
   ```typescript
   // Create a temporary script to analyze mason table structure
   import { supabase } from './lib/supabase';
   
   async function analyzeMasonTable() {
     try {
       // Get the mason table columns
       const { data, error } = await supabase
         .from('information_schema.columns')
         .select('column_name, data_type, is_nullable')
         .eq('table_name', 'masons')
         .order('ordinal_position');
       
       if (error) {
         console.error('Error fetching mason table schema:', error);
         return;
       }
       
       console.log('Mason table schema:', data);
     } catch (err) {
       console.error('Error analyzing mason table:', err);
     }
   }
   
   analyzeMasonTable();
   ```

2. Understand the relationships between masons, lodges, and other tables:
   ```typescript
   // Check relationship with lodges
   async function analyzeLodgeData() {
     try {
       // Get sample data from lodges table
       const { data, error } = await supabase
         .from('lodges')
         .select('*')
         .limit(5);
       
       if (error) {
         console.error('Error fetching lodge data:', error);
         return;
       }
       
       console.log('Lodge data sample:', data);
     } catch (err) {
       console.error('Error analyzing lodge data:', err);
     }
   }
   
   analyzeLodgeData();
   ```

## Implementation Steps

1. Create Mason and Lodge interfaces to match the database schema:
   ```typescript
   // Create a new file at src/shared/types/mason.ts
   
   export interface Lodge {
     id: string;
     name: string;
     number?: string;
     display_name?: string;
     district?: string;
     meeting_place?: string;
     area_type?: string;
     grand_lodge_id?: string;
     created_at?: string;
   }
   
   export interface Mason {
     id: string;
     customer_id?: string;
     title?: string;
     first_name: string;
     last_name: string;
     phone?: string;
     email?: string;
     dietary_requirements?: string;
     special_needs?: string;
     rank?: string;
     grand_rank?: string;
     grand_officer?: string;
     grand_office?: string;
     grand_office_other?: string;
     lodge_id?: string;
     grand_lodge_id?: string;
     created_at?: string;
     lodge?: Lodge;
   }
   
   export interface MasonFormData {
     title?: string;
     first_name: string;
     last_name: string;
     phone?: string;
     email?: string;
     dietary_requirements?: string;
     special_needs?: string;
     rank?: string;
     grand_rank?: string;
     grand_officer?: string;
     grand_office?: string;
     grand_office_other?: string;
     lodge_id?: string;
     grand_lodge_id?: string;
   }
   ```

2. Create API functions for masons and lodges:
   ```typescript
   // Create a new file at src/lib/api/masons.ts
   
   import { supabase } from '../supabase';
   import { Mason, MasonFormData, Lodge } from '../../shared/types/mason';
   
   /**
    * Fetches all lodges for the dropdown
    * @param grandLodgeId Optional grand lodge ID to filter lodges
    * @returns Promise resolving to array of lodges
    */
   export async function getLodges(grandLodgeId?: string): Promise<Lodge[]> {
     try {
       let query = supabase
         .from('lodges')
         .select('*')
         .order('name');
       
       if (grandLodgeId) {
         query = query.eq('grand_lodge_id', grandLodgeId);
       }
       
       const { data, error } = await query;
       
       if (error) {
         console.error('Error fetching lodges:', error);
         return [];
       }
       
       return data || [];
     } catch (err) {
       console.error('Unexpected error fetching lodges:', err);
       return [];
     }
   }
   
   /**
    * Fetches a mason by customer ID
    * @param customerId The customer ID to look up
    * @returns Promise resolving to mason data or null if not found
    */
   export async function getMasonByCustomerId(customerId: string): Promise<Mason | null> {
     try {
       const { data, error } = await supabase
         .from('masons')
         .select(`
           *,
           lodge:lodge_id (
             id,
             name,
             number,
             display_name
           )
         `)
         .eq('customer_id', customerId)
         .maybeSingle();
       
       if (error) {
         console.error('Error fetching mason:', error);
         return null;
       }
       
       return data;
     } catch (err) {
       console.error('Unexpected error fetching mason:', err);
       return null;
     }
   }
   
   /**
    * Creates a new mason profile linked to a customer
    * @param customerId The customer ID to link to
    * @param masonData The mason data to save
    * @returns Promise resolving to the created mason or null on error
    */
   export async function createMason(
     customerId: string,
     masonData: MasonFormData
   ): Promise<Mason | null> {
     try {
       // Check if mason already exists for this customer
       const { data: existingMason } = await supabase
         .from('masons')
         .select('id')
         .eq('customer_id', customerId)
         .maybeSingle();
       
       if (existingMason) {
         console.warn('Mason already exists for this customer');
         return updateMason(existingMason.id, masonData);
       }
       
       // Create new mason
       const { data, error } = await supabase
         .from('masons')
         .insert({
           customer_id: customerId,
           ...masonData
         })
         .select(`
           *,
           lodge:lodge_id (
             id,
             name,
             number,
             display_name
           )
         `)
         .single();
       
       if (error) {
         console.error('Error creating mason:', error);
         return null;
       }
       
       return data;
     } catch (err) {
       console.error('Unexpected error creating mason:', err);
       return null;
     }
   }
   
   /**
    * Updates an existing mason profile
    * @param masonId The ID of the mason to update
    * @param masonData The mason data to update
    * @returns Promise resolving to the updated mason or null on error
    */
   export async function updateMason(
     masonId: string,
     masonData: Partial<MasonFormData>
   ): Promise<Mason | null> {
     try {
       const { data, error } = await supabase
         .from('masons')
         .update(masonData)
         .eq('id', masonId)
         .select(`
           *,
           lodge:lodge_id (
             id,
             name,
             number,
             display_name
           )
         `)
         .single();
       
       if (error) {
         console.error('Error updating mason:', error);
         return null;
       }
       
       return data;
     } catch (err) {
       console.error('Unexpected error updating mason:', err);
       return null;
     }
   }
   ```

3. Create a Mason profile form component:
   ```tsx
   // Create a new file at src/components/MasonProfileForm.tsx
   
   import React, { useState, useEffect } from 'react';
   import { Mason, MasonFormData, Lodge } from '../shared/types/mason';
   import { getLodges } from '../lib/api/masons';
   
   interface MasonProfileFormProps {
     initialData?: Mason;
     onSubmit: (data: MasonFormData) => Promise<void>;
     isSubmitting: boolean;
   }
   
   const MasonProfileForm: React.FC<MasonProfileFormProps> = ({
     initialData,
     onSubmit,
     isSubmitting
   }) => {
     const [formData, setFormData] = useState<MasonFormData>({
       title: initialData?.title || '',
       first_name: initialData?.first_name || '',
       last_name: initialData?.last_name || '',
       phone: initialData?.phone || '',
       email: initialData?.email || '',
       dietary_requirements: initialData?.dietary_requirements || '',
       special_needs: initialData?.special_needs || '',
       rank: initialData?.rank || '',
       grand_rank: initialData?.grand_rank || '',
       grand_officer: initialData?.grand_officer || '',
       grand_office: initialData?.grand_office || '',
       grand_office_other: initialData?.grand_office_other || '',
       lodge_id: initialData?.lodge_id || '',
       grand_lodge_id: initialData?.grand_lodge_id || ''
     });
     
     const [lodges, setLodges] = useState<Lodge[]>([]);
     const [loadingLodges, setLoadingLodges] = useState(false);
     
     useEffect(() => {
       // Fetch lodges for dropdown
       async function fetchLodges() {
         setLoadingLodges(true);
         const lodgeData = await getLodges();
         setLodges(lodgeData);
         setLoadingLodges(false);
       }
       
       fetchLodges();
     }, []);
     
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
     
     return (
       <form onSubmit={handleSubmit} className="space-y-6">
         <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
         
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
               <option value="Wor Bro">Wor Bro</option>
               <option value="V Wor Bro">V Wor Bro</option>
               <option value="Rt Wor Bro">Rt Wor Bro</option>
               <option value="Most Wor Bro">Most Wor Bro</option>
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
         
         <hr className="my-8" />
         
         <h3 className="text-lg font-medium text-gray-900">Masonic Information</h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Lodge */}
           <div>
             <label htmlFor="lodge_id" className="block text-sm font-medium text-gray-700">
               Lodge
             </label>
             <select
               id="lodge_id"
               name="lodge_id"
               value={formData.lodge_id || ''}
               onChange={handleChange}
               className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
             >
               <option value="">Select a lodge</option>
               {loadingLodges && <option disabled>Loading lodges...</option>}
               {lodges.map(lodge => (
                 <option key={lodge.id} value={lodge.id}>
                   {lodge.display_name || `${lodge.name} ${lodge.number ? `No. ${lodge.number}` : ''}`}
                 </option>
               ))}
             </select>
           </div>
           
           {/* Rank */}
           <div>
             <label htmlFor="rank" className="block text-sm font-medium text-gray-700">
               Rank
             </label>
             <select
               id="rank"
               name="rank"
               value={formData.rank || ''}
               onChange={handleChange}
               className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
             >
               <option value="">Select rank</option>
               <option value="Entered Apprentice">Entered Apprentice</option>
               <option value="Fellow Craft">Fellow Craft</option>
               <option value="Master Mason">Master Mason</option>
               <option value="Installed Master">Installed Master</option>
             </select>
           </div>
           
           {/* Grand Rank */}
           <div>
             <label htmlFor="grand_rank" className="block text-sm font-medium text-gray-700">
               Grand Rank
             </label>
             <input
               type="text"
               id="grand_rank"
               name="grand_rank"
               value={formData.grand_rank || ''}
               onChange={handleChange}
               className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
             />
           </div>
           
           {/* Grand Officer */}
           <div>
             <label htmlFor="grand_officer" className="block text-sm font-medium text-gray-700">
               Grand Officer
             </label>
             <select
               id="grand_officer"
               name="grand_officer"
               value={formData.grand_officer || ''}
               onChange={handleChange}
               className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
             >
               <option value="">Select</option>
               <option value="Yes">Yes</option>
               <option value="No">No</option>
             </select>
           </div>
           
           {/* Grand Office (show only if grand_officer is Yes) */}
           {formData.grand_officer === 'Yes' && (
             <div className="md:col-span-2">
               <label htmlFor="grand_office" className="block text-sm font-medium text-gray-700">
                 Grand Office
               </label>
               <select
                 id="grand_office"
                 name="grand_office"
                 value={formData.grand_office || ''}
                 onChange={handleChange}
                 className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
               >
                 <option value="">Select grand office</option>
                 <option value="Grand Master">Grand Master</option>
                 <option value="Deputy Grand Master">Deputy Grand Master</option>
                 <option value="Senior Grand Warden">Senior Grand Warden</option>
                 <option value="Junior Grand Warden">Junior Grand Warden</option>
                 <option value="Grand Director of Ceremonies">Grand Director of Ceremonies</option>
                 <option value="Other">Other</option>
               </select>
             </div>
           )}
           
           {/* Other Grand Office (show only if grand_office is Other) */}
           {formData.grand_officer === 'Yes' && formData.grand_office === 'Other' && (
             <div className="md:col-span-2">
               <label htmlFor="grand_office_other" className="block text-sm font-medium text-gray-700">
                 Specify Grand Office
               </label>
               <input
                 type="text"
                 id="grand_office_other"
                 name="grand_office_other"
                 value={formData.grand_office_other || ''}
                 onChange={handleChange}
                 className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
               />
             </div>
           )}
         </div>
         
         <div className="flex justify-end">
           <button
             type="submit"
             disabled={isSubmitting}
             className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
           >
             {isSubmitting ? 'Saving...' : 'Save Mason Profile'}
           </button>
         </div>
       </form>
     );
   };
   
   export default MasonProfileForm;
   ```

4. Create a Mason profile page or update the existing profile page:
   ```tsx
   // Option 1: Create a standalone Mason profile page
   // src/pages/MasonProfilePage.tsx
   
   import React, { useEffect, useState } from 'react';
   import { useAuth } from '../context/AuthContext';
   import { getCurrentCustomer } from '../lib/api/customers';
   import { getMasonByCustomerId, createMason, updateMason } from '../lib/api/masons';
   import { Mason, MasonFormData } from '../shared/types/mason';
   import MasonProfileForm from '../components/MasonProfileForm';
   
   const MasonProfilePage: React.FC = () => {
     const { user } = useAuth();
     const [customerId, setCustomerId] = useState<string | null>(null);
     const [mason, setMason] = useState<Mason | null>(null);
     const [loading, setLoading] = useState(true);
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const [success, setSuccess] = useState<string | null>(null);
     
     useEffect(() => {
       // Fetch customer and mason data when component mounts
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
           
           // Then get mason data if it exists
           const masonData = await getMasonByCustomerId(customer.id);
           setMason(masonData);
         } catch (err) {
           console.error('Error loading mason profile:', err);
           setError('Failed to load mason information.');
         } finally {
           setLoading(false);
         }
       }
       
       fetchData();
     }, [user]);
     
     const handleSubmit = async (formData: MasonFormData) => {
       if (!customerId) {
         setError('Customer profile not found');
         return;
       }
       
       setIsSubmitting(true);
       setError(null);
       setSuccess(null);
       
       try {
         let updatedMason;
         
         if (mason) {
           // Update existing mason
           updatedMason = await updateMason(mason.id, formData);
         } else {
           // Create new mason
           updatedMason = await createMason(customerId, formData);
         }
         
         if (updatedMason) {
           setMason(updatedMason);
           setSuccess('Mason profile saved successfully!');
           
           // Clear success message after 3 seconds
           setTimeout(() => setSuccess(null), 3000);
         } else {
           throw new Error('Failed to save mason profile');
         }
       } catch (err) {
         console.error('Error saving mason profile:', err);
         setError('Failed to save mason information.');
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
           <h1 className="text-3xl font-bold mb-6">Mason Profile</h1>
           
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
           
           {!customerId ? (
             <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
               <div className="flex">
                 <div className="ml-3">
                   <p className="text-yellow-700">
                     Please complete your customer profile before creating a mason profile.
                   </p>
                   <div className="mt-2">
                     <a href="/profile" className="text-yellow-700 underline font-medium">
                       Go to customer profile
                     </a>
                   </div>
                 </div>
               </div>
             </div>
           ) : (
             <div className="bg-white shadow-md rounded-lg p-6">
               <MasonProfileForm 
                 initialData={mason || undefined}
                 onSubmit={handleSubmit}
                 isSubmitting={isSubmitting}
               />
             </div>
           )}
         </div>
       </div>
     );
   };
   
   export default MasonProfilePage;
   ```

   ```tsx
   // Option 2: Update the existing profile page to include mason profile
   // Modify src/pages/ProfilePage.tsx to add a tab system
   
   import React, { useState, useEffect } from 'react';
   import { useAuth } from '../context/AuthContext';
   import CustomerProfileForm from '../components/CustomerProfileForm';
   import MasonProfileForm from '../components/MasonProfileForm';
   import { Customer, CustomerFormData } from '../shared/types/customer';
   import { Mason, MasonFormData } from '../shared/types/mason';
   import { getCurrentCustomer, createCustomer, updateCustomer } from '../lib/api/customers';
   import { getMasonByCustomerId, createMason, updateMason } from '../lib/api/masons';
   
   const ProfilePage: React.FC = () => {
     const { user } = useAuth();
     const [activeTab, setActiveTab] = useState<'customer' | 'mason'>('customer');
     
     const [customer, setCustomer] = useState<Customer | null>(null);
     const [mason, setMason] = useState<Mason | null>(null);
     
     const [loading, setLoading] = useState(true);
     const [customerSubmitting, setCustomerSubmitting] = useState(false);
     const [masonSubmitting, setMasonSubmitting] = useState(false);
     
     const [error, setError] = useState<string | null>(null);
     const [success, setSuccess] = useState<string | null>(null);
     
     useEffect(() => {
       // Fetch customer and mason data when component mounts
       async function fetchData() {
         if (!user) return;
         
         try {
           setLoading(true);
           
           // First get the customer
           const customerData = await getCurrentCustomer();
           setCustomer(customerData);
           
           // If customer exists, get mason data
           if (customerData) {
             const masonData = await getMasonByCustomerId(customerData.id);
             setMason(masonData);
           }
         } catch (err) {
           console.error('Error loading profiles:', err);
           setError('Failed to load profile information.');
         } finally {
           setLoading(false);
         }
       }
       
       fetchData();
     }, [user]);
     
     const handleCustomerSubmit = async (formData: CustomerFormData) => {
       setCustomerSubmitting(true);
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
           setSuccess('Customer profile saved successfully!');
           
           // Clear success message after 3 seconds
           setTimeout(() => setSuccess(null), 3000);
         } else {
           throw new Error('Failed to save customer profile');
         }
       } catch (err) {
         console.error('Error saving customer profile:', err);
         setError('Failed to save customer information.');
       } finally {
         setCustomerSubmitting(false);
       }
     };
     
     const handleMasonSubmit = async (formData: MasonFormData) => {
       if (!customer) {
         setError('Please complete your customer profile first');
         return;
       }
       
       setMasonSubmitting(true);
       setError(null);
       setSuccess(null);
       
       try {
         let updatedMason;
         
         if (mason) {
           // Update existing mason
           updatedMason = await updateMason(mason.id, formData);
         } else {
           // Create new mason
           updatedMason = await createMason(customer.id, formData);
         }
         
         if (updatedMason) {
           setMason(updatedMason);
           setSuccess('Mason profile saved successfully!');
           
           // Clear success message after 3 seconds
           setTimeout(() => setSuccess(null), 3000);
         } else {
           throw new Error('Failed to save mason profile');
         }
       } catch (err) {
         console.error('Error saving mason profile:', err);
         setError('Failed to save mason information.');
       } finally {
         setMasonSubmitting(false);
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
           
           {/* Tabs */}
           <div className="border-b border-gray-200 mb-6">
             <nav className="-mb-px flex space-x-8">
               <button
                 onClick={() => setActiveTab('customer')}
                 className={`${
                   activeTab === 'customer'
                     ? 'border-primary text-primary'
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
               >
                 Customer Information
               </button>
               <button
                 onClick={() => setActiveTab('mason')}
                 className={`${
                   activeTab === 'mason'
                     ? 'border-primary text-primary'
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
               >
                 Mason Information
               </button>
             </nav>
           </div>
           
           <div className="bg-white shadow-md rounded-lg p-6">
             {activeTab === 'customer' ? (
               <CustomerProfileForm 
                 initialData={customer || undefined}
                 onSubmit={handleCustomerSubmit}
                 isSubmitting={customerSubmitting}
               />
             ) : (
               <>
                 {!customer ? (
                   <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                     <div className="flex">
                       <div className="ml-3">
                         <p className="text-yellow-700">
                           Please complete your customer profile before creating a mason profile.
                         </p>
                         <div className="mt-2">
                           <button 
                             onClick={() => setActiveTab('customer')}
                             className="text-yellow-700 underline font-medium"
                           >
                             Go to customer profile
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>
                 ) : (
                   <MasonProfileForm 
                     initialData={mason || undefined}
                     onSubmit={handleMasonSubmit}
                     isSubmitting={masonSubmitting}
                   />
                 )}
               </>
             )}
           </div>
         </div>
       </div>
     );
   };
   
   export default ProfilePage;
   ```

5. Update the routing in App.tsx to include the Mason profile page (if using option 1):
   ```tsx
   // In src/App.tsx
   
   // Add import
   import MasonProfilePage from './pages/MasonProfilePage';
   
   // Add to routes
   <Route path="/mason-profile" element={
     <ProtectedRoute>
       <MasonProfilePage />
     </ProtectedRoute>
   } />
   ```

## Testing Steps

1. Create test cases for Mason profile functionality:
   ```typescript
   /* Test Cases
    * 1. Lodge Dropdown
    *    - Verify lodges load correctly in the dropdown
    *    - Check display format (name and number)
    *    - Ensure selection works correctly
    *
    * 2. Dependent Fields
    *    - Verify Grand Office field only shows when Grand Officer is "Yes"
    *    - Verify "Specify Other" field only shows when Grand Office is "Other"
    *
    * 3. Create Mason Profile
    *    - Complete customer profile first
    *    - Fill out mason form with required fields
    *    - Submit and verify creation
    *    - Check database for the new mason record
    *
    * 4. Update Mason Profile
    *    - Modify fields in the mason form
    *    - Submit and verify updates
    *    - Check database for the updated mason record
    *
    * 5. Navigation and UX
    *    - Verify tab navigation works correctly (if using tabs)
    *    - Check that users are prompted to complete customer profile first
    */
   ```

2. Test the lodge dropdown:
   - Log in and navigate to the mason profile page
   - Verify that lodges are loaded in the dropdown
   - Check that the lodge names and numbers are displayed correctly
   - Test selecting different lodges

3. Test conditional field display:
   - Select "Yes" for Grand Officer and verify Grand Office field appears
   - Select "Other" for Grand Office and verify the Specify field appears
   - Change Grand Officer to "No" and verify fields are hidden

4. Test Mason profile creation:
   - Create a customer profile if not already done
   - Navigate to the Mason profile form
   - Fill out the required fields (first name, last name)
   - Select a lodge
   - Enter rank and other details
   - Submit the form
   - Verify success message appears
   - Check database for the created mason record

5. Test Mason profile updates:
   - Navigate back to the mason profile
   - Verify form is pre-filled with existing data
   - Update some fields
   - Submit the form
   - Verify success message appears
   - Check database for the updated mason record

## Verification Checklist

Before moving to the next step, verify:

- [ ] Lodges are correctly loaded and displayed in the dropdown
- [ ] Mason profile data is correctly saved to the database
- [ ] Mason form loads and displays correctly
- [ ] Form pre-fills with existing mason data
- [ ] Conditional fields (Grand Office, etc.) show/hide appropriately
- [ ] Create and update operations work correctly
- [ ] Required field validation works
- [ ] Error messages are displayed appropriately
- [ ] Success messages are displayed after successful operations
- [ ] Loading states show during data fetching and submission
- [ ] UI is responsive and accessible
- [ ] Navigation between customer and mason profiles works correctly (if using tabs)

## Common Errors and Solutions

1. **Permission errors**
   - Check Row Level Security (RLS) policies on the masons and lodges tables
   - Ensure authenticated users can read/write their own data

2. **Lodge dropdown issues**
   - Verify that the lodges table has data
   - Check that the lodge display formatting handles null values

3. **Conditional field issues**
   - Ensure state updates correctly trigger UI changes
   - Test edge cases where values may be null

4. **Foreign key constraints**
   - Ensure the customer_id exists before creating a mason profile
   - Verify lodge_id references a valid lodge

5. **Form submission problems**
   - Check form validation logic
   - Verify that required fields are being handled correctly
   - Test error handling for failed submissions

After completing all verifications, clean up any temporary test code and commit your changes before moving on to the next step.
