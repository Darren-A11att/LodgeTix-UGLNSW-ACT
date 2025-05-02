import { supabase } from '../supabase';
import { PostgrestError } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  MasonData, 
  GuestData, 
  LadyPartnerData, 
  GuestPartnerData, 
  AttendeeTicket
} from '../../shared/types/register'; // Types ARE exported correctly
import { Database } from '../../shared/types/supabase'; // Adjust path as needed for DB types

/**
 * Creates a new pending registration record in the database.
 *
 * @param registrationType - The type of registration ('individual', 'lodge', etc.).
 * @param parentEventId - The UUID of the parent event being registered for.
 * @param customerId - The UUID of the customer making the registration.
 * @returns An object containing the new registrationId or an error object.
 */
export async function createPendingRegistration(
  registrationType: string,
  parentEventId: string,
  customerId: string
): Promise<{ registrationId: string | null; error: PostgrestError | null }> {
  if (!registrationType || !parentEventId || !customerId) {
    console.error('Missing required fields for creating pending registration.');
    return { registrationId: null, error: { message: 'Missing required fields.', details: '', hint: '', code: 'MISSING_FIELDS' } as PostgrestError };
  }

  try {
    const { data, error } = await supabase
      .from('registrations')
      .insert({
        registration_type: registrationType,
        parent_event_id: parentEventId,
        customer_id: customerId,
        payment_status: 'pending', // Explicitly set, though it might be the default
        // agree_to_terms will be set later
        // total_price_paid will be set later
        // stripe_payment_intent_id will be set later
      })
      .select('id') // Select only the id of the newly created row
      .single(); // Expect only one row back

    if (error) {
      console.error('Error creating pending registration:', error);
      return { registrationId: null, error };
    }

    if (!data || !data.id) {
        console.error('No data or ID returned after creating pending registration.');
         return { registrationId: null, error: { message: 'Failed to retrieve ID after insert.', details: '', hint: '', code: 'INSERT_FAILED' } as PostgrestError };
    }

    console.log(`Pending registration created with ID: ${data.id}`);
    return { registrationId: data.id, error: null };

  } catch (err) {
    console.error('Unexpected error creating pending registration:', err);
    const error = err instanceof Error ? { message: err.message, details: '', hint: '', code: 'UNEXPECTED_ERROR' } : { message: 'An unknown error occurred', details: '', hint: '', code: 'UNKNOWN_ERROR' };
    return { registrationId: null, error: error as PostgrestError };
  }
}

// TODO: Add function getCustomerIdForUser(userId: string): Promise<string | null>
// This function would query the 'customers' table based on the 'user_id' (auth.users.id)
// returning the corresponding customer 'id' (UUID).
// Example structure:
/*
export async function getCustomerIdForUser(userId: string): Promise<string | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching customer ID for user:', error);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.error('Unexpected error fetching customer ID:', err);
    return null;
  }
}
*/

// Interface for the fully joined Attendee data we expect after the query
// Explicitly define fields based on the SELECT query and generated types
interface JoinedAttendee {
  // Fields from 'attendees' table (use lowercase from generated types)
  attendeeid: string;
  // Use correct Enum path based on generator output inspection
  attendeetype: Database["public"]["Enums"]["attendee_type"]; 
  contactid: string;
  contactpreference: Database["public"]["Enums"]["attendee_contact_preference"];
  createdat: string;
  delegatedcontactid: string | null;
  dietaryrequirements: string | null;
  eventtitle: string | null;
  registrationid: string;
  relatedattendeeid: string | null;
  relationship: string | null;
  specialneeds: string | null;
  updatedat: string;
  // Use correct Table path based on generator output inspection
  contacts: Database["public"]["Tables"]["contacts"]["Row"] | null;
  masonicprofiles: Database["public"]["Tables"]["masonicprofiles"]["Row"] | null;
}

// Interface for the final structured data returned by the function
export interface RegistrationLoadData {
  // Use correct Table path
  registration: Database["public"]["Tables"]["registrations"]["Row"] | null;
  customer: Database["public"]["Tables"]["customers"]["Row"] | null;
  event: Database["public"]["Tables"]["events"]["Row"] | null;
  attendees: JoinedAttendee[]; 
  tickets: Database["public"]["Tables"]["tickets"]["Row"][];
  // Transformed arrays for direct use in frontend forms/contexts:
  masons: MasonData[];
  guests: GuestData[];
  ladyPartners: LadyPartnerData[];
  guestPartners: GuestPartnerData[];
  attendeeAddOrder: string[]; // Reconstruct the order if possible/needed
}

