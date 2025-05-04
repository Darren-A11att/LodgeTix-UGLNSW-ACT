import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { events } from '../shared/data/events';
import { RegisterFormProvider } from '../context/RegisterFormContext';
import { ReservationProvider } from '../context/ReservationContext';
import { useRegisterForm } from '../hooks/useRegisterForm';
import { useRegistrationProgress } from '../hooks/useRegistrationProgress';
import RegisterSteps from '../components/register/RegisterSteps';
import RegistrationTypeSelection from '../components/register/RegistrationTypeSelection';
import TicketSelection from '../components/register/TicketSelection';
import AttendeeDetails from '../components/register/AttendeeDetails';
import OrderSummarySection from '../components/register/OrderSummarySection';
import PaymentSection from '../components/register/PaymentSection';
import ConfirmationSection from '../components/register/ConfirmationSection';
import AttendeeSummary from '../components/register/AttendeeSummary';
import TicketingSummary from '../components/register/ticket/TicketingSummary';
import RegistrationRecoveryModal from '../components/register/RegistrationRecoveryModal';
import ReservationTimerSection from '../components/register/ReservationTimerSection';
import { FormState, MasonData, GuestData, LadyPartnerData, GuestPartnerData } from '../shared/types/register';
import { RegistrationProgress } from '../lib/registrationProgressTracker';
import { AttendeeData } from '../lib/api/registrations';

