import React, { useState } from "react";
import {
  FormState,
  // Remove unused old types
  // LadyPartnerData,
  // GuestPartnerData,
  // MasonData,
  // GuestData,
  // AttendeeData,
} from "../../shared/types/register";
// Import UnifiedAttendeeData directly
import { AttendeeData as UnifiedAttendeeData } from '../../lib/api/registrations';
// import { events } from "../../shared/data/events"; // Remove this import
import { Edit2 } from "lucide-react";
import AttendeeEditModal from "./AttendeeEditModal";

// Remove AttendeeTypeString alias
// type AttendeeTypeString = "mason" | "ladyPartner" | "guest" | "guestPartner";

// Update OrderedAttendeeEntry to use UnifiedAttendeeData
interface OrderedAttendeeEntry {
  type: UnifiedAttendeeData['attendeeType']; 
  attendee: UnifiedAttendeeData; 
  ticketId: string; // Revert to string
  relatedInfo: {
    masonIndex?: number; 
    guestIndex?: number;
    relationship?: string;
  } | null;
}

// Remove shared FieldValue type
// type FieldValue = string | boolean | number | undefined;

interface OrderSummarySectionProps {
  formState: FormState;
  // Remove nextStep/prevStep if not used directly here
  // nextStep: () => void;
  // prevStep: () => void;
  // Add goToStep if needed for edit functionality
  goToStep: (step: number) => void; 
  // Remove old update/toggle functions
  // updateMasonField: ...
  // updateGuestField: ...
  // updateLadyPartnerField: ...
  // updateGuestPartnerField: ...
  // toggleSameLodge: ...
  // toggleHasLadyPartner: ...
  // toggleGuestHasPartner: ...
  // Add unified update function
  updateAttendeeField: (attendeeId: string, field: keyof UnifiedAttendeeData, value: any) => void;
  // Keep remove functions if AttendeeSummary needs them (they are ID based)
  removeMasonById: (id: string) => void; // Context provides this
  removeGuestById: (id: string) => void; // Context provides this
  // Update selectedEvent prop type to match TicketSelection
  selectedEvent?: { id: string; title: string; day: string; time: string; price: number; } | undefined;
}

// Helper Utilities
const ticketUtils = {
  // Helper to get friendly ticket name (needs update for Ticket Definitions)
  getTicketName: (ticketId: string | undefined): string => {
    if (!ticketId) return "";

    // Placeholder logic - needs update to use Ticket Definitions
    if (ticketId === "full") return "Full Package";
    if (ticketId === "ceremony") return "Ceremony Only";
    if (ticketId === "social") return "Social Events";

    // TODO: Find name from actual TicketDefinition data (passed in or from store)
    return `Ticket ID: ${ticketId}`; 
  },

  // Helper to get ticket price by ID (needs update for Ticket Definitions)
  getTicketPrice: (ticketId: string | undefined): number => {
    if (!ticketId) return 0;

    // Placeholder logic - needs update to use Ticket Definitions
    const ticketPackagePrices: { [key: string]: number } = {
      full: 350,
      ceremony: 150,
      social: 250,
    };
    if (ticketId in ticketPackagePrices) {
      return ticketPackagePrices[ticketId];
    }

    // TODO: Find price from actual TicketDefinition data
    return 0; 
  },

  // Find event details by ID (This is no longer needed/possible with static import removed)
  // getEventById: (eventId: string) => {
  //   return events.find((e) => e.id === eventId);
  // },

  // Check if an event is included in a package (This logic might need updating based on how packages/events are defined)
  isEventIncludedInPackage: (eventId: string, packageId: string): boolean => {
    // This likely needs to reference actual package definitions
    const packageEvents: { [key: string]: string[] } = {
      full: ["welcome-reception", "grand-Proclamation-ceremony", "gala-dinner", "thanksgiving-service", "farewell-lunch"],
      ceremony: ["grand-Proclamation-ceremony"],
      social: ["welcome-reception", "gala-dinner", "farewell-lunch"],
    };
    return packageEvents[packageId]?.includes(eventId) ?? false;
  },

  // Calculate attendee total (uses getTicketPrice, which needs update)
  calculateAttendeeTotal: (
    ticketId: string | undefined,
    attendee: UnifiedAttendeeData,
  ): number => {
    if (ticketId) {
      return ticketUtils.getTicketPrice(ticketId);
    }
    return 0;
  },
};

