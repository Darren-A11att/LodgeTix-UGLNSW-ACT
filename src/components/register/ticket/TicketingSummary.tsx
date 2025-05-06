import React from 'react';
import { FormState, TicketType } from '../../../shared/types/register';
import { TicketDefinitionType } from '../../../shared/types/ticket';
import { useRegistrationStore, RegistrationState, UnifiedAttendeeData as StoreUnifiedAttendeeData } from '../../../store/registrationStore';

// Define the structure for the flattened attendee list passed from the parent
interface AttendeeItem {
  type: string;
  id: string;
  name: string;
  title: string;
  data: StoreUnifiedAttendeeData;
  relatedTo?: string;
}

interface TicketingSummaryProps {
  // formState: FormState;
  // allAttendees: AttendeeItem[];
  // availableTickets: (TicketType | TicketDefinitionType)[];
}

// Helper Utilities
const ticketUtils = {
  // Helper to get friendly ticket name
  getTicketName: (ticketId: string | undefined | null, availableTickets: (TicketType | TicketDefinitionType)[]): string => {
    if (!ticketId) return "";
    const ticket = availableTickets.find(t => t.id === ticketId);
    return ticket?.name || "Unknown Ticket";
  },

  // Helper to get ticket price - price is now required by the database schema
  getTicketPrice: (ticketId: string | undefined | null, availableTickets: (TicketType | TicketDefinitionType)[]): number => {
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

const TicketingSummary: React.FC<TicketingSummaryProps> = () => {
  // Access state slices individually from the registration store
  const attendees = useRegistrationStore((state: RegistrationState) => state.attendees);
  const availableTickets = useRegistrationStore((state: RegistrationState) => state.availableTickets || []);

  // Sort using the StoreUnifiedAttendeeData type
  const sortedAttendees = [...attendees].sort((a: StoreUnifiedAttendeeData, b: StoreUnifiedAttendeeData) => {
    // Primary mason first (use lowercase 'mason')
    if (a.attendeeType === 'mason' && a.isPrimary) return -1;
    if (b.attendeeType === 'mason' && b.isPrimary) return 1;

    // Partners after related attendee (use lowercase types)
    if ((b.attendeeType === 'lady_partner' || b.attendeeType === 'guest_partner') && 
        b.relatedAttendeeId === a.attendeeId) {
      return -1; // a should come before b
    }
    
    if ((a.attendeeType === 'lady_partner' || a.attendeeType === 'guest_partner') && 
        a.relatedAttendeeId === b.attendeeId) {
      return 1; // b should come before a
    }
    
    // Use StoreUnifiedAttendeeData type for findIndex parameters
    return (attendees.findIndex((att: StoreUnifiedAttendeeData) => att.attendeeId === a.attendeeId)) - 
           (attendees.findIndex((att: StoreUnifiedAttendeeData) => att.attendeeId === b.attendeeId));
  });

  // Map sorted StoreUnifiedAttendeeData to AttendeeItem format
  const displayAttendees: AttendeeItem[] = sortedAttendees.map((attendee): AttendeeItem => {
    const isPartner = attendee.attendeeType === 'lady_partner' || attendee.attendeeType === 'guest_partner';
    let relatedTo = '';
    
    if (isPartner && attendee.relatedAttendeeId) {
      // Use StoreUnifiedAttendeeData type for find parameter
      const relatedAttendee = attendees.find((a: StoreUnifiedAttendeeData) => 
        a.attendeeId === attendee.relatedAttendeeId
      );
      
      if (relatedAttendee) {
        // Use lowercase type in the string
        relatedTo = `${relatedAttendee.attendeeType} ${relatedAttendee.firstName} ${relatedAttendee.lastName}`;
      }
    }
    
    // Return type matches AttendeeItem, no cast needed if mapping is correct
    return {
      type: attendee.attendeeType ? attendee.attendeeType : 'unknown',
      id: attendee.attendeeId,
      name: `${attendee.firstName || ''} ${attendee.lastName || ''}`,
      title: attendee.title || '',
      data: attendee,
      ...(relatedTo ? { relatedTo } : {})
    };
  });

  const totalAttendees = displayAttendees.length;
  const totalPrice = ticketUtils.calculateTotalPrice(displayAttendees, availableTickets);

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
                <span>{attendee.type}</span>
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