// Email validation utility
const isValidEmail = (email: string): boolean => {
  // Basic regex for email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Function to get specific validation errors for Attendee Details step
const getAttendeeDetailErrors = (formState: FormState): string[] => {
  const errors: string[] = [];
  const attendees = formState.attendees || [];

  // Helper to get attendee description
  const getAttendeeDesc = (attendee: AttendeeData): string => {
    const name = attendee.firstName || attendee.lastName ? `${attendee.firstName} ${attendee.lastName}`.trim() : null;
    let relatedName: string | null = null;
    let relatedDesc = '';

    if (attendee.attendeeType === 'LadyPartner' || attendee.attendeeType === 'GuestPartner') {
      // Find related person
      const relatedAttendee = attendees.find(a => a.attendeeId === attendee.relatedAttendeeId);
      if (relatedAttendee) {
        relatedName = `${relatedAttendee.firstName} ${relatedAttendee.lastName}`.trim();
        relatedDesc = relatedName || (relatedAttendee.attendeeType === 'Mason' ? 'Primary Mason' : `${relatedAttendee.attendeeType}`);
      }
      
      const relDesc = attendee.relationship ? `, ${attendee.relationship.toLowerCase()} of` : ' related to';
      return name ? `${name}${relDesc} ${relatedDesc}` : `Partner of ${relatedDesc}`;
    } else if (attendee.attendeeType === 'Mason') {
      return name ? name : (attendee.isPrimary ? 'Primary Mason' : 'Additional Mason');
    } else { // Guest
      return name ? name : `Guest`;
    }
  };

  // Check all attendees
  attendees.forEach(attendee => {
    const desc = getAttendeeDesc(attendee);
    
    // Common validation for all attendee types
    if (!attendee.title) errors.push(`Title is required for ${desc}.`);
    if (!attendee.firstName) errors.push(`First Name is required for ${desc}.`);
    if (!attendee.lastName) errors.push(`Last Name is required for ${desc}.`);
    
    // Type-specific validation
    if (attendee.attendeeType === 'Mason') {
      if (!attendee.rank || attendee.rank === 'Please Select') errors.push(`Rank is required for ${desc}.`);
      
      // Need to handle these differently or mock them for validation only
      const lodge = attendee.lodgeId || (attendee as any).lodge;
      const grandLodge = (attendee as any).grandLodge;
      if (!grandLodge || grandLodge === 'Please Select') errors.push(`Grand Lodge is required for ${desc}.`);

      const isPrimaryMason = attendee.isPrimary;
      const sameLodgeAsPrimary = (attendee as any).sameLodgeAsPrimary;
      if (!isPrimaryMason && !sameLodgeAsPrimary && !lodge) errors.push(`Lodge is required for ${desc} (or select 'Same Lodge as Primary').`);
      if (isPrimaryMason && !lodge) errors.push(`Lodge is required for ${desc}.`);

      if (attendee.rank === 'GL') {
        if (!attendee.grandOfficer || attendee.grandOfficer === 'Please Select') errors.push(`Grand Officer status is required for ${desc}.`);
        if ((attendee.grandOfficer === 'Current' || attendee.grandOfficer === 'Past') && (!attendee.grandOffice || attendee.grandOffice === 'Please Select')) errors.push(`Grand Office is required for ${desc}.`);
        
        // Mock this property for validation purposes
        const grandOfficeOther = (attendee as any).grandOfficeOther;
        if (attendee.grandOffice === 'Other' && !grandOfficeOther) errors.push(`'Other' Grand Office description is required for ${desc}.`);
      }

      // Specific contact validation for Primary Mason
      if (isPrimaryMason) {
         if (!attendee.primaryPhone) errors.push(`Mobile Number is required for ${desc}.`);
         if (!attendee.primaryEmail) {
           errors.push(`Email Address is required for ${desc}.`);
         } else if (!isValidEmail(attendee.primaryEmail)) {
           errors.push(`Email Address format is invalid for ${desc}.`);
         }
      } else {
        // Contact validation for Additional Masons
        if (!attendee.contactPreference) {
          errors.push(`Contact Preference is required for ${desc}.`);
        } else if (attendee.contactPreference === 'Directly') {
          if (!attendee.primaryPhone) errors.push(`Mobile Number is required for ${desc} when Contact Preference is 'Directly'.`);
          if (!attendee.primaryEmail) {
            errors.push(`Email Address is required for ${desc} when Contact Preference is 'Directly'.`);
          } else if (!isValidEmail(attendee.primaryEmail)) {
            errors.push(`Email Address format is invalid for ${desc} when Contact Preference is 'Directly'.`);
          }
        } else if (!attendee.contactConfirmed) {
           errors.push(`Confirmation checkbox must be ticked for ${desc} when Contact Preference is not 'Directly'.`);
        }
      }
    } else if (attendee.attendeeType === 'LadyPartner' || attendee.attendeeType === 'GuestPartner') {
      if (!attendee.relationship) errors.push(`Relationship is required for ${desc}.`);
      if (!attendee.contactPreference) {
         errors.push(`Contact Preference is required for ${desc}.`);
      } else if (attendee.contactPreference === 'Directly') {
        if (!attendee.primaryPhone) errors.push(`Mobile Number is required for ${desc} when Contact Preference is 'Directly'.`);
        if (!attendee.primaryEmail) {
          errors.push(`Email Address is required for ${desc} when Contact Preference is 'Directly'.`);
        } else if (!isValidEmail(attendee.primaryEmail)) {
          errors.push(`Email Address format is invalid for ${desc} when Contact Preference is 'Directly'.`);
        }
      } else if (!attendee.contactConfirmed) {
         errors.push(`Confirmation checkbox must be ticked for ${desc} when Contact Preference is not 'Directly'.`);
      }
    } else if (attendee.attendeeType === 'Guest') {
      if (!attendee.contactPreference) {
         errors.push(`Contact Preference is required for ${desc}.`);
      } else if (attendee.contactPreference === 'Directly') {
        if (!attendee.primaryPhone) errors.push(`Mobile Number is required for ${desc} when Contact Preference is 'Directly'.`);
        if (!attendee.primaryEmail) {
          errors.push(`Email Address is required for ${desc} when Contact Preference is 'Directly'.`);
        } else if (!isValidEmail(attendee.primaryEmail)) {
          errors.push(`Email Address format is invalid for ${desc} when Contact Preference is 'Directly'.`);
        }
      } else if (!attendee.contactConfirmed) {
         errors.push(`Confirmation checkbox must be ticked for ${desc} when Contact Preference is not 'Directly'.`);
      }
    }
  });

  // Add terms validation
  if (!formState.agreeToTerms) errors.push('You must agree to the Terms and Conditions');

  return errors;
};

// Component that contains the form logic
const RegisterForm: React.FC = () => {
  const location = useLocation();
  const preselectedEventId = location.state?.selectedEventId;
  const checkForDrafts = location.state?.checkForDrafts;
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // Recovery modal state
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState<boolean>(false);
  const [selectedRegistrationType, setSelectedRegistrationType] = useState<string>('');
  const [currentProgressData, setCurrentProgressData] = useState<RegistrationProgress | null>(null);

  const {
    formState,
    updateFormField,
    updateMasonField,
    updateGuestField,
    updateLadyPartnerField,
    updateGuestPartnerField,
    selectMasonTicket,
    selectLadyPartnerTicket,
    selectGuestTicket,
    selectGuestPartnerTicket,
    addMason,
    removeMasonById,
    addGuest,
    removeGuestById,
    toggleSameLodge,
    toggleHasLadyPartner,
    toggleGuestHasPartner,
    setRegistrationType: contextSetRegistrationType,
    nextStep,
    prevStep,
    goToStep,
    // New methods for draft management
    hasDraftForType,
    getDraftInfoForType,
    loadDraftForType,
    startNewDraft,
    saveDraftState
  } = useRegisterForm();
  
  // Registration progress tracking hook
  const { 
    getProgress, 
    saveProgress,
    getAttendeeSummaryText 
  } = useRegistrationProgress({ 
    formState 
  });

  // Apply preselected event ID if it exists and not already set
  useEffect(() => {
    if (preselectedEventId && !formState.selectedEventId) {
      updateFormField('selectedEventId', preselectedEventId);
    }
  }, [preselectedEventId, formState.selectedEventId, updateFormField]);
  
  // Enhanced version of setRegistrationType that handles draft recovery
  const handleSetRegistrationType = (type: string) => {
    if (hasDraftForType(type)) {
      // If there's a draft for this type, show the recovery modal
      const progressData = getProgress(type);
      setCurrentProgressData(progressData);
      setSelectedRegistrationType(type);
      setIsRecoveryModalOpen(true);
    } else {
      // Otherwise proceed normally
      contextSetRegistrationType(type);
      
      // Save initial progress data
      const draftInfo = getDraftInfoForType(type);
      if (draftInfo) {
        saveProgress(type, draftInfo.draftId, {
          lastStep: 2, // Attendee Details
          attendeeCount: 0
        });
      }
    }
  };
  
  // Handler for starting a new registration from the recovery modal
  const handleStartNewRegistration = () => {
    if (selectedRegistrationType) {
      // Ensure redirect prevention is active
      localStorage.setItem('lodgetix_bypass_no_redirect', 'true');
      localStorage.setItem('lodgetix_disable_expiry', 'true');
      
      startNewDraft(selectedRegistrationType);
      setIsRecoveryModalOpen(false);
    }
  };
  
  // Handler for editing attendees from the recovery modal
  const handleEditAttendees = () => {
    if (selectedRegistrationType) {
      // Ensure redirect prevention is active
      localStorage.setItem('lodgetix_bypass_no_redirect', 'true');
      localStorage.setItem('lodgetix_disable_expiry', 'true');
      
      loadDraftForType(selectedRegistrationType);
      goToStep(2); // Attendee Details
      setIsRecoveryModalOpen(false);
    }
  };
  
  // Handler for continuing registration from the recovery modal
  const handleContinueRegistration = () => {
    if (selectedRegistrationType && currentProgressData) {
      // Ensure redirect prevention is active
      localStorage.setItem('lodgetix_bypass_no_redirect', 'true');
      localStorage.setItem('lodgetix_disable_expiry', 'true');
      
      loadDraftForType(selectedRegistrationType);
      // Navigate to the last step they were on
      const targetStep = Math.min(currentProgressData.lastStep, 6); // Ensure we don't go beyond Step 6
      goToStep(targetStep);
      setIsRecoveryModalOpen(false);
    }
  };
  
  // Check for drafts on initial page load if coming from "Register Now" button
  useEffect(() => {
    // Skip draft checking if we have the bypass flag to prevent redirection
    const hasNoRedirectFlag = localStorage.getItem('lodgetix_bypass_no_redirect') === 'true';
    
    if (!hasNoRedirectFlag && checkForDrafts && formState.step === 1 && !formState.registrationType) {
      // This only runs when navigating directly to the register page
      // with checkForDrafts flag from the Register Now button
      
      // Check if we have any drafts and show the modal for the first one found
      const types = ['individual', 'lodge', 'delegation'];
      for (const type of types) {
        if (hasDraftForType(type)) {
          const progressData = getProgress(type);
          setCurrentProgressData(progressData);
          setSelectedRegistrationType(type);
          setIsRecoveryModalOpen(true);
          break; // Only show for the first type found
        }
      }
    }
  }, [checkForDrafts, formState.step, formState.registrationType, hasDraftForType, getProgress]);

  // Find the selected event data
  const selectedEvent = events.find((event) => event.id === formState.selectedEventId);
  
  // Available tickets are now just the main events list
  const availableEvents = events; // Rename for clarity

  // Update completedSteps when form state changes
  useEffect(() => {
    const completed = [];
    if (formState.registrationType) completed.push(1);
    
    // Define step 2 completion criteria
    const attendees = formState.attendees || [];
    const step2Complete = attendees.length > 0 &&
                          attendees.some(att => att.attendeeType === 'Mason') &&
                          attendees.find(att => att.attendeeType === 'Mason')?.firstName &&
                          attendees.find(att => att.attendeeType === 'Mason')?.lastName &&
                          formState.agreeToTerms;
                          
    if (step2Complete) completed.push(2);

    // Define step 3 completion criteria (example: at least one ticket selected)
    const step3Complete = attendees.some(att => att.ticket?.ticketDefinitionId);
                          
    if (step3Complete) completed.push(3);

    // Check if current step 4 is considered complete (e.g., just viewing it)
    // For now, let's assume reaching step 4 means step 3 is done.
    if (formState.step >= 4 && step3Complete) completed.push(4);
    if (formState.step >= 5) completed.push(5); // Payment
    if (formState.step >= 6) completed.push(6); // Confirmation

    setCompletedSteps(completed);

  }, [formState]); // Re-evaluate completed steps based on formState

  // Get validation errors for Step 2
  const step2ValidationErrors = getAttendeeDetailErrors(formState);

  // Calculate if Attendee Details step is complete
  const isStep2Complete = formState.agreeToTerms && step2ValidationErrors.length === 0;

  // Get single event ticket if coming from event page
  const foundEvent = formState.selectedEventId
    ? events.find(e => e.id === formState.selectedEventId)
    : undefined;

  // Ensure the selectedEvent object matches the expected structure, providing a default price
  const selectedEventObj = foundEvent ? {
    ...foundEvent,
    price: foundEvent.price ?? 0 // Default price to 0 if undefined
  } : undefined;

  // Define availableTickets - Placeholder: For now, just use events. 
  // This needs to be replaced with logic combining packages and individual events later.
  const availableTickets = events.map(e => ({ 
      id: e.id, 
      name: e.title ?? 'Event', 
      price: e.price ?? 0,
      // Add other fields needed by TicketType if necessary, using defaults
      description: e.description ?? '',
      includes: [],
      availableTo: [], 
      maxQuantity: 10,
      attendeeTypes: [] 
  })); // Map events to a structure TicketSelection might expect for now

  // calculateTotalPrice needs update later based on package/event price logic
  const calculateTotalPrice = (): number => {
    let total = 0;
    const attendees = formState.attendees || [];

    const getPrice = (ticketId: string): number => {
        // Placeholder: Needs logic for packages vs events
        const ticket = availableTickets.find((t) => t.id === ticketId);
        // If it's a package, get package price
        // If it's an event, get event price
        return ticket?.price ?? 0; 
    };

    // Process all attendees in a unified way
    attendees.forEach(attendee => {
      if (attendee.ticket?.ticketDefinitionId) {
        total += getPrice(attendee.ticket.ticketDefinitionId);
      }
    });

    return total;
  };
  const totalPrice = calculateTotalPrice();

  // Get flat list of all attendees
  const allAttendees = formState.attendees?.map(attendee => {
    const isPartner = attendee.attendeeType === 'LadyPartner' || attendee.attendeeType === 'GuestPartner';
    let relatedTo = '';
    
    // Find related person for partners
    if (isPartner) {
      const relatedAttendee = formState.attendees?.find(a => 
        a.attendeeId === attendee.relatedAttendeeId
      );
      
      if (relatedAttendee) {
        relatedTo = `${relatedAttendee.attendeeType} ${relatedAttendee.firstName} ${relatedAttendee.lastName}`;
      }
    }
    
    return {
      type: attendee.attendeeType.toLowerCase(),
      id: attendee.attendeeId,
      name: `${attendee.firstName} ${attendee.lastName}`,
      title: attendee.title,
      data: attendee,
      ...(relatedTo ? { relatedTo } : {})
    };
  }) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
    // In a real application, you would process the payment and submit the form here
  };

  // New function to handle going back to registration type selection
  const backToRegistrationType = () => {
    goToStep(1);
  };

  // Determine what step content to render based on the current step
  const renderStepContent = () => {
    switch (formState.step) {
      case 1:
        return (
          <RegistrationTypeSelection
            setRegistrationType={handleSetRegistrationType}
          />
        );
      case 2:
        return (
          <AttendeeDetails
            formState={formState}
            updateFormField={updateFormField}
            updateMasonField={updateMasonField}
            updateGuestField={updateGuestField}
            updateLadyPartnerField={updateLadyPartnerField}
            updateGuestPartnerField={updateGuestPartnerField}
            toggleSameLodge={toggleSameLodge}
            toggleHasLadyPartner={toggleHasLadyPartner}
            toggleGuestHasPartner={toggleGuestHasPartner}
            addMason={addMason}
            removeMasonById={removeMasonById}
            addGuest={addGuest}
            removeGuestById={removeGuestById}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <TicketSelection
            // Pass both props for compatibility
            availableTickets={availableTickets}
            tickets={availableTickets}
            selectedEvent={{
                id: selectedEvent?.id ?? '',
                title: selectedEvent?.title ?? 'Event',
                day: selectedEvent?.day ?? '',
                time: selectedEvent?.time ?? '',
                price: selectedEvent?.price ?? 0 
            }}
            formState={formState}
            // Pass ID-based select functions
            selectMasonTicket={selectMasonTicket}
            selectLadyPartnerTicket={selectLadyPartnerTicket}
            selectGuestTicket={selectGuestTicket}
            selectGuestPartnerTicket={selectGuestPartnerTicket}
            selectTicket={(ticketId) => updateFormField('selectedTicket', ticketId)}
            toggleUniformTicketing={(enabled) => updateFormField('useUniformTicketing', enabled)}
            applyTicketToAllAttendees={(ticketId) => {
              // Apply the ticket to all attendees
              const attendees = formState.attendees || [];
              attendees.forEach(attendee => {
                switch (attendee.attendeeType) {
                  case 'Mason':
                    selectMasonTicket(attendee.attendeeId, ticketId, []);
                    break;
                  case 'LadyPartner':
                    selectLadyPartnerTicket(attendee.attendeeId, ticketId, []);
                    break;
                  case 'Guest':
                    selectGuestTicket(attendee.attendeeId, ticketId, []);
                    break;
                  case 'GuestPartner':
                    selectGuestPartnerTicket(attendee.attendeeId, ticketId, []);
                    break;
                }
              });
            }}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <OrderSummarySection
            formState={formState}
            selectedEvent={selectedEventObj}
            goToStep={goToStep}
            // Pass ID-based functions
            updateMasonField={updateMasonField}
            updateGuestField={updateGuestField}
            updateLadyPartnerField={updateLadyPartnerField}
            updateGuestPartnerField={updateGuestPartnerField}
            removeMasonById={removeMasonById}
            removeGuestById={removeGuestById}
            toggleHasLadyPartner={toggleHasLadyPartner}
            toggleGuestHasPartner={toggleGuestHasPartner}
          />
        );
      case 5:
        return (
          <PaymentSection
            formState={formState}
            totalPrice={totalPrice}
            handleSubmit={handleSubmit}
            prevStep={prevStep}
          />
        );
      case 6:
        return (
          <ConfirmationSection
            formState={formState}
            // Use correct variable name
            selectedTicketData={availableTickets.find(ticket => ticket.id === formState.selectedTicket)}
          />
        );
      default:
        return (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">{formState.registrationType} Registration</h2>
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100 max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-amber-800 mb-2">Coming Soon</h3>
              <p className="text-amber-700 mb-4">
                This registration type is still being developed and will be available soon.
              </p>
              <button
                onClick={backToRegistrationType}
                className="btn-primary"
              >
                Go Back to Registration Types
              </button>
            </div>
          </div>
        );
    }
  };

  // Get attendee summary text for display in the modal
  const attendeeSummaryText = formState ? getAttendeeSummaryText(formState) : '';
  
  // Get attendee types and counts for the recovery modal
  const getAttendeeTypes = () => {
    const attendees = formState.attendees || [];
    const typeCounts = attendees.reduce((counts, attendee) => {
      const type = attendee.attendeeType;
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const types = [];
    
    if (typeCounts['Mason']) {
      types.push({
        type: 'Mason',
        count: typeCounts['Mason']
      });
    }
    
    if (typeCounts['LadyPartner']) {
      types.push({
        type: 'Lady/Partner',
        count: typeCounts['LadyPartner']
      });
    }
    
    if (typeCounts['Guest']) {
      types.push({
        type: 'Guest',
        count: typeCounts['Guest']
      });
    }
    
    if (typeCounts['GuestPartner']) {
      types.push({
        type: 'Guest Partner',
        count: typeCounts['GuestPartner']
      });
    }
    
    return types;
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Registration Recovery Modal */}
      <RegistrationRecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        registrationType={selectedRegistrationType}
        progressData={currentProgressData}
        onStartNew={handleStartNewRegistration}
        onEditAttendees={handleEditAttendees}
        onContinue={handleContinueRegistration}
        attendeeSummary={attendeeSummaryText}
        attendeeTypes={currentProgressData?.attendeeTypes ? [
          { type: 'Mason', count: currentProgressData.attendeeTypes.masons },
          { type: 'Lady/Partner', count: currentProgressData.attendeeTypes.ladyPartners },
          { type: 'Guest', count: currentProgressData.attendeeTypes.guests },
          { type: 'Guest Partner', count: currentProgressData.attendeeTypes.guestPartners }
        ].filter(type => type.count > 0) : getAttendeeTypes()}
      />
    
      <RegisterSteps
        step={formState.step}
        registrationType={formState.registrationType}
        goToStep={goToStep}
        completedSteps={completedSteps}
      />

      {/* Add two-column layout only after registration type is selected and before confirmation */}
      {formState.registrationType && formState.step > 1 && formState.step < 6 ? (
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start">
          {/* Left Column: Step Content */}
          <div className="w-full md:w-2/3 has-mobile-nav">
            {renderStepContent()}
            
            {/* Mobile-only: Bottom navigation */}
            <div className="mobile-form-nav md:hidden">
              <button 
                onClick={prevStep}
                className="btn-outline flex-1 mr-2"
                type="button"
                aria-label="Previous step"
              >
                Back
              </button>
              <button 
                onClick={nextStep}
                className="btn-primary flex-1 ml-2"
                type="button"
                aria-label="Next step"
              >
                Continue
              </button>
            </div>
          </div>

          {/* Right Column: Reservation Timer and Attendee Summary */}
          <div className="hidden md:block w-full md:w-1/3 space-y-6 md:mt-[3.75rem]">
            {/* Global Reservation Timer - Shown across all steps once active */}
            <div className="mb-4">
              <ReservationTimerSection />
            </div>
            
            {/* Show TicketingSummary (renamed Order Summary) on Step 3, else show AttendeeSummary */}
            {formState.step === 3 ? (
              <TicketingSummary
                formState={formState}
                allAttendees={allAttendees}
                availableTickets={availableTickets}
              />
            ) : (
              <AttendeeSummary
                attendees={formState.attendees || []}
                removeMasonById={removeMasonById}
                removeGuestById={removeGuestById}
                toggleHasLadyPartner={toggleHasLadyPartner}
                toggleGuestHasPartner={toggleGuestHasPartner}
              />
            )}
          </div>
          
          {/* Mobile-only: Floating summary button that opens bottom sheet */}
          <button 
            className="mobile-fab md:hidden"
            onClick={() => {
              // Add code to toggle the bottom sheet display
              const bottomSheet = document.getElementById('mobile-summary-sheet');
              if (bottomSheet) {
                bottomSheet.classList.toggle('mobile-bottom-sheet-closed');
              }
            }}
            type="button"
            aria-label="Show attendee summary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {/* Mobile-only: Bottom sheet summary */}
          <div id="mobile-summary-sheet" className="mobile-bottom-sheet mobile-bottom-sheet-closed md:hidden">
            <div className="mobile-bottom-sheet-handle" role="button" aria-label="Drag to resize summary sheet"></div>
            <div className="p-4">
              <h3 className="text-lg font-bold mb-4">Registration Summary</h3>
              
              {/* Show reservation timer in mobile view too - direct component without the sticky wrapper */}
              <ReservationTimerSection />
              
              {formState.step === 3 ? (
                <TicketingSummary
                  formState={formState}
                  allAttendees={allAttendees}
                  availableTickets={availableTickets}
                />
              ) : (
                <AttendeeSummary
                  attendees={formState.attendees || []}
                  removeMasonById={removeMasonById}
                  removeGuestById={removeGuestById}
                  toggleHasLadyPartner={toggleHasLadyPartner}
                  toggleGuestHasPartner={toggleGuestHasPartner}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        // Render step content directly for step 1 (Type Selection) and step 6 (Confirmation)
        <div className="has-mobile-nav">
          {renderStepContent()}
          
          {/* Removed redundant bottom navigation for step 1 */}
        </div>
      )}
    </form>
  );
};

// Main RegisterPage component that wraps the form with the context provider
const RegisterPage: React.FC = () => {
  const location = useLocation();
  const preselectedEventId = location.state?.selectedEventId;

  return (
    <div>
      <section className="bg-primary text-white py-10 sm:py-16 hidden sm:block">
        <div className="container-custom">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6">Register for the Grand Proclamation</h1>
          <p className="text-base sm:text-xl max-w-xl">
            Complete your registration for the Grand Proclamation ceremony and associated events.
          </p>
        </div>
      </section>

      <section className="py-6 sm:py-12 bg-white">
        <div id="main-content" className="container-custom max-w-7xl">
          <RegisterFormProvider initialEventId={preselectedEventId}>
            <ReservationProvider>
              <RegisterForm />
            </ReservationProvider>
          </RegisterFormProvider>
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;