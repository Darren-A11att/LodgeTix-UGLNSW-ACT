export interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  includes: string[];
}

export interface AttendeeTicket {
  ticketId: string;
  events: string[]; // Array of selected event IDs
}

export interface LadyPartnerData {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  dietary: string;
  specialNeeds: string;
  relationship: string; // Tracks relationship to the Mason
  masonIndex: number; // Tracks which Mason this Lady/Partner belongs to
  contactPreference: string; // Mason, Directly, Provide Later
  phone: string;
  email: string;
  contactConfirmed: boolean; // Confirmation that selected contact will be responsible
  ticket?: AttendeeTicket; // Selected ticket and events
}

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
  grandRank?: string; // For GL rank
  grandOfficer?: string; // Current or Past
  grandOffice?: string; // Specific grand office when Current
  grandOfficeOther?: string; // For "Other" grand office option
  contactPreference?: string; // Primary Attendee, Directly, Provide Later - Only for additional Masons
  contactConfirmed?: boolean; // Confirmation that selected contact will be responsible
  ticket?: AttendeeTicket; // Selected ticket and events

  // Fields for pending lodge creation
  isPendingNewLodge?: boolean; 
  pendingLodgeDetails?: { name: string; number: string; grandLodgeId: string } | null;
}

export interface GuestPartnerData {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  dietary: string;
  specialNeeds: string;
  relationship: string; // Tracks relationship to the Guest
  guestIndex: number; // Tracks which Guest this Partner belongs to
  contactPreference: string; // Mason, Guest, Directly, Provide Later
  phone: string;
  email: string;
  contactConfirmed: boolean; // Confirmation that selected contact will be responsible
  ticket?: AttendeeTicket; // Selected ticket and events
}

export interface GuestData {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dietary: string;
  specialNeeds: string;
  hasPartner: boolean; // Flag for partner registration
  contactPreference: string; // Primary Attendee, Directly, Provide Later
  contactConfirmed: boolean; // Confirmation that selected contact will be responsible
  ticket?: AttendeeTicket; // Selected ticket and events
}

export interface FormState {
  registrationType: string; // New field for registration type
  step: number; // Track the current step
  selectedTicket: string; // Legacy field for backward compatibility
  selectedEventId: string | null;
  masons: MasonData[];
  guests: GuestData[];
  ladyPartners: LadyPartnerData[];
  guestPartners: GuestPartnerData[];
  agreeToTerms: boolean;
  useUniformTicketing: boolean; // If true, use same ticket for all attendees
  attendeeAddOrder: { type: 'mason' | 'guest'; id: string }[];
}

// Define type alias for different attendee types and export it
export type AttendeeData = MasonData | LadyPartnerData | GuestData | GuestPartnerData;

export type RegistrationType = 'individual' | 'lodge' | 'delegation';