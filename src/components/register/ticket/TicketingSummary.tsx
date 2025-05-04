import React from 'react';
import { FormState, TicketType } from '../../../shared/types/register';
import { events } from '../../../shared/data/events';
import { AttendeeData } from '../../../lib/api/registrations';

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
  availableTickets: TicketType[];
}

// Helper Utilities
const ticketUtils = {
  // Helper to get friendly ticket name
  getTicketName: (ticketId: string | undefined, availableTickets: TicketType[]): string => {
    if (!ticketId) return "";
    const ticket = availableTickets.find(t => t.id === ticketId);
    return ticket?.name || "Unknown Ticket";
  },

  // Helper to get ticket price
  getTicketPrice: (ticketId: string | undefined, availableTickets: TicketType[]): number => {
    if (!ticketId) return 0;
    const ticket = availableTickets.find(t => t.id === ticketId);
    return ticket?.price || 0;
  },

  // Calculate the total price for all attendees
  calculateTotalPrice: (attendees: AttendeeItem[], availableTickets: TicketType[]): number => {
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

const TicketingSummary: React.FC<TicketingSummaryProps> = ({ formState, allAttendees, availableTickets }) => {
  // Create a sorted list that keeps related attendees together
  const sortedAttendees = [...(formState.attendees || [])].sort((a, b) => {
    // Primary mason first
    if (a.attendeeType === 'Mason' && a.isPrimary) return -1;
    if (b.attendeeType === 'Mason' && b.isPrimary) return 1;

    // For partners, always keep them right after their related attendee
    // First, identify if b is a partner of a
    if ((b.attendeeType === 'LadyPartner' || b.attendeeType === 'GuestPartner') && 
        b.relatedAttendeeId === a.attendeeId) {
      return -1; // a should come before b
    }
    
    // Then, identify if a is a partner of b
    if ((a.attendeeType === 'LadyPartner' || a.attendeeType === 'GuestPartner') && 
        a.relatedAttendeeId === b.attendeeId) {
      return 1; // b should come before a
    }
    
    // If no direct relationship, maintain original order in the array
    // This assumes attendees are added to the array in the order they're created
    return (formState.attendees?.findIndex(att => att.attendeeId === a.attendeeId) || 0) - 
          (formState.attendees?.findIndex(att => att.attendeeId === b.attendeeId) || 0);
  });

  // Map the sorted AttendeeData to the AttendeeItem format expected
  const displayAttendees = sortedAttendees.map(attendee => {
    const isPartner = attendee.attendeeType === 'LadyPartner' || attendee.attendeeType === 'GuestPartner';
    let relatedTo = '';
    
    // Find related person for partners
    if (isPartner && attendee.relatedAttendeeId) {
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