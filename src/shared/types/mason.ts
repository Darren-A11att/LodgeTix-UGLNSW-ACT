import { AttendeeTicket } from './register'; // Import shared ticket type

// Interface for Lodge data (can be expanded based on DB schema)
export interface Lodge {
  id: string; // Typically UUID
  name: string;
  number: string | null;
  location?: string | null; // e.g., City, State
  grand_lodge_id?: string | null; // Foreign key
}

// Interface for Grand Lodge data (can be expanded based on DB schema)
export interface GrandLodge {
  id: string; // Typically UUID
  name: string; // e.g., "Grand Lodge of NSW & ACT"
  short_name?: string | null; // e.g., "GLNSWACT"
  jurisdiction_country?: string; // e.g., "AU"
  jurisdiction_state?: string | null; // e.g., "NSW"
}

// Interface for Mason-specific data
export interface MasonData {
  id: string; // Corresponds to the attendee identifier in the form state (e.g., 'primary-mason' or UUID)
  dbId?: string | null; // The actual UUID from the 'masons' table, fetched or after creation
  customerId?: string | null; // UUID from the 'customers' table
  title: string;
  firstName: string;
  lastName: string;
  rank: string;
  phone: string;
  email: string;
  lodgeId: string | null; // Foreign key to lodges table
  lodgeName?: string; // Denormalized/fetched for display
  grandLodgeId: string | null; // Foreign key to grand_lodges table
  grandLodgeName?: string; // Denormalized/fetched for display
  dietary: string;
  specialNeeds: string;
  sameLodgeAsPrimary?: boolean; // UI state, not in DB
  hasLadyPartner: boolean; // UI state, not in DB
  grandRank?: string; // Specific GL rank, potentially stored in 'masons' table
  grandOfficer?: string; // Current or Past, potentially stored in 'masons' table
  grandOffice?: string; // Specific grand office, potentially stored in 'masons' table
  grandOfficeOther?: string; // Custom text if grandOffice is 'Other'
  contactPreference?: string; // For additional masons
  contactConfirmed?: boolean; // For additional masons
  ticket?: AttendeeTicket; // Selected ticket and events
  
  // Fields for pending lodge creation (UI state)
  isPendingNewLodge?: boolean; 
  pendingLodgeDetails?: { name: string; number: string; grandLodgeId: string | null } | null;
} 