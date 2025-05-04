import React, { useState } from "react";
import {
  FormState,
  LadyPartnerData,
  GuestPartnerData,
  MasonData,
  GuestData,
  AttendeeData,
} from "../../shared/types/register";
import { events } from "../../shared/data/events";
import { Edit2 } from "lucide-react";
import AttendeeEditModal from "./AttendeeEditModal";
import { AttendeeData as UnifiedAttendeeData } from '../../lib/api/registrations';

// Define a type alias for the attendee type strings
type AttendeeTypeString = "mason" | "ladyPartner" | "guest" | "guestPartner";

// Interface for the structure of entries in the ordered summary
interface OrderedAttendeeEntry {
  type: AttendeeTypeString; // Use the type alias
  attendee: AttendeeData;
  index: number;
  ticketId: string;
  relatedInfo: {
    masonIndex?: number;
    guestIndex?: number;
    relationship?: string;
  } | null;
}

// Define shared type for field values (copied from AttendeeEditModal)
type FieldValue = string | boolean | number | undefined;

interface OrderSummarySectionProps {
  formState: FormState;
  nextStep: () => void;
  prevStep: () => void;
  // Add context functions passed down from RegisterPage
  updateMasonField: (index: number, field: string, value: FieldValue) => void;
  updateGuestField: (index: number, field: string, value: FieldValue) => void;
  updateLadyPartnerField: (index: number, field: string, value: FieldValue) => void;
  updateGuestPartnerField: (index: number, field: string, value: FieldValue) => void;
  toggleSameLodge: (index: number, checked: boolean) => void;
  toggleHasLadyPartner: (index: number, checked: boolean) => void;
  toggleGuestHasPartner: (index: number, checked: boolean) => void;
}