// Helper functions for attendee info
const attendeeUtils = {
  // Get Mason Grand Lodge display info
  getMasonLodgeInfo: (mason: UnifiedAttendeeData) => { // Use UnifiedAttendeeData
    // Remove check for grandOfficeOther as it doesn't exist
    if (mason.rank === "GL" && mason.grandOfficer === "Current") {
      if (mason.grandOffice /* && mason.grandOffice !== "Please Select" */) { // Simplified check
        // TODO: Need a way to get Grand Lodge Name from ID for display
        return `${mason.grandOffice} of Grand Lodge ID: ${'UNKNOWN'}`; // Placeholder
      }
    }

    // TODO: Need a way to get Lodge Name & Grand Lodge Name from IDs
    return mason.lodgeId
      ? `Lodge ID: ${mason.lodgeId} of Grand Lodge ID: ${'UNKNOWN'}` // Placeholder
      : `Grand Lodge ID: ${'UNKNOWN'}`; // Placeholder
  },

  // Get contact details for display
  getContactInfo: (
    attendee: UnifiedAttendeeData,
  ) => {
    if (!attendee) return "";
    const type = attendee.attendeeType;

      const phone = attendee.primaryPhone;
      const email = attendee.primaryEmail;

      if (
        attendee.contactPreference === "Directly" &&
        phone &&
        email
      ) {
        // Define formattedPhone
        const formattedPhone =
          phone.startsWith("61") &&
          phone.length > 2 &&
          phone.charAt(2) === "4"
            ? "0" + phone.substring(2)
            : phone;
        return `${email} | ${formattedPhone}`;
      } else if (attendee.contactPreference === "PrimaryAttendee") {
        return "Contact via Primary Attendee";
      } else if (attendee.contactPreference === "ProvideLater") {
        return "Contact details to be provided";
      } else if (
        type === "LadyPartner" && 
        attendee.contactPreference === "Mason"
      ) {
        return "Contact via Mason";
      } else if (
        type === "GuestPartner" && 
        attendee.contactPreference === "Guest"
      ) {
        return "Contact via Guest";
      }
    
    return "Contact info pending"; // Default fallback
  },
};

// AttendeeHeader component
interface AttendeeHeaderProps {
  type: string;
  heading: string;
  secondRow: string;
  thirdRow: string;
  onEdit: (e: React.MouseEvent) => void;
}

const AttendeeHeader: React.FC<AttendeeHeaderProps> = ({
  type,
  heading,
  secondRow,
  thirdRow,
  onEdit,
}) => (
  <div className="bg-primary/10 p-4 border-b border-slate-200">
    <div className="flex justify-between">
      <h3 className="font-bold text-primary flex items-center">
        {type === "mason" && (
          <div className="mr-2 w-6 h-6 flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 600"
              className="w-full h-full"
              fill="currentColor"
            >
              <path d="M223.88 61.4L345.1 172.5L296.7 183.5L264.2 156.2L264.6 200.7L217.3 217.7L217.6 262.3L171.1 245.1L170.8 200.5L124.3 183.3L123.8 138.7L91.08 166.1L42.59 155.2L223.88 61.4zM44.77 210.1L87.48 219.7L87.89 268.6L148 288.8L147.6 239.8L188.1 252.2L188.4 301.3L246.9 320.1L247.3 271.9L287.8 284.1L289 332.1L340.4 346.2L341.6 385L360.3 367.5L367 403.4L347.1 426.2L223.7 399.9L-0.44 458.6L43.01 405.7V210.1H44.77z" />
            </svg>
          </div>
        )}
        {heading}
      </h3>
      <button
        onClick={onEdit}
        className="text-primary hover:text-primary/80 p-1"
        aria-label="Edit attendee"
      >
        <Edit2 className="h-4 w-4" />
      </button>
    </div>
    {secondRow && <p className="text-sm text-slate-700">{secondRow}</p>}
    {thirdRow && <p className="text-sm text-slate-600">{thirdRow}</p>}
  </div>
);

// EventItemRow component for package events
interface EventItemRowProps {
  event: {
    id: string;
    title: string;
    day: string;
    time: string;
    location: string;
    price?: number;
  };
  isIncluded?: boolean;
}

