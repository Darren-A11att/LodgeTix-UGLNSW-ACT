# Step 12: Registration Types Implementation

## Context
Now that we have implemented all attendee types (Mason, Mason's Partner, Guest, and Guest's Partner), we need to implement the registration types functionality. This will allow customers to select between different registration options when registering for events, which may have different pricing, eligibility, and included features.

## Objective
Implement the registration types system, including the API functions to fetch registration types, and the user interface components to select registration types during the event registration process.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated (Step 2)
- Authentication is implemented (Step 6)
- All attendee types are implemented (Steps 7-11)
- Understanding of the registration_types and ticket_definitions tables in the database

## Analysis Steps

1. First, examine the registration_types and ticket_definitions tables:
   ```typescript
   // Create a temporary script to analyze the tables
   import { supabase } from './lib/supabase';
   
   async function analyzeRegistrationTypes() {
     try {
       // Get the registration_types table columns
       const { data: typeColumns, error: typeError } = await supabase
         .from('information_schema.columns')
         .select('column_name, data_type, is_nullable')
         .eq('table_name', 'registration_types')
         .order('ordinal_position');
       
       if (typeError) {
         console.error('Error fetching registration_types schema:', typeError);
         return;
       }
       
       console.log('Registration Types table schema:', typeColumns);
       
       // Get sample data
       const { data: typeData, error: dataError } = await supabase
         .from('registration_types')
         .select('*')
         .limit(5);
       
       if (dataError) {
         console.error('Error fetching registration_types data:', dataError);
         return;
       }
       
       console.log('Registration Types sample data:', typeData);
       
       // Check ticket definitions
       const { data: ticketDefs, error: ticketError } = await supabase
         .from('ticket_definitions')
         .select('*')
         .limit(5);
       
       if (ticketError) {
         console.error('Error fetching ticket_definitions data:', ticketError);
         return;
       }
       
       console.log('Ticket Definitions sample data:', ticketDefs);
     } catch (err) {
       console.error('Error analyzing registration types:', err);
     }
   }
   
   analyzeRegistrationTypes();
   ```

2. Understand how registration types relate to events and ticket definitions:
   ```typescript
   // Check relationship between events, registration types, and ticket definitions
   async function analyzeRegistrationRelationships() {
     try {
       // Get sample data to understand the relationships
       const { data, error } = await supabase
         .from('registration_types')
         .select(`
           *,
           events:event_id(*),
           ticket_definitions:id(*)
         `)
         .limit(5);
       
       if (error) {
         console.error('Error fetching relationship data:', error);
         return;
       }
       
       console.log('Registration relationships data:', data);
     } catch (err) {
       console.error('Error analyzing relationships:', err);
     }
   }
   
   analyzeRegistrationRelationships();
   ```

## Implementation Steps

1. Create interfaces for registration types and ticket definitions:
   ```typescript
   // Create a new file at src/shared/types/registration.ts
   
   export interface TicketDefinition {
     id: string;
     name: string;
     price: number;
     description?: string;
     eligibility_attendee_types?: string[];
     eligibility_mason_rank?: string;
     is_active?: boolean;
     event_id?: string;
     package_id?: string;
     created_at?: string;
   }
   
   export interface RegistrationType {
     id: string;
     name: string;
     description?: string;
     base_price: number;
     event_id: string;
     max_attendees?: number;
     display_order?: number;
     is_active?: boolean;
     eligibility_criteria?: any;
     created_at?: string;
     updated_at?: string;
     event?: any;
     ticket_definitions?: TicketDefinition[];
   }
   
   export interface RegistrationSelection {
     registrationTypeId: string;
     attendeeSelections: {
       attendeeId: string;
       attendeeType: 'mason' | 'mason_partner' | 'guest' | 'guest_partner';
       ticketDefinitionId: string;
     }[];
   }
   ```