// Helper Utilities
const ticketUtils = {
  // Helper to get friendly ticket name
  getTicketName: (ticketId: string | undefined): string => {
    if (!ticketId) return "";

    if (ticketId === "full") return "Full Package";
    if (ticketId === "ceremony") return "Ceremony Only";
    if (ticketId === "social") return "Social Events";

    // If it's an individual event
    const event = events.find((e) => e.id === ticketId);
    // Provide default empty string if title is null
    return event ? (event.title || '') : ""; 
  },

  // Helper to get ticket price by ID
  getTicketPrice: (ticketId: string | undefined): number => {
    if (!ticketId) return 0;

    const ticketPackagePrices: { [key: string]: number } = {
      full: 350,
      ceremony: 150,
      social: 250,
    };

    // First check if it's a package
    if (ticketId in ticketPackagePrices) {
      return ticketPackagePrices[ticketId];
    }

    // Otherwise check if it's an individual event
    const event = events.find((e) => e.id === ticketId);
    return event?.price ?? 0;
  },

  // Find event details by ID
  getEventById: (eventId: string) => {
    return events.find((e) => e.id === eventId);
  },

  // Check if an event is included in a package
  isEventIncludedInPackage: (eventId: string, packageId: string): boolean => {
    // Map package IDs to the events they include
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

  // Calculate attendee total
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
  getMasonLodgeInfo: (mason: MasonData) => {
    if (mason.rank === "GL" && mason.grandOfficer === "Current") {
      if (mason.grandOffice === "Other" && mason.grandOfficeOther) {
        return `${mason.grandOfficeOther} of ${mason.grandLodge}`;
      } else if (mason.grandOffice && mason.grandOffice !== "Please Select") {
        return `${mason.grandOffice} of ${mason.grandLodge}`;
      }
    }

    // Default to lodge info
    return mason.lodge
      ? `${mason.lodge} of ${mason.grandLodge}`
      : mason.grandLodge;
  },

  // Get contact details for display
  getContactInfo: (
    attendee: UnifiedAttendeeData,
    type: string,
  ) => {
    if (!attendee) return "";

    // Check attendeeType to gate logic if needed, although contactPreference should suffice
    if (
      type === "mason" ||
      type === "guest" ||
      type === "ladyPartner" ||
      type === "guestPartner"
    ) {
      // Use primaryPhone and primaryEmail
      const phone = attendee.primaryPhone;
      const email = attendee.primaryEmail;

      // Compare against correct enum values (as strings for now)
      if (
        attendee.contactPreference === "Directly" &&
        phone &&
        email
      ) {
        // Convert international format (61...) to national format (04...)
        const formattedPhone =
          phone.startsWith("61") &&
          phone.length > 2 &&
          phone.charAt(2) === "4"
            ? "0" + phone.substring(2)
            : phone;

        return `${email} | ${formattedPhone}`;
      } else if (attendee.contactPreference === "PrimaryAttendee") { // Changed "Primary Attendee" to "PrimaryAttendee"
        return "Contact via Primary Attendee";
      } else if (attendee.contactPreference === "ProvideLater") { // Changed "Provide Later" to "ProvideLater"
        return "Contact details to be provided";
      } else if (
        type === "ladyPartner" &&
        attendee.contactPreference === "Mason"
      ) {
        return "Contact via Mason";
      } else if (
        type === "guestPartner" &&
        attendee.contactPreference === "Guest"
      ) {
        return "Contact via Guest";
      }
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
      <td
        colSpan={5}
        className="p-4 font-medium text-slate-800 border-b border-slate-200"
      >
        {ticketName} Package
      </td>
    </tr>

    {events.map((event) => {
      if (ticketUtils.isEventIncludedInPackage(event.id, ticketId)) {
        // Ensure event data matches EventItemRowProps expectations
        const eventProps = {
          ...event,
          title: event.title || '', // Provide default
          day: event.day || '', // Provide default
          time: event.time || '', // Provide default
          location: event.location || '', // Provide default
          price: event.price ?? undefined 
        };
        return <EventItemRow key={event.id} event={eventProps} isIncluded={true} />;
      }
      return null;
    })}
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
      eventIds.map((eventId) => {
        const event = ticketUtils.getEventById(eventId);
        if (!event) return null;
        const eventProps = {
          ...event,
          title: event.title || '', // Provide default
          day: event.day || '', // Provide default
          time: event.time || '', // Provide default
          location: event.location || '', // Provide default
          price: event.price ?? undefined
        };
        return <EventItemRow key={eventId} event={eventProps} />;
      })
    ) : (
      <tr>
        <td colSpan={5} className="p-4 text-center text-slate-500">
          No events selected
        </td>
      </tr>
    )}
  </>
);

// Main OrderSummarySection component
const OrderSummarySection: React.FC<OrderSummarySectionProps> = ({
  formState,
  nextStep,
  prevStep,
  // Destructure context functions
  updateMasonField,
  updateGuestField,
  updateLadyPartnerField,
  updateGuestPartnerField,
  toggleSameLodge,
  toggleHasLadyPartner,
  toggleGuestHasPartner,
}) => {
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [currentEditAttendee, setCurrentEditAttendee] = useState<{
    type: AttendeeTypeString; // Use the type alias here
    index: number;
  } | null>(null);

  // Helper to get ticket ID for an attendee based on ticketing mode
  const getTicketIdForAttendee = (
    attendee: AttendeeData | undefined,
    formStateInstance: FormState,
  ): string => {
    if (!attendee) return "";
    return formStateInstance.useUniformTicketing
      ? formStateInstance.selectedTicket
      : attendee.ticket?.ticketId ?? "";
  };

  // Helper to create an attendee entry object
  const createAttendeeEntry = (
    type: AttendeeTypeString,
    attendee: UnifiedAttendeeData,
    index: number,
    formStateInstance: FormState,
    relatedInfo: {
      masonIndex?: number;
      guestIndex?: number;
      relationship?: string;
    } | null = null,
  ): OrderedAttendeeEntry | null => {
    // Check completeness using UnifiedAttendeeData fields
    if (!attendee.firstName) return null; 

    // Access ticketDefinitionId from UnifiedAttendeeData structure
    const ticketId = attendee.ticket?.ticketDefinitionId || "";

    // Refine relatedInfo structure based on type
    let finalRelatedInfo = null;
    if (relatedInfo) {
      if (type === "ladyPartner" && relatedInfo.masonIndex !== undefined) {
        finalRelatedInfo = {
          masonIndex: relatedInfo.masonIndex,
          relationship: relatedInfo.relationship,
        };
      } else if (
        type === "guestPartner" &&
        relatedInfo.guestIndex !== undefined
      ) {
        finalRelatedInfo = {
          guestIndex: relatedInfo.guestIndex,
          relationship: relatedInfo.relationship,
        };
      }
    }

    return {
      type: type,
      attendee: attendee,
      index: index,
      ticketId: ticketId,
      relatedInfo: finalRelatedInfo,
    };
  };

  // Generate attendee entries in the required order
  const generateOrderedAttendeeEntries = (): OrderedAttendeeEntry[] => {
    const orderedEntries: OrderedAttendeeEntry[] = [];
    const attendees = formState.attendees || [];

    // Create a map for easy lookup
    const attendeeMap = new Map(attendees.map(att => [att.attendeeId, att]));

    // Sort attendees: Primary Mason first, then others, keeping partners after their primary
    const sortedAttendees = [...attendees].sort((a, b) => {
      if (a.attendeeType === 'Mason' && a.isPrimary) return -1;
      if (b.attendeeType === 'Mason' && b.isPrimary) return 1;
      if (a.relatedAttendeeId === b.attendeeId) return 1; // a is partner of b, b comes first
      if (b.relatedAttendeeId === a.attendeeId) return -1; // b is partner of a, a comes first
      // Basic fallback sort (can be improved if specific order is needed)
      return 0; 
    });

    sortedAttendees.forEach((attendee, index) => {
      const type = attendee.attendeeType.toLowerCase() as AttendeeTypeString;
      let relatedInfo: { masonIndex?: number; guestIndex?: number; relationship?: string } | null = null;
      
      // Add relationship info if it's a partner
      if (attendee.relatedAttendeeId) {
          const relatedAttendee = attendeeMap.get(attendee.relatedAttendeeId);
          if (relatedAttendee) {
              // Find the index of the related attendee in the *sorted* list
              const relatedIndex = sortedAttendees.findIndex(att => att.attendeeId === attendee.relatedAttendeeId);
              if (relatedAttendee.attendeeType === 'Mason') {
                  relatedInfo = { masonIndex: relatedIndex, relationship: attendee.relationship || undefined };
              } else if (relatedAttendee.attendeeType === 'Guest') {
                  relatedInfo = { guestIndex: relatedIndex, relationship: attendee.relationship || undefined };
              }
          }
      }

      const entry = createAttendeeEntry(
        type,
        attendee,
        index, // Use the current index in the sorted array
        formState,
        relatedInfo
      );
      if (entry) orderedEntries.push(entry);
    });
    
    return orderedEntries;
  };

  // Calculate total price
  const calculateTotalPrice = (): number => {
    const orderedEntries = generateOrderedAttendeeEntries();
    let total = 0;

    for (const entry of orderedEntries) {
      const ticketPrice = ticketUtils.getTicketPrice(entry.ticketId);

      if (entry.ticketId) {
        total += ticketPrice;
      } else if (
        entry.attendee.ticket?.events &&
        entry.attendee.ticket.events.length > 0
      ) {
        // Sum prices of individual events
        let eventTotal = 0;
        for (const eventId of entry.attendee.ticket.events) {
          const event = events.find((e) => e.id === eventId);
          if (event?.price) {
            eventTotal += event.price;
          }
        }
        total += eventTotal;
      }
    }

    return total;
  };

  // Open edit modal for an attendee
  const handleEditAttendee = (
    e: React.MouseEvent,
    type: AttendeeTypeString, // Use type alias here
    index: number,
  ) => {
    // Prevent event propagation to stop any parent click handlers from firing
    e.preventDefault();
    e.stopPropagation();

    // Set the current attendee and show the modal
    setCurrentEditAttendee({ type, index });
    setShowEditModal(true);
  };

  // Close edit modal
  const handleCloseModal = () => {
    setShowEditModal(false);
    setCurrentEditAttendee(null);
  };

  const totalPrice = calculateTotalPrice();
  const orderedEntries = generateOrderedAttendeeEntries();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>

      {/* Order Summary Content */}
      <div className="space-y-8 mb-8">
        {orderedEntries.map((entry) => {
          const attendeeId = `${entry.type}-${entry.index}`;
          const ticketName = ticketUtils.getTicketName(entry.ticketId);
          const attendeeTotal = ticketUtils.calculateAttendeeTotal(
            entry.ticketId,
            entry.attendee,
          );

          // Skip if no ticket or price
          if (!ticketName && attendeeTotal === 0) return null;

          // Get the proper heading based on attendee type
          let attendeeHeading = "";
          let secondRow = "";
          let thirdRow = "";

          if (entry.type === "mason") {
            const mason = entry.attendee; // This is UnifiedAttendeeData

            // Perform type check before accessing Mason-specific fields
            const rankDisplay = (mason.attendeeType === 'Mason' && mason.rank && mason.rank !== "GL") ? mason.rank : "";
            const grandRankDisplay = (mason.attendeeType === 'Mason' && mason.rank === "GL" && mason.grandRank) ? mason.grandRank : "";
            
            attendeeHeading = `${mason.title} ${mason.firstName} ${mason.lastName} ${grandRankDisplay || rankDisplay}`.trim();

            // Reconstruct secondRow for Lodge Info
            const lodgeDisplay = (mason.attendeeType === 'Mason' && mason.lodgeId) ? mason.lodgeId : 'Lodge details missing'; 
            const grandLodgeDisplay = 'Grand Lodge Name?'; // Placeholder
            
            // Check if this mason should use the primary mason's lodge details
            // Note: 'sameLodgeAsPrimary' might not exist on UnifiedAttendeeData, logic needs verification
            const usePrimaryLodge = (mason.attendeeType === 'Mason' && (mason as any).sameLodgeAsPrimary === true);
            
            if (usePrimaryLodge && !mason.isPrimary) {
                // Find the primary mason from the attendees array
                const primaryMason = formState.attendees?.find(a => a.attendeeType === 'Mason' && a.isPrimary);
                const primaryLodgeDisplay = (primaryMason?.lodgeId) ? primaryMason.lodgeId : 'Lodge details missing';
                // TODO: Look up primary grand lodge name
                const primaryGrandLodgeDisplay = 'Grand Lodge Name?'; 
                secondRow = `${primaryLodgeDisplay}, ${primaryGrandLodgeDisplay} (Same as Primary)`;
            } else {
                // Use this mason's own details
                secondRow = `${lodgeDisplay}, ${grandLodgeDisplay}`;
            }
            
            // Construct thirdRow with Contact and Needs from AttendeeData
            const phoneStr = mason.primaryPhone || 'No mobile';
            const emailStr = mason.primaryEmail || 'No email';
            const dietaryStr = mason.dietaryRequirements || 'No dietary needs';
            const needsStr = mason.specialNeeds || 'No special needs';
            thirdRow = `${phoneStr} | ${emailStr} | ${dietaryStr} | ${needsStr}`;

            const headerProps = {
              type: entry.type,
              heading: attendeeHeading,
              secondRow: secondRow, // Pass reconstructed lodge info
              thirdRow: thirdRow, // Pass combined contact/needs
              onEdit: (e: React.MouseEvent) => handleEditAttendee(e, entry.type, entry.index)
            };

            return (
              <div
                key={attendeeId}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm order-summary-table"
              >
                {/* Attendee Header */}
                <AttendeeHeader {...headerProps} />
                
                {/* Package or Event Table (like other types) */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-4 font-medium text-slate-700">Item Details</th>
                        <th className="text-left p-4 font-medium text-slate-700">Date</th>
                        <th className="text-left p-4 font-medium text-slate-700">Time</th>
                        <th className="text-left p-4 font-medium text-slate-700">Location</th>
                        <th className="text-right p-4 font-medium text-slate-700">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Check ticketDefinitionId from the attendee data */}
                      {(() => {
                        const ticketDefId = entry.attendee.ticket?.ticketDefinitionId;
                        const isPackageTicket = ticketDefId && ["full", "ceremony", "social"].includes(ticketDefId);
                        
                        if (isPackageTicket) {
                          // It's a package, render PackageEventsTable
                          const packageName = ticketUtils.getTicketName(ticketDefId); // Use helper to get name
                          return <PackageEventsTable ticketId={ticketDefId} ticketName={packageName} />;
                        } else {
                          // It's not a package (or no ticket selected)
                          // Render IndividualEventsTable - currently expects events array which is empty
                          // This will show "No events selected" until individual event selection is fixed
                          // const individualEvents = entry.attendee.ticket?.events || []; // This path is currently not supported
                          return <IndividualEventsTable events={[]} />;
                        }
                      })()}
                      {(entry.attendee.ticket?.ticketDefinitionId) && (
                        <tr className="bg-slate-50 font-medium">
                          <td colSpan={4} className="p-4 text-right border-t border-slate-200">Attendee Total:</td>
                          <td className="p-4 text-right border-t border-slate-200">${attendeeTotal.toFixed(2)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          } else if (entry.type === "guest") {
            const guest = entry.attendee;
            attendeeHeading = `${guest.title} ${guest.firstName} ${guest.lastName}`;
            // Find primary mason from attendees array
            const primaryMason = formState.attendees?.find(a => a.attendeeType === 'Mason' && a.isPrimary);
            secondRow = primaryMason ? `Guest of ${primaryMason.title} ${primaryMason.firstName} ${primaryMason.lastName}` : 'Guest';
            thirdRow = attendeeUtils.getContactInfo(guest, entry.type);
          } else if (entry.type === "ladyPartner") {
            const partner = entry.attendee;
            // Find related mason using relatedAttendeeId from attendees array
            const relatedMason = partner.relatedAttendeeId ? formState.attendees?.find(m => m.attendeeId === partner.relatedAttendeeId && m.attendeeType === 'Mason') : undefined;
            
            attendeeHeading = `${partner.title} ${partner.firstName} ${partner.lastName}`;
            
            // Add null check for relatedMason
            if (relatedMason) {
              secondRow = `${partner.relationship || 'Partner'} of ${relatedMason.title} ${relatedMason.firstName} ${relatedMason.lastName}`;
            } else {
              secondRow = `${partner.relationship || 'Partner'} of Mason`;
              console.log(`Warning: Related mason not found for lady partner ${partner.id}`);
            }
            
            thirdRow = attendeeUtils.getContactInfo(partner, entry.type);
          } else if (entry.type === "guestPartner") {
            const partner = entry.attendee;
            // Find related guest using relatedAttendeeId from attendees array
            const relatedGuest = partner.relatedAttendeeId ? formState.attendees?.find(g => g.attendeeId === partner.relatedAttendeeId && g.attendeeType === 'Guest') : undefined;
            
            attendeeHeading = `${partner.title} ${partner.firstName} ${partner.lastName}`;
            
            // Add null check for relatedGuest
            if (relatedGuest) {
              secondRow = `${partner.relationship || 'Partner'} of ${relatedGuest.title} ${relatedGuest.firstName} ${relatedGuest.lastName}`;
            } else {
              secondRow = `${partner.relationship || 'Partner'} of Guest`;
              console.log(`Warning: Related guest not found for guest partner ${partner.id}`);
            }
            
            thirdRow = attendeeUtils.getContactInfo(partner, entry.type);
          }

          return (
            <div
              key={attendeeId}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm order-summary-table"
            >
              {/* Attendee Header */}
              <AttendeeHeader
                type={entry.type}
                heading={attendeeHeading}
                secondRow={secondRow}
                thirdRow={thirdRow}
                onEdit={(e) => handleEditAttendee(e, entry.type, entry.index)}
              />

              {/* Package or Event Table (like other types) */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-4 font-medium text-slate-700">Item Details</th>
                      <th className="text-left p-4 font-medium text-slate-700">Date</th>
                      <th className="text-left p-4 font-medium text-slate-700">Time</th>
                      <th className="text-left p-4 font-medium text-slate-700">Location</th>
                      <th className="text-right p-4 font-medium text-slate-700">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Check ticketDefinitionId from the attendee data */}
                    {(() => {
                      const ticketDefId = entry.attendee.ticket?.ticketDefinitionId;
                      const isPackageTicket = ticketDefId && ["full", "ceremony", "social"].includes(ticketDefId);
                      
                      if (isPackageTicket) {
                        // It's a package, render PackageEventsTable
                        const packageName = ticketUtils.getTicketName(ticketDefId); // Use helper to get name
                        return <PackageEventsTable ticketId={ticketDefId} ticketName={packageName} />;
                      } else {
                        // It's not a package (or no ticket selected)
                        // Render IndividualEventsTable - currently expects events array which is empty
                        // This will show "No events selected" until individual event selection is fixed
                        // const individualEvents = entry.attendee.ticket?.events || []; // This path is currently not supported
                        return <IndividualEventsTable events={[]} />;
                      }
                    })()}
                    {(entry.attendee.ticket?.ticketDefinitionId) && (
                      <tr className="bg-slate-50 font-medium">
                        <td colSpan={4} className="p-4 text-right border-t border-slate-200">Attendee Total:</td>
                        <td className="p-4 text-right border-t border-slate-200">${attendeeTotal.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Grand Total Section */}
        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-primary">GRAND TOTAL</h3>
            <span className="text-xl font-bold text-primary">
              ${totalPrice}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={prevStep} className="btn-outline">
          Back to Tickets
        </button>
        <button type="button" onClick={nextStep} className="btn-primary">
          Continue to Payment
        </button>
      </div>

      {/* Edit Attendee Modal */}
      {showEditModal && currentEditAttendee && (
        <AttendeeEditModal
          attendeeType={currentEditAttendee.type}
          attendeeIndex={currentEditAttendee.index}
          formState={formState}
          onClose={handleCloseModal}
          // Pass the context functions down
          updateMasonField={updateMasonField}
          updateGuestField={updateGuestField}
          updateLadyPartnerField={updateLadyPartnerField}
          updateGuestPartnerField={updateGuestPartnerField}
          toggleSameLodge={toggleSameLodge}
          toggleHasLadyPartner={toggleHasLadyPartner}
          toggleGuestHasPartner={toggleGuestHasPartner}
        />
      )}
    </div>
  );
};

export default OrderSummarySection;
