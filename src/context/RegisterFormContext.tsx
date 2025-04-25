import React, { createContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { MasonData, GuestData, LadyPartnerData, GuestPartnerData, FormState } from '../shared/types/register';

interface RegisterFormContextType {
  formState: FormState;
  updateFormField: (field: string, value: unknown) => void;
  updateMasonField: (index: number, field: string, value: string | boolean) => void;
  updateGuestField: (index: number, field: string, value: string | boolean) => void;
  updateLadyPartnerField: (index: number, field: string, value: string | boolean) => void;
  updateGuestPartnerField: (index: number, field: string, value: string | boolean) => void;
  selectTicket: (ticketId: string) => void;
  selectMasonTicket: (masonIndex: number, ticketId: string, events?: string[]) => void;
  selectLadyPartnerTicket: (partnerIndex: number, ticketId: string, events?: string[]) => void;
  selectGuestTicket: (guestIndex: number, ticketId: string, events?: string[]) => void;
  selectGuestPartnerTicket: (partnerIndex: number, ticketId: string, events?: string[]) => void;
  toggleUniformTicketing: (enabled: boolean) => void;
  applyTicketToAllAttendees: (ticketId: string) => void;
  addMason: () => void;
  removeMason: () => void;
  removeMasonByIndex: (index: number) => void;
  toggleSameLodge: (index: number, checked: boolean) => void;
  toggleHasLadyPartner: (index: number, checked: boolean) => void;
  addGuest: () => void;
  removeGuest: () => void;
  removeGuestByIndex: (index: number) => void;
  toggleGuestUseContact: (index: number, checked: boolean) => void;
  toggleGuestHasPartner: (index: number, checked: boolean) => void;
  setRegistrationType: (type: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
}

const defaultMasonData: MasonData = {
  id: 'primary-mason',
  title: 'Bro',
  firstName: '',
  lastName: '',
  rank: 'EAF',
  phone: '',
  email: '',
  lodge: '',
  grandLodge: '',
  dietary: '',
  specialNeeds: '',
  sameLodgeAsPrimary: false,
  hasLadyPartner: false,
  grandRank: '',
  grandOfficer: 'Past',
  grandOffice: '',
  contactPreference: 'Directly',
  contactConfirmed: false,
  ticket: { ticketId: '', events: [] }
};

const defaultGuestData: GuestData = {
  id: '',
  title: 'Mr',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  dietary: '',
  specialNeeds: '',
  contactPreference: 'Please Select',
  contactConfirmed: false,
  hasPartner: false,
  ticket: { ticketId: '', events: [] }
};

const defaultLadyPartnerData: LadyPartnerData = {
  id: '',
  title: 'Mrs',
  firstName: '',
  lastName: '',
  dietary: '',
  specialNeeds: '',
  relationship: 'Wife', // Default relationship
  masonIndex: 0,
  contactPreference: 'Please Select',
  phone: '',
  email: '',
  contactConfirmed: false,
  ticket: { ticketId: '', events: [] }
};

const defaultGuestPartnerData: GuestPartnerData = {
  id: '',
  title: 'Mrs',
  firstName: '',
  lastName: '',
  dietary: '',
  specialNeeds: '',
  relationship: 'Partner', // Default relationship
  guestIndex: 0,
  contactPreference: 'Please Select',
  phone: '',
  email: '',
  contactConfirmed: false,
  ticket: { ticketId: '', events: [] }
};

const initialFormState: FormState = {
  registrationType: '',
  step: 1, // Start at step 1 (Registration Type)
  selectedTicket: '',
  selectedEventId: null,
  masons: [{ ...defaultMasonData }],
  guests: [],
  ladyPartners: [],
  guestPartners: [],
  agreeToTerms: false,
  useUniformTicketing: true, // Default to using the same ticket for all attendees
  attendeeAddOrder: [] // Initialize new state field
};

const RegisterFormContext = createContext<RegisterFormContextType | undefined>(undefined);

export const RegisterFormProvider: React.FC<{ children: ReactNode, initialEventId?: string | null }> = ({ 
  children, 
  initialEventId = null 
}) => {
  const [formState, setFormState] = useState<FormState>({
    ...initialFormState,
    selectedEventId: initialEventId
  });

  const updateFormField = (field: string, value: unknown) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateMasonField = (index: number, field: string, value: string | boolean) => {
    setFormState(prev => {
      const updatedMasons = [...prev.masons];
      updatedMasons[index] = {
        ...updatedMasons[index],
        [field]: value
      };
      return {
        ...prev,
        masons: updatedMasons
      };
    });
  };

  const updateGuestField = (index: number, field: string, value: string | boolean) => {
    setFormState(prev => {
      const updatedGuests = [...prev.guests];
      updatedGuests[index] = {
        ...updatedGuests[index],
        [field]: value
      };
      return {
        ...prev,
        guests: updatedGuests
      };
    });
  };

  const updateLadyPartnerField = (index: number, field: string, value: string | boolean) => {
    setFormState(prev => {
      const updatedLadyPartners = [...prev.ladyPartners];
      updatedLadyPartners[index] = {
        ...updatedLadyPartners[index],
        [field]: value
      };
      return {
        ...prev,
        ladyPartners: updatedLadyPartners
      };
    });
  };

  const updateGuestPartnerField = (index: number, field: string, value: string | boolean) => {
    setFormState(prev => {
      const updatedGuestPartners = [...prev.guestPartners];
      updatedGuestPartners[index] = {
        ...updatedGuestPartners[index],
        [field]: value
      };
      return {
        ...prev,
        guestPartners: updatedGuestPartners
      };
    });
  };

  // Apply the same ticket to all attendees
  const applyTicketToAllAttendees = useCallback((ticketId: string) => {
    setFormState(prev => {
      // Update masons tickets
      const updatedMasons = prev.masons.map(mason => ({
        ...mason,
        ticket: { 
          ticketId, 
          events: mason.ticket?.events || [] 
        }
      }));
      
      // Update lady & partner tickets
      const updatedLadyPartners = prev.ladyPartners.map(partner => ({
        ...partner,
        ticket: { 
          ticketId, 
          events: partner.ticket?.events || [] 
        }
      }));
      
      // Update guest tickets
      const updatedGuests = prev.guests.map(guest => ({
        ...guest,
        ticket: { 
          ticketId, 
          events: guest.ticket?.events || [] 
        }
      }));
      
      // Update guest partner tickets
      const updatedGuestPartners = prev.guestPartners.map(partner => ({
        ...partner,
        ticket: { 
          ticketId, 
          events: partner.ticket?.events || [] 
        }
      }));
      
      return {
        ...prev,
        masons: updatedMasons,
        ladyPartners: updatedLadyPartners,
        guests: updatedGuests,
        guestPartners: updatedGuestPartners,
        selectedTicket: ticketId
      };
    });
  }, []);

  // Legacy ticket selection (for backward compatibility)
  const selectTicket = useCallback((ticketId: string) => {
    // If uniform ticketing is enabled, apply to all attendees
    if (formState.useUniformTicketing) {
      applyTicketToAllAttendees(ticketId);
    }
    
    setFormState(prev => ({
      ...prev,
      selectedTicket: ticketId
    }));
  }, [formState.useUniformTicketing, applyTicketToAllAttendees]);

  // New individual ticket selection functions
  const selectMasonTicket = (masonIndex: number, ticketId: string, events: string[] = []) => {
    setFormState(prev => {
      const updatedMasons = [...prev.masons];
      updatedMasons[masonIndex] = {
        ...updatedMasons[masonIndex],
        ticket: {
          ticketId,
          events: events
        }
      };
      return {
        ...prev,
        masons: updatedMasons
      };
    });
  };

  const selectLadyPartnerTicket = (partnerIndex: number, ticketId: string, events: string[] = []) => {
    setFormState(prev => {
      const updatedLadyPartners = [...prev.ladyPartners];
      updatedLadyPartners[partnerIndex] = {
        ...updatedLadyPartners[partnerIndex],
        ticket: {
          ticketId,
          events: events
        }
      };
      return {
        ...prev,
        ladyPartners: updatedLadyPartners
      };
    });
  };

  const selectGuestTicket = (guestIndex: number, ticketId: string, events: string[] = []) => {
    setFormState(prev => {
      const updatedGuests = [...prev.guests];
      updatedGuests[guestIndex] = {
        ...updatedGuests[guestIndex],
        ticket: {
          ticketId,
          events: events
        }
      };
      return {
        ...prev,
        guests: updatedGuests
      };
    });
  };

  const selectGuestPartnerTicket = (partnerIndex: number, ticketId: string, events: string[] = []) => {
    setFormState(prev => {
      const updatedGuestPartners = [...prev.guestPartners];
      updatedGuestPartners[partnerIndex] = {
        ...updatedGuestPartners[partnerIndex],
        ticket: {
          ticketId,
          events: events
        }
      };
      return {
        ...prev,
        guestPartners: updatedGuestPartners
      };
    });
  };

  // Toggle uniform ticketing mode
  const toggleUniformTicketing = useCallback((enabled: boolean) => {
    setFormState(prev => ({
      ...prev,
      useUniformTicketing: enabled
    }));
    
    // If enabling, apply current selected ticket to all attendees
    if (enabled) {
      applyTicketToAllAttendees(formState.selectedTicket);
    }
  }, [formState.selectedTicket, applyTicketToAllAttendees]);

  const addMason = () => {
    setFormState(prev => {
      if (prev.masons.length >= 10) return prev; // Max limit check
      const newMasonId = crypto.randomUUID(); // Generate unique ID first
      const newMason: MasonData = {
        ...defaultMasonData,
        id: newMasonId, 
        sameLodgeAsPrimary: true, // Default to same lodge
        hasLadyPartner: false, // Reset partner status
      };
      // Add to order tracking
      const newAttendeeOrder = { type: 'mason' as const, id: newMasonId };
      return {
        ...prev,
        masons: [...prev.masons, newMason],
        attendeeAddOrder: [...prev.attendeeAddOrder, newAttendeeOrder]
      };
    });
  };

  const removeMason = useCallback(() => {
    if (formState.masons.length <= 1) return; // Don't remove primary
    
    setFormState(prev => {
      // If removed mason had a lady partner, we need to remove that too
      const removedMasonIndex = prev.masons.length - 1;
      
      // Filter out any lady partners associated with this mason
      const updatedLadyPartners = prev.ladyPartners.filter(
        lp => lp.masonIndex !== removedMasonIndex
      );
      
      // Remove last mason and corresponding order entry
      const updatedMasons = prev.masons.slice(0, -1);
      const updatedOrder = prev.attendeeAddOrder.filter(item => item.id !== prev.masons[removedMasonIndex].id);

      return {
        ...prev,
        masons: updatedMasons,
        ladyPartners: updatedLadyPartners,
        attendeeAddOrder: updatedOrder
      };
    });
  }, [formState.masons.length]);

  // New function to remove a specific mason by index
  const removeMasonByIndex = useCallback((index: number) => {
    // Don't allow removing the primary mason (index 0)
    if (index === 0 || index >= formState.masons.length) return;
    
    setFormState(prev => {
      const masonToRemove = prev.masons[index];
      // Remove the mason
      const updatedMasons = [...prev.masons];
      updatedMasons.splice(index, 1);
      
      // Remove any lady partner associated with this mason
      let updatedLadyPartners = prev.ladyPartners.filter(
        lp => lp.masonIndex !== index
      );
      
      // Update masonIndex for lady partners of masons with higher indices
      updatedLadyPartners = updatedLadyPartners.map(lp => {
        if (lp.masonIndex > index) {
          return { ...lp, masonIndex: lp.masonIndex - 1 };
        }
        return lp;
      });

      // Remove from order tracking by ID
      const updatedOrder = prev.attendeeAddOrder.filter(item => item.id !== masonToRemove.id);
      
      return {
        ...prev,
        masons: updatedMasons,
        ladyPartners: updatedLadyPartners,
        attendeeAddOrder: updatedOrder
      };
    });
  }, [formState.masons.length]);

  const toggleSameLodge = (index: number, checked: boolean) => {
    setFormState(prev => {
      const updatedMasons = [...prev.masons];
      
      // If checked, copy lodge and grand lodge from primary mason
      if (checked) {
        updatedMasons[index] = {
          ...updatedMasons[index],
          lodge: prev.masons[0].lodge,
          grandLodge: prev.masons[0].grandLodge,
          sameLodgeAsPrimary: true
        };
      } else {
        updatedMasons[index] = {
          ...updatedMasons[index],
          sameLodgeAsPrimary: false
        };
      }
      
      return {
        ...prev,
        masons: updatedMasons
      };
    });
  };

  const toggleHasLadyPartner = (index: number, checked: boolean) => {
    setFormState(prev => {
      let updatedLadyPartners = [...prev.ladyPartners];

      if (checked) {
        // Add a new lady partner if not already present
        const existingPartnerIndex = updatedLadyPartners.findIndex(lp => lp.masonIndex === index);
        if (existingPartnerIndex === -1) {
          const newPartner: LadyPartnerData = {
            ...defaultLadyPartnerData,
            id: crypto.randomUUID(), // Generate unique ID
            masonIndex: index
          };
          updatedLadyPartners.push(newPartner);
        }
      } else {
        // Remove the lady partner associated with this mason
        updatedLadyPartners = updatedLadyPartners.filter(lp => lp.masonIndex !== index);
      }

      const updatedMasons = [...prev.masons];
      if (updatedMasons[index]) {
        updatedMasons[index] = { ...updatedMasons[index], hasLadyPartner: checked };
      }

      return {
        ...prev,
        masons: updatedMasons,
        ladyPartners: updatedLadyPartners
      };
    });
  };

  const addGuest = () => {
    setFormState(prev => {
      if (prev.guests.length >= 10) return prev; // Max limit check
      const newGuestId = crypto.randomUUID(); // Generate unique ID first
      const newGuest: GuestData = {
        ...defaultGuestData,
        id: newGuestId, 
        hasPartner: false // Reset partner status
      };
      // Add to order tracking
      const newAttendeeOrder = { type: 'guest' as const, id: newGuestId };
      return {
        ...prev,
        guests: [...prev.guests, newGuest],
        attendeeAddOrder: [...prev.attendeeAddOrder, newAttendeeOrder]
      };
    });
  };

  const removeGuest = useCallback(() => {
    if (formState.guests.length <= 0) return;
    
    setFormState(prev => {
      // If removed guest had a partner, we need to remove that too
      const removedGuestIndex = prev.guests.length - 1;
      
      // Filter out any partners associated with this guest
      const updatedGuestPartners = prev.guestPartners.filter(
        gp => gp.guestIndex !== removedGuestIndex
      );
      
      // Remove last guest and corresponding order entry
      const updatedGuests = prev.guests.slice(0, -1);
      const updatedOrder = prev.attendeeAddOrder.filter(item => item.id !== prev.guests[removedGuestIndex].id);
      
      return {
        ...prev,
        guests: updatedGuests,
        guestPartners: updatedGuestPartners,
        attendeeAddOrder: updatedOrder
      };
    });
  }, [formState.guests.length]);

  // New function to remove a specific guest by index
  const removeGuestByIndex = useCallback((index: number) => {
    if (index < 0 || index >= formState.guests.length) return;
    
    setFormState(prev => {
      const guestToRemove = prev.guests[index];
      // Remove the guest
      const updatedGuests = [...prev.guests];
      updatedGuests.splice(index, 1);
      
      // Remove any partner associated with this guest
      let updatedGuestPartners = prev.guestPartners.filter(
        gp => gp.guestIndex !== index
      );
      
      // Update guestIndex for partners of guests with higher indices
      updatedGuestPartners = updatedGuestPartners.map(gp => {
        if (gp.guestIndex > index) {
          return { ...gp, guestIndex: gp.guestIndex - 1 };
        }
        return gp;
      });
      
      // Remove from order tracking by ID
      const updatedOrder = prev.attendeeAddOrder.filter(item => item.id !== guestToRemove.id);

      return {
        ...prev,
        guests: updatedGuests,
        guestPartners: updatedGuestPartners,
        attendeeAddOrder: updatedOrder
      };
    });
  }, [formState.guests.length]);

  const toggleGuestUseContact = (index: number, checked: boolean) => {
    setFormState(prev => {
      const updatedGuests = [...prev.guests];
      updatedGuests[index] = {
        ...updatedGuests[index],
        contactPreference: checked ? 'Primary Attendee' : 'Directly'
      };
      return {
        ...prev,
        guests: updatedGuests
      };
    });
  };

  const toggleGuestHasPartner = (index: number, checked: boolean) => {
    setFormState(prev => {
      let updatedGuestPartners = [...(prev.guestPartners || [])];

      if (checked) {
        // Add a new guest partner if not already present
        const existingPartnerIndex = updatedGuestPartners.findIndex(gp => gp.guestIndex === index);
        if (existingPartnerIndex === -1) {
          const newPartner: GuestPartnerData = {
            ...defaultGuestPartnerData,
            id: crypto.randomUUID(), // Generate unique ID
            guestIndex: index
          };
          updatedGuestPartners.push(newPartner);
        }
      } else {
        // Remove the guest partner associated with this guest
        updatedGuestPartners = updatedGuestPartners.filter(gp => gp.guestIndex !== index);
      }

      const updatedGuests = [...prev.guests];
      if (updatedGuests[index]) {
        updatedGuests[index] = { ...updatedGuests[index], hasPartner: checked };
      }

      return {
        ...prev,
        guests: updatedGuests,
        guestPartners: updatedGuestPartners
      };
    });
  };

  // New function to set the registration type
  const setRegistrationType = (type: string) => {
    setFormState(prev => ({
      ...prev,
      registrationType: type,
      step: 2 // Move to step 2 after selecting registration type
    }));
  };

  // Navigation functions
  const nextStep = () => {
    setFormState(prev => ({
      ...prev,
      step: prev.step + 1
    }));
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setFormState(prev => ({
      ...prev,
      step: prev.step > 1 ? prev.step - 1 : 1
    }));
    window.scrollTo(0, 0);
  };
  
  const goToStep = (step: number) => {
    setFormState(prev => ({
      ...prev,
      step: step
    }));
    window.scrollTo(0, 0);
  };

  return (
    <RegisterFormContext.Provider value={useMemo(() => ({
      formState,
      updateFormField,
      updateMasonField,
      updateGuestField,
      updateLadyPartnerField,
      updateGuestPartnerField,
      selectTicket,
      selectMasonTicket,
      selectLadyPartnerTicket,
      selectGuestTicket,
      selectGuestPartnerTicket,
      toggleUniformTicketing,
      applyTicketToAllAttendees,
      addMason,
      removeMason,
      removeMasonByIndex,
      toggleSameLodge,
      toggleHasLadyPartner,
      addGuest,
      removeGuest,
      removeGuestByIndex,
      toggleGuestUseContact,
      toggleGuestHasPartner,
      setRegistrationType,
      nextStep,
      prevStep,
      goToStep
    }), [
      formState,
      selectTicket,
      toggleUniformTicketing,
      applyTicketToAllAttendees,
      removeMason,
      removeMasonByIndex,
      removeGuest,
      removeGuestByIndex
    ])}>
      {children}
    </RegisterFormContext.Provider>
  );
};

// Export the context directly instead of the hook
export { RegisterFormContext };