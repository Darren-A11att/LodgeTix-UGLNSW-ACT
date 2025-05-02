/**
 * @file register_updated.ts
 * 
 * This file defines TypeScript interfaces for the registration system,
 * aligning frontend types with the Supabase database schema while
 * maintaining backwards compatibility with existing UI components.
 * 
 * The type system is organized into several categories:
 * 1. Database Entity Interfaces - Match database table structures
 * 2. UI Entity Interfaces - Used by frontend components
 * 3. Form State Interface - Tracks registration state
 * 4. Transformation Functions - Convert between UI and DB formats
 * 5. Enum Types - Define valid values for categorical fields
 */

// ============================================================================
// Enum Types - Define valid values for categorical fields
// ============================================================================

/**
 * Type of attendee in the registration system
 */
export enum AttendeeType {
  Mason = 'Mason',
  Guest = 'Guest', 
  LadyPartner = 'LadyPartner',
  GuestPartner = 'GuestPartner'
}

/**
 * Contact preference for attendees
 */
export enum ContactPreference {
  Directly = 'Directly',
  PrimaryAttendee = 'PrimaryAttendee',
  Mason = 'Mason', // For lady partners
  Guest = 'Guest', // For guest partners
  ProvideLater = 'ProvideLater'
}

/**
 * Type of registration
 */
export enum RegistrationType {
  Individual = 'individual',
  Lodge = 'lodge',
  Delegation = 'delegation'
}

/**
 * Grand officer status
 */
export enum GrandOfficerStatus {
  Current = 'Current',
  Past = 'Past',
  None = 'None'
}

// ============================================================================
// Database Entity Interfaces - Match database table structures
// ============================================================================

/**
 * Represents a Contact in the database
 * Maps to the Contacts table
 */
export interface ContactData {
  contactId: string;
  firstName: string;
  lastName: string;
  title?: string;
  suffix?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  authUserId?: string;
  isOrganisation: boolean;
  dietaryRequirements?: string;
  specialNeeds?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Represents a Masonic Profile in the database
 * Maps to the MasonicProfiles table
 */
export interface MasonicProfileData {
  masonicProfileId: string;
  contactId: string;
  masonicTitle?: string;
  rank?: string;
  grandRank?: string;
  grandOfficer?: string;
  grandOffice?: string;
  grandOfficeOther?: string;
  lodgeId?: string;
  grandLodgeId?: string;
  sameLodgeAsPrimary?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Represents an Attendee in the database
 * Maps to the Attendees table
 */
export interface AttendeeData {
  attendeeId: string;
  registrationId: string;
  contactId: string;
  attendeeType: AttendeeType;
  eventTitle?: string;
  dietaryRequirements?: string;
  specialNeeds?: string;
  contactPreference: ContactPreference;
  delegatedContactId?: string;
  relatedAttendeeId?: string;
  relationship?: string;
  isPrimaryAttendee: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Represents a Ticket in the database
 * Maps to the Tickets table
 */
export interface TicketData {
  ticketId: string;
  attendeeId: string;
  eventId: string;
  ticketDefinitionId?: string;
  pricePaid: number;
  seatInfo?: string;
  status: string;
  checkedInAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Represents a Registration in the database
 * Maps to the registrations table
 */
export interface RegistrationData {
  registrationId: string;
  customerId: string;
  primaryAttendeeId?: string;
  parent_event_id: string;
  registration_type: string;
  total_price_paid?: number;
  payment_status: string;
  stripe_payment_intent_id?: string;
  agree_to_terms: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Represents a Customer in the database
 * Maps to the Customers table
 */
export interface CustomerData {
  customerId: string;
  contactId?: string;
  organisationId?: string;
  billingFirstName?: string;
  billingLastName?: string;
  billingOrganisationName?: string;
  billingEmail?: string;
  billingPhone?: string;
  billingStreetAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  stripeCustomerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// UI Entity Interfaces - Used by frontend components
// ============================================================================

/**
 * Represents a ticket selection for an attendee
 */
export interface AttendeeTicket {
  ticketId: string;
  events: string[]; // Array of selected event IDs
}

/**
 * Represents a ticket type/definition
 */
export interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  includes: string[];
}

/**
 * Represents a Mason in the UI
 */
export interface MasonData {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  rank: string;
  phone: string;
  email: string;
  lodge: string;
  grandLodge: string;
  dietary: string;
  specialNeeds: string;
  sameLodgeAsPrimary?: boolean;
  hasLadyPartner: boolean;
  grandRank?: string;
  grandOfficer?: string;
  grandOffice?: string;
  grandOfficeOther?: string;
  contactPreference?: ContactPreference;
  contactConfirmed?: boolean;
  ticket?: AttendeeTicket;

