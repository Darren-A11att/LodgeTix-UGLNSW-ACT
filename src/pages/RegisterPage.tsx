import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getEvents } from '../lib/api/events';
import { EventType } from '../shared/types/event';
import { ReservationProvider } from '../context/ReservationContext';
import RegisterSteps from '../components/register/RegisterSteps';
import RegistrationTypeSelection from '../components/register/RegistrationTypeSelection';
import TicketSelection from '../components/register/TicketSelection';
import AttendeeDetails from '../components/register/AttendeeDetails';
import OrderSummarySection from '../components/register/OrderSummarySection';
import PaymentSection from '../components/register/PaymentSection';
import ConfirmationSection from '../components/register/ConfirmationSection';
import AttendeeSummary from '../components/register/AttendeeSummary';
import TicketingSummary from '../components/register/ticket/TicketingSummary';
import ReservationTimerSection from '../components/register/ReservationTimerSection';
import { useRegistrationStore, UnifiedAttendeeData, RegistrationType, BillingDetailsType, PackageSelectionType } from '../store/registrationStore';
import { FormState, TicketType } from '../shared/types/register';
import DraftRecoveryModal from '../components/register/DraftRecoveryModal';

// Email validation utility
const isValidEmail = (email: string): boolean => {
  // Basic regex for email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Updated validation logic
const getAttendeeDetailErrors = (attendees: UnifiedAttendeeData[], agreeToTerms: boolean): string[] => {
  const errors: string[] = [];
  
  // Use lowercase types for comparison here
  const getAttendeeDesc = (attendee: UnifiedAttendeeData): string => {
    const name = attendee.firstName || attendee.lastName ? `${attendee.firstName} ${attendee.lastName}`.trim() : null;
    let relatedName: string | null = null;
    let relatedDesc = '';

    if (attendee.attendeeType === 'lady_partner' || attendee.attendeeType === 'guest_partner') {
      const relatedAttendee = attendees.find(a => a.attendeeId === attendee.relatedAttendeeId);
      if (relatedAttendee) {
        relatedName = `${relatedAttendee.firstName} ${relatedAttendee.lastName}`.trim();
        relatedDesc = relatedName || (relatedAttendee.attendeeType === 'mason' ? 'Primary Mason' : `${relatedAttendee.attendeeType}`);
      }
      const relDesc = attendee.relationship ? `, ${attendee.relationship.toLowerCase()} of` : ' related to';
      return name ? `${name}${relDesc} ${relatedDesc}` : `Partner of ${relatedDesc}`;
    } else if (attendee.attendeeType === 'mason') {
      const isPrimaryMason = !!attendee.isPrimary;
      return name ? name : (isPrimaryMason ? 'Primary Mason' : 'Additional Mason');
    } else if (attendee.attendeeType === 'guest') {
      return name ? name : `Guest`;
    } else {
       // Handle other types like individual, delegation_member if necessary
       return name || attendee.attendeeType || 'Attendee'; 
    }
  };
  
  attendees.forEach(attendee => {
    const desc = getAttendeeDesc(attendee);
    // Common validation
    if (!attendee.title) errors.push(`Title is required for ${desc}.`);
    if (!attendee.firstName) errors.push(`First Name is required for ${desc}.`);
    if (!attendee.lastName) errors.push(`Last Name is required for ${desc}.`);
    
    // Mason validation
    if (attendee.attendeeType === 'mason') { 
      const isPrimaryMason = !!attendee.isPrimary;
      if (!attendee.rank) errors.push(`Rank is required for ${desc}.`);
      if (attendee.rank === 'GL') {
        if (!attendee.grandOffice && !attendee.pastGrandOffice) {
          errors.push(`Grand Office or Past Grand Office is required for ${desc} with rank GL.`);
        }
      }
      if (isPrimaryMason) { 
        if (!attendee.primaryPhone) errors.push(`Mobile Number is required for ${desc}.`);
        if (!attendee.primaryEmail) errors.push(`Email Address is required for ${desc}.`);
        else if (!isValidEmail(attendee.primaryEmail)) errors.push(`Email Address format is invalid for ${desc}.`);
      } else { 
        if (!attendee.contactPreference) errors.push(`Contact Preference is required for ${desc}.`);
        else if (attendee.contactPreference === 'Directly') {
          if (!attendee.primaryPhone) errors.push(`Mobile Number is required for ${desc} (Contact Directly).`);
          if (!attendee.primaryEmail) errors.push(`Email Address is required for ${desc} (Contact Directly).`);
          else if (!isValidEmail(attendee.primaryEmail)) errors.push(`Email format invalid for ${desc} (Contact Directly).`);
        } else if (!attendee.contactConfirmed) {
          errors.push(`Confirmation checkbox must be ticked for ${desc}.`);
        }
      }
    }
    // Partner validation
    else if (attendee.attendeeType === 'lady_partner' || attendee.attendeeType === 'guest_partner') { 
      if (!attendee.relationship) errors.push(`Relationship is required for ${desc}.`);
      if (!attendee.contactPreference) errors.push(`Contact Preference is required for ${desc}.`);
      else if (attendee.contactPreference === 'Directly') {
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
    // Guest validation
    else if (attendee.attendeeType === 'guest') { 
      if (!attendee.contactPreference) errors.push(`Contact Preference is required for ${desc}.`);
      else if (attendee.contactPreference === 'Directly') {
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
  
  // Validate terms agreement
  if (!agreeToTerms) errors.push('You must agree to the Terms and Conditions');

  return errors;
};

// Component that contains the form logic
const RegisterForm: React.FC = () => {
  const location = useLocation();
  
  // State for fetched events
  const [eventsData, setEventsData] = useState<EventType[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  
  // Get state and actions from the registration store
  const {
      draftId,
      registrationType,
      attendees, 
      packages,
      billingDetails,
      status,
      lastSaved,
      error,
      startNewRegistration,
      loadDraft, 
      clearRegistration,
      setRegistrationType,
      addAttendee, 
      updateAttendee,
      removeAttendee,
      updatePackageSelection,
      updateBillingDetails,
      agreeToTerms,
      setAgreeToTerms
  } = useRegistrationStore();
  
  // Local UI state (current step)
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]); 
  // State for draft recovery modal
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingRegistrationType, setPendingRegistrationType] = useState<RegistrationType | null>(null);

  // --- Fetch Events --- 
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      setEventsError(null);
      try {
        // Fetch events (assuming no pagination needed for initial load here)
        const response = await getEvents({}); // Pass empty object for default params
        setEventsData(response.events); // Extract events array from response
      } catch (error) {
        console.error("Error fetching events:", error);
        setEventsError("Failed to load event data.");
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Step Navigation (using local state) --- 
  const nextStep = useCallback(() => setCurrentStep(prev => prev + 1), []);
  const prevStep = useCallback(() => setCurrentStep(prev => prev - 1), []);
  const goToStep = useCallback((step: number) => setCurrentStep(step), []);

  // --- Update completed steps based on store state --- 
  useEffect(() => {
    const completed: number[] = [];
    if (registrationType) completed.push(1);
    
    const step2ValidationErrors = getAttendeeDetailErrors(attendees, agreeToTerms);
    // Use lowercase 'mason' for comparison
    const step2Complete = attendees.length > 0 &&
                          attendees.some(att => att.attendeeType === 'mason') && 
                          step2ValidationErrors.length === 0;
    if (step2Complete) completed.push(2);

    const step3Complete = attendees.every(att => att.ticket?.ticketDefinitionId);
    if (step3Complete) completed.push(3);

    if (currentStep >= 4 && step3Complete) completed.push(4);
    if (currentStep >= 5 /* && payment details valid? */) completed.push(5);
    if (currentStep >= 6) completed.push(6);

    setCompletedSteps(completed);
  }, [registrationType, attendees, packages, billingDetails, currentStep, agreeToTerms]);

  // --- Registration Type Selection Handler --- 
  const handleSetRegistrationType = (type: string) => {
      const regType = type as RegistrationType;
      const validTypes: RegistrationType[] = ['individual', 'lodge', 'delegation'];
      if (!validTypes.includes(regType)) {
          console.error(`Invalid registration type selected: ${type}`);
          return;
      }

      // Directly check the current state from the hook's return values
      // This state reflects the result of initial load + potential hydration
      const isMeaningfulDraft = !!draftId && 
          attendees.length > 0 && 
          attendees.some(att => att.firstName && att.lastName); // At least one attendee has data

      console.log(`[RegisterPage] handleSetRegistrationType: Selected=${regType}, Current Draft ID=${draftId}, Current Attendees=${attendees.length}, Is Meaningful=${isMeaningfulDraft}`); // DEBUG

      if (isMeaningfulDraft) {
          console.log("[RegisterPage] Meaningful draft detected. Showing modal."); // DEBUG
          setPendingRegistrationType(regType); // Store the type the user *wants* to start
          setShowDraftModal(true);
          // DO NOT proceed - wait for modal interaction
          // Do NOT call setRegistrationType here - wait for modal decision
      } else {
          console.log("[RegisterPage] No meaningful draft. Setting registration type without creating draft yet."); // DEBUG
          // Just set the registration type, but don't create a draft yet - that will happen when entering step 2
          setRegistrationType(regType);
          nextStep(); // Proceed to the next step
      }
  };

  // Create a useEffect to handle the draft creation when entering step 2
  useEffect(() => {
    // Only create a draft when entering step 2 and no draft exists
    if (currentStep === 2 && registrationType && !draftId) {
      console.log(`[RegisterPage] Creating new draft for registration type: ${registrationType}`); // DEBUG
      const newDraftId = startNewRegistration(registrationType);
      console.log(`[RegisterPage] Created new draft with ID: ${newDraftId}`); // DEBUG
    }
  }, [currentStep, registrationType, draftId, startNewRegistration]);

  // --- Modal Handlers ---
  const handleCloseModal = () => {
    setShowDraftModal(false);
    setPendingRegistrationType(null); // Clear pending type when closing
    // Do not advance to next step if user just closes the modal
  };

  const handleContinueDraft = () => {
    // User wants to continue the existing draft. The state is already loaded.
    console.log(`[RegisterPage] Continuing with existing draft (Type: ${registrationType}).`); // DEBUG
    handleCloseModal();
    // Just navigate to step 2 - the correct draft data is already in the store.
    goToStep(2);
  };

  const handleStartNewConfirmed = () => {
    // User confirmed starting a new registration, discarding the old one
    if (pendingRegistrationType) {
        console.log(`[RegisterPage] Starting new registration (Type: ${pendingRegistrationType}) after confirmation.`); // DEBUG
        const newDraftId = startNewRegistration(pendingRegistrationType); // Reset state and set type
        console.log("Started new registration:", newDraftId);
        handleCloseModal();
        // Navigate to step 2 after starting the new registration
        goToStep(2);
    } else {
        console.error("[RegisterPage] Attempted to start new registration without a pending type.");
        handleCloseModal();
    }
  };

  // Find the selected event data
  const selectedEvent = eventsData.find((event) => event.id === registrationType);
  
  // Available tickets are now just the main events list
  const availableEvents = eventsData; // Rename for clarity

  // Get validation errors for Step 2
  const step2ValidationErrors = getAttendeeDetailErrors(attendees, agreeToTerms);

  // Calculate if Attendee Details step is complete
  const isStep2Complete = agreeToTerms && step2ValidationErrors.length === 0;

  // Get single event ticket if coming from event page
  const foundEvent = registrationType
    ? eventsData.find(e => e.id === registrationType)
    : undefined;

  // Ensure the selectedEvent object matches the expected structure, providing a default price
  const selectedEventObj = foundEvent ? {
    ...foundEvent,
    price: 0, // Add placeholder price back for prop compatibility
  } : undefined;

  // Define availableTickets - Placeholder: For now, just use events. 
  // This needs to be replaced with logic combining packages and individual events later.
  const availableTickets = eventsData.map(e => ({ 
      id: e.id, 
      name: e.title ?? 'Event', 
      // Add placeholder price back to satisfy TicketType
      price: 0, 
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

    const getPrice = (ticketId: string): number => {
        // Placeholder: Needs logic for packages vs events
        const ticket = availableTickets.find((t) => t.id === ticketId);
        // If it's a package, get package price
        // If it's an event, get event price
        // Remove price access as it's no longer available here
        // return ticket?.price ?? 0; 
        // TODO: Implement actual pricing logic based on TicketDefinitions
        const ticketPackagePrices: { [key: string]: number } = { full: 350, ceremony: 150, social: 250 }; 
        return ticketId ? (ticketPackagePrices[ticketId] || 0) : 0;
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
  const allAttendees = attendees.map(attendee => {
    const isPartner = attendee.attendeeType === 'lady_partner' || attendee.attendeeType === 'guest_partner';
    let relatedTo = '';
    
    // Find related person for partners
    if (isPartner) {
      const relatedAttendee = attendees.find(a => 
        a.attendeeId === attendee.relatedAttendeeId
      );
      
      if (relatedAttendee) {
        // Ensure relatedAttendee.attendeeType is a string before using it
        const relatedAttendeeTypeString = relatedAttendee.attendeeType || '';
        relatedTo = `${relatedAttendeeTypeString} ${relatedAttendee.firstName} ${relatedAttendee.lastName}`;
      }
    }
    
    return {
      type: attendee.attendeeType.toLowerCase(),
      id: attendee.attendeeId,
      name: `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim(), 
      title: attendee.title ?? '', 
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

  // Create a placeholder FormState for prop compatibility
  const minimalFormState = { 
    billingDetails, 
    registrationType: registrationType ?? 'individual', 
    step: currentStep,
    selectedTicket: '',
    selectedEventId: null,
    masons: [], 
    guests: [],
    ladyPartners: [],
    guestPartners: [],
    agreeToTerms: agreeToTerms,
    useUniformTicketing: true, 
    attendeeAddOrder: [],
    attendees: attendees, 
    // Add missing fields required by FormState type
    registrationId: draftId, // Use draftId from store?
    customerId: null, // Placeholder
    userId: null, // Placeholder
    isLoading: status === 'loading' || status === 'saving', // Derive from store status
    error: error // Use error from store
  } as FormState; // Cast might still be needed depending on exact FormState definition

  // Dummy functions for missing props
  const dummyAction = () => {};

  // Determine what step content to render based on the current step
  const renderStepContent = () => {
    console.log(`[RegisterPage] renderStepContent called. Current step: ${currentStep}, Modal visible: ${showDraftModal}`); // DEBUG
    
    // If we're on step 1 and showing a draft modal, we want to STAY on step 1
    if (currentStep === 1) {
        console.log("[RegisterPage] Rendering step 1: RegistrationTypeSelection"); // DEBUG
        return (
            <RegistrationTypeSelection
                setRegistrationType={handleSetRegistrationType}
                // Disable the whole form while the modal is visible or while loading
                disabled={isLoadingEvents || showDraftModal}
            />
        );
    }
    
    // For other steps, use the existing switch logic
    switch (currentStep) {
        case 2:
            console.log("[RegisterPage] Rendering step 2: AttendeeDetails"); // DEBUG
            return (
                <AttendeeDetails
                    agreeToTerms={agreeToTerms} 
                    onAgreeToTermsChange={setAgreeToTerms} 
                    nextStep={nextStep} 
                    prevStep={prevStep} 
                    validationErrors={step2ValidationErrors} 
                />
            );
        case 3:
            console.log("[RegisterPage] Rendering step 3: TicketSelection"); // DEBUG
            return (
                <TicketSelection
                    formState={minimalFormState} // Pass placeholder formState
                    selectAttendeeTicket={dummyAction} // Pass dummy action
                    nextStep={nextStep}
                    prevStep={prevStep}
                    availableTickets={availableTickets} 
                    selectedEvent={selectedEventObj ? {
                        id: selectedEventObj.id,
                        title: selectedEventObj.title ?? 'Event Title', 
                        day: selectedEventObj.day ?? '', 
                        time: selectedEventObj.time ?? '', 
                        price: selectedEventObj.price ?? 0 
                    } : undefined}
                />
            );
        case 4:
            // Add back formState and dummy actions for OrderSummarySection
            return (
                <OrderSummarySection
                    formState={minimalFormState} // Pass placeholder formState
                    selectedEvent={selectedEventObj ? {
                        id: selectedEventObj.id,
                        title: selectedEventObj.title ?? 'Event Title', 
                        day: selectedEventObj.day ?? '', 
                        time: selectedEventObj.time ?? '', 
                        price: selectedEventObj.price ?? 0 
                    } : undefined}
                    goToStep={goToStep}
                    updateAttendeeField={dummyAction} // Pass dummy action
                    removeMasonById={dummyAction} // Pass dummy action
                    removeGuestById={dummyAction} // Pass dummy action
                />
            );
        case 5:
            // Pass minimal FormState placeholder
            return (
                <PaymentSection
                    formState={minimalFormState} 
                    totalPrice={totalPrice} 
                    handleSubmit={handleSubmit} 
                    prevStep={prevStep} 
                />
            );
        case 6:
            // Pass minimal FormState placeholder
            return (
                <ConfirmationSection
                    formState={minimalFormState} 
                    selectedTicketData={undefined} 
                />
            );
        default:
            console.log(`[RegisterPage] Rendering default step content for step: ${currentStep}`); // DEBUG
            return (
                <div className="text-center py-8">
                    <h2 className="text-2xl font-bold mb-4">{registrationType} Registration</h2>
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

  console.log(`[RegisterPage] Rendering RegisterForm. Current Step: ${currentStep}, Registration Type: ${registrationType}, Modal Visible: ${showDraftModal}`); // DEBUG

  return (
    <form onSubmit={handleSubmit}>
        <RegisterSteps
            step={currentStep}
            registrationType={registrationType ?? undefined}
            goToStep={goToStep}
            completedSteps={completedSteps}
        />

        {/* Render modal - Make sure it's positioned above everything else with appropriate z-index */} 
        <DraftRecoveryModal 
            isOpen={showDraftModal}
            onClose={handleCloseModal} 
            onContinue={handleContinueDraft}
            onStartNew={handleStartNewConfirmed}
        />

        {/* Add two-column layout only after registration type is selected and before confirmation */}
        {registrationType && currentStep > 1 && currentStep < 6 ? (
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
                        {/* Only show reservation timer after ticket selection (step 3+) */}
                        {currentStep >= 3 && <ReservationTimerSection />}
                    </div>
                    
                    {/* Show TicketingSummary (renamed Order Summary) on Step 3, else show AttendeeSummary */}
                    {currentStep === 3 ? (
                        <TicketingSummary />
                    ) : (
                        <AttendeeSummary />
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
                        {currentStep >= 3 && <ReservationTimerSection />}
                        
                        {currentStep === 3 ? (
                            <TicketingSummary />
                        ) : (
                            <AttendeeSummary />
                        )}
                    </div>
                </div>
            </div>
        ) : (
            // Render step content directly for step 1 (Type Selection) and step 6 (Confirmation)
            <div className="has-mobile-nav">
                {renderStepContent()}
            </div>
        )}
    </form>
  );
};

// Main RegisterPage component that wraps the form with the context provider
const RegisterPage: React.FC = () => {
  console.log("[RegisterPage] Main component rendering..."); // DEBUG
  const location = useLocation();
  const preselectedEventId = location.state?.selectedEventId;
  console.log(`[RegisterPage] Preselected Event ID: ${preselectedEventId}`); // DEBUG

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
          <ReservationProvider>
            <RegisterForm />
          </ReservationProvider>
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;