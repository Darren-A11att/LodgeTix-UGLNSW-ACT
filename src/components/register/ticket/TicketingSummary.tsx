import React from 'react';
import { FormState, TicketType } from '../../../shared/types/register';
import { TicketDefinitionType } from '../../../shared/types/ticket';
import { events } from '../../../shared/data/events';
import { AttendeeData } from '../../../lib/api/registrations';
import { useRegistrationStore } from '../../../store/registrationStore';

// Define the structure for the flattened attendee list passed from the parent
interface AttendeeItem {
  type: string;
  id: string;
  name: string;
  title: string;
  data: AttendeeData;
  relatedTo?: string;
}

interface TicketingSummaryProps {
  formState: FormState;
  allAttendees: AttendeeItem[];
  // Support both ticket types for backward compatibility
  availableTickets: (TicketType | TicketDefinitionType)[];
}

// Helper Utilities
const ticketUtils = {
  // Helper to get friendly ticket name
  getTicketName: (ticketId: string | undefined, availableTickets: (TicketType | TicketDefinitionType)[]): string => {
    if (!ticketId) return "";
    const ticket = availableTickets.find(t => t.id === ticketId);
    return ticket?.name || "Unknown Ticket";
  },

  // Helper to get ticket price - price is now required by the database schema
  getTicketPrice: (ticketId: string | undefined, availableTickets: (TicketType | TicketDefinitionType)[]): number => {
    if (!ticketId) return 0;
    const ticket = availableTickets.find(t => t.id === ticketId);
    // Since price is required in the updated schema, we can confidently return the price
    return ticket?.price || 0;
  },

  // Calculate the total price for all attendees
  calculateTotalPrice: (attendees: AttendeeItem[], availableTickets: (TicketType | TicketDefinitionType)[]): number => {
    let total = 0;
    
    attendees.forEach(attendee => {
      const ticketId = attendee.data.ticket?.ticketDefinitionId;
      if (ticketId) {
        total += ticketUtils.getTicketPrice(ticketId, availableTickets);
      }
    });
    
    return total;
  }
};

const TicketingSummary: React.FC = () => {
  // Access state from the registration store
  const { attendees, availableTickets } = useRegistrationStore(state => ({
    attendees: state.attendees,
    availableTickets: state.availableTickets || [] // Ensure this is correctly defined in the store
  }));

  // Correct type comparisons
  const sortedAttendees = [...attendees].sort((a, b) => {
    // Primary mason first
    if (a.attendeeType === 'mason' && a.isPrimary) return -1;
    if (b.attendeeType === 'mason' && b.isPrimary) return 1;

    // For partners, always keep them right after their related attendee
    if ((b.attendeeType === 'lady_partner' || b.attendeeType === 'guest_partner') && 
        b.relatedAttendeeId === a.attendeeId) {
      return -1; // a should come before b
    }
    
    if ((a.attendeeType === 'lady_partner' || a.attendeeType === 'guest_partner') && 
        a.relatedAttendeeId === b.attendeeId) {
      return 1; // b should come before a
    }
    
    return (attendees.findIndex(att => att.attendeeId === a.attendeeId)) - 
           (attendees.findIndex(att => att.attendeeId === b.attendeeId));
  });

  // Map the sorted AttendeeData to the AttendeeItem format expected
  const displayAttendees = sortedAttendees.map(attendee => {
    const isPartner = attendee.attendeeType === 'lady_partner' || attendee.attendeeType === 'guest_partner';
    let relatedTo = '';
    
    if (isPartner && attendee.relatedAttendeeId) {
      const relatedAttendee = attendees.find(a => 
        a.attendeeId === attendee.relatedAttendeeId
      );
      
      if (relatedAttendee) {
        relatedTo = `${relatedAttendee.attendeeType} ${relatedAttendee.firstName} ${relatedAttendee.lastName}`;
      }
    }
    
    return {
      type: attendee.attendeeType.toLowerCase(),
      id: attendee.attendeeId,
      name: `${attendee.firstName || ''} ${attendee.lastName || ''}`,
      title: attendee.title || '',
      data: attendee,
      ...(relatedTo ? { relatedTo } : {})
    };
  });

  const totalAttendees = displayAttendees.length;
  const totalPrice = ticketUtils.calculateTotalPrice(displayAttendees as AttendeeItem[], availableTickets);

  if (totalAttendees === 0) {
    return null;
  }

  return (
    <div className="bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold mb-3 text-slate-800 border-b pb-2">Order Summary</h3>
      <ul className="space-y-3">
        {displayAttendees.map((attendee) => {
          const ticketId = attendee.data.ticket?.ticketDefinitionId;
          const hasTicket = !!ticketId;
          const ticketName = hasTicket ? ticketUtils.getTicketName(ticketId, availableTickets) : '';
          const ticketPrice = hasTicket ? ticketUtils.getTicketPrice(ticketId, availableTickets) : 0;
          
          return (
            <li key={attendee.id} className="text-sm border-b border-slate-100 pb-2 last:border-b-0">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-slate-700">{attendee.name}</span>
                <span className="font-semibold text-slate-800">
                  ${ticketPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{attendee.data.attendeeType}</span>
                <span>{hasTicket ? ticketName : 'No ticket selected'}</span>
              </div>
              {attendee.relatedTo && (
                <div className="text-xs text-slate-500 mt-0.5">
                  Partner of {attendee.relatedTo}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="border-t border-slate-200 pt-3 mt-3">
        <div className="flex justify-between text-sm text-slate-700">
          <span>Total Attendees:</span>
          <span className="font-medium">{totalAttendees}</span>
        </div>
        <div className="flex justify-between mt-2 text-base">
          <span className="font-semibold text-slate-800">Total Price:</span>
          <span className="font-semibold text-slate-800">${totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default TicketingSummary;