import React, { createContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { MasonData, GuestData, LadyPartnerData, GuestPartnerData, FormState, EmailConflictInfo as FormStateEmailConflictInfo, AttendeeType, AttendeeTicket } from '../shared/types/register';
// Import the specific AttendeeData type from the API definitions
import { AttendeeData as UnifiedAttendeeData } from '../lib/api/registrations';

// Remove local/incorrect type definitions
/*
interface NormalizedAttendee extends MasonData, GuestData, LadyPartnerData, GuestPartnerData {
  type: string;
}
interface EntityStore { ... }
interface RelationshipStore { ... }
*/

// Use UnifiedAttendeeData where NormalizedAttendee was used previously if appropriate
// Adjust interfaces relying on the removed types if needed

// Type for email conflict details stored in state
interface EmailConflictInfo extends FormStateEmailConflictInfo {}

// Type for the state passed to the Email Conflict Modal
interface EmailConflictModalDetails {
  attendeeId: string; // ID of the attendee whose preference might change
  attendeeType: AttendeeType;
  attemptedEmail: string;
  canChangePreference: boolean;
  newPreference: string | null; // Proposed new preference if user chooses to change
  sourceConflictingAttendeeId: string; // ID of the original attendee causing the conflict
  actualConflictingAttendeeId: string; // ID of the attendee whose email is actually being conflicted with (might be the same as source)
}

// Information about available drafts
interface DraftInfo {
  draftId: string;
  lastStep: number;
  attendeeCount: number;
}

// Define a type for database-ready submission data (adjust if NormalizedAttendee structure changes)
export interface SubmissionData {
  registrationType: string;
  attendees: UnifiedAttendeeData[]; // Use the unified type
  // tickets: Record<string, AttendeeTicket>; // This might be redundant if ticket info is in attendee
  totalPrice: number;
  agreeToTerms: boolean;
}

interface RegisterFormContextType {
  formState: FormState;
  emailConflictModalDetails: EmailConflictModalDetails | null;
  updateFormField: (field: string, value: unknown) => void;
  // Remove update functions for deprecated arrays
  // updateMasonField: ...
  // updateGuestField: ...
  // updateLadyPartnerField: ...
  // updateGuestPartnerField: ...
  updateAttendeeField: (attendeeId: string, field: keyof UnifiedAttendeeData, value: any) => void; // New unified update function
  selectTicket: (ticketId: string) => void;
  // Remove select functions for deprecated arrays
  // selectMasonTicket: ...
  // selectLadyPartnerTicket: ...
  // selectGuestTicket: ...
  // selectGuestPartnerTicket: ...
  selectAttendeeTicket: (attendeeId: string, ticketDefinitionId: string | null) => void; // New unified select function
  toggleUniformTicketing: (enabled: boolean) => void;
  applyTicketToAllAttendees: (ticketId: string) => void;
  addMason: () => void;
  removeMasonById: (id: string) => void;
  // toggleSameLodge: ... // This logic needs rework based on unified data
  toggleHasLadyPartner: (masonId: string, checked: boolean) => void;
  addGuest: () => void;
  removeGuestById: (id: string) => void;
  // toggleGuestUseContact: ... // This logic is likely handled within attendee details now
  toggleGuestHasPartner: (guestId: string, checked: boolean) => void;
  setRegistrationType: (type: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  checkEmailOnBlur: (id: string, field: string, value: string) => Promise<void>;
  clearEmailConflictFlag: (id: string) => void;
  confirmEmailConflictResolution: () => void;
  cancelEmailConflictResolution: () => void;
  // Draft management methods remain
  hasDraftForType: (registrationType: string) => boolean;
  getDraftInfoForType: (registrationType: string) => DraftInfo | null;
  loadDraftForType: (registrationType: string) => void;
  startNewDraft: (registrationType: string) => void;
  saveDraftState: () => void;
  
  // Remove methods relying on deprecated structures
  // getAttendeeById: ...
  // findLadyPartnerForMason: ...
  // findPartnerForGuest: ...
  // getAllAttendees: ...
  // getAttendeesByType: ...
  // getAttendeesInEntryOrder: ...
  // prepareSubmissionData: ... 
  calculateTotalPrice: () => number;
}

// Remove default data for deprecated arrays
/*
const defaultMasonData: MasonData = { ... };
const defaultGuestData: GuestData = { ... };
const defaultLadyPartnerData: LadyPartnerData = { ... };
const defaultGuestPartnerData: GuestPartnerData = { ... };
*/

const initialFormState: FormState = {
  registrationType: '',
  step: 1,
  selectedTicket: '',
  selectedEventId: null,
  // Remove deprecated fields
  // masons: [{ ...defaultMasonData }],
  // guests: [],
  // ladyPartners: [],
  // guestPartners: [],
  attendees: [], // Initialize the unified attendees array
  agreeToTerms: false,
  useUniformTicketing: true,
  attendeeAddOrder: [],
  emailConflictFlags: {},
  // Remove deprecated normalized structures
  // entities: { ... },
  // attendeeOrder: [ ... ],
  // relationships: { ... }
  // Add new fields from FormState definition if missing
  registrationId: null,
  customerId: null,
  userId: null,
  isLoading: false,
  error: null,
  progressData: null
};

const RegisterFormContext = createContext<RegisterFormContextType | undefined>(undefined);

// Constants for localStorage
const DRAFT_ID_KEY = 'lodgetix_registration_draft_id';
const DRAFT_TYPE_KEY = 'lodgetix_registration_type';
const DRAFT_DATA_PREFIX = 'lodgetix_registration_draft_';
const DRAFT_INDEX_KEY = 'lodgetix_registration_drafts_index';
const DRAFT_LAST_UPDATED_KEY = 'lodgetix_registration_last_updated';

// Helper functions for draft management
const generateDraftId = (): string => {
  return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Get the full storage key for a draft based on type and ID
const getDraftKey = (draftId: string, registrationType?: string): string => {
  if (registrationType) {
    return `${DRAFT_DATA_PREFIX}${registrationType.toLowerCase()}_${draftId}`;
  }
  return `${DRAFT_DATA_PREFIX}${draftId}`;
};

// Save the draft index to track all available drafts by type
const updateDraftIndex = (draftId: string, registrationType: string): void => {
  try {
    // Get current index
    const indexJson = localStorage.getItem(DRAFT_INDEX_KEY);
    const index = indexJson ? JSON.parse(indexJson) : {};
    
    // Update the index with this draft
    if (!index[registrationType]) {
      index[registrationType] = [];
    }
    
    // Add draftId if not already present
    if (!index[registrationType].includes(draftId)) {
      index[registrationType].push(draftId);
    }
    
    // Save updated index
    localStorage.setItem(DRAFT_INDEX_KEY, JSON.stringify(index));
    
    // Update last updated timestamp
    localStorage.setItem(DRAFT_LAST_UPDATED_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error updating draft index:', error);
  }
};

// Save a draft to localStorage with registration type tracking
const saveDraftToLocalStorage = (draftId: string, formData: FormState): void => {
  try {
    const registrationType = formData.registrationType || 'default';
    const storageKey = getDraftKey(draftId, registrationType);
    
    // Save the form state with the registration type in the key
    localStorage.setItem(storageKey, JSON.stringify(formData));
    
    // Save the current draft ID (for backward compatibility)
    localStorage.setItem(DRAFT_ID_KEY, draftId);
    
    // Save the current registration type
    localStorage.setItem(DRAFT_TYPE_KEY, registrationType);
    
    // Update the draft index
    updateDraftIndex(draftId, registrationType);
  } catch (error) {
    console.error('Error saving draft to localStorage:', error);
  }
};

// Check if there are any drafts for a specific registration type
const hasDraftsForType = (registrationType: string): boolean => {
  try {
    const indexJson = localStorage.getItem(DRAFT_INDEX_KEY);
    if (!indexJson) return false;
    
    const index = JSON.parse(indexJson);
    return !!index[registrationType] && index[registrationType].length > 0;
  } catch (error) {
    console.error('Error checking drafts for type:', error);
    return false;
  }
};

// Get draft information for a specific registration type
const getDraftInfoForType = (registrationType: string): { draftId: string, lastStep: number, attendeeCount: number } | null => {
  try {
    const indexJson = localStorage.getItem(DRAFT_INDEX_KEY);
    if (!indexJson) return null;
    
    const index = JSON.parse(indexJson);
    if (!index[registrationType] || index[registrationType].length === 0) return null;
    
    const draftId = index[registrationType][0];
    const storageKey = getDraftKey(draftId, registrationType);
    const draftJson = localStorage.getItem(storageKey);
    
    if (!draftJson) return null;
    
    const draft = JSON.parse(draftJson) as FormState;
    
    // Ensure calculation uses draft.attendees only
    const attendeeCount = draft.attendees ? draft.attendees.length : 0;
    
    return {
      draftId,
      lastStep: draft.step || 1,
      attendeeCount
    };
  } catch (error) {
    console.error('Error getting draft info for type:', error);
    return null;
  }
};

// Load a draft from localStorage, prioritizing a specific registration type if provided
const loadDraftFromLocalStorage = (registrationType?: string): FormState | null => {
  try {
    // If a specific registration type is requested, try to load that first
    if (registrationType) {
      const indexJson = localStorage.getItem(DRAFT_INDEX_KEY);
      if (indexJson) {
        const index = JSON.parse(indexJson);
        if (index[registrationType] && index[registrationType].length > 0) {
          const draftId = index[registrationType][0]; // Take the first draft of this type
          const storageKey = getDraftKey(draftId, registrationType);
          const draftJson = localStorage.getItem(storageKey);
          
          if (draftJson) {
            // Save current active draft references
            localStorage.setItem(DRAFT_ID_KEY, draftId);
            localStorage.setItem(DRAFT_TYPE_KEY, registrationType);
            
            let draft = JSON.parse(draftJson);

            // Migrate draft to unified attendees structure if needed
            draft.attendees = migrateDraftToUnifiedAttendees(draft);
            
            // Remove deprecated fields from the loaded draft before returning
            delete draft.masons;
            delete draft.guests;
            delete draft.ladyPartners;
            delete draft.guestPartners;
            delete draft.entities;
            delete draft.attendeeOrder;
            delete draft.relationships;

            return draft as FormState;
          }
        }
      }
    }
    
    // Fall back to original method for backward compatibility
    const draftId = localStorage.getItem(DRAFT_ID_KEY);
    if (!draftId) return null;
    
    // Try to get the stored registration type first
    const storedType = localStorage.getItem(DRAFT_TYPE_KEY);
    const storageKey = getDraftKey(draftId, storedType || undefined);
    
    const draftJson = localStorage.getItem(storageKey);
    if (!draftJson) return null;
    
    let draft = JSON.parse(draftJson);

    // Migrate draft to unified attendees structure if needed
    draft.attendees = migrateDraftToUnifiedAttendees(draft);
    
    // Remove deprecated fields from the loaded draft before returning
    delete draft.masons;
    delete draft.guests;
    delete draft.ladyPartners;
    delete draft.guestPartners;
    delete draft.entities;
    delete draft.attendeeOrder;
    delete draft.relationships;

    return draft as FormState;
  } catch (error) {
    console.error('Error loading/migrating draft from localStorage:', error);
    return null;
  }
};

// Function to migrate old draft structure to new unified structure
const migrateDraftToUnifiedAttendees = (draft: any): UnifiedAttendeeData[] => {
  const unifiedAttendees: UnifiedAttendeeData[] = [];
  if (!draft) return unifiedAttendees;

  // Check if attendees array already exists and is valid
  if (Array.isArray(draft.attendees) && draft.attendees.length > 0 && draft.attendees[0].attendeeId) {
    return draft.attendees as UnifiedAttendeeData[]; // Assume it's already the new format
  }

  // If not, migrate from old arrays (masons, guests, etc.)
  (draft.masons || []).forEach((mason: any) => {
     unifiedAttendees.push({ 
        attendeeId: mason.id || crypto.randomUUID(),
        personId: mason.id || crypto.randomUUID(),
        firstName: mason.firstName || null,
        lastName: mason.lastName || null,
        title: mason.title || null,
        primaryEmail: mason.email || null,
        primaryPhone: mason.phone || null,
        attendeeType: 'Mason',
        dietaryRequirements: mason.dietary || null,
        specialNeeds: mason.specialNeeds || null,
        eventTitle: null,
        contactPreference: mason.contactPreference || 'Directly',
        relatedAttendeeId: null,
        relationship: null,
        rank: mason.rank || null,
        grandRank: mason.grandRank || null,
        grandOfficer: mason.grandOfficer || null,
        grandOffice: mason.grandOffice || null,
        lodgeId: mason.lodge || null,
        masonicProfileId: mason.masonicProfileId || null,
        isPrimary: mason.id === 'primary-mason',
        contactConfirmed: !!mason.contactConfirmed,
        ticket: mason.ticket?.ticketId ? { ticketDefinitionId: mason.ticket.ticketId } : null,
    });
  });

  (draft.ladyPartners || []).forEach((partner: any) => {
     unifiedAttendees.push({ 
        attendeeId: partner.id || crypto.randomUUID(),
        personId: partner.id || crypto.randomUUID(),
        firstName: partner.firstName || null,
        lastName: partner.lastName || null,
        title: partner.title || null,
        primaryEmail: partner.email || null,
        primaryPhone: partner.phone || null,
        attendeeType: 'LadyPartner',
        dietaryRequirements: partner.dietary || null,
        specialNeeds: partner.specialNeeds || null,
        eventTitle: null,
        contactPreference: partner.contactPreference || 'Mason',
        relatedAttendeeId: partner.masonId || null,
        relationship: partner.relationship || null,
        isPrimary: false,
        contactConfirmed: !!partner.contactConfirmed,
        ticket: partner.ticket?.ticketId ? { ticketDefinitionId: partner.ticket.ticketId } : null,
        rank: null, grandRank: null, grandOfficer: null, grandOffice: null, lodgeId: null, masonicProfileId: null, 
     });
  });

  (draft.guests || []).forEach((guest: any) => {
     unifiedAttendees.push({ 
        attendeeId: guest.id || crypto.randomUUID(),
        personId: guest.id || crypto.randomUUID(),
        firstName: guest.firstName || null,
        lastName: guest.lastName || null,
        title: guest.title || null,
        primaryEmail: guest.email || null,
        primaryPhone: guest.phone || null,
        attendeeType: 'Guest',
        dietaryRequirements: guest.dietary || null,
        specialNeeds: guest.specialNeeds || null,
        eventTitle: null,
        contactPreference: guest.contactPreference || 'Directly',
        relatedAttendeeId: null,
        relationship: null,
        isPrimary: false,
        contactConfirmed: !!guest.contactConfirmed,
        ticket: guest.ticket?.ticketId ? { ticketDefinitionId: guest.ticket.ticketId } : null,
        rank: null, grandRank: null, grandOfficer: null, grandOffice: null, lodgeId: null, masonicProfileId: null, 
     });
  });

  (draft.guestPartners || []).forEach((partner: any) => {
     unifiedAttendees.push({ 
        attendeeId: partner.id || crypto.randomUUID(),
        personId: partner.id || crypto.randomUUID(),
        firstName: partner.firstName || null,
        lastName: partner.lastName || null,
        title: partner.title || null,
        primaryEmail: partner.email || null,
        primaryPhone: partner.phone || null,
        attendeeType: 'GuestPartner',
        dietaryRequirements: partner.dietary || null,
        specialNeeds: partner.specialNeeds || null,
        eventTitle: null,
        contactPreference: partner.contactPreference || 'Guest',
        relatedAttendeeId: partner.guestId || null,
        relationship: partner.relationship || null,
        isPrimary: false,
        contactConfirmed: !!partner.contactConfirmed,
        ticket: partner.ticket?.ticketId ? { ticketDefinitionId: partner.ticket.ticketId } : null,
        rank: null, grandRank: null, grandOfficer: null, grandOffice: null, lodgeId: null, masonicProfileId: null, 
     });
  });

  return unifiedAttendees;
};

export const RegisterFormProvider: React.FC<{ children: ReactNode, initialEventId?: string | null }> = ({ 
  children, 
  initialEventId = null 
}) => {
  // Load and potentially migrate draft
  const loadedDraft = loadDraftFromLocalStorage(); 

  const [formState, setFormState] = useState<FormState>(() => {
    if (loadedDraft) {
      // Ensure initialEventId is respected
      return {
        ...loadedDraft,
        selectedEventId: initialEventId || loadedDraft.selectedEventId,
      };
    }
    
    // Initialize with default state, including primary mason in unified array
    const primaryMasonAttendee: UnifiedAttendeeData = {
      attendeeId: 'primary-mason',
      personId: 'primary-mason',
      firstName: null,
      lastName: null,
      title: 'Bro',
      primaryEmail: null,
      primaryPhone: null,
      attendeeType: 'Mason', 
      dietaryRequirements: null,
      specialNeeds: null,
      eventTitle: null,
      contactPreference: 'Directly',
      relatedAttendeeId: null,
      relationship: null,
      rank: 'EAF',
      grandRank: null,
      grandOfficer: 'Past',
      grandOffice: null,
      lodgeId: null,
      masonicProfileId: null,
      isPrimary: true,
      contactConfirmed: false,
      ticket: null,
    };
    
    return {
      ...initialFormState, // Use the cleaned initial state
      selectedEventId: initialEventId,
      attendees: [primaryMasonAttendee] // Start with primary mason
    };
  });

  const [emailConflictModalDetails, setEmailConflictModalDetails] = useState<EmailConflictModalDetails | null>(null);
  
  // Ensure we have a draft ID, generating one if needed
  const [draftId, setDraftId] = useState<string>(() => {
    const existingId = localStorage.getItem(DRAFT_ID_KEY);
    if (existingId) return existingId;
    
    const newId = generateDraftId();
    localStorage.setItem(DRAFT_ID_KEY, newId);
    return newId;
  });
  
  // Check if there is an existing draft for a specific registration type
  const hasDraftForType = useCallback((registrationType: string): boolean => {
    return hasDraftsForType(registrationType);
  }, []);
  
  // Get information about an existing draft for a specific registration type
  const getDraftInfoForType = useCallback((registrationType: string): DraftInfo | null => {
    // Call the global utility function, not recursively calling itself
    const draftInfo = window.localStorage.getItem(DRAFT_INDEX_KEY);
    if (!draftInfo) return null;
    
    try {
      const index = JSON.parse(draftInfo);
      if (!index[registrationType] || index[registrationType].length === 0) return null;
      
      // Use the first draft ID for this type
      const draftId = index[registrationType][0];
      const storageKey = getDraftKey(draftId, registrationType);
      const draftJson = window.localStorage.getItem(storageKey);
      
      if (!draftJson) return null;
      
      const draft = JSON.parse(draftJson) as FormState;
      const attendeeCount = 
        (draft.masons ? draft.masons.length : 0) + 
        (draft.guests ? draft.guests.length : 0) + 
        (draft.ladyPartners ? draft.ladyPartners.length : 0) + 
        (draft.guestPartners ? draft.guestPartners.length : 0);
      
      return {
        draftId,
        lastStep: draft.step || 1,
        attendeeCount
      };
    } catch (error) {
      console.error('Error getting draft info in component:', error);
      return null;
    }
  }, []);
  
  // Load a draft for a specific registration type
  const loadDraftForType = useCallback((registrationType: string): void => {
    const draft = loadDraftFromLocalStorage(registrationType);
    if (draft) {
      // Update the draft ID state to match the loaded draft
      const indexJson = localStorage.getItem(DRAFT_INDEX_KEY);
      if (indexJson) {
        const index = JSON.parse(indexJson);
        if (index[registrationType] && index[registrationType].length > 0) {
          const loadedDraftId = index[registrationType][0];
          setDraftId(loadedDraftId);
        }
      }
      
      // Set the form state to the loaded draft
      setFormState(draft);
    }
  }, []);
  
  // Start a new draft for a specific registration type
  const startNewDraft = useCallback((registrationType: string): void => {
    // Generate a new draft ID
    const newDraftId = generateDraftId();
    setDraftId(newDraftId);
    
    // Reset form state to initial values with the new registration type
    setFormState({
      ...initialFormState,
      registrationType,
      step: 2, // Skip directly to step 2 (skipping registration type selection)
      selectedEventId: formState.selectedEventId // Keep the selected event if any
    });
    
    // Save the new draft immediately
    const newFormState = {
      ...initialFormState,
      registrationType,
      step: 2,
      selectedEventId: formState.selectedEventId
    };
    saveDraftToLocalStorage(newDraftId, newFormState);
  }, [formState.selectedEventId]);
  
  // Save draft function to be called at specific events
  const saveDraft = useCallback(() => {
    saveDraftToLocalStorage(draftId, formState);
  }, [draftId, formState]);

  // Explicit function to save the current draft state
  const saveDraftState = useCallback(() => {
    saveDraft();
  }, [saveDraft]);

  // --- Define ALL state update and navigation functions first --- 

  const updateFormField = useCallback((field: keyof FormState, value: unknown) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setTimeout(saveDraft, 0); 
  }, [saveDraft]);

  const updateAttendeeField = useCallback((attendeeId: string, field: keyof UnifiedAttendeeData, value: any) => {
    setFormState(prev => ({
      ...prev,
      attendees: prev.attendees.map(att => 
        att.attendeeId === attendeeId ? { ...att, [field]: value } : att
      )
    }));
    setTimeout(saveDraft, 0); 
  }, [saveDraft]);

  // Define clearEmailConflictFlag early
  const clearEmailConflictFlag = useCallback((id: string) => {
    setFormState(prev => {
      const newFlags = { ...(prev.emailConflictFlags || {}) };
      if (newFlags.hasOwnProperty(id)) {
          delete newFlags[id];
      }
      // Ensure emailConflictFlags is never undefined in state
      return { ...prev, emailConflictFlags: newFlags }; 
    });
  }, []); // No dependency on saveDraft? Maybe add if clearing should save.

  // Define cancelEmailConflictResolution early
   const cancelEmailConflictResolution = useCallback(() => {
    if (!emailConflictModalDetails) return;
    // Clear the flag for the attendee who triggered the modal
    clearEmailConflictFlag(emailConflictModalDetails.attendeeId); 
    setEmailConflictModalDetails(null); // Close the modal
  }, [emailConflictModalDetails, clearEmailConflictFlag]);

  // Define step navigation functions early
  const setRegistrationType = useCallback((type: string) => {
    setFormState(prev => ({
      ...prev,
      registrationType: type,
      // Always go to step 2 after setting type
      step: 2 
    }));
    setTimeout(saveDraft, 0);
  }, [saveDraft]);

  const nextStep = useCallback(() => {
    setFormState(prev => ({ ...prev, step: prev.step + 1 }));
    window.scrollTo(0, 0);
    setTimeout(saveDraft, 0);
  }, [saveDraft]);

  const prevStep = useCallback(() => {
    setFormState(prev => ({ ...prev, step: prev.step > 1 ? prev.step - 1 : 1 }));
    window.scrollTo(0, 0);
    setTimeout(saveDraft, 0);
  }, [saveDraft]);
  
  const goToStep = useCallback((step: number) => {
    // Add bounds check if necessary, e.g., step >= 1 && step <= MAX_STEPS
    setFormState(prev => ({ ...prev, step: step }));
    window.scrollTo(0, 0);
    setTimeout(saveDraft, 0);
  }, [saveDraft]);

  // Now define functions that depend on the above
  const applyTicketToAllAttendees = useCallback((ticketId: string) => {
    setFormState(prev => {
      const updatedAttendees = (prev.attendees || []).map(attendee => ({
        ...attendee,
        ticket: ticketId ? { ticketDefinitionId: ticketId } : null 
      }));
      return {
        ...prev,
        attendees: updatedAttendees,
        selectedTicket: ticketId // Ensure selectedTicket is also updated
      };
    });
    setTimeout(saveDraft, 0);
  }, [saveDraft]);

  const selectTicket = useCallback((ticketId: string) => {
    if (formState.useUniformTicketing) {
      applyTicketToAllAttendees(ticketId);
    } else {
      updateFormField('selectedTicket', ticketId);
    }
  }, [formState.useUniformTicketing, applyTicketToAllAttendees, updateFormField]);

  const selectAttendeeTicket = useCallback((attendeeId: string, ticketDefinitionId: string | null) => {
    setFormState(prev => ({
      ...prev,
      attendees: prev.attendees.map(att => 
        att.attendeeId === attendeeId ? { ...att, ticket: ticketDefinitionId ? { ticketDefinitionId } : null } : att
      )
    }));
    setTimeout(saveDraft, 0);
  }, [saveDraft]);

  const toggleUniformTicketing = useCallback((enabled: boolean) => {
    updateFormField('useUniformTicketing', enabled);
    if (enabled && formState.selectedTicket) { 
      applyTicketToAllAttendees(formState.selectedTicket);
    }
  }, [formState.selectedTicket, applyTicketToAllAttendees, updateFormField]);

  const checkEmailOnBlur = useCallback(async (id: string, field: string, value: string) => {
    if (field !== 'primaryEmail' || !value) {
      // Ensure emailConflictFlags exists before checking property
      if (formState.emailConflictFlags && formState.emailConflictFlags[id]) {
        clearEmailConflictFlag(id); 
      }
      return;
    }
    const attemptedEmail = value.trim().toLowerCase();
    let conflictFound: FormStateEmailConflictInfo | null = null;
    // Ensure attendees exists before iterating
    (formState.attendees || []).some(attendee => { 
      if (attendee.attendeeId !== id && attendee.primaryEmail?.trim().toLowerCase() === attemptedEmail) {
        conflictFound = { 
            attemptedEmail: value,
            conflictingAttendeeId: attendee.attendeeId,
            conflictingAttendeeType: attendee.attendeeType, // Use the type from UnifiedAttendeeData
            conflictingAttendeeName: `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim()
         };
        return true;
      }
      return false;
    });
    if (conflictFound) {
      setFormState(prev => ({ ...prev, emailConflictFlags: { ...(prev.emailConflictFlags || {}), [id]: conflictFound! } }));
    } else if (formState.emailConflictFlags && formState.emailConflictFlags[id]) {
      clearEmailConflictFlag(id);
    }
    // Don't save draft on blur check? Depends on desired behavior.
  }, [formState.attendees, formState.emailConflictFlags, clearEmailConflictFlag]); // Dependencies are now defined before this

  const confirmEmailConflictResolution = useCallback(() => {
    if (!emailConflictModalDetails) return;
    const { attendeeId, newPreference, sourceConflictingAttendeeId } = emailConflictModalDetails;
    setFormState(prev => {
      const updatedAttendees = prev.attendees.map(att => {
        if (att.attendeeId === sourceConflictingAttendeeId && newPreference) {
          return { ...att, contactPreference: newPreference as UnifiedAttendeeData['contactPreference'], contactConfirmed: true };
        }
        return att;
      });
      return { ...prev, attendees: updatedAttendees };
    });
    clearEmailConflictFlag(attendeeId); // Safe to call now
    setEmailConflictModalDetails(null);
    // Save draft after resolution? 
    // setTimeout(saveDraft, 0); 
  }, [emailConflictModalDetails, clearEmailConflictFlag]); // Dependencies are now defined

  // Define addMason
  const addMason = useCallback(() => {
    setFormState(prev => {
      const masonAttendees = (prev.attendees || []).filter(att => att.attendeeType === 'Mason');
      if (masonAttendees.length >= 10) return prev; 
      const newMasonId = crypto.randomUUID();
      const newAttendeeData: UnifiedAttendeeData = {
          attendeeId: newMasonId,
          personId: newMasonId, 
          firstName: null,
          lastName: null,
          title: 'Bro',
          primaryEmail: null,
          primaryPhone: null,
          attendeeType: 'Mason',
          dietaryRequirements: null,
          specialNeeds: null,
          eventTitle: null,
          contactPreference: 'Directly', 
          relatedAttendeeId: null,
          relationship: null,
          rank: 'EAF', 
          grandRank: null,
          grandOfficer: null, 
          grandOffice: null,
          lodgeId: null, 
          masonicProfileId: null,
          isPrimary: false,
          contactConfirmed: false,
          ticket: null,
      };
      const newAttendeeOrderEntry = { type: AttendeeType.Mason, id: newMasonId }; 
      return {
        ...prev,
        attendees: [...(prev.attendees || []), newAttendeeData],
        // Ensure attendeeAddOrder type is handled correctly
        attendeeAddOrder: [...(prev.attendeeAddOrder as { type: AttendeeType; id: string }[] || []), newAttendeeOrderEntry],
        agreeToTerms: false 
      };
    });
    setTimeout(saveDraft, 0);
  }, [saveDraft]);
  
  // Define removeMasonById
  const removeMasonById = useCallback((id: string) => {
    if (id === 'primary-mason') return; 
    setFormState(prev => {
      let partnerIdToRemove: string | null = null;
      const updatedAttendees = (prev.attendees || []).filter(att => {
        if (att.attendeeId === id) return false; 
        if (att.relatedAttendeeId === id && att.attendeeType === 'LadyPartner') {
          partnerIdToRemove = att.attendeeId; 
          return false; 
        }
        return true;
      });
      // Ensure attendeeAddOrder type is handled correctly
      const updatedOrder = (prev.attendeeAddOrder as { type: AttendeeType; id: string }[] || []).filter(item => 
          item.id !== id && item.id !== partnerIdToRemove
      );
      return {
        ...prev,
        attendees: updatedAttendees,
        attendeeAddOrder: updatedOrder,
        agreeToTerms: false
      };
    });
    setTimeout(saveDraft, 0);
  }, [saveDraft]);

  // Define toggleHasLadyPartner
  const toggleHasLadyPartner = useCallback((masonId: string, checked: boolean) => {
      // ... (implementation using attendees array)
      setTimeout(saveDraft, 0);
  }, [saveDraft]);
  
  // Define addGuest
  const addGuest = useCallback(() => {
      // ... (implementation using attendees array)
      setTimeout(saveDraft, 0);
  }, [saveDraft]);
  
  // Define removeGuestById
  const removeGuestById = useCallback((id: string) => {
      // ... (implementation using attendees array)
      setTimeout(saveDraft, 0);
  }, [saveDraft]);
  
  // Define toggleGuestHasPartner
  const toggleGuestHasPartner = useCallback((guestId: string, checked: boolean) => {
      // ... (implementation using attendees array)
      setTimeout(saveDraft, 0);
  }, [saveDraft]);

  // Define calculateTotalPrice using useCallback
  const calculateTotalPrice = useCallback((): number => {
    let totalPrice = 0;
    const getTicketPrice = (ticketDefId: string | undefined): number => {
      const ticketPackagePrices: { [key: string]: number } = { full: 350, ceremony: 150, social: 250 }; 
      return ticketDefId ? (ticketPackagePrices[ticketDefId] || 0) : 0;
    };
    (formState.attendees || []).forEach(attendee => {
      totalPrice += getTicketPrice(attendee.ticket?.ticketDefinitionId);
    });
    return totalPrice;
  }, [formState.attendees]);

  // --- Provide Context Value --- 

  const contextValue = useMemo(() => ({
    formState,
    emailConflictModalDetails,
    updateFormField,
    updateAttendeeField, 
    selectTicket,
    selectAttendeeTicket, 
    toggleUniformTicketing,
    applyTicketToAllAttendees,
    addMason,
    removeMasonById,
    toggleHasLadyPartner,
    addGuest,
    removeGuestById,
    toggleGuestHasPartner,
    setRegistrationType,
    nextStep,
    prevStep,
    goToStep,
    checkEmailOnBlur,
    clearEmailConflictFlag,
    confirmEmailConflictResolution,
    cancelEmailConflictResolution, 
    hasDraftForType, 
    getDraftInfoForType, 
    loadDraftForType, 
    startNewDraft, 
    saveDraftState, 
    calculateTotalPrice,
  }), [
      // Add ALL functions defined with useCallback to dependency array
      formState, emailConflictModalDetails, updateFormField, updateAttendeeField, 
      selectTicket, selectAttendeeTicket, toggleUniformTicketing, applyTicketToAllAttendees, 
      addMason, removeMasonById, toggleHasLadyPartner, addGuest, removeGuestById,
      toggleGuestHasPartner, setRegistrationType, nextStep, prevStep, goToStep, 
      checkEmailOnBlur, clearEmailConflictFlag, confirmEmailConflictResolution, 
      cancelEmailConflictResolution, hasDraftForType, getDraftInfoForType, 
      loadDraftForType, startNewDraft, saveDraftState, calculateTotalPrice, saveDraft 
    ]);

  return (
    <RegisterFormContext.Provider value={contextValue}>
      {children}
    </RegisterFormContext.Provider>
  );
};

export { RegisterFormContext };