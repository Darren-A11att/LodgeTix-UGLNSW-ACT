import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { TicketType } from '../shared/types/register';
import { TicketDefinitionType } from '../shared/types/ticket';

// --- Define Unified Attendee Data Structure ---
// Combining all possible fields needed for any attendee type
export interface UnifiedAttendeeData {
  // Core IDs
  attendeeId: string; 
  registrationId?: string; // Overall registration ID (optional? Might be set later)
  personId?: string; // If linking to a separate persons table
  relatedAttendeeId?: string; // Link to primary Mason/Guest for partners

  // Type & Role
  attendeeType: 'mason' | 'lady_partner' | 'guest' | 'guest_partner' | 'delegation_member' | 'individual' | 'lodge_contact' | 'delegation_contact'; // Expanded types
  isPrimary?: boolean; // Added isPrimary flag

  // Personal Info
  title?: string;
  firstName: string; 
  lastName: string; 
  primaryEmail?: string;
  primaryPhone?: string;
  dietaryRequirements?: string;
  specialNeeds?: string;
  relationship?: string; // Partner/Guest relationship to primary

  // Contact Prefs
  contactPreference?: 'Directly' | 'PrimaryAttendee' | 'ProvideLater';
  contactConfirmed?: boolean;

  // Mason Specific
  memberNumber?: string;
  rank?: string; 
  grandRank?: string;
  grandLodgeId?: string | null;
  lodgeId?: string | null;
  grandOfficer?: string; // Current or Past grand officer status
  grandOffice?: string; // The specific grand office title
  grandOfficeOther?: string; // For "Other" grand office specification
  pastGrandOffice?: string;
  isPastGrandMaster?: boolean;
  honours?: string;
  
  // Ticket/Event Info (Example structure)
  ticketDefinitionId?: string | null;
  selectedEvents?: string[];
  eventTitle?: string; // Title for specific events like Ladies Lunch

  // Flags/Other
  hasLadyPartner?: boolean; // Might be derivable from attendees array
  hasGuestPartner?: boolean; // Might be derivable

  // Add ticket field using PackageSelectionType
  ticket?: PackageSelectionType;
}

// --- Placeholder Types (Defined locally) ---
// Using RegistrationType defined here until shared types are stable
export type RegistrationType = 'individual' | 'lodge' | 'delegation';

// Placeholder type for package/ticket selections per attendee
// TODO: Define the actual structure based on package data
export interface PackageSelectionType {
  ticketDefinitionId: string | null;
  selectedEvents: string[]; // Array of event IDs
}

// Placeholder type for billing details
// TODO: Define the actual structure needed
export interface BillingDetailsType {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
}

// --- State Interface ---
export interface RegistrationState {
  draftId: string | null;
  registrationType: RegistrationType | null;
  attendees: UnifiedAttendeeData[];
  // Using Record<attendeeId, PackageSelectionType> for packages
  packages: Record<string, PackageSelectionType>; 
  billingDetails: BillingDetailsType | null;
  agreeToTerms: boolean; // Add agreeToTerms
  status: 'idle' | 'loading' | 'draft' | 'error' | 'saving'; // Added idle/saving
  lastSaved: number | null;
  error: string | null;
  availableTickets: (TicketType | TicketDefinitionType)[]; // Add availableTickets

  // --- Actions ---
  startNewRegistration: (type: RegistrationType) => string; // Returns new draftId
  addPrimaryAttendee: () => void; // New action
  loadDraft: (id: string) => void; // Sets draftId, relies on middleware for loading
  clearRegistration: () => void;
  setRegistrationType: (type: RegistrationType) => void;
  addAttendee: (attendee: Omit<UnifiedAttendeeData, 'attendeeId'>) => string; // Returns new attendeeId
  updateAttendee: (attendeeId: string, updatedData: Partial<UnifiedAttendeeData>) => void;
  removeAttendee: (attendeeId: string) => void;
  updatePackageSelection: (attendeeId: string, selection: PackageSelectionType) => void;
  updateBillingDetails: (details: BillingDetailsType) => void;
  setAgreeToTerms: (agreed: boolean) => void; // Add action
  _updateStatus: (status: RegistrationState['status'], error?: string | null) => void; // Internal helper
}

// --- Initial State --- 
const initialRegistrationState: Omit<RegistrationState, 'startNewRegistration' | 'addPrimaryAttendee' | 'loadDraft' | 'clearRegistration' | 'setRegistrationType' | 'addAttendee' | 'updateAttendee' | 'removeAttendee' | 'updatePackageSelection' | 'updateBillingDetails' | 'setAgreeToTerms' | '_updateStatus'> = {
    draftId: null,
    registrationType: null,
    attendees: [],
    packages: {},
    billingDetails: null,
    agreeToTerms: false, // Init agreeToTerms
    status: 'idle',
    lastSaved: null,
    error: null,
    availableTickets: [], // Initialize availableTickets
};

type RegistrationStateCreator = StateCreator<RegistrationState>;

