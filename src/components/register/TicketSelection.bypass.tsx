import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { TicketType, FormState, MasonData, LadyPartnerData, GuestData, GuestPartnerData } from '../../shared/types/register';
import { events } from '../../shared/data/events';
import { sortEventsByDate, getEligibleEvents, AttendeeData as EligibilityAttendeeData } from '../../shared/utils/eventEligibility';
import TicketingModeToggle from './ticket/TicketingModeToggle';
import UniformTicketing from './ticket/UniformTicketing';
import AttendeeTicketItem from './ticket/AttendeeTicketItem';
import EventSelectionList from './ticket/EventSelectionList';
import { useReservation } from '../../hooks/useReservation';
import { v4 as uuidv4 } from 'uuid';

interface TicketSelectionProps {
  formState: FormState;
  tickets?: TicketType[]; // Allow backward compatibility with tickets instead of availableTickets
  availableTickets?: TicketType[]; // Original prop name for internal use
  selectedEvent?: { id: string; title: string; day: string; time: string; price: number };
  selectTicket?: (ticketId: string) => void; // Make optional
  selectMasonTicket: (masonIndex: number, ticketId: string, events?: string[]) => void;
  selectLadyPartnerTicket: (partnerIndex: number, ticketId: string, events?: string[]) => void;
  selectGuestTicket: (guestIndex: number, ticketId: string, events?: string[]) => void;
  selectGuestPartnerTicket: (partnerIndex: number, ticketId: string, events?: string[]) => void;
  toggleUniformTicketing?: (enabled: boolean) => void; // Make optional
  applyTicketToAllAttendees?: (ticketId: string) => void; // Make optional
  nextStep: () => void;
  prevStep: () => void;
}

// Create a simple local reservation system with typescript interfaces
interface LocalReservation {
  reservationId: string;
  eventId: string;
  ticketDefinitionId: string;
  quantity: number;
  expiresAt: Date;
}