2. Create API functions for registration types:
   ```typescript
   // Create a new file at src/lib/api/registrations.ts
   
   import { supabase } from '../supabase';
   import { RegistrationType, TicketDefinition, RegistrationSelection } from '../../shared/types/registration';
   
   /**
    * Fetches all registration types for an event
    * @param eventId The event ID to get registration types for
    * @returns Promise resolving to array of registration types
    */
   export async function getRegistrationTypesByEventId(eventId: string): Promise<RegistrationType[]> {
     try {
       const { data, error } = await supabase
         .from('registration_types')
         .select(`
           *,
           ticket_definitions!inner(*)
         `)
         .eq('event_id', eventId)
         .eq('is_active', true)
         .order('display_order', { ascending: true });
       
       if (error) {
         console.error('Error fetching registration types:', error);
         return [];
       }
       
       return data || [];
     } catch (err) {
       console.error('Unexpected error fetching registration types:', err);
       return [];
     }
   }
   
   /**
    * Fetches ticket definitions for a specific registration type
    * @param registrationTypeId The registration type ID
    * @returns Promise resolving to array of ticket definitions
    */
   export async function getTicketDefinitionsByRegistrationType(
     registrationTypeId: string
   ): Promise<TicketDefinition[]> {
     try {
       const { data, error } = await supabase
         .from('ticket_definitions')
         .select('*')
         .eq('registration_type_id', registrationTypeId)
         .eq('is_active', true);
       
       if (error) {
         console.error('Error fetching ticket definitions:', error);
         return [];
       }
       
       return data || [];
     } catch (err) {
       console.error('Unexpected error fetching ticket definitions:', err);
       return [];
     }
   }
   
   /**
    * Creates a new registration
    * @param customerId The customer ID making the registration
    * @param eventId The event ID being registered for
    * @param selection The registration selection data
    * @returns Promise resolving to the registration ID or null on error
    */
   export async function createRegistration(
     customerId: string,
     eventId: string,
     selection: RegistrationSelection
   ): Promise<string | null> {
     try {
       // First create the registration record
       const { data: registration, error: regError } = await supabase
         .from('registrations')
         .insert({
           customer_id: customerId,
           parent_event_id: eventId,
           registration_type: selection.registrationTypeId,
           payment_status: 'pending'
         })
         .select()
         .single();
       
       if (regError || !registration) {
         console.error('Error creating registration:', regError);
         return null;
       }
       
       // Then create attendee_ticket_assignments for each selected attendee
       const assignments = selection.attendeeSelections.map(attendeeSelection => ({
         registration_id: registration.id,
         attendee_link_id: attendeeSelection.attendeeId,
         ticket_definition_id: attendeeSelection.ticketDefinitionId,
         // You might need to calculate or look up the price here
         price_at_assignment: 0
       }));
       
       const { error: assignError } = await supabase
         .from('attendee_ticket_assignments')
         .insert(assignments);
       
       if (assignError) {
         console.error('Error creating ticket assignments:', assignError);
         // You might want to delete the registration here to avoid orphaned records
         return null;
       }
       
       return registration.id;
     } catch (err) {
       console.error('Unexpected error creating registration:', err);
       return null;
     }
   }
   ```

