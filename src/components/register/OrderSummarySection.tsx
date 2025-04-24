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
    return event ? event.title : "";
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
    attendee: AttendeeData,
  ): number => {
    if (ticketId) {
      return ticketUtils.getTicketPrice(ticketId);
    } else if (attendee.ticket?.events && attendee.ticket.events.length > 0) {
      // Sum prices of individual events
      let eventTotal = 0;
      for (const eventId of attendee.ticket.events) {
        const event = events.find((e) => e.id === eventId);
        if (event?.price) {
          eventTotal += event.price;
        }
      }
      return eventTotal;
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
    attendee: AttendeeData,
    type: string,
  ) => {
    if (!attendee) return "";

    if (
      type === "mason" ||
      type === "guest" ||
      type === "ladyPartner" ||
      type === "guestPartner"
    ) {
      if (
        attendee.contactPreference === "Directly" &&
        attendee.phone &&
        attendee.email
      ) {
        // Convert international format (61...) to national format (04...)
        const formattedPhone =
          attendee.phone.startsWith("61") &&
          attendee.phone.length > 2 &&
          attendee.phone.charAt(2) === "4"
            ? "0" + attendee.phone.substring(2)
            : attendee.phone;

        return `${attendee.email} | ${formattedPhone}`;
      } else if (attendee.contactPreference === "Primary Attendee") {
        return "Contact via Primary Attendee";
      } else if (attendee.contactPreference === "Provide Later") {
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

    return "";
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
        return <EventItemRow key={event.id} event={event} isIncluded={true} />;
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
        return <EventItemRow key={eventId} event={event} />;
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
    attendee: AttendeeData,
    index: number,
    formStateInstance: FormState,
    relatedInfo: {
      masonIndex?: number;
      guestIndex?: number;
      relationship?: string;
    } | null = null,
  ): OrderedAttendeeEntry | null => {
    // Skip if attendee data seems incomplete (e.g., missing firstName)
    // We need to cast here as AttendeeData is a union
    if (!(attendee as MasonData | LadyPartnerData | GuestData | GuestPartnerData).firstName) return null; 

    const ticketId = getTicketIdForAttendee(attendee, formStateInstance);

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

    // 1. Primary Mason
    const primaryMason = formState.masons[0];
    if (primaryMason) {
      const masonEntry = createAttendeeEntry(
        "mason",
        primaryMason,
        0,
        formState,
      );
      if (masonEntry) orderedEntries.push(masonEntry);

      // 2. Primary Lady & Partner
      const primaryLadyPartnerIndex = formState.ladyPartners.findIndex(
        (lp) => lp.masonIndex === 0,
      );
      if (primaryLadyPartnerIndex !== -1) {
        const partner = formState.ladyPartners[primaryLadyPartnerIndex];
        const partnerEntry = createAttendeeEntry(
          "ladyPartner",
          partner,
          primaryLadyPartnerIndex,
          formState,
          { masonIndex: 0, relationship: partner.relationship },
        );
        if (partnerEntry) orderedEntries.push(partnerEntry);
      }
    }

    // 3. Additional Masons and their Partners
    formState.masons.slice(1).forEach((mason, relativeIndex) => {
      const actualIndex = relativeIndex + 1;
      const masonEntry = createAttendeeEntry(
        "mason",
        mason,
        actualIndex,
        formState,
      );
      if (masonEntry) orderedEntries.push(masonEntry);

      const ladyPartnerIndex = formState.ladyPartners.findIndex(
        (lp) => lp.masonIndex === actualIndex,
      );
      if (ladyPartnerIndex !== -1) {
        const partner = formState.ladyPartners[ladyPartnerIndex];
        const partnerEntry = createAttendeeEntry(
          "ladyPartner",
          partner,
          ladyPartnerIndex,
          formState,
          { masonIndex: actualIndex, relationship: partner.relationship },
        );
        if (partnerEntry) orderedEntries.push(partnerEntry);
      }
    });

    // 4. Guests and their Partners
    formState.guests.forEach((guest, index) => {
      const guestEntry = createAttendeeEntry("guest", guest, index, formState);
      if (guestEntry) orderedEntries.push(guestEntry);

      const guestPartnerIndex = formState.guestPartners.findIndex(
        (gp) => gp.guestIndex === index,
      );
      if (guestPartnerIndex !== -1) {
        const partner = formState.guestPartners[guestPartnerIndex];
        const partnerEntry = createAttendeeEntry(
          "guestPartner",
          partner,
          guestPartnerIndex,
          formState,
          { guestIndex: index, relationship: partner.relationship },
        );
        if (partnerEntry) orderedEntries.push(partnerEntry);
      }
    });

    // Filter out any null entries and return with proper type
    return orderedEntries.filter((entry): entry is OrderedAttendeeEntry => entry !== null);
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
  const primaryMason = formState.masons[0];

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
            const mason = entry.attendee as MasonData;

            attendeeHeading = `${mason.title} ${mason.firstName} ${mason.lastName} ${
              mason.rank === "GL" && mason.grandRank
                ? mason.grandRank
                : mason.rank && mason.rank !== "GL"
                  ? mason.rank
                  : ""
            }`;

            // Reconstruct secondRow for Lodge Info
            if (entry.index === 0) {
              secondRow = `${mason.lodge || 'Lodge details missing'}${mason.grandLodge ? `, ${mason.grandLodge}` : ''}`;
            } else {
              secondRow = mason.sameLodgeAsPrimary
                ? `${primaryMason.lodge || 'Lodge details missing'}${primaryMason.grandLodge ? `, ${primaryMason.grandLodge}` : ''}`
                : `${mason.lodge || 'Lodge details missing'}${mason.grandLodge ? `, ${mason.grandLodge}` : ''}`;
            }

            // Construct thirdRow with Contact and Needs
            const phoneStr = mason.phone || 'No mobile';
            const emailStr = mason.email || 'No email';
            const dietaryStr = mason.dietary || 'No dietary needs';
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
                      {entry.ticketId && ["full", "ceremony", "social"].includes(entry.ticketId) ? (
                        <PackageEventsTable ticketId={entry.ticketId} ticketName={ticketName} />
                      ) : (
                        <IndividualEventsTable events={entry.attendee.ticket?.events || []} />
                      )}
                      {(entry.ticketId || (entry.attendee.ticket?.events && entry.attendee.ticket.events.length > 0)) && (
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
            const guest = entry.attendee as GuestData;
            attendeeHeading = `${guest.title} ${guest.firstName} ${guest.lastName}`;
            secondRow = `Guest of ${primaryMason.title} ${primaryMason.firstName} ${primaryMason.lastName}`;
            thirdRow = attendeeUtils.getContactInfo(guest, entry.type);
          } else if (entry.type === "ladyPartner") {
            const partner = entry.attendee as LadyPartnerData;
            const relatedMason = formState.masons[partner.masonIndex];
            attendeeHeading = `${partner.title} ${partner.firstName} ${partner.lastName}`;
            secondRow = `${partner.relationship} of ${relatedMason.title} ${relatedMason.firstName} ${relatedMason.lastName}`;
            thirdRow = attendeeUtils.getContactInfo(partner, entry.type);
          } else if (entry.type === "guestPartner") {
            const partner = entry.attendee as GuestPartnerData;
            const relatedGuest = formState.guests[partner.guestIndex];
            attendeeHeading = `${partner.title} ${partner.firstName} ${partner.lastName}`;
            secondRow = `${partner.relationship} of ${relatedGuest.title} ${relatedGuest.firstName} ${relatedGuest.lastName}`;
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
                    {entry.ticketId && ["full", "ceremony", "social"].includes(entry.ticketId) ? (
                      <PackageEventsTable ticketId={entry.ticketId} ticketName={ticketName} />
                    ) : (
                      <IndividualEventsTable events={entry.attendee.ticket?.events || []} />
                    )}
                    {(entry.ticketId || (entry.attendee.ticket?.events && entry.attendee.ticket.events.length > 0)) && (
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