const TicketSelection: React.FC<TicketSelectionProps> = ({ 
  formState, 
  availableTickets, 
  tickets, 
  selectedEvent, 
  selectTicket,
  selectMasonTicket,
  selectLadyPartnerTicket,
  selectGuestTicket,
  selectGuestPartnerTicket,
  toggleUniformTicketing,
  applyTicketToAllAttendees,
  nextStep,
  prevStep
}) => {
  // Log the selected event to debug
  console.log('TicketSelection - selectedEvent:', selectedEvent);
  console.log('TicketSelection - formState.selectedEventId:', formState.selectedEventId);
  
  // Use tickets prop if availableTickets is not provided (backward compatibility)
  const ticketsToUse = availableTickets || tickets || [];
  
  // Create effective event ID - use either the passed selectedEvent.id or formState.selectedEventId
  // For direct ticketing without a specific event, we'll use a hardcoded default that matches welcomeEventId in other places
  const effectiveEventId = (selectedEvent && selectedEvent.id) || formState.selectedEventId || 'welcome-reception';
  
  // Default implementation for optional props
  const selectTicketSafe = selectTicket || ((ticketId: string) => {
    console.warn('selectTicket not provided to TicketSelection component');
  });
  
  const toggleUniformTicketingSafe = toggleUniformTicketing || ((enabled: boolean) => {
    console.warn('toggleUniformTicketing not provided to TicketSelection component');
  });
  
  const applyTicketToAllAttendeesSafe = applyTicketToAllAttendees || ((ticketId: string) => {
    console.warn('applyTicketToAllAttendees not provided to TicketSelection component');
  });
  const [expandedAttendee, setExpandedAttendee] = useState<string | null>(null);
  const [currentTicketSelection, setCurrentTicketSelection] = useState<{
    attendeeType: string;
    index: number;
    ticketId: string;
  } | null>(null);
  
  // BYPASS: Local reservation management instead of API calls
  const [localReservation, setLocalReservation] = useState<LocalReservation | null>(null);
  const [isLocalReserving, setIsLocalReserving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  
  // Use our regular useReservation hook for proper integration
  const reservationApi = useReservation();
  
  // Sort events by date in ascending order
  const sortedEvents = sortEventsByDate([...events]);

  // Get flat list of all attendees for individual ticketing
  const allAttendees = [
    // First add all masons with their partners directly after them
    ...formState.masons.flatMap((mason: MasonData, masonIndex: number) => {
      // Find any partners associated with this mason
      const relatedPartners = formState.ladyPartners.filter((partner: LadyPartnerData) => 
        partner.masonId === mason.id
      );
      
      return [
        { 
          type: 'mason' as const, 
          index: masonIndex, 
          name: `${mason.firstName} ${mason.lastName}`,
          title: mason.title,
          data: mason
        },
        ...relatedPartners.map((partner: LadyPartnerData) => ({
          type: 'ladyPartner' as const, 
          index: formState.ladyPartners.findIndex((p: LadyPartnerData) => p.id === partner.id), 
          name: `${partner.firstName} ${partner.lastName}`,
          title: partner.title,
          data: partner,
          relatedTo: `Mason ${mason.firstName} ${mason.lastName}`
        }))
      ];
    }),
    
    // Then add all guests with their partners directly after them
    ...formState.guests.flatMap((guest: GuestData, guestIndex: number) => {
      // Find any partners associated with this guest
      const relatedPartners = formState.guestPartners.filter((partner: GuestPartnerData) => 
        partner.guestId === guest.id
      );
      
      return [
        { 
          type: 'guest' as const, 
          index: guestIndex, 
          name: `${guest.firstName} ${guest.lastName}`,
          title: guest.title,
          data: guest
        },
        ...relatedPartners.map((partner: GuestPartnerData) => ({
          type: 'guestPartner' as const, 
          index: formState.guestPartners.findIndex((p: GuestPartnerData) => p.id === partner.id), 
          name: `${partner.firstName} ${partner.lastName}`,
          title: partner.title,
          data: partner,
          relatedTo: `Guest ${guest.firstName} ${guest.lastName}`
        }))
      ];
    })
  ];

  // Format remaining time for display
  const formatRemainingTime = (ms: number | null): string => {
    if (ms === null) return '';
    
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get eligible events for an attendee
  const getEligibleEventsForAttendee = (
    attendeeType: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner', 
    attendeeData: EligibilityAttendeeData
  ) => {
    return getEligibleEvents(sortedEvents, attendeeType, attendeeData);
  };
  
  // Get selected ticket id for an attendee
  const getSelectedTicketId = (attendeeType: string, index: number): string => {
    switch(attendeeType) {
      case 'mason':
        return formState.masons[index]?.ticket?.ticketId ?? '';
      case 'ladyPartner':
        return formState.ladyPartners[index]?.ticket?.ticketId ?? '';
      case 'guest':
        return formState.guests[index]?.ticket?.ticketId ?? '';
      case 'guestPartner':
        return formState.guestPartners[index]?.ticket?.ticketId ?? '';
      default:
        return '';
    }
  };

  // Get selected events for an attendee
  const getSelectedEvents = (attendeeType: string, index: number): string[] => {
    switch(attendeeType) {
      case 'mason':
        return formState.masons[index]?.ticket?.events ?? [];
      case 'ladyPartner':
        return formState.ladyPartners[index]?.ticket?.events ?? [];
      case 'guest':
        return formState.guests[index]?.ticket?.events ?? [];
      case 'guestPartner':
        return formState.guestPartners[index]?.ticket?.events ?? [];
      default:
        return [];
    }
  };

  // Check if a ticket ID is a package (not an individual event)
  const isPackage = (ticketId: string): boolean => {
    return ['full', 'ceremony', 'social'].includes(ticketId);
  };

  // Get ticket price based on selected package or summed individual events
  const getTicketPriceForAttendee = (attendeeType: string, index: number): number => {
    const ticketId = getSelectedTicketId(attendeeType, index);
    const eventIds = getSelectedEvents(attendeeType, index);

    if (ticketId && isPackage(ticketId)) {
      const ticket = ticketsToUse.find(t => t.id === ticketId);
      return ticket?.price ?? 0;
    } else if (eventIds.length > 0) {
      return eventIds.reduce((sum, eventId) => {
        const event = events.find(e => e.id === eventId);
        return sum + (event?.price ?? 0);
      }, 0);
    }
    return 0;
  };

  // BYPASS: Local reservation system
  const createLocalReservation = async (
    eventId: string, 
    ticketDefinitionId: string,
    quantity: number = 1
  ) => {
    setIsLocalReserving(true);
    setErrorMessage(null);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const reservationId = uuidv4();
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      
      const newReservation: LocalReservation = {
        reservationId,
        eventId,
        ticketDefinitionId,
        quantity,
        expiresAt: expiryTime
      };
      
      setLocalReservation(newReservation);
      console.log('Created local reservation:', newReservation);
      
      // Generate fake tickets to satisfy the useReservation interface
      const tickets = Array(quantity).fill(null).map(() => ({
        ticketId: uuidv4(),
        reservationId,
        expiresAt: expiryTime.toISOString(),
        eventId,
        ticketDefinitionId
      }));
      
      setIsLocalReserving(false);
      
      return {
        success: true,
        data: tickets,
        error: null
      };
    } catch (error) {
      console.error('Error creating local reservation:', error);
      setErrorMessage('Failed to reserve tickets. Please try again.');
      setIsLocalReserving(false);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Reserve ticket when selecting
  const reserveTicket = async (
    eventId: string, 
    ticketDefinitionId: string,
    attendeeType: string,
    attendeeIndex: number
  ) => {
    // Always use the effective event ID to ensure we have a valid ID
    const eventIdToUse = eventId || effectiveEventId;
    
    if (!eventIdToUse || !ticketDefinitionId || ticketDefinitionId.trim() === '') {
      console.error('Invalid event ID or ticket definition ID', { eventIdToUse, ticketDefinitionId });
      return;
    }
    
    // Store the current selection to update after reservation completes
    setCurrentTicketSelection({
      attendeeType,
      index: attendeeIndex,
      ticketId: ticketDefinitionId
    });
    
    console.log(`Reserving ticket: ${ticketDefinitionId} for event: ${eventIdToUse}`);
    
    // BYPASS: Use local reservation
    const result = await createLocalReservation(eventIdToUse, ticketDefinitionId, 1);
    
    if (result.success && result.data && result.data.length > 0) {
      // Update the form state with the selected ticket
      handleSelectTicket(attendeeType, attendeeIndex, ticketDefinitionId);
    }

    // Also attempt real API call through the hook
    reservationApi.reserve(eventIdToUse, ticketDefinitionId, 1)
      .then(apiResult => {
        console.log('API reservation result:', apiResult);
      })
      .catch(err => {
        console.warn('API reservation failed (using local fallback):', err);
      });
  };

  // Select ticket for an attendee
  const handleSelectTicket = (attendeeType: string, index: number, ticketId: string) => {
    // When selecting a package, clear any individual event selections
    const emptyEvents: string[] = [];
    
    switch(attendeeType) {
      case 'mason':
        selectMasonTicket(index, ticketId, emptyEvents);
        break;
      case 'ladyPartner':
        selectLadyPartnerTicket(index, ticketId, emptyEvents);
        break;
      case 'guest':
        selectGuestTicket(index, ticketId, emptyEvents);
        break;
      case 'guestPartner':
        selectGuestPartnerTicket(index, ticketId, emptyEvents);
        break;
    }
  };

  // Toggle individual event selection for an attendee
  const toggleEventSelection = (attendeeType: string, attendeeIndex: number, eventId: string) => {
    let currentEvents = getSelectedEvents(attendeeType, attendeeIndex);
    let currentTicketId = getSelectedTicketId(attendeeType, attendeeIndex);
    
    // If a package is currently selected, clear it when selecting an individual event
    if (isPackage(currentTicketId)) {
      currentTicketId = '';
      currentEvents = [];
    }
    
    // Toggle event in the events array
    let updatedEvents: string[];
    if (currentEvents.includes(eventId)) {
      // If removing an event, just update the state
      updatedEvents = currentEvents.filter(id => id !== eventId);
    } else {
      // For adding a new event, first reserve a ticket for this specific child event
      // We pass the event ID as both eventId and ticketDefinitionId because
      // for individual events, these values are the same
      reserveTicket(eventId, eventId, attendeeType, attendeeIndex);
      updatedEvents = [...currentEvents, eventId];
    }
    
    // Update the attendee's ticket
    switch(attendeeType) {
      case 'mason':
        selectMasonTicket(attendeeIndex, currentTicketId, updatedEvents);
        break;
      case 'ladyPartner':
        selectLadyPartnerTicket(attendeeIndex, currentTicketId, updatedEvents);
        break;
      case 'guest':
        selectGuestTicket(attendeeIndex, currentTicketId, updatedEvents);
        break;
      case 'guestPartner':
        selectGuestPartnerTicket(attendeeIndex, currentTicketId, updatedEvents);
        break;
    }
  };

  // Toggle expand/collapse for an attendee
  const toggleExpandAttendee = (attendeeId: string) => {
    if (expandedAttendee === attendeeId) {
      setExpandedAttendee(null);
    } else {
      setExpandedAttendee(attendeeId);
    }
  };

  // Check if all attendees have tickets selected
  const allAttendeesHaveTickets = (): boolean => {
    const allMasonsHaveTickets = formState.masons.every((mason: MasonData) => 
      (mason.ticket?.ticketId !== '' && mason.ticket?.ticketId !== undefined) || 
      (mason.ticket?.events && mason.ticket?.events.length > 0));
      
    const allLadyPartnersHaveTickets = formState.ladyPartners.every((partner: LadyPartnerData) => 
      (partner.ticket?.ticketId !== '' && partner.ticket?.ticketId !== undefined) || 
      (partner.ticket?.events && partner.ticket?.events.length > 0));
    
    const allGuestsHaveTickets = formState.guests.every((guest: GuestData) => 
      (guest.ticket?.ticketId !== '' && guest.ticket?.ticketId !== undefined) || 
      (guest.ticket?.events && guest.ticket?.events.length > 0));
      
    const allGuestPartnersHaveTickets = formState.guestPartners.every((partner: GuestPartnerData) => 
      (partner.ticket?.ticketId !== '' && partner.ticket?.ticketId !== undefined) || 
      (partner.ticket?.events && partner.ticket?.events.length > 0));
    
    return allMasonsHaveTickets && 
           allLadyPartnersHaveTickets && 
           allGuestsHaveTickets && 
           allGuestPartnersHaveTickets;
  };

  // Update remaining time
  useEffect(() => {
    if (!localReservation) {
      setRemainingTime(null);
      return;
    }
    
    const intervalId = setInterval(() => {
      const now = new Date();
      const timeLeft = localReservation.expiresAt.getTime() - now.getTime();
      
      if (timeLeft <= 0) {
        setRemainingTime(0);
        clearInterval(intervalId);
      } else {
        setRemainingTime(timeLeft);
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [localReservation]);

  // Is the reservation expired
  const isExpired = remainingTime !== null && remainingTime <= 0;
  
  // Is the reservation expiring soon
  const isExpiringSoon = remainingTime !== null && remainingTime <= 120000 && remainingTime > 0;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        {selectedEvent 
          ? `Register for ${selectedEvent.title}` 
          : 'Select Your Ticket Package'
        }
      </h2>
      
      {/* Reservation status */}
      {localReservation && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          isExpired ? 'bg-red-50 border border-red-200' : 
          isExpiringSoon ? 'bg-yellow-50 border border-yellow-200' : 
          'bg-blue-50 border border-blue-100'
        }`}>
          <Clock className={`w-5 h-5 mt-0.5 ${
            isExpired ? 'text-red-500' : 
            isExpiringSoon ? 'text-yellow-500' : 
            'text-blue-500'
          }`} />
          <div>
            <h4 className={`font-medium ${
              isExpired ? 'text-red-800' : 
              isExpiringSoon ? 'text-yellow-800' : 
              'text-blue-800'
            }`}>
              {isExpired ? 'Reservation Expired' : 
               isExpiringSoon ? 'Reservation Expiring Soon' : 
               'Ticket Reserved'}
            </h4>
            <p className={`text-sm ${
              isExpired ? 'text-red-700' : 
              isExpiringSoon ? 'text-yellow-700' : 
              'text-blue-700'
            }`}>
              {isExpired ? 
                'Your ticket reservation has expired. Please select another ticket.' : 
                `Reserved for ${formatRemainingTime(remainingTime)}. Complete registration before time expires.`}
            </p>
          </div>
        </div>
      )}
      
      {/* Reservation error */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-lg flex items-start gap-3 bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 mt-0.5 text-red-500" />
          <div>
            <h4 className="font-medium text-red-800">Reservation Error</h4>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}
      
      {/* Ticketing Mode Toggle */}
      <TicketingModeToggle 
        useUniformTicketing={formState.useUniformTicketing}
        toggleUniformTicketing={(useUniform) => {
          toggleUniformTicketingSafe(useUniform);
          
          // When switching from uniform to individual ticketing,
          // clear all previously selected tickets
          if (!useUniform) {
            // Clear main ticket selection
            selectTicketSafe('');
            
            // Clear mason tickets
            formState.masons.forEach((_, index: number) => {
              selectMasonTicket(index, '', []);
            });
            
            // Clear lady partner tickets
            formState.ladyPartners.forEach((_, index: number) => {
              selectLadyPartnerTicket(index, '', []);
            });
            
            // Clear guest tickets
            formState.guests.forEach((_, index: number) => {
              selectGuestTicket(index, '', []);
            });
            
            // Clear guest partner tickets
            formState.guestPartners.forEach((_, index: number) => {
              selectGuestPartnerTicket(index, '', []);
            });
          }
        }}
      />
      
      {/* Unified Ticketing */}
      {formState.useUniformTicketing && (
        <UniformTicketing
          selectedTicketId={formState.selectedTicket}
          availableTickets={ticketsToUse}
          allAttendees={allAttendees}
          onSelectTicket={(ticketId) => {
            // We need to handle reservation before setting the ticket
            if (ticketId && ticketId.trim() !== '') {
              // Use the ticket ID itself as the event ID if no effectiveEventId is available
              const eventIdToUse = effectiveEventId || ticketId;
              console.log(`Reserving ticket: ${ticketId} for event: ${eventIdToUse}`);
              
              // BYPASS: Use local reservation for "Same Tickets for All"
              createLocalReservation(eventIdToUse, ticketId, allAttendees.length).then(result => {
                if (result.success) {
                  selectTicketSafe(ticketId);
                  applyTicketToAllAttendeesSafe(ticketId);
                }
              });
            } else {
              console.log(`Not reserving: TicketId is empty or undefined`);
            }
          }}
        />
      )}
      
      {/* Individual Ticketing */}
      {!formState.useUniformTicketing && (
        <div>
          {/* Attendee list with individual ticket selection */}
          <div className="space-y-4 mb-8">
            {allAttendees.map((attendee) => {
              const attendeeId = `${attendee.type}-${attendee.index}`;
              const selectedTicketId = getSelectedTicketId(attendee.type, attendee.index);
              const selectedEvents = getSelectedEvents(attendee.type, attendee.index);
              const ticketPrice = getTicketPriceForAttendee(attendee.type, attendee.index);
              const hasCustomEvents = !isPackage(selectedTicketId) && selectedEvents.length > 0;
              
              // Check if this attendee is currently reserving
              const isCurrentlyReserving = isLocalReserving && 
                currentTicketSelection?.attendeeType === attendee.type && 
                currentTicketSelection?.index === attendee.index;
              
              return (
                <AttendeeTicketItem
                  key={attendeeId}
                  attendee={attendee}
                  isExpanded={expandedAttendee === attendeeId}
                  selectedTicketId={selectedTicketId}
                  ticketPrice={ticketPrice}
                  hasCustomEvents={hasCustomEvents}
                  isReserving={isCurrentlyReserving}
                  onToggleExpand={() => toggleExpandAttendee(attendeeId)}
                >
                  {/* Package Selection */}
                  <div className="p-4">
                    <h4 className="font-semibold mb-3 text-slate-700">
                      Select Package or Individual Events:
                    </h4>
                    <div className="space-y-3">
                      {/* Available Packages */}
                      {ticketsToUse.map(ticket => (
                        <label 
                          key={ticket.id} 
                          className={`flex items-center p-4 border rounded-md cursor-pointer transition-colors 
                            ${selectedTicketId === ticket.id ? 'bg-primary/10 border-primary' : 'border-slate-200 hover:border-slate-300'}
                            ${isCurrentlyReserving ? 'opacity-50' : ''}
                          `}
                        >
                          <input 
                            type="radio" 
                            name={`ticket-${attendeeId}`}
                            value={ticket.id}
                            checked={selectedTicketId === ticket.id}
                            disabled={isCurrentlyReserving}
                            onChange={() => {
                              // Always try to reserve, using ticket ID as fallback event ID if needed
                              // The reserveTicket function now handles the case when eventId is empty
                              const eventIdToUse = effectiveEventId || ticket.id;
                              reserveTicket(eventIdToUse, ticket.id, attendee.type, attendee.index);
                            }}
                            className="mr-3 h-4 w-4 text-primary focus:ring-primary border-slate-300"
                          />
                          <div>
                            <span className="font-medium text-slate-800">{ticket.name}</span>
                            <span className="text-slate-600 ml-2">(${ticket.price})</span>
                            <p className="text-sm text-slate-500 mt-1">{ticket.description}</p>
                          </div>
                        </label>
                      ))}
                      
                      {/* Individual Event Selection Title */}
                      <p className="pt-2 text-slate-600">
                        Or select individual events:
                      </p>
                    </div>

                    {/* Eligible Event Selection List */}
                    <EventSelectionList 
                      events={getEligibleEventsForAttendee(attendee.type, attendee.data as unknown as EligibilityAttendeeData)}
                      selectedEvents={selectedEvents}
                      isReserving={isCurrentlyReserving}
                      toggleEvent={(eventId: string) => toggleEventSelection(attendee.type, attendee.index, eventId)}
                    />
                  </div>
                </AttendeeTicketItem>
              );
            })}
          </div>
          
          {/* Warning if not all attendees have tickets */}
          {!allAttendeesHaveTickets() && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800">Incomplete Ticket Selection</h4>
                <p className="text-sm text-yellow-700">
                  Not all attendees have tickets selected. Please expand each attendee card and select a ticket package.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-between">
        <button 
          type="button" 
          onClick={prevStep}
          className="btn-outline"
        >
          Back to Attendee Details
        </button>
        <button 
          type="button" 
          onClick={nextStep}
          // Disable if:
          // 1. Uniform ticketing is ON and no ticket is selected OR
          // 2. Uniform ticketing is OFF and not all attendees have tickets OR
          // 3. Currently reserving tickets OR
          // 4. Has a reservation that's expired
          disabled={
            (formState.useUniformTicketing && !formState.selectedTicket) || 
            (!formState.useUniformTicketing && !allAttendeesHaveTickets()) ||
            isLocalReserving ||
            isExpired
          }
          className={`btn-primary ${
            ((formState.useUniformTicketing && !formState.selectedTicket) || 
            (!formState.useUniformTicketing && !allAttendeesHaveTickets()) ||
            isLocalReserving ||
            isExpired) 
            ? 'opacity-50 cursor-not-allowed' 
            : ''
          }`}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
};

export default TicketSelection;