const EventItemRow: React.FC<EventItemRowProps> = ({
  event,
  isIncluded = false,
}) => (
  <tr className="border-b border-slate-100 last:border-b-0">
    <td className="p-4 pl-8 text-slate-700">
      {event.title}{" "}
      {isIncluded && <span className="italic text-slate-500">(Included)</span>}
    </td>
    <td className="p-4 text-slate-700">{event.day}</td>
    <td className="p-4 text-slate-700">{event.time}</td>
    <td className="p-4 text-slate-700">{event.location}</td>
    <td className="p-4 text-right text-slate-700">
      {isIncluded ? (
        <span className="italic">Included</span>
      ) : (
        `$${event.price ?? 0}`
      )}
    </td>
  </tr>
);

// PackageEventsTable component
interface PackageEventsTableProps {
  ticketId: string;
  ticketName: string;
}

const PackageEventsTable: React.FC<PackageEventsTableProps> = ({
  ticketId,
  ticketName,
}) => (
  <>
    <tr>
      <td colSpan={5} className="p-4 font-medium text-slate-800 border-b border-slate-200">
        {ticketName} Package
      </td>
    </tr>
    {/* TODO: Render included events based on actual package definition data */}
    <tr>
      <td colSpan={5} className="p-4 text-center text-slate-500 italic">
        (Event list placeholder - Requires package definition data)
      </td>
    </tr>
  </>
);

// IndividualEventsTable component
interface IndividualEventsTableProps {
  events: string[];
}

