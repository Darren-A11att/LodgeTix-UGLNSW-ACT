import { supabase } from '../supabase';
import { PostgrestError } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from '../../../supabase/supabase.types'; // Ensure Json is imported if needed later
import { supabaseTables, supabaseSchemas } from '../supabase'; // Import constants

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
      .from('Registrations')
      .insert({
        registrationType: registrationType,
        parentEventId: parentEventId,
        customerId: customerId,
        paymentStatus: 'pending', // Explicitly set, though it might be the default
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
// This function would query the 'customers' table based on the 'userId' (auth.users.id)
// returning the corresponding customer 'id' (UUID).
// Example structure:
/*
export async function getCustomerIdForUser(userId: string): Promise<string | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('Customers')
      .select('id')
      .eq('userId', userId)
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

// Define a frontend-friendly Attendee type combining data from different tables
// This replaces MasonData, GuestData etc.
export interface AttendeeData {
  // From people table (via join)
  personId: string;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  // Potentially add address fields if needed by frontend

  // From Attendees table
  attendeeId: string; // Keep the specific attendee instance ID for this registration
  attendeeType: Database["public"]["Enums"]["attendee_type"];
  dietaryRequirements: string | null;
  specialNeeds: string | null;
  eventTitle: string | null; // Title specific to this event attendance
  contactPreference: Database["public"]["Enums"]["attendee_contact_preference"];
  relatedAttendeeId: string | null; // Still needed to link partners? Re-evaluate if needed.
  relationship: string | null;

  // From MasonicProfiles table (if applicable)
  masonicProfileId?: string | null;
  masonicTitle?: string | null;
  rank?: string | null;
  grandRank?: string | null;
  grandOfficer?: string | null;
  grandOffice?: string | null;
  lodgeId?: string | null; // FK to organisations table

  // Application/State specific flags (to be determined by frontend logic if possible)
  isPrimary?: boolean; // Can be derived by comparing attendeeId to registration.primaryAttendeeId
  contactConfirmed?: boolean; // This likely needs to be managed in the UI state, not loaded directly

  // Ticket Info (derived from Tickets table)
  ticket?: { // Simplified structure, adjust as needed
    ticketDefinitionId: string;
    // eventIds: string[]; // Or perhaps the specific Ticket record ID?
  } | null;
}

// Define types for the nested joined data explicitly
// Use actual table names as keys, matching Supabase join results
type PeopleData = Database["public"]["Tables"]["people"]["Row"];
type MasonicProfileData = Database["public"]["Tables"]["MasonicProfiles"]["Row"];

// Updated Interface for the raw DB data expected after the query
// Use literal keys for joined tables.
interface DbJoinedAttendee {
  // Fields from 'Attendees' table (use names from generated supabase.ts)
  attendeeid: string;
  attendeeType: Database["public"]["Enums"]["attendee_type"];
  contactPreference: Database["public"]["Enums"]["attendee_contact_preference"];
  createdat: string;
  dietaryRequirements: string | null;
  eventTitle: string | null;
  registrationid: string;
  relatedAttendeeId: string | null;
  relationship: string | null;
  specialNeeds: string | null;
  updatedat: string;
  person_id: string; // FK to people

  // Joined data will be nested under keys matching table names
  people: PeopleData | null; // Use the explicit type
  MasonicProfiles: MasonicProfileData | null; // Use PascalCase based on DB, and explicit type
}

// Updated Interface for the final structured data returned by the function
// Consolidates attendee types into a single array
export interface RegistrationLoadData {
  registration: Database["public"]["Tables"]["Registrations"]["Row"] | null;
  customer: Database["public"]["Tables"]["Customers"]["Row"] | null;
  event: Database["public"]["Tables"]["Events"]["Row"] | null;
  attendees: AttendeeData[]; // Unified array using the new AttendeeData type
  tickets: Database["public"]["Tables"]["Tickets"]["Row"][];
  // attendeeAddOrder: string[]; // Keep if order is important and loadable
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
  supabaseClient: SupabaseClient = supabase
): Promise<RegistrationLoadData> {
  // Initialize with the new structure
  const result: RegistrationLoadData = {
    registration: null,
    customer: null,
    event: null,
    attendees: [],
    tickets: [],
  };

  if (!registrationId) {
    throw new Error('Registration ID is required to load data.');
  }

  try {
    // 1. Fetch Registration record
    const { data: registrationData, error: regError } = await supabaseClient
      .from(supabaseTables.registrations)
      .select('*')
      .eq('registrationId', registrationId)
      .single();

    if (regError || !registrationData) {
      throw new Error(`Registration not found or error fetching: ${regError?.message || 'Not Found'}`);
    }
    result.registration = registrationData;

    // 2. Fetch linked Customer
    if (registrationData.customerId) {
      const { data: customerData, error: custError } = await supabaseClient
        .from(supabaseTables.customers)
        .select('*')
        .eq('id', registrationData.customerId)
        .single();
      if (custError) console.error(`Error fetching customer ${registrationData.customerId}:`, custError.message);
      result.customer = customerData;
    } else {
      console.warn(`Registration ${registrationId} has no linked customerId.`);
    }

    // 3. Fetch linked Event
    if (registrationData.eventId) {
      const { data: eventData, error: eventError } = await supabaseClient
        .from(supabaseTables.events)
        .select('*')
        .eq('id', registrationData.eventId)
        .single();
      if (eventError) console.error(`Error fetching event ${registrationData.eventId}:`, eventError.message);
      result.event = eventData;
    } else {
        console.warn(`Registration ${registrationId} has no linked eventId.`);
    }

    // 4. Fetch Attendees joining People and MasonicProfiles
    const { data: attendeeData, error: attendeeError } = await supabaseClient
      .from(supabaseTables.attendees)
      .select(`
        *,
        ${supabaseTables.people} ( * ),
        ${supabaseTables.masonicProfiles} ( * )
      `)
      .eq('registrationid', registrationId)
      .order('createdat', { ascending: true })
      .returns<DbJoinedAttendee[]>();

    if (attendeeError) {
      throw new Error(`Error fetching attendees: ${attendeeError.message}`);
    }
    const dbAttendees = attendeeData || [];

    // 5. Fetch Tickets for these Attendees
    const attendeeIds = dbAttendees.map(a => a.attendeeid).filter(Boolean);
    if (attendeeIds.length > 0) {
      const { data: ticketData, error: ticketError } = await supabaseClient
        .from(supabaseTables.tickets)
        .select('*')
        .in('attendeeid', attendeeIds)
        .returns<Database["public"]["Tables"]["Tickets"]["Row"][]>();

      if (ticketError) {
        console.error(`Error fetching tickets for attendees:`, ticketError.message);
      }
      result.tickets = ticketData || [];
    }

    // 6. Data Transformation: Map DbJoinedAttendee to AttendeeData
    result.attendees = dbAttendees.map(dbAttendee => {
      const person = dbAttendee.people;
      const profile = dbAttendee.MasonicProfiles;

      if (!person) {
        console.warn(`Attendee ${dbAttendee.attendeeid} is missing linked Person data. Skipping.`);
        return null;
      }

      const ticketInfo: AttendeeData['ticket'] = (() => {
        const dbTicket = result.tickets.find(t => t.attendeeid === dbAttendee.attendeeid);
        if (dbTicket && dbTicket.ticketdefinitionid) {
          return { ticketDefinitionId: dbTicket.ticketdefinitionid };
        }
        return null;
      })();

      const attendee: AttendeeData = {
        // From people
        personId: person.person_id,
        firstName: person.first_name,
        lastName: person.last_name,
        title: person.title,
        primaryEmail: person.primary_email,
        primaryPhone: person.primary_phone,

        // From Attendees
        attendeeId: dbAttendee.attendeeid,
        attendeeType: dbAttendee.attendeeType,
        dietaryRequirements: dbAttendee.dietaryRequirements,
        specialNeeds: dbAttendee.specialNeeds,
        eventTitle: dbAttendee.eventTitle || person.title,
        contactPreference: dbAttendee.contactPreference,
        relatedAttendeeId: dbAttendee.relatedAttendeeId,
        relationship: dbAttendee.relationship,

        // From MasonicProfiles
        masonicProfileId: profile?.masonicprofileid,
        masonicTitle: profile?.masonictitle,
        rank: profile?.rank,
        grandRank: profile?.grandrank,
        grandOfficer: profile?.grandofficer,
        grandOffice: profile?.grandoffice,
        lodgeId: profile?.lodgeid,

        // Derived/State flags
        isPrimary: dbAttendee.attendeeid === result.registration?.primaryAttendeeId,

        // Ticket Info
        ticket: ticketInfo,
      };

      return attendee;
    }).filter((att): att is AttendeeData => att !== null);

    return result;

  } catch (error: any) {
    console.error(`Failed to load registration data for ${registrationId}:`, error);
    throw error;
  }
} 