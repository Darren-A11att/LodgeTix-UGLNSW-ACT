import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { TicketType, FormState, MasonData, LadyPartnerData, GuestData, GuestPartnerData, AttendeeType } from '../../shared/types/register';
import { getEvents } from '../../lib/api/events';
import { EventType } from '../../shared/types/event';
import { sortEventsByDate, getEligibleEvents, AttendeeData as EligibilityAttendeeData } from '../../shared/utils/eventEligibility';
import TicketingModeToggle from './ticket/TicketingModeToggle';
import UniformTicketing from './ticket/UniformTicketing';
import AttendeeTicketItem from './ticket/AttendeeTicketItem';
import EventSelectionList from './ticket/EventSelectionList';
import { useReservationBypass as useReservationHook } from '../../hooks/useReservationBypass';
import { useReservation as useReservationContext } from '../../context/ReservationContext';
import { preventRedirect, startRedirectPreventionKeepAlive } from '../../lib/redirectPrevention';

// Import AttendeeData from registrations API and alias it to avoid conflict with legacy type
import { AttendeeData as UnifiedAttendeeData } from '../../lib/api/registrations';

// Create our own simple UUID generator (used as fallback if uuid package fails)
function generateId() {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return '_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

interface TicketSelectionProps {
  formState: FormState;
  tickets?: TicketType[]; // Allow backward compatibility
  availableTickets?: TicketType[]; // Use this
  selectedEvent?: { id: string; title: string; day: string; time: string; price: number };
  selectTicket?: (ticketId: string) => void; 
  selectAttendeeTicket: (attendeeId: string, ticketDefinitionId: string | null) => void;
  toggleUniformTicketing?: (enabled: boolean) => void; 
  applyTicketToAllAttendees?: (ticketId: string) => void; 
  nextStep: () => void;
  prevStep: () => void;
}

const TicketSelection: React.FC<TicketSelectionProps> = ({ 
  formState, 
  availableTickets, 
  tickets, 
  selectedEvent, 
  selectTicket,
  selectAttendeeTicket,
  toggleUniformTicketing,
  applyTicketToAllAttendees,
  nextStep,
  prevStep
}) => {
  // Create state to store loaded event data
  const [loadedEvent, setLoadedEvent] = useState(selectedEvent);
  // State for all fetched events
  const [allEventsData, setAllEventsData] = useState<EventType[]>([]);
  const [isLoadingAllEvents, setIsLoadingAllEvents] = useState(true);
  const [allEventsError, setAllEventsError] = useState<string | null>(null);
  
  // Log the selected event to debug
  console.log('TicketSelection - selectedEvent:', selectedEvent);
  console.log('TicketSelection - formState.selectedEventId:', formState.selectedEventId);
  
  // Fetch *all* events when component mounts
  useEffect(() => {
    const fetchAllEvents = async () => {
      setIsLoadingAllEvents(true);
      setAllEventsError(null);
      try {
        const response = await getEvents({}); // Fetch all events (no pagination)
        setAllEventsData(response.events);
      } catch (error) {
        console.error("Error fetching all events:", error);
        setAllEventsError("Failed to load event list.");
      } finally {
        setIsLoadingAllEvents(false);
      }
    };
    fetchAllEvents();
  }, []); // Run once on mount

  // Load *specific* event details if ID passed but details aren't
  useEffect(() => {
    // If we already have event details from props, use those
    if (selectedEvent) {
      setLoadedEvent(selectedEvent);
      return;
    }
    
    // If we have an event ID but no details, fetch them
    if (formState.selectedEventId && !loadedEvent) {
      // Ensure selectedEventId is not null before calling API
      const eventIdToFetch = formState.selectedEventId;
      if (!eventIdToFetch) return; 

      // Import the getEventById function dynamically
      import('../../lib/api/events').then(({ getEventById }) => {
        getEventById(eventIdToFetch).then(eventData => { // Pass non-null ID
          if (eventData) {
            // Create a compatible event object
            const compatibleEvent = {
              id: eventData.id,
              title: eventData.title ?? 'Event', // Provide fallback for null title
              day: new Date(eventData.eventStart).toLocaleDateString(),
              time: new Date(eventData.eventStart).toLocaleTimeString(),
              price: 0 // Price is now on ticket definitions, not events
            };
            setLoadedEvent(compatibleEvent);
          }
        });
      });
    }
  }, [formState.selectedEventId, selectedEvent, loadedEvent]);
  
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
  const [isReserving, setIsReserving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  
  // Use our actual reservation hook (currently bypass)
  const reservationApi = useReservationHook();
  
  // Use the global reservation context
  const { reservation, setReservation } = useReservationContext(); // Get current reservation from context
  
  // Sort events by date in ascending order - USE FETCHED DATA
  const sortedEvents = sortEventsByDate([...allEventsData]);

  // Get flat list of all attendees for individual ticketing
  // Define the type inline based on the structure EXPECTED BY CHILD COMPONENTS
  const allAttendees: Array<{
    type: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner';
    index: number; // Use numeric index
    id: string; // Keep attendeeId as id
    name: string;
    title: string;
    // Use the legacy data union type expected by children
    data: MasonData | LadyPartnerData | GuestData | GuestPartnerData;
    relatedTo?: string; 
  }> = formState.attendees ? 
    formState.attendees.map((attendee: UnifiedAttendeeData, idx) => {
      const isPartner = attendee.attendeeType === 'LadyPartner' || attendee.attendeeType === 'GuestPartner';
      let relatedTo: string | undefined = undefined; 
      if (isPartner && attendee.relatedAttendeeId) {
        const relatedAttendee = formState.attendees?.find(a => a.attendeeId === attendee.relatedAttendeeId); 
        if (relatedAttendee) {
          relatedTo = `${relatedAttendee.attendeeType} ${relatedAttendee.firstName} ${relatedAttendee.lastName}`;
        }
      }
      
      // --- TODO: Refactor Child Components --- 
      // This mapping transforms UnifiedAttendeeData back to the legacy format 
      // expected by UniformTicketing/AttendeeTicketItem.
      // Ideally, those components should be updated to accept UnifiedAttendeeData directly.
      let mappedData: MasonData | LadyPartnerData | GuestData | GuestPartnerData;
      const baseData = {
        id: attendee.attendeeId, // Use attendeeId for the legacy id field
        title: attendee.title || '',
        firstName: attendee.firstName || '',
        lastName: attendee.lastName || '',
        dietary: attendee.dietaryRequirements || '',
        specialNeeds: attendee.specialNeeds || '',
        contactPreference: attendee.contactPreference,
        phone: attendee.primaryPhone || '',
        email: attendee.primaryEmail || '',
        contactConfirmed: false, // Assuming default, needs clarification
        ticket: undefined // Ticket info needs separate mapping if required by legacy types
      };

      switch (attendee.attendeeType) {
        case 'Mason':
          mappedData = {
            ...baseData,
            rank: attendee.rank || '',
            lodge: attendee.lodgeId || '', // Assuming lodgeId maps to lodge name/id
            grandLodge: '', // Missing from UnifiedAttendeeData
            sameLodgeAsPrimary: false, // Needs logic if applicable
            hasLadyPartner: formState.attendees.some(p => p.relatedAttendeeId === attendee.attendeeId && p.attendeeType === 'LadyPartner'),
            // Map other Mason specific fields if available in UnifiedAttendeeData
            grandRank: attendee.grandRank,
            grandOfficer: attendee.grandOfficer,
            grandOffice: attendee.grandOffice,
          } as MasonData;
          break;
        case 'LadyPartner':
          mappedData = {
            ...baseData,
            attendeeType: AttendeeType.LADY_PARTNER, // Add missing type
            relationship: attendee.relationship || '',
            masonIndex: -1, 
            masonId: attendee.relatedAttendeeId || '' 
          } as LadyPartnerData;
          break;
        case 'Guest':
          mappedData = {
            ...baseData,
            hasPartner: formState.attendees.some(p => p.relatedAttendeeId === attendee.attendeeId && p.attendeeType === 'GuestPartner')
          } as GuestData;
          break;
        case 'GuestPartner':
          mappedData = {
            ...baseData,
            attendeeType: AttendeeType.GUEST_PARTNER, // Add missing type
            relationship: attendee.relationship || '',
            guestIndex: -1, 
            guestId: attendee.relatedAttendeeId || '' 
          } as GuestPartnerData;
          break;
        default:
          // Handle unexpected type, maybe throw error or use a default
          console.error("Unexpected attendee type in mapping:", attendee.attendeeType);
          // Use a minimal GuestData as fallback to satisfy type, but this is not ideal
          mappedData = { ...baseData, hasPartner: false } as GuestData; 
      }
      // --- End TODO section ---

      return {
        type: attendee.attendeeType.toLowerCase() as 'mason' | 'ladyPartner' | 'guest' | 'guestPartner',
        index: idx, 
        id: attendee.attendeeId, 
        name: `${attendee.firstName} ${attendee.lastName}`,
        title: attendee.title || '',
        data: mappedData, // Use the transformed data
        ...(relatedTo && { relatedTo })
      };
    })
  : 
    [];

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
  const getSelectedTicketId = (attendeeType: string, attendeeId: string): string => {
    if (formState.attendees) {
      const attendee = formState.attendees.find(a => a.attendeeId === attendeeId);
      // Use attendeeId
      if (attendee?.ticket) {
        return attendee.ticket.ticketDefinitionId || '';
      }
      return '';
    } 
    return '';
  };

  // Get selected events for an attendee - Modified as AttendeeData.ticket doesn't have .events
  const getSelectedEvents = (attendeeType: string, attendeeId: string): string[] => {
    // TODO: If individual event selection is needed, data must be stored elsewhere
    // For now, return empty array as AttendeeData.ticket doesn't store events.
    // const attendee = formState.attendees?.find(a => a.attendeeId === attendeeId);
    // if (attendee?.ticket?.events) { // This structure doesn't exist
    //   return attendee.ticket.events;
    // }
    return [];
  };

  // Check if a ticket ID is a package (not an individual event)
  const isPackage = (ticketId: string): boolean => {
    return ['full', 'ceremony', 'social'].includes(ticketId);
  };

  // Get ticket price based on selected package or summed individual events
  const getTicketPriceForAttendee = (attendeeType: string, index: string | number): number => {
    const ticketId = getSelectedTicketId(attendeeType, index.toString());
    const eventIds = getSelectedEvents(attendeeType, index.toString()); // This returns [] currently

    if (ticketId && isPackage(ticketId)) {
      const ticket = ticketsToUse.find(t => t.id === ticketId);
      return ticket?.price ?? 0; // ticketsToUse should have price from the TicketType
    } else if (eventIds.length > 0) {
      // This path is currently unreachable because getSelectedEvents returns []
      // If individual event selection is re-enabled, this needs pricing logic based on TicketDefinitions
      return 0; 
    }
    return 0;
  };

  // Select ticket for an attendee (Updates form state) - SIMPLIFIED
  const handleSelectTicket = (attendeeId: string, ticketDefId: string | null) => {
    // Call the unified function passed via props
    selectAttendeeTicket(attendeeId, ticketDefId);
  };

  // Reserve ticket for a *single* attendee (used in individual mode)
  const reserveTicketForAttendee = async (
    eventId: string, 
    ticketDefinitionId: string,
    attendeeId: string // Use the actual attendee ID
  ) => {
    setIsReserving(true);
    setErrorMessage(null);
    const eventIdToUse = eventId || effectiveEventId;
    
    if (!eventIdToUse || !ticketDefinitionId || ticketDefinitionId.trim() === '' || !attendeeId) {
      console.error('Invalid parameters for reserveTicketForAttendee', { eventIdToUse, ticketDefinitionId, attendeeId });
      setErrorMessage('Internal error: Missing required event ID or ticket definition ID.');
      setIsReserving(false);
      return;
    }
    
    console.log(`Reserving ticket: ${ticketDefinitionId} for event: ${eventIdToUse}, attendee ID: ${attendeeId}`);
    
    try {
      // Remove availability check as it's not on the bypass hook
      /*
      const availability = await reservationApi.getAvailability(eventIdToUse, ticketDefinitionId);
      if (!availability || !availability.success) {
        throw new Error(availability?.error || 'Failed to check ticket availability');
      }
      if (availability.availableCount <= 0) {
        throw new Error(`This ticket is sold out. Please select a different ticket or try again later.`);
      }
      */
      
      // Now try to reserve
      const result = await reservationApi.reserve(eventIdToUse, ticketDefinitionId, 1, attendeeId);
      
      if (result.success && result.data && result.data.length > 0) {
        handleSelectTicket(attendeeId, ticketDefinitionId);
      } else {
        throw new Error(result.error || 'Failed to reserve ticket via API bypass.');
      }
    } catch (err) {
      console.error('Error reserving ticket:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error reserving ticket.');
      // Optionally, revert the selection in the UI if reservation fails
    } finally {
      setIsReserving(false);
    }
  };

  // Toggle individual event selection - This needs full rework or removal
  const toggleEventSelection = (attendeeId: string, eventId: string) => {
    // This function needs rework as AttendeeData.ticket has no .events array
    console.warn("toggleEventSelection called, but attendee ticket structure doesn't support individual events currently.");
    // The logic here was invalid anyway. We should probably just disable individual event selection for now.
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
    if (formState.attendees) {
      // Check only for ticketDefinitionId as events array doesn't exist on ticket
      return formState.attendees.every(attendee => 
        (attendee.ticket?.ticketDefinitionId !== '' && attendee.ticket?.ticketDefinitionId !== undefined)
        // Remove check for events array
        // || (attendee.ticket?.events && attendee.ticket?.events.length > 0)
      );
    } else {
      return false; 
    }
  };

  // Update remaining time based on reservation from context/hook
  useEffect(() => {
    const currentReservations = reservationApi.reservation || reservation; 
    
    // Add type check for array
    if (!currentReservations || !Array.isArray(currentReservations) || currentReservations.length === 0) {
      setRemainingTime(null);
      return;
    }
    
    // Use the expiry from the first reservation (assuming they are created together)
    const expiresAt = new Date(currentReservations[0].expiresAt);
    
    // Make sure we have our no-redirect flag set
    localStorage.setItem('lodgetix_bypass_no_redirect', 'true');
    
    const intervalId = setInterval(() => {
      const now = new Date();
      const timeLeft = expiresAt.getTime() - now.getTime();
      
      if (timeLeft <= 0) {
        setRemainingTime(0);
        clearInterval(intervalId);
        console.log('Reservation timer expired but keeping session active to prevent redirection');
      } else {
        setRemainingTime(timeLeft);
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [reservationApi.reservation, reservation]); // Depend on reservation from hook/context

  // Is the reservation expired
  const isExpired = remainingTime !== null && remainingTime <= 0;
  
  // Is the reservation expiring soon (within 2 minutes)
  const isExpiringSoon = remainingTime !== null && remainingTime <= 120000 && remainingTime > 0;
  
  // Prevent redirects when reservation is active and maintain keepalive
  useEffect(() => {
    // Make sure prevention flags are set immediately
    preventRedirect();
    
    // Start the keepalive process when a reservation is active
    const cleanupFunction = startRedirectPreventionKeepAlive();
    
    // Clean up interval on unmount
    return cleanupFunction;
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        {(selectedEvent || loadedEvent)
          ? `Register for ${(selectedEvent || loadedEvent)?.title}` 
          : 'Select Your Ticket Package'
        }
      </h2>
      
      {/* Reservation status is now shown in the right column */}
      
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
          if (!useUniform) {
            selectTicketSafe('');
            if (formState.attendees) {
              formState.attendees.forEach(attendee => {
                // Use the unified selectAttendeeTicket
                selectAttendeeTicket(attendee.attendeeId, null); 
              });
            } 
          }
        }}
      />
      
      {/* Unified Ticketing */}
      {formState.useUniformTicketing && (
        <UniformTicketing
          selectedTicketId={formState.selectedTicket || ''}
          availableTickets={ticketsToUse}
          allAttendees={allAttendees}
          onSelectTicket={async (ticketId) => { 
            setIsReserving(true);
            setErrorMessage(null);
            try {
              if (ticketId && ticketId.trim() !== '') {
                const eventIdToUse = effectiveEventId || ticketId;
                console.log(`Reserving ticket ${ticketId} for event ${eventIdToUse} for ALL ${allAttendees.length} attendees.`);
                
                // --- TODO: Capacity Check --- 
                // 1. Fetch availability for ticketId/eventIdToUse (needs simulated source in bypass)
                // const availability = await reservationApi.getAvailability(eventIdToUse, ticketId);
                // if (allAttendees.length > availability.availableCount) { 
                //   setErrorMessage(`Not enough tickets available (${availability.availableCount}) for all ${allAttendees.length} attendees.`);
                //   setIsReserving(false);
                //   // Optionally trigger mode switch here or let UniformTicketing handle UI change
                //   return; 
                // }
                // --- End TODO ---
                
                // Reserve ticket for each attendee using the hook
                const reservationPromises = allAttendees.map(attendee => 
                  reservationApi.reserve(eventIdToUse, ticketId, 1, attendee.id)
                );
                
                const results = await Promise.all(reservationPromises);
                
                // Check if all reservations were successful
                const allSucceeded = results.every(result => result.success);
                
                if (allSucceeded) {
                  // If all successful, update the main form state
                  selectTicketSafe(ticketId);
                  // Ensure this function correctly updates the ticket for *all* attendees in the form state
                  applyTicketToAllAttendeesSafe(ticketId); 
                } else {
                  // Handle partial failure - potentially cancel successful ones or show error
                  const errors = results.filter(r => !r.success).map(r => r.error).join(', ');
                  console.error('Some reservations failed:', results);
                  setErrorMessage(`Failed to reserve tickets for all attendees: ${errors}. Please try again or select individually.`);
                  // TODO: Consider cancelling successfully reserved tickets if any fail?
                  // const successfulReservationIds = results.filter(r => r.success).flatMap(r => r.data?.map(t => t.reservationId) || []);
                  // if (successfulReservationIds.length > 0) { reservationApi.cancel(...) }
                }
                
              } else {
                console.log(`Not reserving: TicketId is empty or undefined`);
                // If clearing selection, potentially cancel existing reservations
                // if (reservationApi.reservation && reservationApi.reservation.length > 0) {
                //   await reservationApi.cancel(reservationApi.reservation[0].reservationId); // Pass appropriate ID
                // }
                selectTicketSafe('');
                applyTicketToAllAttendeesSafe('');
              }
            } catch (error) {
              console.error('Error during bulk reservation:', error);
              setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred.');
            } finally {
              setIsReserving(false);
            }
          }}
          // --- TODO: Capacity Handling UI --- 
          // Pass availability data down to UniformTicketing
          // UniformTicketing needs to conditionally render "Select" vs "Select Individually"
          // based on availableCount vs allAttendees.length for each ticket row.
          // It should also call a function passed via props to switch the mode, e.g.:
          // onSwitchToIndividualMode={() => toggleUniformTicketingSafe(false)}
          // --- End TODO ---
        />
      )}
      
      {/* Individual Ticketing */}
      {!formState.useUniformTicketing && (
        <div>
          {/* Attendee list with individual ticket selection */}
          <div className="space-y-4 mb-8">
            {allAttendees.map((attendee) => { // attendee now has the inline defined type
              const attendeeId = attendee.id; 
              const selectedTicketId = getSelectedTicketId(attendee.type, attendeeId);
              const selectedEvents = getSelectedEvents(attendee.type, attendeeId); 
              const ticketPrice = getTicketPriceForAttendee(attendee.type, attendeeId);
              const hasCustomEvents = !isPackage(selectedTicketId) && selectedEvents.length > 0; 
              const isCurrentlyReserving = isReserving; 
              
              return (
                <AttendeeTicketItem
                  key={attendeeId}
                  // Pass the attendee object. AttendeeTicketItem must accept this structure.
                  attendee={attendee} 
                  isExpanded={expandedAttendee === attendeeId}
                  selectedTicketId={selectedTicketId}
                  ticketPrice={ticketPrice}
                  hasCustomEvents={hasCustomEvents}
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
                              const eventIdToUse = effectiveEventId || ticket.id;
                              // Pass only attendeeId and ticket.id
                              reserveTicketForAttendee(eventIdToUse, ticket.id, attendee.id);
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
                      toggleEvent={(eventId: string) => toggleEventSelection(attendeeId, eventId)}
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
            isReserving ||
            isExpired
          }
          className={`btn-primary ${
            ((formState.useUniformTicketing && !formState.selectedTicket) || 
            (!formState.useUniformTicketing && !allAttendeesHaveTickets()) ||
            isReserving ||
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