/**
 * Fetches all necessary data for loading/editing a registration based on the new schema.
 * Performs joins and transforms data into a structure usable by the frontend.
 * 
 * @param registrationId - The UUID of the registration to load.
 * @param supabaseClient - An initialized Supabase client instance.
 * @returns An object containing the fetched and transformed registration data.
 */
export async function getRegistrationLoadData(
  registrationId: string,
  supabaseClient: SupabaseClient = supabase // Default to the initialized client
): Promise<RegistrationLoadData> {

  const result: RegistrationLoadData = {
    registration: null,
    customer: null,
    event: null,
    attendees: [], // Initialize with JoinedAttendee[] type
    tickets: [],
    masons: [],
    guests: [],
    ladyPartners: [],
    guestPartners: [],
    attendeeAddOrder: [],
  };

  if (!registrationId) {
    throw new Error('Registration ID is required to load data.');
  }

  try {
    // 1. Fetch Registration record (using lowercase table name)
    const { data: registrationData, error: regError } = await supabaseClient
      .from('registrations') // Use lowercase table name
      .select('*')
      .eq('registrationid', registrationId) // Use lowercase column name
      .single();

    if (regError || !registrationData) {
      throw new Error(`Registration not found or error fetching: ${regError?.message || 'Not Found'}`);
    }
    result.registration = registrationData;

    // 2. Fetch linked Customer (using lowercase table name)
    if (registrationData.customerid) { // Use lowercase column name
      const { data: customerData, error: custError } = await supabaseClient
        .from('customers') // Use lowercase table name
        .select('*')
        .eq('customerid', registrationData.customerid) // Use lowercase column name
        .single();
      if (custError) console.error(`Error fetching customer ${registrationData.customerid}:`, custError.message);
      result.customer = customerData;
    } else {
      console.warn(`Registration ${registrationId} has no linked customerid.`);
    }

    // 3. Fetch linked Event
    if (registrationData.eventid) { // Use lowercase column name
      const { data: eventData, error: eventError } = await supabaseClient
        .from('events') // lowercase, existing table
        .select('*')
        .eq('id', registrationData.eventid) // Use lowercase column name for FK
        .single();
      if (eventError) console.error(`Error fetching event ${registrationData.eventid}:`, eventError.message);
      result.event = eventData;
    } else {
        console.warn(`Registration ${registrationId} has no linked eventid.`);
    }

    // 4. Fetch Attendees with joined Contacts and Masonic Profiles (lowercase tables/columns)
    const { data: attendeeData, error: attendeeError } = await supabaseClient
      .from('attendees') 
      .select(`
        *,
        contacts (*),
        masonicprofiles (*)
      `) 
      .eq('registrationid', registrationId) 
      .order('createdat', { ascending: true }); 

    if (attendeeError) {
      throw new Error(`Error fetching attendees: ${attendeeError.message}`);
    }
    // Cast the result to the explicitly defined JoinedAttendee[] type
    result.attendees = attendeeData as JoinedAttendee[]; 

    // 5. Fetch Tickets for these Attendees (lowercase tables/columns)
    const attendeeIds = result.attendees.map(a => a.attendeeid); // Use lowercase column name
    if (attendeeIds.length > 0) {
      const { data: ticketData, error: ticketError } = await supabaseClient
        .from('tickets') // lowercase table name
        .select('*')
        .in('attendeeid', attendeeIds); // lowercase column name

      if (ticketError) {
        console.error(`Error fetching tickets for attendees:`, ticketError.message);
        // Decide if this should throw or just result in empty tickets array
      }
      result.tickets = ticketData || [];
    }

    // 6. Data Transformation (Fix mapping to frontend types)
    const attendeeIdToFrontendIdMap = new Map<string, string>();
    const backendIdToAttendeeMap = new Map<string, JoinedAttendee>();
    result.attendees.forEach(att => {
      attendeeIdToFrontendIdMap.set(att.attendeeid, att.attendeeid);
      backendIdToAttendeeMap.set(att.attendeeid, att);
    });

    result.attendeeAddOrder = result.attendees.map(a => a.attendeeid); 

    for (const attendee of result.attendees) {
      const contact = attendee.contacts;
      const profile = attendee.masonicprofiles;
      const frontendId = attendee.attendeeid; 

      if (!contact) {
        console.warn(`Attendee ${attendee.attendeeid} is missing linked Contact data.`);
        continue;
      }

      // Map database tickets to frontend AttendeeTicket format
      const mappedTickets: AttendeeTicket | undefined = (() => {
        const relatedDbTickets = result.tickets.filter(t => t.attendeeid === attendee.attendeeid);
        if (relatedDbTickets.length === 0) return undefined;
        // Assuming the frontend type expects one primary ticket definition ID
        // and a list of event IDs it applies to.
        const primaryTicketDefId = relatedDbTickets[0].ticketdefinitionid;
        if (!primaryTicketDefId) return undefined; // Need a definition ID
        const eventIds = relatedDbTickets.map(t => t.eventid);
        return {
          ticketId: primaryTicketDefId,
          events: eventIds,
        };
      })();

      // Base data mapping - common fields for all frontend types
      const baseData = {
        id: frontendId,
        firstName: contact.firstname,
        lastName: contact.lastname,
        title: attendee.eventtitle || contact.title, 
        phone: contact.primaryphone || '',
        email: contact.primaryemail || '',
        dietary: attendee.dietaryrequirements || '',
        specialNeeds: attendee.specialneeds || '',
        contactPreference: attendee.contactpreference as string, 
      };

      switch (attendee.attendeetype) { 
        case 'Mason':
          // SIMPLIFIED MAPPING: Map only known fields from base + profile
          // Assumes MasonData type (from ./mason) requires these.
          // Add other fields only if defined in the actual MasonData type.
          const masonData: MasonData = {
              ...baseData,
              isPrimary: attendee.attendeeid === result.registration?.primaryattendeeid, 
              // From profile (nullable in DB, provide defaults if needed by MasonData)
              masonicTitle: profile?.masonictitle,
              rank: profile?.rank,
              grandRank: profile?.grandrank,
              grandOfficer: profile?.grandofficer,
              grandOffice: profile?.grandoffice,
              lodgeId: profile?.lodgeid, 
              // Required flags/fields from MasonData (assuming defaults)
              sameLodgeAsPrimary: false, // Default, logic needed
              hasLadyPartner: false,    // Default, logic needed
              contactConfirmed: false,   // Default
              // Map the ticket if it exists
              ticket: mappedTickets,
              // --- Remove fields likely not in MasonData or needing complex logic/fetch ---
              // dbId: attendee.attendeeid, 
              // customerId: null, 
              // grandLodgeId: null, 
              // grandOfficeOther: '', 
              // lodgeName: undefined, 
              // grandLodgeName: undefined, 
              // isPendingNewLodge: false, 
              // pendingLodgeDetails: null, 
          };
          result.masons.push(masonData);
          break;

        case 'Guest':
          const guestData: GuestData = {
              ...baseData,
              // Add required fields from GuestData definition
              hasPartner: false, // Default, logic needed based on related attendees
              contactConfirmed: false, // Default, DB doesn't store this
              ticket: mappedTickets,
          };
          result.guests.push(guestData);
          break;

        case 'LadyPartner':
          // const relatedMasonAttendeeIdL = attendee.relatedattendeeid;
          // const relatedMasonFrontendIdL = relatedMasonAttendeeIdL ? attendeeIdToFrontendIdMap.get(relatedMasonAttendeeIdL) : undefined;
          const ladyPartnerData: LadyPartnerData = {
            ...baseData,
            relationship: attendee.relationship || 'Partner', 
            // Removed masonId - does not exist on LadyPartnerData type in register.ts
            masonIndex: 0, // Default, requires reconstruction logic if needed
            contactConfirmed: false, // Default
            ticket: mappedTickets,
          };
          result.ladyPartners.push(ladyPartnerData);
          break;

        case 'GuestPartner':
            // const relatedGuestAttendeeIdG = attendee.relatedattendeeid;
            // const relatedGuestFrontendIdG = relatedGuestAttendeeIdG ? attendeeIdToFrontendIdMap.get(relatedGuestAttendeeIdG) : undefined;
           const guestPartnerData: GuestPartnerData = {
            ...baseData,
            relationship: attendee.relationship || 'Partner', 
             // Removed guestId - does not exist on GuestPartnerData type in register.ts
            guestIndex: 0, // Default, requires reconstruction logic if needed
            contactConfirmed: false, // Default
            ticket: mappedTickets,
           };
          result.guestPartners.push(guestPartnerData);
          break;
      }
    }

    return result;

  } catch (error: any) {
    console.error(`Failed to load registration data for ${registrationId}:`, error);
    throw error;
  }
} 