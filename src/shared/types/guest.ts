import { AttendeeTicket } from './register';

/**
 * Represents a Guest record aligned with the database 'guests' table schema.
 */
export interface Guest {
  id: string;
  customer_id: string | null;
  related_mason_id: string | null;
  related_guest_id: string | null;
  guest_type: string; // e.g., 'partner', 'guest', 'partner_of_guest'
  title: string | null;
  first_name: string | null; // Allow null as per DB
  last_name: string | null;  // Allow null as per DB
  email: string | null; 
  phone: string | null; 
  dietary_requirements: string | null;
  special_needs: string | null;
  partner_relationship: string | null; // Renamed from relationship
  contact_preference: string | null; // Changed to string | null
  contact_confirmed: boolean | null;
  created_at: string;
  // updated_at is likely handled by DB triggers, not returned directly in basic select
}

/**
 * Represents the data structure used specifically for a Mason's Lady/Partner
 * in the registration form state.
 */
export interface LadyPartnerData {
  id: string; 
  masonIndex: number;
  dbGuestId?: string | null;
  title: string;
  firstName: string;
  lastName: string;
  dietary: string;              // Maps to dietary_requirements
  specialNeeds: string;         // Maps to special_needs
  relationship: string;         // Maps to partner_relationship
  contactPreference: 'mason' | 'primary' | 'direct' | 'later' | 'Please Select'; 
  phone: string;
  email: string;
  contactConfirmed: boolean;
  ticket?: AttendeeTicket;
}

/**
 * Represents the data structure used for a standard Guest attendee
 * in the registration form state.
 */
export interface GuestData {
  // UI/State specific fields
  id: string;                      // Unique ID for the form state

  // Fields mapping to Guest schema
  dbGuestId?: string | null;       // Actual UUID from the 'guests' table
  title: string;
  firstName: string;
  lastName: string;
  phone: string;                   // Maps to phone (required if contactPreference='direct')
  email: string;                   // Maps to email (required if contactPreference='direct')
  dietary: string;                 // Maps to dietary_requirements
  specialNeeds: string;            // Maps to special_needs
  contactPreference: 'primary' | 'direct' | 'later' | 'Please Select'; // Note: Excludes 'mason'/'guest' for standard guests?
  contactConfirmed: boolean;       // Maps to contact_confirmed
  hasPartner: boolean;             // UI flag to trigger partner form
  // partner_relationship is likely not relevant for a standard guest themselves
  
  // Ticket information
  ticket?: AttendeeTicket;
}

// TODO: Define GuestPartnerData similarly if needed for Step 11 