// --- Store Implementation ---
export const useRegistrationStore = create<RegistrationState>(
  persist(
    (set, get) => ({
      ...initialRegistrationState,

      _updateStatus: (status, error = null) => set({ status, error }),

      startNewRegistration: (type) => {
        const newDraftId = `draft_${Date.now()}_${uuidv4().substring(0, 7)}`;
        console.log(`[Store] Starting new registration (Type: ${type}). Draft ID: ${newDraftId}. Clearing previous state.`); // DEBUG
        // Reset state, set new draftId and type, keep attendees empty for now
        set({
          draftId: newDraftId,
          registrationType: type,
          attendees: [], // Start with empty attendees
          packages: {}, 
          billingDetails: null, 
          agreeToTerms: false, 
          status: 'draft',
          lastSaved: null, 
          error: null, 
          availableTickets: [], 
        });
        return newDraftId;
      },

      addPrimaryAttendee: () => {
        set(state => {
          // Only add if attendees array is currently empty
          if (state.attendees.length > 0) {
            console.warn("[Store] addPrimaryAttendee called but attendees array is not empty.");
            return state; 
          }
          if (!state.registrationType) {
            console.error("[Store] addPrimaryAttendee called but registrationType is null.");
            return state;
          }

          // Determine primary attendee type based on registration type
          let primaryAttendeeType: UnifiedAttendeeData['attendeeType'];
          switch (state.registrationType) {
            case 'lodge':
              primaryAttendeeType = 'lodge_contact';
              break;
            case 'delegation':
              primaryAttendeeType = 'delegation_contact';
              break;
            case 'individual':
            default: 
              primaryAttendeeType = 'mason';
              break;
          }

          // Create the primary attendee object
          const newAttendeeId = uuidv4();
          const primaryAttendee: UnifiedAttendeeData = {
            attendeeId: newAttendeeId,
            attendeeType: primaryAttendeeType,
            isPrimary: true,
            firstName: '', 
            lastName: '', 
            ticket: { ticketDefinitionId: null, selectedEvents: [] }, 
          };
          
          console.log(`[Store] Adding primary attendee (Type: ${primaryAttendeeType})`); // DEBUG
          return { attendees: [primaryAttendee] };
        });
      },

      loadDraft: (id) => {
        // Middleware handles loading data for this ID on hydration.
        // This action mainly signals intent and sets the active ID.
        const currentState = get();
        if (currentState.draftId !== id) {
             console.log(`Attempting to load draft: ${id}. Current state draftId: ${currentState.draftId}`);
             // If the middleware loaded a different draft, reset state before setting new ID
             set({ ...initialRegistrationState, draftId: id, status: 'loading' }); 
        } else {
             // Already loaded or loading this draft
             set({ status: 'draft' }); 
        }
        // After middleware hydrates, status should ideally become 'draft' 
        // We might need a way to detect hydration completion?
      },

      clearRegistration: () => {
        set({ ...initialRegistrationState }); // Reset to initial state
        console.log('Registration state cleared.');
      },

      setRegistrationType: (type) => {
        set({ registrationType: type });
      },

      addAttendee: (attendeeData) => {
        const newAttendeeId = uuidv4();
        const newAttendee: UnifiedAttendeeData = {
          ...attendeeData,
          attendeeId: newAttendeeId, 
          // Initialize ticket field
          ticket: { ticketDefinitionId: null, selectedEvents: [] }, 
        };
        if (!newAttendee.firstName) newAttendee.firstName = '';
        if (!newAttendee.lastName) newAttendee.lastName = '';
        
        set(state => ({
          attendees: [...state.attendees, newAttendee],
          // Don't need separate package init if ticket is on attendee
          // packages: { 
          //     ...state.packages, 
          //     [newAttendeeId]: { ticketDefinitionId: null, selectedEvents: [] } 
          // }
        }));
        return newAttendeeId;
      },

      updateAttendee: (attendeeId, updatedData) => {
        set(state => ({
          attendees: state.attendees.map(att => 
            att.attendeeId === attendeeId 
              ? { ...att, ...updatedData } 
              : att
          ),
        }));
      },

      removeAttendee: (attendeeId) => {
        set(state => {
          const updatedPackages = { ...state.packages };
          delete updatedPackages[attendeeId]; // Remove package info too
          return {
            attendees: state.attendees.filter(att => att.attendeeId !== attendeeId),
            packages: updatedPackages,
          };
        });
      },

      updatePackageSelection: (attendeeId, selection) => {
        set(state => ({
          packages: {
            ...state.packages,
            [attendeeId]: selection,
          },
        }));
      },

      updateBillingDetails: (details) => {
        set({ billingDetails: details });
      },

      setAgreeToTerms: (agreed) => set({ agreeToTerms: agreed }), // Implement action

    }),
    {
      name: 'lodgetix-registration-storage', 
      partialize: (state) => ({
        draftId: state.draftId,
        registrationType: state.registrationType,
        attendees: state.attendees,
        packages: state.packages,
        billingDetails: state.billingDetails,
        agreeToTerms: state.agreeToTerms, // Persist agreeToTerms
        lastSaved: Date.now(),
      }),
      onRehydrateStorage: () => {
        // We can't reliably use set/get here. Status logic needs to be handled
        // externally after hydration, e.g., in a component effect.
        console.log('Registration store hydration finished.');
      },
       // Optional: Add migration logic if state structure changes later
       // version: 1, 
       // migrate: (persistedState, version) => { ... }
    }
  ) as RegistrationStateCreator
); 