3. Create a Registration Type selection component:
   ```tsx
   // Create a new file at src/components/RegistrationTypeSelector.tsx
   
   import React, { useState, useEffect } from 'react';
   import { RegistrationType } from '../shared/types/registration';
   
   interface RegistrationTypeSelectorProps {
     registrationTypes: RegistrationType[];
     selectedTypeId: string | null;
     onSelect: (typeId: string) => void;
   }
   
   const RegistrationTypeSelector: React.FC<RegistrationTypeSelectorProps> = ({
     registrationTypes,
     selectedTypeId,
     onSelect
   }) => {
     if (registrationTypes.length === 0) {
       return (
         <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-6">
           <p className="text-amber-800">
             No registration types available for this event. Please contact the organizer.
           </p>
         </div>
       );
     }
     
     return (
       <div className="space-y-4">
         <h3 className="text-lg font-bold text-gray-900">Select Registration Type</h3>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
           {registrationTypes.map(regType => (
             <div 
               key={regType.id}
               className={`border rounded-lg p-4 cursor-pointer transition ${
                 selectedTypeId === regType.id
                   ? 'border-primary bg-primary/5'
                   : 'border-gray-200 hover:border-primary/50'
               }`}
               onClick={() => onSelect(regType.id)}
             >
               <div className="flex justify-between items-start mb-2">
                 <h4 className="font-bold text-gray-900">{regType.name}</h4>
                 <span className="text-primary font-bold">
                   ${regType.base_price.toFixed(2)}
                 </span>
               </div>
               
               {regType.description && (
                 <p className="text-sm text-gray-600 mb-4">{regType.description}</p>
               )}
               
               {regType.ticket_definitions && regType.ticket_definitions.length > 0 && (
                 <div className="mt-2">
                   <h5 className="text-xs font-medium text-gray-700 mb-1">Includes:</h5>
                   <ul className="text-xs text-gray-600 space-y-1">
                     {regType.ticket_definitions.map(ticket => (
                       <li key={ticket.id} className="flex items-center">
                         <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5" />
                         {ticket.name}
                       </li>
                     ))}
                   </ul>
                 </div>
               )}
               
               {regType.max_attendees && (
                 <div className="mt-3 text-xs text-amber-800">
                   Limited to {regType.max_attendees} attendees
                 </div>
               )}
             </div>
           ))}
         </div>
       </div>
     );
   };
   
   export default RegistrationTypeSelector;
   ```