const IndividualEventsTable: React.FC<IndividualEventsTableProps> = ({
  events: eventIds,
}) => (
  <>
    {eventIds.length > 0 ? (
      eventIds.map((eventId) => (
        // TODO: Fetch and render event details based on eventId
        <tr key={eventId}>
          <td colSpan={5} className="p-4 pl-8 text-slate-700">
            Event ID: {eventId} (Details placeholder)
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan={5} className="p-4 text-center text-slate-500">
          No individual events selected
        </td>
      </tr>
    )}
  </>
);

// Main OrderSummarySection component
const OrderSummarySection: React.FC<OrderSummarySectionProps> = ({
  formState,
  // Remove nextStep, prevStep
  goToStep,
  // Destructure unified update function
  updateAttendeeField,
  // Keep remove functions if passed down
  removeMasonById,
  removeGuestById,
  // remove toggles
  selectedEvent // Added prop
}) => {
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  // Change state to hold attendeeId instead of index/type
  const [currentEditAttendeeId, setCurrentEditAttendeeId] = useState<string | null>(null);

  // Helper to get ticket ID remains the same, using attendee.ticket structure
  const getTicketIdForAttendee = (
    attendee: UnifiedAttendeeData | undefined,
    formStateInstance: FormState,
  ): string => {
    if (!attendee) return "";
    // Access ticketDefinitionId from UnifiedAttendeeData structure
    return formStateInstance.useUniformTicketing
      ? (formStateInstance.selectedTicket ?? "") // Provide default for potentially undefined selectedTicket
      : attendee.ticket?.ticketDefinitionId ?? "";
  };

  // Helper to create an attendee entry object - simplified
  const createAttendeeEntry = (
    attendee: UnifiedAttendeeData,
    formStateInstance: FormState,
  ): OrderedAttendeeEntry | null => {
    if (!attendee.firstName) return null; 
    const ticketId = getTicketIdForAttendee(attendee, formStateInstance); // Returns string (can be "")
    let relatedInfo = null; 
    return {
      type: attendee.attendeeType,
      attendee: attendee,
      ticketId: ticketId, // Assign the string (even if empty)
      relatedInfo: relatedInfo, 
    };
  };

  // Generate attendee entries in the required order
  const generateOrderedAttendeeEntries = (): OrderedAttendeeEntry[] => {
    const orderedEntries: OrderedAttendeeEntry[] = [];
    const attendees = formState.attendees || [];
    // Sorting logic might need adjustment if order matters beyond primary mason
    const sortedAttendees = [...attendees].sort((a, b) => {
      if (a.attendeeType === 'Mason' && a.isPrimary) return -1;
      if (b.attendeeType === 'Mason' && b.isPrimary) return 1;
      if (a.relatedAttendeeId === b.attendeeId) return 1;
      if (b.relatedAttendeeId === a.attendeeId) return -1;
      return 0; 
    });
    sortedAttendees.forEach((attendee) => {
      const entry = createAttendeeEntry(attendee, formState);
      if (entry) orderedEntries.push(entry);
    });
    return orderedEntries;
  };

  // Calculate total price (Needs update for new pricing logic)
  const calculateTotalPrice = (): number => {
    // ... (This function needs significant rework based on TicketDefinitions) ...
    // Placeholder:
    return 0;
  };

  // Open edit modal for an attendee - use ID now
  const handleEditAttendee = (
    e: React.MouseEvent,
    attendeeId: string, // Pass ID directly
  ) => {
    e.preventDefault();
    e.stopPropagation();
    // Set the ID and show the modal
    setCurrentEditAttendeeId(attendeeId);
    setShowEditModal(true);
  };

  // Close edit modal
  const handleCloseModal = () => {
    setShowEditModal(false);
    setCurrentEditAttendeeId(null);
  };

  const totalPrice = calculateTotalPrice();
  const orderedEntries = generateOrderedAttendeeEntries();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>

      {/* Order Summary Content */}
      <div className="space-y-8 mb-8">
        {orderedEntries.map((entry) => {
          const attendeeId = entry.attendee.attendeeId; // Use actual ID
          const ticketName = ticketUtils.getTicketName(entry.ticketId); // Needs update for TicketDef
          const attendeeTotal = ticketUtils.calculateAttendeeTotal(
            entry.ticketId,
            entry.attendee,
          ); // Needs update for TicketDef

          if (!ticketName && attendeeTotal === 0) return null;

          let attendeeHeading = "";
          let secondRow = "";
          let thirdRow = "";

          const attendee = entry.attendee; // UnifiedAttendeeData
          const type = attendee.attendeeType.toLowerCase();

          // Construct heading/rows using UnifiedAttendeeData fields
          attendeeHeading = `${attendee.title || ''} ${attendee.firstName || ''} ${attendee.lastName || ''}`.trim() || attendee.attendeeType;
          if (type === "mason") {
            // ... (Mason specific heading/row construction) ...
            const rankDisplay = (attendee.rank && attendee.rank !== "GL") ? attendee.rank : "";
            const grandRankDisplay = (attendee.rank === "GL" && attendee.grandRank) ? attendee.grandRank : "";
            attendeeHeading = `${attendee.title} ${attendee.firstName} ${attendee.lastName} ${grandRankDisplay || rankDisplay}`.trim();
            
            // TODO: Need to fetch lodge/GL names based on IDs for display
            secondRow = `Lodge: ${attendee.lodgeId || 'N/A'}`; 
            thirdRow = attendeeUtils.getContactInfo(attendee);
          } else if (type === "guest") {
            const primaryMason = formState.attendees?.find(a => a.attendeeType === 'Mason' && a.isPrimary);
            secondRow = primaryMason ? `Guest of ${primaryMason.title} ${primaryMason.firstName} ${primaryMason.lastName}` : 'Guest';
            thirdRow = attendeeUtils.getContactInfo(attendee);
          } else if (type === "ladypartner" || type === "guestpartner") {
            const relatedAttendee = attendee.relatedAttendeeId ? formState.attendees?.find(a => a.attendeeId === attendee.relatedAttendeeId) : undefined;
            const relatedDesc = relatedAttendee ? `${relatedAttendee.title} ${relatedAttendee.firstName} ${relatedAttendee.lastName}` : (type === 'ladypartner' ? 'Mason' : 'Guest');
            secondRow = `${attendee.relationship || 'Partner'} of ${relatedDesc}`;
            thirdRow = attendeeUtils.getContactInfo(attendee);
          }

          return (
            <div
              key={attendeeId}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm order-summary-table"
            >
              <AttendeeHeader
                type={entry.type} // Pass AttendeeType directly
                heading={attendeeHeading}
                secondRow={secondRow}
                thirdRow={thirdRow}
                // Pass ID to handler
                onEdit={(e) => handleEditAttendee(e, attendeeId)}
              />
              {/* ... Table rendering ... */}
            </div>
          );
        })}
        {/* ... Grand Total ... */}
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={() => goToStep(3)} className="btn-outline">
          Back to Tickets
        </button>
        <button type="button" onClick={() => goToStep(5)} className="btn-primary">
          Continue to Payment
        </button>
      </div>

      {/* Edit Attendee Modal - Updated Props */}
      {showEditModal && currentEditAttendeeId && (
        <AttendeeEditModal
          // Pass attendeeId
          attendeeId={currentEditAttendeeId}
          formState={formState}
          onClose={handleCloseModal}
          // Pass unified update function
          updateAttendeeField={updateAttendeeField}
          // Remove old update/toggle functions
        />
      )}
    </div>
  );
};

export default OrderSummarySection;
