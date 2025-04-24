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
import { TicketType } from '../shared/types/register';

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
      switch(formState.step) {
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
              prevStep={backToRegistrationType}
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

      {renderStepContent()}
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
          <p className="text-xl max-w-3xl">
            Complete your registration for the Grand Proclamation ceremony and associated events.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div id="main-content" className="container-custom max-w-5xl">
          <RegisterFormProvider initialEventId={preselectedEventId}>
            <RegisterForm />
          </RegisterFormProvider>
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;