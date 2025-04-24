import React from 'react';
import { FormState, MasonData, LadyPartnerData, GuestData, GuestPartnerData, AttendeeTicket, TicketType } from '../../../shared/types/register'; // Updated imports, added TicketType
import { events } from '../../../shared/data/events'; // Import events data
// Removed import for availableTickets

// Define the structure for the flattened attendee list passed from the parent
interface AttendeeType {
  type: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner';
  index: number;
  name: string;
  title: string;
  data: MasonData | LadyPartnerData | GuestData | GuestPartnerData;
  relatedTo?: string;
}

interface TicketingSummaryProps {
  formState: FormState; // Pass full form state
  allAttendees: AttendeeType[]; // Pass the flattened list of attendees
  availableTickets: TicketType[]; // Pass available tickets data
}

// Helper Utilities (Consider moving to a shared utils file later)
const ticketUtils = {
  // Helper to get friendly ticket name
  getTicketName: (ticketId: string | undefined, availableTickets: TicketType[]): string => { // Added availableTickets param
    if (!ticketId) return "";
    const ticket = availableTickets.find((t: TicketType) => t.id === ticketId); // Added type
    return ticket?.name ?? ""; // Return package name if found
  },

  // Helper to get ticket price by ID (simplified for packages)
  getPackagePrice: (ticketId: string | undefined, availableTickets: TicketType[]): number => { // Added availableTickets param
    if (!ticketId) return 0;
    const ticket = availableTickets.find((t: TicketType) => t.id === ticketId); // Added type
    return ticket?.price ?? 0;
  },

  // Find event details by ID
  getEventById: (eventId: string) => {
    return events.find((e) => e.id === eventId);
  },

  // Check if an event is included in a package
  isEventIncludedInPackage: (eventId: string, packageId: string): boolean => {
    // Removed unused 'ticket' variable lookup
    // Kept logic based on IDs as per OrderSummarySection
     const packageEvents: { [key: string]: string[] } = {
      full: [
        "welcome-reception",
        "grand-Proclamation-ceremony",
        "gala-dinner",
        "thanksgiving-service",
        "farewell-lunch",
      ],
      ceremony: ["grand-Proclamation-ceremony"],
      social: ["welcome-reception", "gala-dinner", "farewell-lunch"],
    };
    return packageEvents[packageId]?.includes(eventId) ?? false;
  },

  // Check if a ticket ID is a package
  isPackage: (ticketId: string | undefined): boolean => {
    return !!ticketId && ['full', 'ceremony', 'social'].includes(ticketId);
  },

  // Get selected ticket/events for an attendee
  getAttendeeTicketSelection: (formState: FormState, attendeeType: string, index: number): AttendeeTicket | undefined => {
    switch(attendeeType) {
      case 'mason': return formState.masons[index]?.ticket;
      case 'ladyPartner': return formState.ladyPartners[index]?.ticket;
      case 'guest': return formState.guests[index]?.ticket;
      case 'guestPartner': return formState.guestPartners[index]?.ticket;
      default: return undefined;
    }
  },

  // Calculate attendee total
  calculateAttendeeTotal: (
    attendeeTicket: AttendeeTicket | undefined,
    availableTickets: TicketType[] // Added availableTickets param
  ): number => {
    if (!attendeeTicket) return 0;

    const { ticketId, events: eventIds } = attendeeTicket;

    if (ticketId && ticketUtils.isPackage(ticketId)) {
      return ticketUtils.getPackagePrice(ticketId, availableTickets); // Pass availableTickets
    } else if (eventIds && eventIds.length > 0) {
      // Sum prices of individual events
      return eventIds.reduce((sum, eventId) => {
        const event = ticketUtils.getEventById(eventId);
        return sum + (event?.price ?? 0);
      }, 0);
    }
    return 0;
  },
};


const TicketingSummary: React.FC<TicketingSummaryProps> = ({
  formState,
  allAttendees,
  availableTickets // Destructure prop
}) => {
  let grandTotal = 0;

  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
      <h3 className="font-bold text-lg mb-4">Order Summary</h3>
      
      <div className="space-y-4">
        {allAttendees.map((attendee) => {
          const attendeeTicket = ticketUtils.getAttendeeTicketSelection(formState, attendee.type, attendee.index);
          const attendeeTotal = ticketUtils.calculateAttendeeTotal(attendeeTicket, availableTickets); // Pass availableTickets
          grandTotal += attendeeTotal;
          const ticketId = attendeeTicket?.ticketId;
          const selectedEvents = attendeeTicket?.events ?? [];
          const packageName = ticketUtils.getTicketName(ticketId, availableTickets); // Pass availableTickets

          return (
            <div key={`${attendee.type}-${attendee.index}`} className="pb-4 border-b border-slate-200 last:border-b-0">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-800">{attendee.title} {attendee.name}</span>
                <span className="font-medium text-slate-800">${attendeeTotal}</span>
              </div>
              <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                {ticketUtils.isPackage(ticketId) && packageName ? (
                  <>
                    <li>
                      {packageName} Package
                      <ul className="list-[circle] pl-5 space-y-0.5 mt-1">
                        {events
                          .filter(event => ticketUtils.isEventIncludedInPackage(event.id, ticketId!))
                          .map(includedEvent => (
                            <li key={includedEvent.id} className="text-xs italic">
                              {includedEvent.title}
                            </li>
                          ))}
                      </ul>
                    </li>
                  </>
                ) : selectedEvents.length > 0 ? (
                  selectedEvents.map(eventId => {
                    const event = ticketUtils.getEventById(eventId);
                    return event ? <li key={eventId}>{event.title} (${event.price})</li> : null;
                  })
                ) : (
                  <li className="italic">No tickets selected</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {allAttendees.length > 0 && (
        <div className="flex justify-between border-t border-slate-200 pt-3 mt-3">
          <span className="font-semibold text-sm text-slate-800">Grand Total</span>
          <span className="font-semibold text-sm text-slate-800">${grandTotal}</span>
        </div>
      )}
    </div>
  );
};

export default TicketingSummary;