  // Fields for pending lodge creation
  isPendingNewLodge?: boolean;
  pendingLodgeDetails?: { name: string; number: string; grandLodgeId: string } | null;
  
  // Database IDs for linking - added in updated version
  contactId?: string; 
  masonicProfileId?: string;
  attendeeId?: string;
}

/**
 * Represents a Lady/Partner for a Mason in the UI
 */
export interface LadyPartnerData {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  dietary: string;
  specialNeeds: string;
  relationship: string;
  masonIndex: number; // Legacy field: tracks which Mason this Lady/Partner belongs to
  contactPreference: ContactPreference;
  phone: string;
  email: string;
  contactConfirmed: boolean;
  ticket?: AttendeeTicket;
  
  // Database IDs for linking - added in updated version
  contactId?: string;
  attendeeId?: string;
  relatedMasonId?: string; // The attendeeId of the Mason this Lady/Partner is related to
}

/**
 * Represents a Guest in the UI
 */
export interface GuestData {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dietary: string;
  specialNeeds: string;
  hasPartner: boolean;
  contactPreference: ContactPreference;
  contactConfirmed: boolean;
  ticket?: AttendeeTicket;
  
  // Database IDs for linking - added in updated version
  contactId?: string;
  attendeeId?: string;
}

/**
 * Represents a Guest's Partner in the UI
 */
export interface GuestPartnerData {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  dietary: string;
  specialNeeds: string;
  relationship: string;
  guestIndex: number; // Legacy field: tracks which Guest this Partner belongs to
  contactPreference: ContactPreference;
  phone: string;
  email: string;
  contactConfirmed: boolean;
  ticket?: AttendeeTicket;
  
  // Database IDs for linking - added in updated version
  contactId?: string;
  attendeeId?: string;
  relatedGuestId?: string; // The attendeeId of the Guest this Partner is related to
}

/**
 * Union type for all attendee data types for UI
 */
export type AttendeeDataUI = MasonData | LadyPartnerData | GuestData | GuestPartnerData;

// ============================================================================
// Form State Interface - Tracks registration state
// ============================================================================

/**
 * Represents the overall form state for registration
 */
export interface FormState {
  registrationType: RegistrationType;
  step: number;
  selectedTicket: string; // Legacy field for backward compatibility
  selectedEventId: string | null;
  masons: MasonData[];
  guests: GuestData[];
  ladyPartners: LadyPartnerData[];
  guestPartners: GuestPartnerData[];
  agreeToTerms: boolean;
  useUniformTicketing: boolean;
  attendeeAddOrder: { type: 'mason' | 'guest'; id: string }[];
  
