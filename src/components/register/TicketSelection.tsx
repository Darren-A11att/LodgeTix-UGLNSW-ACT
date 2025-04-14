import React, { useState } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { TicketType } from '../../shared/types/register';
import { FormState } from '../../context/RegisterFormContext';
import { events } from '../../shared/data/events';
import { sortEventsByDate, getEligibleEvents, isEligibleForEvent } from '../../shared/utils/eventEligibility';
import TicketingModeToggle from './ticket/TicketingModeToggle';
import UniformTicketing from './ticket/UniformTicketing';
import AttendeeTicketItem from './ticket/AttendeeTicketItem';
import PackageTicketSection from './ticket/PackageTicketSection';
import EventSelectionList from './ticket/EventSelectionList';
import TicketingSummary from './ticket/TicketingSummary';

interface TicketSelectionProps {
  formState: FormState;
  availableTickets: TicketType[];
  selectedEvent: any;
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
    ...formState.masons.map((mason, index) => ({ 
      type: 'mason' as const, 
      index, 
      name: `${mason.firstName} ${mason.lastName}`,
      title: mason.title,
      data: mason
    })),
    ...formState.ladyPartners.map((partner, index) => ({ 
      type: 'ladyPartner' as const, 
      index, 
      name: `${partner.firstName} ${partner.lastName}`,
      title: partner.title,
      data: partner,
      relatedTo: `Mason ${formState.masons[partner.masonIndex]?.firstName || ''} ${formState.masons[partner.masonIndex]?.lastName || ''}`
    })),
    ...formState.guests.map((guest, index) => ({ 
      type: 'guest' as const, 
      index, 
      name: `${guest.firstName} ${guest.lastName}`,
      title: guest.title,
      data: guest
    })),
    ...formState.guestPartners.map((partner, index) => ({ 
      type: 'guestPartner' as const, 
      index, 
      name: `${partner.firstName} ${partner.lastName}`,
      title: partner.title,
      data: partner,
      relatedTo: `Guest ${formState.guests[partner.guestIndex]?.firstName || ''} ${formState.guests[partner.guestIndex]?.lastName || ''}`
    }))
  ];

  // Get eligible events for an attendee
  const getEligibleEventsForAttendee = (attendeeType: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner', attendeeData: any) => {
    return getEligibleEvents(sortedEvents, attendeeType, attendeeData);
  };
  
  // Get selected ticket id for an attendee
  const getSelectedTicketId = (attendeeType: string, index: number): string => {
    switch(attendeeType) {
      case 'mason':
        return formState.masons[index]?.ticket?.ticketId || '';
      case 'ladyPartner':
        return formState.ladyPartners[index]?.ticket?.ticketId || '';
      case 'guest':
        return formState.guests[index]?.ticket?.ticketId || '';
      case 'guestPartner':
        return formState.guestPartners[index]?.ticket?.ticketId || '';
      default:
        return '';
    }
  };

  // Get selected events for an attendee
  const getSelectedEvents = (attendeeType: string, index: number): string[] => {
    switch(attendeeType) {
      case 'mason':
        return formState.masons[index]?.ticket?.events || [];
      case 'ladyPartner':
        return formState.ladyPartners[index]?.ticket?.events || [];
      case 'guest':
        return formState.guests[index]?.ticket?.events || [];
      case 'guestPartner':
        return formState.guestPartners[index]?.ticket?.events || [];
      default:
        return [];
    }
  };

  // Check if a ticket ID is a package (not an individual event)
  const isPackage = (ticketId: string): boolean => {
    return ['full', 'ceremony', 'social'].includes(ticketId);
  };

  // Get ticket price for an attendee
  const getTicketPrice = (ticketId: string): number => {
    // Check if it's a package
    if (['full', 'ceremony', 'social'].includes(ticketId)) {
      const ticket = availableTickets.find(t => t.id === ticketId);
      return ticket?.price || 0;
    }
    
    // Check if it's an individual event
    const event = events.find(e => e.id === ticketId);
    return event?.price || 0;
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
    const allMasonsHaveTickets = formState.masons.every(mason => 
      (mason.ticket?.ticketId !== '' && mason.ticket?.ticketId !== undefined) || 
      (mason.ticket?.events && mason.ticket?.events.length > 0));
      
    const allLadyPartnersHaveTickets = formState.ladyPartners.every(partner => 
      (partner.ticket?.ticketId !== '' && partner.ticket?.ticketId !== undefined) || 
      (partner.ticket?.events && partner.ticket?.events.length > 0));
    
    const allGuestsHaveTickets = formState.guests.every(guest => 
      (guest.ticket?.ticketId !== '' && guest.ticket?.ticketId !== undefined) || 
      (guest.ticket?.events && guest.ticket?.events.length > 0));
      
    const allGuestPartnersHaveTickets = formState.guestPartners.every(partner => 
      (partner.ticket?.ticketId !== '' && partner.ticket?.ticketId !== undefined) || 
      (partner.ticket?.events && partner.ticket?.events.length > 0));
    
    return allMasonsHaveTickets && 
           allLadyPartnersHaveTickets && 
           allGuestsHaveTickets && 
           allGuestPartnersHaveTickets;
  };

  // Helper function to get attendee ticket selection summary
  const getAttendeeTicketSummary = () => {
    // Count tickets by type
    const ticketCounts: {[key: string]: number} = {};
    
    // Count Mason tickets
    formState.masons.forEach(mason => {
      const ticketId = mason.ticket?.ticketId || '';
      if (ticketId) {
        ticketCounts[ticketId] = (ticketCounts[ticketId] || 0) + 1;
      }
    });
    
    // Count Lady/Partner tickets
    formState.ladyPartners.forEach(partner => {
      const ticketId = partner.ticket?.ticketId || '';
      if (ticketId) {
        ticketCounts[ticketId] = (ticketCounts[ticketId] || 0) + 1;
      }
    });
    
    // Count Guest tickets
    formState.guests.forEach(guest => {
      const ticketId = guest.ticket?.ticketId || '';
      if (ticketId) {
        ticketCounts[ticketId] = (ticketCounts[ticketId] || 0) + 1;
      }
    });
    
    // Count Guest Partner tickets
    formState.guestPartners.forEach(partner => {
      const ticketId = partner.ticket?.ticketId || '';
      if (ticketId) {
        ticketCounts[ticketId] = (ticketCounts[ticketId] || 0) + 1;
      }
    });
    
    // Return an array of ticket types and counts
    return Object.entries(ticketCounts).map(([ticketId, count]) => {
      const ticket = availableTickets.find(ticket => ticket.id === ticketId);
      return {
        name: ticket?.name || 'Unknown Ticket',
        count,
        price: ticket?.price || 0
      };
    });
  };

  // Get the summary of selected tickets
  const ticketSummary = getAttendeeTicketSummary();
  const totalTicketPrice = ticketSummary.reduce((total, item) => total + (item.price * item.count), 0);

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
            You can also choose to register for the full Grand Installation experience below.
          </p>
        </div>
      )}
      
      {/* Ticketing Mode Toggle */}
      <TicketingModeToggle 
        useUniformTicketing={formState.useUniformTicketing}
        toggleUniformTicketing={toggleUniformTicketing}
      />
      
      {/* Unified Ticketing */}
      {formState.useUniformTicketing && (
        <UniformTicketing
          selectedTicketId={formState.selectedTicket}
          availableTickets={availableTickets}
          attendeeCount={allAttendees.length}
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
              const eligibleEvents = getEligibleEventsForAttendee(attendee.type, attendee.data);
              const hasCustomEvents = selectedEvents.length > 0;
              
              return (
                <AttendeeTicketItem
                  key={attendeeId}
                  attendee={attendee}
                  isExpanded={expandedAttendee === attendeeId}
                  selectedTicketId={selectedTicketId}
                  ticketPrice={getTicketPrice(selectedTicketId)}
                  hasCustomEvents={hasCustomEvents}
                  onToggleExpand={() => toggleExpandAttendee(attendeeId)}
                >
                  {/* Package Selection */}
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Select a Ticket Package</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                      {availableTickets.map(ticket => (
                        <div 
                          key={`${attendeeId}-${ticket.id}`}
                          className={`border rounded-md p-3 cursor-pointer ${
                            selectedTicketId === ticket.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-slate-200 hover:border-primary/30'
                          }`}
                          onClick={() => handleSelectTicket(attendee.type, attendee.index, ticket.id)}
                        >
                          <div className="flex flex-col h-full">
                            <div className="flex justify-between mb-2">
                              <div className="font-medium">{ticket.name}</div>
                              <div className="font-bold text-primary">${ticket.price}</div>
                            </div>
                            <div className="text-xs text-slate-600 mb-2 flex-grow">{ticket.description}</div>
                            <div className={`w-5 h-5 rounded-full border ${
                              selectedTicketId === ticket.id 
                                ? 'bg-primary border-primary text-white flex items-center justify-center' 
                                : 'border-slate-300'
                            }`}>
                              {selectedTicketId === ticket.id && (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="font-medium text-slate-900 mb-3">Individual Events</h4>
                    
                    <div className="mb-3 flex items-start p-3 bg-blue-50 rounded-md border border-blue-100 text-sm text-blue-800">
                      <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        Only events this attendee is eligible to attend are shown below.
                      </div>
                    </div>
                    
                    <EventSelectionList
                      events={eligibleEvents}
                      selectedEvents={selectedEvents}
                      toggleEvent={(eventId) => toggleEventSelection(attendee.type, attendee.index, eventId)}
                      showEligibilityBadges={true}
                      attendeeType={attendee.type}
                    />
                  </div>
                </AttendeeTicketItem>
              );
            })}
          </div>
          
          {/* Summary of tickets and total cost */}
          <TicketingSummary
            ticketSummary={ticketSummary}
            totalPrice={totalTicketPrice}
          />
          
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
          disabled={!formState.useUniformTicketing && !allAttendeesHaveTickets()}
          className={`btn-primary ${!formState.useUniformTicketing && !allAttendeesHaveTickets() ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
};

export default TicketSelection;