4. Create an Attendee Ticket Assignment component:
   ```tsx
   // Create a new file at src/components/AttendeeTicketAssignment.tsx
   
   import React, { useState, useEffect } from 'react';
   import { TicketDefinition } from '../shared/types/registration';
   import { Mason } from '../shared/types/mason';
   import { Guest } from '../shared/types/guest';
   
   interface AttendeeOption {
     id: string;
     type: 'mason' | 'mason_partner' | 'guest' | 'guest_partner';
     name: string;
     details?: string;
   }
   
   interface AttendeeTicketAssignmentProps {
     ticketDefinitions: TicketDefinition[];
     availableAttendees: AttendeeOption[];
     onAssign: (attendeeId: string, attendeeType: string, ticketId: string) => void;
     existingAssignments?: Record<string, string>; // attendeeId -> ticketId
   }
   
   const AttendeeTicketAssignment: React.FC<AttendeeTicketAssignmentProps> = ({
     ticketDefinitions,
     availableAttendees,
     onAssign,
     existingAssignments = {}
   }) => {
     if (ticketDefinitions.length === 0 || availableAttendees.length === 0) {
       return (
         <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
           <p className="text-gray-500">
             No tickets or attendees available for assignment.
           </p>
         </div>
       );
     }
     
     return (
       <div className="space-y-6">
         <h3 className="text-lg font-bold text-gray-900">Assign Tickets to Attendees</h3>
         
         <div className="space-y-4">
           {availableAttendees.map(attendee => (
             <div key={attendee.id} className="border rounded-lg p-4">
               <div className="flex justify-between items-start mb-3">
                 <div>
                   <h4 className="font-bold text-gray-900">{attendee.name}</h4>
                   {attendee.details && (
                     <p className="text-xs text-gray-600">{attendee.details}</p>
                   )}
                 </div>
                 <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                   {attendee.type === 'mason' ? 'Mason' : 
                    attendee.type === 'mason_partner' ? 'Partner' :
                    attendee.type === 'guest' ? 'Guest' : 'Guest Partner'}
                 </span>
               </div>
               
               <div>
                 <label htmlFor={`ticket-${attendee.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                   Select Ticket
                 </label>
                 <select
                   id={`ticket-${attendee.id}`}
                   value={existingAssignments[attendee.id] || ''}
                   onChange={(e) => onAssign(attendee.id, attendee.type, e.target.value)}
                   className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                 >
                   <option value="">Select a ticket...</option>
                   {ticketDefinitions
                     .filter(ticket => {
                       // Filter tickets by attendee type eligibility if specified
                       if (!ticket.eligibility_attendee_types || ticket.eligibility_attendee_types.length === 0) {
                         return true;
                       }
                       return ticket.eligibility_attendee_types.includes(attendee.type);
                     })
                     .map(ticket => (
                       <option key={ticket.id} value={ticket.id}>
                         {ticket.name} - ${ticket.price.toFixed(2)}
                       </option>
                     ))}
                 </select>
               </div>
             </div>
           ))}
         </div>
       </div>
     );
   };
   
   export default AttendeeTicketAssignment;
   ```

5. Update or create the RegisterPage to use these components:
   ```tsx
   // Create or update src/pages/RegisterPage.tsx
   
   import React, { useState, useEffect } from 'react';
   import { useNavigate, useLocation } from 'react-router-dom';
   import { useAuth } from '../context/AuthContext';
   import { getCurrentCustomer } from '../lib/api/customers';
   import { getMasonByCustomerId } from '../lib/api/masons';
   import { getPartnerByMasonId } from '../lib/api/partners';
   import { getGuestsByCustomerId, getPartnerByGuestId } from '../lib/api/guests';
   import { getEventById } from '../lib/api/events';
   import { getRegistrationTypesByEventId, createRegistration } from '../lib/api/registrations';
   import { EventType } from '../shared/types/event';
   import { Customer } from '../shared/types/customer';
   import { Mason } from '../shared/types/mason';
   import { Guest } from '../shared/types/guest';
   import { RegistrationType, RegistrationSelection } from '../shared/types/registration';
   import RegistrationTypeSelector from '../components/RegistrationTypeSelector';
   import AttendeeTicketAssignment from '../components/AttendeeTicketAssignment';
   
   interface AttendeeOption {
     id: string;
     type: 'mason' | 'mason_partner' | 'guest' | 'guest_partner';
     name: string;
     details?: string;
   }
   
   const RegisterPage: React.FC = () => {
     const { user } = useAuth();
     const navigate = useNavigate();
     const location = useLocation();
     
     // Get selected event ID from location state or URL param
     const selectedEventId = 
       location.state?.selectedEventId || 
       new URLSearchParams(location.search).get('eventId');
     
     // State
     const [event, setEvent] = useState<EventType | null>(null);
     const [customer, setCustomer] = useState<Customer | null>(null);
     const [mason, setMason] = useState<Mason | null>(null);
     const [masonPartner, setMasonPartner] = useState<Guest | null>(null);
     const [guests, setGuests] = useState<Guest[]>([]);
     const [guestPartners, setGuestPartners] = useState<Record<string, Guest | null>>({});
     const [registrationTypes, setRegistrationTypes] = useState<RegistrationType[]>([]);
     const [availableAttendees, setAvailableAttendees] = useState<AttendeeOption[]>([]);
     
     const [selectedRegTypeId, setSelectedRegTypeId] = useState<string | null>(null);
     const [ticketAssignments, setTicketAssignments] = useState<Record<string, string>>({});
     
     const [loading, setLoading] = useState(true);
     const [submitting, setSubmitting] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const [success, setSuccess] = useState<string | null>(null);
     
     // Effects
     useEffect(() => {
       // Fetch event data
       async function fetchEventData() {
         if (!selectedEventId) return;
         
         try {
           const eventData = await getEventById(selectedEventId);
           setEvent(eventData);
           
           if (eventData) {
             const regTypes = await getRegistrationTypesByEventId(eventData.id);
             setRegistrationTypes(regTypes);
             
             // Select first registration type by default
             if (regTypes.length > 0 && !selectedRegTypeId) {
               setSelectedRegTypeId(regTypes[0].id);
             }
           }
         } catch (err) {
           console.error('Error fetching event data:', err);
           setError('Failed to load event information.');
         }
       }
       
       fetchEventData();
     }, [selectedEventId]);
     
     useEffect(() => {
       // Fetch customer and attendee data
       async function fetchAttendeeData() {
         if (!user) return;
         
         try {
           // Get customer
           const customerData = await getCurrentCustomer();
           setCustomer(customerData);
           
           if (!customerData) {
             setError('Please complete your customer profile before registering.');
             setLoading(false);
             return;
           }
           
           // Get mason
           const masonData = await getMasonByCustomerId(customerData.id);
           setMason(masonData);
           
           // Get mason's partner if mason exists
           if (masonData) {
             const partnerData = await getPartnerByMasonId(masonData.id);
             setMasonPartner(partnerData);
           }
           
           // Get guests
           const guestsData = await getGuestsByCustomerId(customerData.id);
           setGuests(guestsData);
           
           // Get guest partners
           const partnerPromises = guestsData.map(async (guest) => {
             const partnerData = await getPartnerByGuestId(guest.id);
             return { guestId: guest.id, partner: partnerData };
           });
           
           const partnersResults = await Promise.all(partnerPromises);
           const partnersMap: Record<string, Guest | null> = {};
           
           partnersResults.forEach(result => {
             partnersMap[result.guestId] = result.partner;
           });
           
           setGuestPartners(partnersMap);
         } catch (err) {
           console.error('Error fetching attendee data:', err);
           setError('Failed to load attendee information.');
         } finally {
           setLoading(false);
         }
       }
       
       fetchAttendeeData();
     }, [user]);
     
     // Update available attendees whenever attendee data changes
     useEffect(() => {
       const attendees: AttendeeOption[] = [];
       
       // Add mason if exists
       if (mason) {
         attendees.push({
           id: mason.id,
           type: 'mason',
           name: `${mason.title || ''} ${mason.first_name} ${mason.last_name}`.trim(),
           details: mason.lodge?.name ? `Lodge: ${mason.lodge.name}` : undefined
         });
       }
       
       // Add mason's partner if exists
       if (masonPartner) {
         attendees.push({
           id: masonPartner.id,
           type: 'mason_partner',
           name: `${masonPartner.title || ''} ${masonPartner.first_name} ${masonPartner.last_name}`.trim(),
           details: 'Partner of Mason'
         });
       }
       
       // Add guests
       guests.forEach(guest => {
         attendees.push({
           id: guest.id,
           type: 'guest',
           name: `${guest.title || ''} ${guest.first_name} ${guest.last_name}`.trim()
         });
         
         // Add guest's partner if exists
         const partner = guestPartners[guest.id];
         if (partner) {
           attendees.push({
             id: partner.id,
             type: 'guest_partner',
             name: `${partner.title || ''} ${partner.first_name} ${partner.last_name}`.trim(),
             details: `Partner of ${guest.first_name} ${guest.last_name}`
           });
         }
       });
       
       setAvailableAttendees(attendees);
     }, [mason, masonPartner, guests, guestPartners]);
     
     // Handlers
     const handleRegTypeSelect = (typeId: string) => {
       setSelectedRegTypeId(typeId);
       // Reset ticket assignments when registration type changes
       setTicketAssignments({});
     };
     
     const handleTicketAssign = (attendeeId: string, attendeeType: string, ticketId: string) => {
       if (ticketId === '') {
         // Remove assignment if empty selection
         const newAssignments = { ...ticketAssignments };
         delete newAssignments[attendeeId];
         setTicketAssignments(newAssignments);
       } else {
         // Add or update assignment
         setTicketAssignments(prev => ({
           ...prev,
           [attendeeId]: ticketId
         }));
       }
     };
     
     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       
       if (!customer || !event || !selectedRegTypeId) {
         setError('Missing required information. Please complete all fields.');
         return;
       }
       
       // Validate that at least one ticket is assigned
       const assignedAttendees = Object.keys(ticketAssignments);
       if (assignedAttendees.length === 0) {
         setError('Please assign at least one ticket to an attendee.');
         return;
       }
       
       setSubmitting(true);
       setError(null);
       setSuccess(null);
       
       try {
         // Create registration selection
         const selection: RegistrationSelection = {
           registrationTypeId: selectedRegTypeId,
           attendeeSelections: assignedAttendees.map(attendeeId => {
             const attendee = availableAttendees.find(a => a.id === attendeeId);
             return {
               attendeeId,
               attendeeType: attendee?.type || 'guest', // Default to guest if type not found
               ticketDefinitionId: ticketAssignments[attendeeId]
             };
           })
         };
         
         // Create registration
         const registrationId = await createRegistration(
           customer.id,
           event.id,
           selection
         );
         
         if (!registrationId) {
           throw new Error('Failed to create registration');
         }
         
         setSuccess('Registration created successfully!');
         
         // Navigate to checkout page
         setTimeout(() => {
           navigate(`/checkout/${registrationId}`);
         }, 1500);
       } catch (err) {
         console.error('Error creating registration:', err);
         setError('Failed to create registration. Please try again.');
       } finally {
         setSubmitting(false);
       }
     };
     
     // Show loading state
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
     
     // Show error for missing event
     if (!selectedEventId || !event) {
       return (
         <div className="container-custom py-8">
           <div className="max-w-3xl mx-auto">
             <div className="bg-red-50 border-l-4 border-red-500 p-4">
               <div className="flex">
                 <div className="ml-3">
                   <p className="text-red-700">
                     No event selected. Please select an event to register for.
                   </p>
                   <div className="mt-2">
                     <button
                       onClick={() => navigate('/events')}
                       className="text-red-700 underline font-medium"
                     >
                       Browse Events
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       );
     }
     
     // Show message if no customer profile
     if (!customer) {
       return (
         <div className="container-custom py-8">
           <div className="max-w-3xl mx-auto">
             <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
               <div className="flex">
                 <div className="ml-3">
                   <p className="text-yellow-700">
                     Please complete your customer profile before registering for events.
                   </p>
                   <div className="mt-2">
                     <button
                       onClick={() => navigate('/profile')}
                       className="text-yellow-700 underline font-medium"
                     >
                       Complete Profile
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       );
     }
     
     // Main registration form
     return (
       <div className="container-custom py-8">
         <div className="max-w-3xl mx-auto">
           <h1 className="text-3xl font-bold mb-2">Register for Event</h1>
           <h2 className="text-xl text-gray-600 mb-6">{event.title}</h2>
           
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
           
           <form onSubmit={handleSubmit}>
             <div className="space-y-8">
               {/* Event Info Card */}
               <div className="bg-white shadow-md rounded-lg overflow-hidden">
                 {event.imageSrc && (
                   <div 
                     className="h-32 bg-cover bg-center"
                     style={{ backgroundImage: `url('${event.imageSrc}')` }}
                   ></div>
                 )}
                 <div className="p-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     <div>
                       <h3 className="text-sm font-medium text-gray-500">Date</h3>
                       <p>{event.day}</p>
                     </div>
                     <div>
                       <h3 className="text-sm font-medium text-gray-500">Time</h3>
                       <p>{event.time}</p>
                     </div>
                     <div>
                       <h3 className="text-sm font-medium text-gray-500">Location</h3>
                       <p>{event.location}</p>
                     </div>
                     {event.type && (
                       <div>
                         <h3 className="text-sm font-medium text-gray-500">Event Type</h3>
                         <p>{event.type}</p>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
               
               {/* Registration Type Selection */}
               <div className="bg-white shadow-md rounded-lg p-6">
                 <RegistrationTypeSelector
                   registrationTypes={registrationTypes}
                   selectedTypeId={selectedRegTypeId}
                   onSelect={handleRegTypeSelect}
                 />
               </div>
               
               {/* Attendee Selection */}
               {selectedRegTypeId && (
                 <div className="bg-white shadow-md rounded-lg p-6">
                   {availableAttendees.length === 0 ? (
                     <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                       <p className="text-amber-800">
                         You don't have any attendees set up yet. Please add Mason or Guest profiles.
                       </p>
                       <div className="mt-2 flex space-x-4">
                         <button
                           type="button"
                           onClick={() => navigate('/profile')}
                           className="text-amber-800 underline font-medium"
                         >
                           Setup Mason Profile
                         </button>
                         <button
                           type="button"
                           onClick={() => navigate('/guests')}
                           className="text-amber-800 underline font-medium"
                         >
                           Manage Guests
                         </button>
                       </div>
                     </div>
                   ) : (
                     <AttendeeTicketAssignment
                       ticketDefinitions={
                         registrationTypes.find(rt => rt.id === selectedRegTypeId)?.ticket_definitions || []
                       }
                       availableAttendees={availableAttendees}
                       onAssign={handleTicketAssign}
                       existingAssignments={ticketAssignments}
                     />
                   )}
                 </div>
               )}
               
               {/* Submit Button */}
               <div className="flex justify-end">
                 <button
                   type="submit"
                   disabled={submitting || Object.keys(ticketAssignments).length === 0}
                   className={`px-6 py-3 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                     submitting || Object.keys(ticketAssignments).length === 0
                       ? 'bg-gray-400 cursor-not-allowed'
                       : 'bg-primary hover:bg-primary-700'
                   }`}
                 >
                   {submitting ? 'Processing...' : 'Continue to Payment'}
                 </button>
               </div>
             </div>
           </form>
         </div>
       </div>
     );
   };
   
   export default RegisterPage;
   ```

## Testing Steps

1. Create test cases for Registration Types functionality:
   ```typescript
   /* Test Cases
    * 1. Registration Type Display
    *    - Verify registration types are fetched and displayed correctly
    *    - Check that selection works
    *
    * 2. Ticket Definition Display
    *    - Verify ticket definitions are displayed correctly for each registration type
    *    - Check that eligibility filtering works correctly
    *
    * 3. Attendee List
    *    - Verify all attendee types (Mason, Mason Partner, Guest, Guest Partner) are displayed
    *    - Check attendee details are displayed correctly
    *
    * 4. Ticket Assignment
    *    - Test assigning tickets to different attendees
    *    - Test changing ticket assignments
    *    - Test removing ticket assignments
    *
    * 5. Form Validation
    *    - Test submitting without selecting registration type
    *    - Test submitting without assigning any tickets
    *
    * 6. Registration Creation
    *    - Test complete registration flow
    *    - Verify database records are created correctly
    */
   ```

2. Test registration type display:
   - Navigate to the registration page for an event
   - Verify that registration types are displayed
   - Check that selection works correctly
   - Test changing between different registration types

3. Test ticket definition display:
   - Verify that ticket definitions are displayed for each registration type
   - Check that eligibility filtering works correctly (if implemented)
   - Test that ticket prices are displayed correctly

4. Test attendee selection:
   - Verify all attendee types (Mason, Mason Partner, Guest, Guest Partner) are displayed
   - Check attendee details are displayed correctly
   - Test displaying attendees with missing information
   - Test with no attendees available

5. Test ticket assignments:
   - Test assigning tickets to different attendees
   - Test changing ticket assignments
   - Test removing ticket assignments
   - Verify validation ensures at least one ticket is assigned

6. Test form submission:
   - Test submitting with valid data
   - Verify that registration is created successfully
   - Check database records
   - Test error handling for failed submissions

## Verification Checklist

Before moving to the next step, verify:

- [ ] Registration types are fetched and displayed correctly
- [ ] Selection of registration types works correctly
- [ ] Ticket definitions are displayed correctly for each registration type
- [ ] Attendee list shows all available attendees
- [ ] Attendee details are displayed correctly
- [ ] Ticket assignment works correctly
- [ ] Validation ensures at least one ticket is assigned
- [ ] Form submission creates registration records correctly
- [ ] Error messages are displayed appropriately
- [ ] Success messages are displayed after successful operations
- [ ] Loading states show during data fetching and submission
- [ ] UI is responsive and accessible
- [ ] Navigation from registration to payment works correctly

## Common Errors and Solutions

1. **Permission errors**
   - Check Row Level Security (RLS) policies on registration tables
   - Ensure authenticated users can read/write their own data

2. **Missing data**
   - Verify that registration types and ticket definitions exist for the event
   - Test with events that have no registration types defined

3. **Eligibility issues**
   - Check that eligibility filtering works correctly
   - Test with different attendee types to verify correct tickets are displayed

4. **Data relationships**
   - Ensure foreign key relationships are maintained correctly
   - Check that registration records link to correct event, customer, and attendees

5. **UI/UX issues**
   - Ensure clear guidance is provided to the user throughout the process
   - Test with different screen sizes to ensure responsive design works

6. **Transaction failures**
   - Implement proper error handling for failed database operations
   - Consider using transactions to ensure all related records are created/updated atomically

After completing all verifications, clean up any temporary test code and commit your changes before moving on to the next step.