  // Database tracking fields - added in updated version
  registrationId?: string;
  customerId?: string;
}

// ============================================================================
// Transformation Functions - Convert between UI and DB formats
// ============================================================================

/**
 * Transforms a UI Mason to database entities
 * @param mason The UI Mason data
 * @returns Object containing Contact, MasonicProfile, and Attendee data
 */
export function masonToDbEntities(mason: MasonData, registrationId: string): {
  contact: ContactData;
  masonicProfile: MasonicProfileData;
  attendee: AttendeeData;
} {
  // Create contact entity
  const contact: ContactData = {
    contactId: mason.contactId || crypto.randomUUID(),
    firstName: mason.firstName,
    lastName: mason.lastName,
    title: mason.title,
    primaryPhone: mason.phone,
    primaryEmail: mason.email,
    dietaryRequirements: mason.dietary,
    specialNeeds: mason.specialNeeds,
    isOrganisation: false
  };

  // Create masonic profile entity
  const masonicProfile: MasonicProfileData = {
    masonicProfileId: mason.masonicProfileId || crypto.randomUUID(),
    contactId: contact.contactId,
    masonicTitle: mason.title,
    rank: mason.rank,
    grandRank: mason.grandRank,
    grandOfficer: mason.grandOfficer,
    grandOffice: mason.grandOffice,
    grandOfficeOther: mason.grandOfficeOther,
    lodgeId: mason.lodge,
    grandLodgeId: mason.grandLodge,
    sameLodgeAsPrimary: mason.sameLodgeAsPrimary || false
  };

  // Create attendee entity
  const attendee: AttendeeData = {
    attendeeId: mason.attendeeId || crypto.randomUUID(),
    registrationId: registrationId,
    contactId: contact.contactId,
    attendeeType: AttendeeType.Mason,
    dietaryRequirements: mason.dietary,
    specialNeeds: mason.specialNeeds,
    contactPreference: mason.contactPreference || ContactPreference.Directly,
    isPrimaryAttendee: false // Will be set true for primary attendee later
  };

  return { contact, masonicProfile, attendee };
}

/**
 * Transforms a UI Lady/Partner to database entities
 * @param ladyPartner The UI Lady/Partner data
 * @param relatedMasonAttendeeId The attendeeId of the related Mason
 * @param registrationId The registration ID
 * @returns Object containing Contact and Attendee data
 */
export function ladyPartnerToDbEntities(
  ladyPartner: LadyPartnerData, 
  relatedMasonAttendeeId: string,
  registrationId: string
): {
  contact: ContactData;
  attendee: AttendeeData;
} {
  // Create contact entity
  const contact: ContactData = {
    contactId: ladyPartner.contactId || crypto.randomUUID(),
    firstName: ladyPartner.firstName,
    lastName: ladyPartner.lastName,
    title: ladyPartner.title,
    primaryPhone: ladyPartner.phone,
    primaryEmail: ladyPartner.email,
    dietaryRequirements: ladyPartner.dietary,
    specialNeeds: ladyPartner.specialNeeds,
    isOrganisation: false
  };

  // Create attendee entity
  const attendee: AttendeeData = {
    attendeeId: ladyPartner.attendeeId || crypto.randomUUID(),
    registrationId: registrationId,
    contactId: contact.contactId,
    attendeeType: AttendeeType.LadyPartner,
    dietaryRequirements: ladyPartner.dietary,
    specialNeeds: ladyPartner.specialNeeds,
    contactPreference: ladyPartner.contactPreference,
    relatedAttendeeId: relatedMasonAttendeeId,
    relationship: ladyPartner.relationship,
    isPrimaryAttendee: false
  };

  return { contact, attendee };
}

/**
 * Transforms a UI Guest to database entities
 * @param guest The UI Guest data
 * @param registrationId The registration ID
 * @returns Object containing Contact and Attendee data
 */
export function guestToDbEntities(
  guest: GuestData,
  registrationId: string
): {
  contact: ContactData;
  attendee: AttendeeData;
} {
  // Create contact entity
  const contact: ContactData = {
    contactId: guest.contactId || crypto.randomUUID(),
    firstName: guest.firstName,
    lastName: guest.lastName,
    title: guest.title,
    primaryPhone: guest.phone,
    primaryEmail: guest.email,
    dietaryRequirements: guest.dietary,
    specialNeeds: guest.specialNeeds,
    isOrganisation: false
  };

  // Create attendee entity
  const attendee: AttendeeData = {
    attendeeId: guest.attendeeId || crypto.randomUUID(),
    registrationId: registrationId,
    contactId: contact.contactId,
    attendeeType: AttendeeType.Guest,
    dietaryRequirements: guest.dietary,
    specialNeeds: guest.specialNeeds,
    contactPreference: guest.contactPreference,
    isPrimaryAttendee: false
  };

  return { contact, attendee };
}

/**
 * Transforms a UI Guest Partner to database entities
 * @param guestPartner The UI Guest Partner data
 * @param relatedGuestAttendeeId The attendeeId of the related Guest
 * @param registrationId The registration ID
 * @returns Object containing Contact and Attendee data
 */
export function guestPartnerToDbEntities(
  guestPartner: GuestPartnerData,
  relatedGuestAttendeeId: string,
  registrationId: string
): {
  contact: ContactData;
  attendee: AttendeeData;
} {
  // Create contact entity
  const contact: ContactData = {
    contactId: guestPartner.contactId || crypto.randomUUID(),
    firstName: guestPartner.firstName,
    lastName: guestPartner.lastName,
    title: guestPartner.title,
    primaryPhone: guestPartner.phone,
    primaryEmail: guestPartner.email,
    dietaryRequirements: guestPartner.dietary,
    specialNeeds: guestPartner.specialNeeds,
    isOrganisation: false
  };

  // Create attendee entity
  const attendee: AttendeeData = {
    attendeeId: guestPartner.attendeeId || crypto.randomUUID(),
    registrationId: registrationId,
    contactId: contact.contactId,
    attendeeType: AttendeeType.GuestPartner,
    dietaryRequirements: guestPartner.dietary,
    specialNeeds: guestPartner.specialNeeds,
    contactPreference: guestPartner.contactPreference,
    relatedAttendeeId: relatedGuestAttendeeId,
    relationship: guestPartner.relationship,
    isPrimaryAttendee: false
  };

  return { contact, attendee };
}

/**
 * Transforms an Attendee and Contact from database format to UI Mason format
 * @param attendee The database Attendee entity
 * @param contact The database Contact entity
 * @param masonicProfile The database MasonicProfile entity
 * @returns A UI-compatible Mason object
 */
export function dbEntitiesToMason(
  attendee: AttendeeData,
  contact: ContactData,
  masonicProfile: MasonicProfileData
): MasonData {
  return {
    id: attendee.attendeeId, // Use attendeeId as the frontend ID
    contactId: contact.contactId,
    masonicProfileId: masonicProfile.masonicProfileId,
    attendeeId: attendee.attendeeId,
    title: contact.title || '',
    firstName: contact.firstName,
    lastName: contact.lastName,
    rank: masonicProfile.rank || '',
    phone: contact.primaryPhone || '',
    email: contact.primaryEmail || '',
    lodge: masonicProfile.lodgeId || '',
    grandLodge: masonicProfile.grandLodgeId || '',
    dietary: contact.dietaryRequirements || '',
    specialNeeds: contact.specialNeeds || '',
    sameLodgeAsPrimary: masonicProfile.sameLodgeAsPrimary || false,
    hasLadyPartner: false, // This would be determined by querying related attendees
    grandRank: masonicProfile.grandRank,
    grandOfficer: masonicProfile.grandOfficer,
    grandOffice: masonicProfile.grandOffice,
    grandOfficeOther: masonicProfile.grandOfficeOther,
    contactPreference: attendee.contactPreference as ContactPreference,
    contactConfirmed: true, // Default to true for existing records
  };
}

/**
 * Transforms an Attendee and Contact from database format to UI Lady/Partner format
 * @param attendee The database Attendee entity
 * @param contact The database Contact entity
 * @param masonIndex The UI index of the related Mason (for compatibility)
 * @returns A UI-compatible LadyPartner object
 */
export function dbEntitiesToLadyPartner(
  attendee: AttendeeData,
  contact: ContactData,
  masonIndex: number
): LadyPartnerData {
  return {
    id: attendee.attendeeId, // Use attendeeId as the frontend ID
    contactId: contact.contactId,
    attendeeId: attendee.attendeeId,
    relatedMasonId: attendee.relatedAttendeeId,
    title: contact.title || '',
    firstName: contact.firstName,
    lastName: contact.lastName,
    dietary: contact.dietaryRequirements || '',
    specialNeeds: contact.specialNeeds || '',
    relationship: attendee.relationship || '',
    masonIndex, // Maintain UI compatibility
    contactPreference: attendee.contactPreference as ContactPreference,
    phone: contact.primaryPhone || '',
    email: contact.primaryEmail || '',
    contactConfirmed: true, // Default to true for existing records
  };
}

/**
 * Transforms an Attendee and Contact from database format to UI Guest format
 * @param attendee The database Attendee entity
 * @param contact The database Contact entity
 * @returns A UI-compatible Guest object
 */
export function dbEntitiesToGuest(
  attendee: AttendeeData,
  contact: ContactData
): GuestData {
  return {
    id: attendee.attendeeId, // Use attendeeId as the frontend ID
    contactId: contact.contactId,
    attendeeId: attendee.attendeeId,
    title: contact.title || '',
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.primaryPhone || '',
    email: contact.primaryEmail || '',
    dietary: contact.dietaryRequirements || '',
    specialNeeds: contact.specialNeeds || '',
    hasPartner: false, // This would be determined by querying related attendees
    contactPreference: attendee.contactPreference as ContactPreference,
    contactConfirmed: true, // Default to true for existing records
  };
}

/**
 * Transforms an Attendee and Contact from database format to UI Guest Partner format
 * @param attendee The database Attendee entity
 * @param contact The database Contact entity
 * @param guestIndex The UI index of the related Guest (for compatibility)
 * @returns A UI-compatible GuestPartner object
 */
export function dbEntitiesToGuestPartner(
  attendee: AttendeeData,
  contact: ContactData,
  guestIndex: number
): GuestPartnerData {
  return {
    id: attendee.attendeeId, // Use attendeeId as the frontend ID
    contactId: contact.contactId,
    attendeeId: attendee.attendeeId,
    relatedGuestId: attendee.relatedAttendeeId,
    title: contact.title || '',
    firstName: contact.firstName,
    lastName: contact.lastName,
    dietary: contact.dietaryRequirements || '',
    specialNeeds: contact.specialNeeds || '',
    relationship: attendee.relationship || '',
    guestIndex, // Maintain UI compatibility
    contactPreference: attendee.contactPreference as ContactPreference,
    phone: contact.primaryPhone || '',
    email: contact.primaryEmail || '',
    contactConfirmed: true, // Default to true for existing records
  };
}

/**
 * Transforms a database Ticket to a UI AttendeeTicket
 * @param ticket The database Ticket entity
 * @returns A UI-compatible AttendeeTicket object
 */
export function dbTicketToAttendeeTicket(ticket: TicketData): AttendeeTicket {
  return {
    ticketId: ticket.ticketDefinitionId || '',
    events: [ticket.eventId], // Include the event ID
  };
}

/**
 * Creates a new registration form state
 * @param registrationType Type of registration to create
 * @returns An initialized FormState object
 */
export function createNewFormState(registrationType: RegistrationType): FormState {
  return {
    registrationType,
    step: 1,
    selectedTicket: '',
    selectedEventId: null,
    masons: [],
    guests: [],
    ladyPartners: [],
    guestPartners: [],
    agreeToTerms: false,
    useUniformTicketing: true,
    attendeeAddOrder: []
  };
}

/**
 * Utility to find an attendee by ID across all attendee arrays in form state
 * @param formState The current form state
 * @param attendeeId The attendee ID to search for
 * @returns The attendee data or null if not found
 */
export function findAttendeeById(
  formState: FormState,
  attendeeId: string
): AttendeeDataUI | null {
  // Check masons
  const mason = formState.masons.find(m => m.id === attendeeId || m.attendeeId === attendeeId);
  if (mason) return mason;
  
  // Check guests
  const guest = formState.guests.find(g => g.id === attendeeId || g.attendeeId === attendeeId);
  if (guest) return guest;
  
  // Check lady partners
  const ladyPartner = formState.ladyPartners.find(lp => lp.id === attendeeId || lp.attendeeId === attendeeId);
  if (ladyPartner) return ladyPartner;
  
  // Check guest partners
  const guestPartner = formState.guestPartners.find(gp => gp.id === attendeeId || gp.attendeeId === attendeeId);
  if (guestPartner) return guestPartner;
  
  return null;
}

/**
 * Converts a form state to database entities for submission
 * @param formState The current form state
 * @returns All database entities needed for saving the registration
 */
export function formStateToDbEntities(formState: FormState): {
  registration: RegistrationData;
  contacts: ContactData[];
  masonicProfiles: MasonicProfileData[];
  attendees: AttendeeData[];
  tickets: TicketData[];
} {
  // Generate a registration ID if not already set
  const registrationId = formState.registrationId || crypto.randomUUID();
  
  // Arrays to store all entities
  const contacts: ContactData[] = [];
  const masonicProfiles: MasonicProfileData[] = [];
  const attendees: AttendeeData[] = [];
  const tickets: TicketData[] = [];
  
  // Process primary mason first (always the first mason)
  if (formState.masons.length > 0) {
    const primaryMason = formState.masons[0];
    const { contact, masonicProfile, attendee } = masonToDbEntities(primaryMason, registrationId);
    
    // Mark as primary attendee
    attendee.isPrimaryAttendee = true;
    
    contacts.push(contact);
    masonicProfiles.push(masonicProfile);
    attendees.push(attendee);
    
    // Add ticket if present
    if (primaryMason.ticket) {
      primaryMason.ticket.events.forEach(eventId => {
        tickets.push({
          ticketId: crypto.randomUUID(),
          attendeeId: attendee.attendeeId,
          eventId,
          ticketDefinitionId: primaryMason.ticket?.ticketId,
          pricePaid: 0, // Price would be retrieved from ticket definition
          status: 'Active'
        });
      });
    }
    
    // Process additional masons (skip the first one)
    for (let i = 1; i < formState.masons.length; i++) {
      const mason = formState.masons[i];
      const { contact, masonicProfile, attendee } = masonToDbEntities(mason, registrationId);
      
      contacts.push(contact);
      masonicProfiles.push(masonicProfile);
      attendees.push(attendee);
      
      // Add ticket if present
      if (mason.ticket) {
        mason.ticket.events.forEach(eventId => {
          tickets.push({
            ticketId: crypto.randomUUID(),
            attendeeId: attendee.attendeeId,
            eventId,
            ticketDefinitionId: mason.ticket?.ticketId,
            pricePaid: 0,
            status: 'Active'
          });
        });
      }
    }
  }
  
  // Process guests
  for (const guest of formState.guests) {
    const { contact, attendee } = guestToDbEntities(guest, registrationId);
    
    contacts.push(contact);
    attendees.push(attendee);
    
    // Add ticket if present
    if (guest.ticket) {
      guest.ticket.events.forEach(eventId => {
        tickets.push({
          ticketId: crypto.randomUUID(),
          attendeeId: attendee.attendeeId,
          eventId,
          ticketDefinitionId: guest.ticket?.ticketId,
          pricePaid: 0,
          status: 'Active'
        });
      });
    }
  }
  
  // Process lady partners
  for (const ladyPartner of formState.ladyPartners) {
    // Find related mason attendee ID
    const relatedMason = formState.masons[ladyPartner.masonIndex];
    let relatedMasonAttendeeId = '';
    
    if (relatedMason) {
      // If mason exists, use their attendee ID
      // Find the attendee we created above for this mason
      const masonAttendee = attendees.find(a => 
        a.contactId === relatedMason.contactId && 
        a.attendeeType === AttendeeType.Mason
      );
      
      if (masonAttendee) {
        relatedMasonAttendeeId = masonAttendee.attendeeId;
      }
    }
    
    const { contact, attendee } = ladyPartnerToDbEntities(
      ladyPartner, 
      relatedMasonAttendeeId, 
      registrationId
    );
    
    contacts.push(contact);
    attendees.push(attendee);
    
    // Add ticket if present
    if (ladyPartner.ticket) {
      ladyPartner.ticket.events.forEach(eventId => {
        tickets.push({
          ticketId: crypto.randomUUID(),
          attendeeId: attendee.attendeeId,
          eventId,
          ticketDefinitionId: ladyPartner.ticket?.ticketId,
          pricePaid: 0,
          status: 'Active'
        });
      });
    }
  }
  
  // Process guest partners
  for (const guestPartner of formState.guestPartners) {
    // Find related guest attendee ID
    const relatedGuest = formState.guests[guestPartner.guestIndex];
    let relatedGuestAttendeeId = '';
    
    if (relatedGuest) {
      // If guest exists, use their attendee ID
      // Find the attendee we created above for this guest
      const guestAttendee = attendees.find(a => 
        a.contactId === relatedGuest.contactId && 
        a.attendeeType === AttendeeType.Guest
      );
      
      if (guestAttendee) {
        relatedGuestAttendeeId = guestAttendee.attendeeId;
      }
    }
    
    const { contact, attendee } = guestPartnerToDbEntities(
      guestPartner, 
      relatedGuestAttendeeId, 
      registrationId
    );
    
    contacts.push(contact);
    attendees.push(attendee);
    
    // Add ticket if present
    if (guestPartner.ticket) {
      guestPartner.ticket.events.forEach(eventId => {
        tickets.push({
          ticketId: crypto.randomUUID(),
          attendeeId: attendee.attendeeId,
          eventId,
          ticketDefinitionId: guestPartner.ticket?.ticketId,
          pricePaid: 0,
          status: 'Active'
        });
      });
    }
  }
  
  // Create registration
  const registration: RegistrationData = {
    registrationId,
    customerId: formState.customerId || crypto.randomUUID(),
    parent_event_id: formState.selectedEventId || '',
    registration_type: formState.registrationType,
    payment_status: 'pending',
    agree_to_terms: formState.agreeToTerms
  };
  
  // Set primary attendee ID if we have one
  const primaryAttendee = attendees.find(a => a.isPrimaryAttendee);
  if (primaryAttendee) {
    registration.primaryAttendeeId = primaryAttendee.attendeeId;
  }
  
  return {
    registration,
    contacts,
    masonicProfiles,
    attendees,
    tickets
  };
}

/**
 * Converts database entities to a form state
 * @param registration Registration data from database
 * @param attendees Array of attendees from database
 * @param contacts Array of contacts from database
 * @param masonicProfiles Array of masonic profiles from database
 * @param tickets Array of tickets from database
 * @returns A fully populated form state ready for UI
 */
export function dbEntitiesToFormState(
  registration: RegistrationData,
  attendees: AttendeeData[],
  contacts: ContactData[],
  masonicProfiles: MasonicProfileData[],
  tickets: TicketData[]
): FormState {
  // Initialize form state with registration data
  const formState: FormState = {
    registrationId: registration.registrationId,
    customerId: registration.customerId,
    registrationType: registration.registration_type as RegistrationType,
    step: 1, // Always start at step 1
    selectedTicket: '',
    selectedEventId: registration.parent_event_id,
    masons: [],
    guests: [],
    ladyPartners: [],
    guestPartners: [],
    agreeToTerms: registration.agree_to_terms,
    useUniformTicketing: true, // Default to true
    attendeeAddOrder: []
  };
  
  // Find the primary attendee
  const primaryAttendee = attendees.find(a => a.isPrimaryAttendee);
  
  // Group attendees by type
  const masonAttendees = attendees.filter(a => a.attendeeType === AttendeeType.Mason);
  const guestAttendees = attendees.filter(a => a.attendeeType === AttendeeType.Guest);
  const ladyPartnerAttendees = attendees.filter(a => a.attendeeType === AttendeeType.LadyPartner);
  const guestPartnerAttendees = attendees.filter(a => a.attendeeType === AttendeeType.GuestPartner);
  
  // Process Masons - make sure primary attendee is first
  if (primaryAttendee && primaryAttendee.attendeeType === AttendeeType.Mason) {
    // Process primary mason first
    const contact = contacts.find(c => c.contactId === primaryAttendee.contactId);
    const profile = masonicProfiles.find(mp => mp.contactId === primaryAttendee.contactId);
    
    if (contact && profile) {
      formState.masons.push(dbEntitiesToMason(primaryAttendee, contact, profile));
      
      // Add to attendee order
      formState.attendeeAddOrder.push({ type: 'mason', id: primaryAttendee.attendeeId });
      
      // Get tickets for this attendee
      const attendeeTickets = tickets.filter(t => t.attendeeId === primaryAttendee.attendeeId);
      if (attendeeTickets.length > 0) {
        formState.masons[0].ticket = {
          ticketId: attendeeTickets[0].ticketDefinitionId || '',
          events: attendeeTickets.map(t => t.eventId)
        };
      }
    }
    
    // Filter out primary attendee from masonAttendees
    const otherMasonAttendees = masonAttendees.filter(a => a.attendeeId !== primaryAttendee.attendeeId);
    
    // Process other masons
    for (const masonAttendee of otherMasonAttendees) {
      const contact = contacts.find(c => c.contactId === masonAttendee.contactId);
      const profile = masonicProfiles.find(mp => mp.contactId === masonAttendee.contactId);
      
      if (contact && profile) {
        formState.masons.push(dbEntitiesToMason(masonAttendee, contact, profile));
        
        // Add to attendee order
        formState.attendeeAddOrder.push({ type: 'mason', id: masonAttendee.attendeeId });
        
        // Get tickets for this attendee
        const attendeeTickets = tickets.filter(t => t.attendeeId === masonAttendee.attendeeId);
        if (attendeeTickets.length > 0) {
          const lastIndex = formState.masons.length - 1;
          formState.masons[lastIndex].ticket = {
            ticketId: attendeeTickets[0].ticketDefinitionId || '',
            events: attendeeTickets.map(t => t.eventId)
          };
        }
      }
    }
  } else {
    // No primary Mason, just process all Mason attendees
    for (const masonAttendee of masonAttendees) {
      const contact = contacts.find(c => c.contactId === masonAttendee.contactId);
      const profile = masonicProfiles.find(mp => mp.contactId === masonAttendee.contactId);
      
      if (contact && profile) {
        formState.masons.push(dbEntitiesToMason(masonAttendee, contact, profile));
        
        // Add to attendee order
        formState.attendeeAddOrder.push({ type: 'mason', id: masonAttendee.attendeeId });
        
        // Get tickets for this attendee
        const attendeeTickets = tickets.filter(t => t.attendeeId === masonAttendee.attendeeId);
        if (attendeeTickets.length > 0) {
          const lastIndex = formState.masons.length - 1;
          formState.masons[lastIndex].ticket = {
            ticketId: attendeeTickets[0].ticketDefinitionId || '',
            events: attendeeTickets.map(t => t.eventId)
          };
        }
      }
    }
  }
  
  // Process Guests
  for (const guestAttendee of guestAttendees) {
    const contact = contacts.find(c => c.contactId === guestAttendee.contactId);
    
    if (contact) {
      formState.guests.push(dbEntitiesToGuest(guestAttendee, contact));
      
      // Add to attendee order
      formState.attendeeAddOrder.push({ type: 'guest', id: guestAttendee.attendeeId });
      
      // Get tickets for this attendee
      const attendeeTickets = tickets.filter(t => t.attendeeId === guestAttendee.attendeeId);
      if (attendeeTickets.length > 0) {
        const lastIndex = formState.guests.length - 1;
        formState.guests[lastIndex].ticket = {
          ticketId: attendeeTickets[0].ticketDefinitionId || '',
          events: attendeeTickets.map(t => t.eventId)
        };
      }
      
      // Set hasPartner flag if this guest has any partners
      const lastIndex = formState.guests.length - 1;
      formState.guests[lastIndex].hasPartner = guestPartnerAttendees.some(
        gp => gp.relatedAttendeeId === guestAttendee.attendeeId
      );
    }
  }
  
  // Process Lady Partners - need to find related Mason index
  for (const ladyPartnerAttendee of ladyPartnerAttendees) {
    const contact = contacts.find(c => c.contactId === ladyPartnerAttendee.contactId);
    
    if (contact && ladyPartnerAttendee.relatedAttendeeId) {
      // Find the index of the related Mason in the UI state
      const relatedMasonIndex = formState.masons.findIndex(
        m => m.attendeeId === ladyPartnerAttendee.relatedAttendeeId
      );
      
      if (relatedMasonIndex !== -1) {
        // Convert to UI format with the correct Mason index
        const ladyPartner = dbEntitiesToLadyPartner(ladyPartnerAttendee, contact, relatedMasonIndex);
        formState.ladyPartners.push(ladyPartner);
        
        // Get tickets for this attendee
        const attendeeTickets = tickets.filter(t => t.attendeeId === ladyPartnerAttendee.attendeeId);
        if (attendeeTickets.length > 0) {
          const lastIndex = formState.ladyPartners.length - 1;
          formState.ladyPartners[lastIndex].ticket = {
            ticketId: attendeeTickets[0].ticketDefinitionId || '',
            events: attendeeTickets.map(t => t.eventId)
          };
        }
        
        // Update Mason's hasLadyPartner flag
        formState.masons[relatedMasonIndex].hasLadyPartner = true;
      }
    }
  }
  
  // Process Guest Partners - need to find related Guest index
  for (const guestPartnerAttendee of guestPartnerAttendees) {
    const contact = contacts.find(c => c.contactId === guestPartnerAttendee.contactId);
    
    if (contact && guestPartnerAttendee.relatedAttendeeId) {
      // Find the index of the related Guest in the UI state
      const relatedGuestIndex = formState.guests.findIndex(
        g => g.attendeeId === guestPartnerAttendee.relatedAttendeeId
      );
      
      if (relatedGuestIndex !== -1) {
        // Convert to UI format with the correct Guest index
        const guestPartner = dbEntitiesToGuestPartner(guestPartnerAttendee, contact, relatedGuestIndex);
        formState.guestPartners.push(guestPartner);
        
        // Get tickets for this attendee
        const attendeeTickets = tickets.filter(t => t.attendeeId === guestPartnerAttendee.attendeeId);
        if (attendeeTickets.length > 0) {
          const lastIndex = formState.guestPartners.length - 1;
          formState.guestPartners[lastIndex].ticket = {
            ticketId: attendeeTickets[0].ticketDefinitionId || '',
            events: attendeeTickets.map(t => t.eventId)
          };
        }
      }
    }
  }
  
  return formState;
}