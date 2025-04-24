import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { TicketType, FormState, MasonData, LadyPartnerData, GuestData, GuestPartnerData } from '../../shared/types/register';
import { events } from '../../shared/data/events';
import { sortEventsByDate, getEligibleEvents, AttendeeData as EligibilityAttendeeData } from '../../shared/utils/eventEligibility';
import TicketingModeToggle from './ticket/TicketingModeToggle';
import UniformTicketing from './ticket/UniformTicketing';
import AttendeeTicketItem from './ticket/AttendeeTicketItem';
import EventSelectionList from './ticket/EventSelectionList';

interface TicketSelectionProps {
  formState: FormState;
  availableTickets: TicketType[];
  selectedEvent?: { id: string; title: string; day: string; time: string; price: number };
  selectTicket: (ticketId: string) => void;
  selectMasonTicket: (masonIndex: number, ticketId: string, events?: string[]) => void;
  selectLadyPartnerTicket: (partnerIndex: number, ticketId: string, events?: string[]) => void;
  selectGuestTicket: (guestIndex: number, ticketId: string, events?: string[]) => void;
  selectGuestPartnerTicket: (partnerIndex: number, ticketId: string, events?: string[]) => void;
  toggleUniformTicketing: (enabled: boolean) => void;
  applyTicketToAllAttendees: (ticketId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const TicketSelection: React.FC<TicketSelectionProps> = ({ 
  formState, 
  availableTickets, 
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
  const [expandedAttendee, setExpandedAttendee] = useState<string | null>(null);
  
  // Sort events by date in ascending order
  const sortedEvents = sortEventsByDate([...events]);

  // Get flat list of all attendees for individual ticketing
  const allAttendees = [
    // First add all masons with their partners directly after them
    ...formState.masons.flatMap((mason: MasonData, masonIndex: number) => {
      // Find any partners associated with this mason
      const relatedPartners = formState.ladyPartners.filter((partner: LadyPartnerData) => 
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
        ...relatedPartners.map((partner: LadyPartnerData) => ({
          type: 'ladyPartner' as const, 
          index: formState.ladyPartners.findIndex((p: LadyPartnerData) => p === partner), 
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
        ...relatedPartners.map((partner: GuestPartnerData) => ({
          type: 'guestPartner' as const, 
          index: formState.guestPartners.findIndex((p: GuestPartnerData) => p === partner), 
          name: `${partner.firstName} ${partner.lastName}`,
          title: partner.title,
          data: partner,
          relatedTo: `Guest ${guest.firstName} ${guest.lastName}`
        }))
      ];
    })
  ];

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
      const ticket = availableTickets.find(t => t.id === ticketId);
      return ticket?.price ?? 0;
    } else if (eventIds.length > 0) {
      return eventIds.reduce((sum, eventId) => {
        const event = events.find(e => e.id === eventId);
        return sum + (event?.price ?? 0);
      }, 0);
    }
    return 0;
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
      updatedEvents = currentEvents.filter(id => id !== eventId);
    } else {
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

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        {selectedEvent 
          ? `Register for ${selectedEvent.title}` 
          : 'Select Your Ticket Package'
        }
      </h2>
      
      {selectedEvent && (
        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mb-6">
          <p className="text-slate-700">
            You are registering for <strong>{selectedEvent.title}</strong> on {selectedEvent.day} at {selectedEvent.time}.
            You can also choose to register for the full Grand Proclamation experience below.
          </p>
        </div>
      )}
      
      {/* Ticketing Mode Toggle */}
      <TicketingModeToggle 
        useUniformTicketing={formState.useUniformTicketing}
        toggleUniformTicketing={(useUniform) => {
          toggleUniformTicketing(useUniform);
          
          // When switching from uniform to individual ticketing,
          // clear all previously selected tickets
          if (!useUniform) {
            // Clear main ticket selection
            selectTicket('');
            
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
          availableTickets={availableTickets}
          allAttendees={allAttendees}
          onSelectTicket={(ticketId) => {
            selectTicket(ticketId);
            applyTicketToAllAttendees(ticketId);
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
              
              return (
                <AttendeeTicketItem
                  key={attendeeId}
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
                      {availableTickets.map(ticket => (
                        <label 
                          key={ticket.id} 
                          className={`flex items-center p-4 border rounded-md cursor-pointer transition-colors ${selectedTicketId === ticket.id ? 'bg-primary/10 border-primary' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                          <input 
                            type="radio" 
                            name={`ticket-${attendeeId}`}
                            value={ticket.id}
                            checked={selectedTicketId === ticket.id}
                            onChange={() => handleSelectTicket(attendee.type, attendee.index, ticket.id)}
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
          // 2. Uniform ticketing is OFF and not all attendees have tickets
          disabled={
            (formState.useUniformTicketing && !formState.selectedTicket) || 
            (!formState.useUniformTicketing && !allAttendeesHaveTickets())
          }
          className={`btn-primary ${
            ((formState.useUniformTicketing && !formState.selectedTicket) || 
            (!formState.useUniformTicketing && !allAttendeesHaveTickets())) 
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