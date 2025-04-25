import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { events } from '../shared/data/events';
import { RegisterFormProvider } from '../context/RegisterFormContext';
import { useRegisterForm } from '../hooks/useRegisterForm';
import RegisterSteps from '../components/register/RegisterSteps';
import RegistrationTypeSelection from '../components/register/RegistrationTypeSelection';
import TicketSelection from '../components/register/TicketSelection';
import AttendeeDetails from '../components/register/AttendeeDetails';
import OrderSummarySection from '../components/register/OrderSummarySection';
import PaymentSection from '../components/register/PaymentSection';
import ConfirmationSection from '../components/register/ConfirmationSection';
import AttendeeSummary from '../components/register/AttendeeSummary';
import TicketingSummary from '../components/register/ticket/TicketingSummary';
import { TicketType, FormState } from '../shared/types/register';

// Email validation utility
const isValidEmail = (email: string): boolean => {
  // Basic regex for email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Function to get specific validation errors for Attendee Details step
const getAttendeeDetailErrors = (formState: FormState): string[] => {
  const errors: string[] = [];

  // Helper to get attendee description using primitive values
  const getAttendeeDesc = (
    type: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner',
    index: number,
    firstName?: string,
    lastName?: string,
    relationship?: string,
    relatedIndex?: number, // Index of the related mason/guest
    relatedFirstName?: string,
    relatedLastName?: string
  ): string => {
    const name = firstName || lastName ? `${firstName} ${lastName}`.trim() : null;
    const relatedName = relatedFirstName || relatedLastName ? `${relatedFirstName} ${relatedLastName}`.trim() : null;

    switch (type) {
      case 'mason': {
        return name ? name : (index === 0 ? 'Primary Mason' : `Additional Mason ${index}`);
      }
      case 'ladyPartner': {
        const relDesc = relationship ? `, ${relationship.toLowerCase()} of` : ' related to';
        const relatedDesc = relatedName ? relatedName : (relatedIndex === 0 ? 'Primary Mason' : `Additional Mason ${relatedIndex}`);
        return name ? `${name}${relDesc} ${relatedDesc}` : `Lady/Partner of ${relatedDesc}`;
      }
      case 'guest': {
        return name ? name : `Guest ${index + 1}`;
      }
      case 'guestPartner': {
        const relDesc = relationship ? `, ${relationship.toLowerCase()} of` : ' related to';
        const relatedDesc = relatedName ? relatedName : `Guest ${relatedIndex !== undefined ? relatedIndex + 1 : '?'}`;
        return name ? `${name}${relDesc} ${relatedDesc}` : `Partner of ${relatedDesc}`;
      }
    }
  };

  // Check Masons
  formState.masons.forEach((mason, index) => {
    const desc = getAttendeeDesc('mason', index, mason.firstName, mason.lastName);
    if (!mason.title) errors.push(`Title is required for ${desc}.`);
    if (!mason.firstName) errors.push(`First Name is required for ${desc}.`);
    if (!mason.lastName) errors.push(`Last Name is required for ${desc}.`);
    if (!mason.rank || mason.rank === 'Please Select') errors.push(`Rank is required for ${desc}.`);
    if (!mason.grandLodge || mason.grandLodge === 'Please Select') errors.push(`Grand Lodge is required for ${desc}.`);

    const isPrimaryMason = index === 0;
    if (!isPrimaryMason && !mason.sameLodgeAsPrimary && !mason.lodge) errors.push(`Lodge is required for ${desc} (or select 'Same Lodge as Primary').`);
    if (isPrimaryMason && !mason.lodge) errors.push(`Lodge is required for ${desc}.`);

    if (mason.rank === 'GL') {
      if (!mason.grandOfficer || mason.grandOfficer === 'Please Select') errors.push(`Grand Officer status is required for ${desc}.`);
      if ((mason.grandOfficer === 'Current' || mason.grandOfficer === 'Past') && (!mason.grandOffice || mason.grandOffice === 'Please Select')) errors.push(`Grand Office is required for ${desc}.`);
      if (mason.grandOffice === 'Other' && !mason.grandOfficeOther) errors.push(`'Other' Grand Office description is required for ${desc}.`);
    }

    // Specific contact validation for Primary Mason (index 0)
    if (isPrimaryMason) {
       if (!mason.phone) errors.push(`Mobile Number is required for ${desc}.`);
       if (!mason.email) {
         errors.push(`Email Address is required for ${desc}.`);
       } else if (!isValidEmail(mason.email)) {
         errors.push(`Email Address format is invalid for ${desc}.`);
       }
    } else {
      // Contact validation for Additional Masons
      if (!mason.contactPreference || mason.contactPreference === 'Please Select') {
        errors.push(`Contact Preference is required for ${desc}.`);
      } else if (mason.contactPreference === 'Directly') {
        if (!mason.phone) errors.push(`Mobile Number is required for ${desc} when Contact Preference is 'Directly'.`);
        if (!mason.email) {
          errors.push(`Email Address is required for ${desc} when Contact Preference is 'Directly'.`);
        } else if (!isValidEmail(mason.email)) {
          errors.push(`Email Address format is invalid for ${desc} when Contact Preference is 'Directly'.`);
        }
      } else if (!mason.contactConfirmed) {
         errors.push(`Confirmation checkbox must be ticked for ${desc} when Contact Preference is not 'Directly'.`);
      }
    }
  });

  // Check Lady Partners
  formState.ladyPartners.forEach((partner, index) => {
    const relatedMason = formState.masons[partner.masonIndex];
    const desc = getAttendeeDesc(
      'ladyPartner',
      index, 
      partner.firstName, 
      partner.lastName, 
      partner.relationship,
      partner.masonIndex, // relatedIndex
      relatedMason?.firstName,
      relatedMason?.lastName
    );
    if (!partner.relationship || partner.relationship === 'Please Select') errors.push(`Relationship is required for ${desc}.`);
    if (!partner.title) errors.push(`Title is required for ${desc}.`);
    if (!partner.firstName) errors.push(`First Name is required for ${desc}.`);
    if (!partner.lastName) errors.push(`Last Name is required for ${desc}.`);
    if (!partner.contactPreference || partner.contactPreference === 'Please Select') {
       errors.push(`Contact Preference is required for ${desc}.`);
    } else if (partner.contactPreference === 'Directly') {
      if (!partner.phone) errors.push(`Mobile Number is required for ${desc} when Contact Preference is 'Directly'.`);
      if (!partner.email) {
        errors.push(`Email Address is required for ${desc} when Contact Preference is 'Directly'.`);
      } else if (!isValidEmail(partner.email)) {
        errors.push(`Email Address format is invalid for ${desc} when Contact Preference is 'Directly'.`);
      }
    } else if (!partner.contactConfirmed) {
       errors.push(`Confirmation checkbox must be ticked for ${desc} when Contact Preference is not 'Directly'.`);
    }
  });

  // Check Guests
  formState.guests.forEach((guest, index) => {
    const desc = getAttendeeDesc('guest', index, guest.firstName, guest.lastName);
    if (!guest.title) errors.push(`Title is required for ${desc}.`);
    if (!guest.firstName) errors.push(`First Name is required for ${desc}.`);
    if (!guest.lastName) errors.push(`Last Name is required for ${desc}.`);
    if (!guest.contactPreference || guest.contactPreference === 'Please Select') {
       errors.push(`Contact Preference is required for ${desc}.`);
    } else if (guest.contactPreference === 'Directly') {
      if (!guest.phone) errors.push(`Mobile Number is required for ${desc} when Contact Preference is 'Directly'.`);
      if (!guest.email) {
        errors.push(`Email Address is required for ${desc} when Contact Preference is 'Directly'.`);
      } else if (!isValidEmail(guest.email)) {
        errors.push(`Email Address format is invalid for ${desc} when Contact Preference is 'Directly'.`);
      }
    } else if (!guest.contactConfirmed) {
       errors.push(`Confirmation checkbox must be ticked for ${desc} when Contact Preference is not 'Directly'.`);
    }
  });

  // Check Guest Partners
  formState.guestPartners.forEach((partner, index) => {
    const relatedGuest = formState.guests[partner.guestIndex];
    const desc = getAttendeeDesc(
      'guestPartner',
      index, 
      partner.firstName, 
      partner.lastName, 
      partner.relationship,
      partner.guestIndex, // relatedIndex
      relatedGuest?.firstName,
      relatedGuest?.lastName
    );
    if (!partner.relationship || partner.relationship === 'Please Select') errors.push(`Relationship is required for ${desc}.`);
    if (!partner.title) errors.push(`Title is required for ${desc}.`);
    if (!partner.firstName) errors.push(`First Name is required for ${desc}.`);
    if (!partner.lastName) errors.push(`Last Name is required for ${desc}.`);
    if (!partner.contactPreference || partner.contactPreference === 'Please Select') {
       errors.push(`Contact Preference is required for ${desc}.`);
    } else if (partner.contactPreference === 'Directly') {
      if (!partner.phone) errors.push(`Mobile Number is required for ${desc} when Contact Preference is 'Directly'.`);
      if (!partner.email) {
        errors.push(`Email Address is required for ${desc} when Contact Preference is 'Directly'.`);
      } else if (!isValidEmail(partner.email)) {
        errors.push(`Email Address format is invalid for ${desc} when Contact Preference is 'Directly'.`);
      }
    } else if (!partner.contactConfirmed) {
       errors.push(`Confirmation checkbox must be ticked for ${desc} when Contact Preference is not 'Directly'.`);
    }
  });

  return errors;
};

// Component that contains the form logic
const RegisterForm: React.FC = () => {
  const location = useLocation();
  const preselectedEventId = location.state?.selectedEventId;
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const {
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
    addGuest,
    removeGuest,
    removeGuestByIndex,
    toggleGuestHasPartner,
    toggleSameLodge,
    toggleHasLadyPartner,
    setRegistrationType,
    nextStep,
    prevStep,
    goToStep
  } = useRegisterForm();

  // Apply preselected event ID if it exists and not already set
  useEffect(() => {
    if (preselectedEventId && !formState.selectedEventId) {
      updateFormField('selectedEventId', preselectedEventId);
    }
  }, [preselectedEventId, formState.selectedEventId, updateFormField]);

  // Update completedSteps when form state changes
  useEffect(() => {
    const completed = [];

    // Step 1 is always completed once registration type is selected
    if (formState.registrationType) {
      completed.push(1);
    }

    // Step 2 (Attendee Details) criteria
    const step2Complete =
      formState.masons.length > 0 &&
      formState.masons[0].firstName &&
      formState.masons[0].lastName &&
      formState.agreeToTerms;

    if (step2Complete) {
      completed.push(2);
    }

    // Step 3 (Select Tickets) criteria - check if tickets have been selected
    const hasSelectedTickets = formState.useUniformTicketing
      ? !!formState.selectedTicket
      : formState.masons.every(m => !!m.ticket?.ticketId) &&
      formState.ladyPartners.every(lp => !!lp.ticket?.ticketId) &&
      formState.guests.every(g => !!g.ticket?.ticketId) &&
      formState.guestPartners.every(gp => !!gp.ticket?.ticketId);

    if (hasSelectedTickets) {
      completed.push(3);
    }

    // Step 4 (Review Order) is completed if we've moved past it
    if (formState.step > 4) {
      completed.push(4);
    }

    // Step 5 (Payment) is only marked as completed when we reach confirmation
    if (formState.step === 6) {
      completed.push(5);
    }

    setCompletedSteps(completed);
  }, [formState]);

  // Get validation errors for Step 2
  const step2ValidationErrors = getAttendeeDetailErrors(formState);

  // Calculate if Attendee Details step is complete
  const isStep2Complete = formState.agreeToTerms && step2ValidationErrors.length === 0;

  // Get single event ticket if coming from event page
  const foundEvent = formState.selectedEventId
    ? events.find(e => e.id === formState.selectedEventId)
    : undefined;

  // Ensure the selectedEvent object matches the expected structure, providing a default price
  const selectedEvent = foundEvent ? {
    ...foundEvent,
    price: foundEvent.price ?? 0 // Default price to 0 if undefined
  } : undefined;

  // Define standard ticket packages
  const tickets: TicketType[] = [
    {
      id: 'full',
      name: 'Full Package',
      description: 'Access to all events throughout the weekend',
      price: 350,
      includes: [
        'Welcome Reception (Friday)',
        'Proclamation Ceremony (Saturday)',
        'Gala Dinner (Saturday)',
        'Thanksgiving Service (Sunday)',
        'Farewell Lunch (Sunday)',
        'Commemorative Gift Package'
      ]
    },
    {
      id: 'ceremony',
      name: 'Ceremony Only',
      description: 'Access to the main Proclamation ceremony only',
      price: 150,
      includes: [
        'Proclamation Ceremony (Saturday)',
        'Commemorative Program'
      ]
    },
    {
      id: 'social',
      name: 'Social Events',
      description: 'Access to all social events (no ceremony)',
      price: 250,
      includes: [
        'Welcome Reception (Friday)',
        'Gala Dinner (Saturday)',
        'Farewell Lunch (Sunday)'
      ]
    }
  ];

  // Create single event ticket if coming from event page
  const singleEventTicket: TicketType | null = selectedEvent ? {
    id: selectedEvent.id,
    name: selectedEvent.title,
    description: `Admission to ${selectedEvent.title}`,
    price: selectedEvent.price ?? 0,
    includes: [
      `Admission to ${selectedEvent.title}`,
      selectedEvent.type === 'Ceremony' ? 'Official Program' : 'Refreshments',
    ]
  } : null;

  // Combine standard tickets with event-specific ticket if applicable
  const availableTickets = singleEventTicket
    ? [singleEventTicket, ...tickets]
    : tickets;

  const selectedTicketData = availableTickets.find(ticket => ticket.id === formState.selectedTicket);

  // Calculate total price
  const calculateTotalPrice = (): number => {
    let total = 0;

    // If using uniform ticketing
    if (formState.useUniformTicketing) {
      const ticketPrice = selectedTicketData?.price ?? 0;
      const attendeeCount = formState.masons.length +
        formState.ladyPartners.length +
        formState.guests.length +
        formState.guestPartners.length;

      return ticketPrice * attendeeCount;
    }

    // Individual tickets calculation
    // This is a simplified version - copied from OrderSummarySection for consistency
    const ticketPackagePrices: Record<string, number> = {
      'full': 350,
      'ceremony': 150,
      'social': 250
    };

    const getPrice = (ticketId: string): number => {
      if (ticketId in ticketPackagePrices) {
        return ticketPackagePrices[ticketId];
      }

      const event = events.find(e => e.id === ticketId);
      return event?.price ?? 0;
    };

    // Add up all individual ticket prices
    [...formState.masons, ...formState.ladyPartners, ...formState.guests, ...formState.guestPartners].forEach(attendee => {
      if (attendee.ticket?.ticketId) {
        total += getPrice(attendee.ticket.ticketId);
      }
    });

    return total;
  };

  const totalPrice = calculateTotalPrice();

  // Get flat list of all attendees (copied from TicketSelection for use in TicketingSummary)
  const allAttendees = [
    // First add all masons with their partners directly after them
    ...formState.masons.flatMap((mason, masonIndex) => {
      // Find any partners associated with this mason
      const relatedPartners = formState.ladyPartners.filter(partner =>
        partner.masonIndex === masonIndex
      );

      return [
        {
          type: 'mason' as const,
          index: masonIndex,
          name: `${mason.firstName} ${mason.lastName}`,
          title: mason.title,
          data: mason
        },
        ...relatedPartners.map(partner => ({
          type: 'ladyPartner' as const,
          index: formState.ladyPartners.findIndex(p => p === partner),
          name: `${partner.firstName} ${partner.lastName}`,
          title: partner.title,
          data: partner,
          relatedTo: `Mason ${mason.firstName} ${mason.lastName}`
        }))
      ];
    }),

    // Then add all guests with their partners directly after them
    ...formState.guests.flatMap((guest, guestIndex) => {
      // Find any partners associated with this guest
      const relatedPartners = formState.guestPartners.filter(partner =>
        partner.guestIndex === guestIndex
      );

      return [
        {
          type: 'guest' as const,
          index: guestIndex,
          name: `${guest.firstName} ${guest.lastName}`,
          title: guest.title,
          data: guest
        },
        ...relatedPartners.map(partner => ({
          type: 'guestPartner' as const,
          index: formState.guestPartners.findIndex(p => p === partner),
          name: `${partner.firstName} ${partner.lastName}`,
          title: partner.title,
          data: partner,
          relatedTo: `Guest ${guest.firstName} ${guest.lastName}`
        }))
      ];
    })
  ];

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
    // For the individual registration type (Myself & Others)
    if (formState.registrationType === 'individual') {
      switch (formState.step) {
        case 1: // Registration Type Selection
          return (
            <RegistrationTypeSelection
              setRegistrationType={setRegistrationType}
            />
          );
        case 2: // Attendee Details
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
              removeMason={removeMason}
              removeMasonByIndex={removeMasonByIndex}
              addGuest={addGuest}
              removeGuest={removeGuest}
              removeGuestByIndex={removeGuestByIndex}
              nextStep={nextStep}
              prevStep={prevStep}
              isStep2Complete={isStep2Complete}
              validationErrors={step2ValidationErrors}
            />
          );
        case 3: // Select Tickets
          return (
            <TicketSelection
              formState={formState}
              availableTickets={availableTickets}
              selectedEvent={selectedEvent}
              selectTicket={selectTicket}
              selectMasonTicket={selectMasonTicket}
              selectLadyPartnerTicket={selectLadyPartnerTicket}
              selectGuestTicket={selectGuestTicket}
              selectGuestPartnerTicket={selectGuestPartnerTicket}
              toggleUniformTicketing={toggleUniformTicketing}
              applyTicketToAllAttendees={applyTicketToAllAttendees}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          );
        case 4: // Order Summary (new step)
          return (
            <OrderSummarySection
              formState={formState}
              nextStep={nextStep}
              prevStep={prevStep}
              updateMasonField={updateMasonField}
              updateGuestField={updateGuestField}
              updateLadyPartnerField={updateLadyPartnerField}
              updateGuestPartnerField={updateGuestPartnerField}
              toggleSameLodge={toggleSameLodge}
              toggleHasLadyPartner={toggleHasLadyPartner}
              toggleGuestHasPartner={toggleGuestHasPartner}
            />
          );
        case 5: // Payment
          return (
            <PaymentSection
              formState={formState}
              totalPrice={totalPrice}
              handleSubmit={handleSubmit}
              prevStep={prevStep}
            />
          );
        case 6: // Confirmation
          return (
            <ConfirmationSection
              formState={formState}
              selectedTicketData={selectedTicketData}
            />
          );
      }
    }

    // For other registration types (not implemented yet)
    else if (formState.registrationType !== '') {
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

    // Default to registration type selection
    else {
      return (
        <RegistrationTypeSelection
          setRegistrationType={setRegistrationType}
        />
      );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <RegisterSteps
        step={formState.step}
        registrationType={formState.registrationType}
        goToStep={goToStep}
        completedSteps={completedSteps}
      />

      {/* Add two-column layout only after registration type is selected and before confirmation */}
      {formState.registrationType && formState.step > 1 && formState.step < 6 ? (
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left Column: Step Content */}
          <div className="w-full md:w-2/3">
            {renderStepContent()}
          </div>

          {/* Right Column: Attendee Summary ONLY */}
          <div className="w-full md:w-1/3 space-y-6 md:mt-[3.75rem]">
            {/* Show TicketingSummary (renamed Order Summary) on Step 3, else show AttendeeSummary */}
            {formState.step === 3 ? (
              <TicketingSummary
                formState={formState}
                allAttendees={allAttendees}
                availableTickets={availableTickets}
              />
            ) : (
              <AttendeeSummary
                masons={formState.masons}
                guests={formState.guests}
                ladyPartners={formState.ladyPartners}
                guestPartners={formState.guestPartners}
                removeMasonByIndex={removeMasonByIndex}
                removeGuestByIndex={removeGuestByIndex}
                toggleHasLadyPartner={toggleHasLadyPartner}
                toggleGuestHasPartner={toggleGuestHasPartner}
              />
            )}
          </div>
        </div>
      ) : (
        // Render step content directly for step 1 (Type Selection) and step 6 (Confirmation)
        renderStepContent()
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
      <section className="bg-primary text-white py-16">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-6">Register for the Grand Proclamation</h1>
          <p className="text-xl max-w-xl">
            Complete your registration for the Grand Proclamation ceremony and associated events.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div id="main-content" className="container-custom max-w-7xl">
          <RegisterFormProvider initialEventId={preselectedEventId}>
            <RegisterForm />
          </RegisterFormProvider>
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;