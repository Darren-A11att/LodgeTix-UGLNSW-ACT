import React, { useState } from 'react';
import { FormState } from '../../context/RegisterFormContext';
import { TicketType } from '../../shared/types/register';
import { events } from '../../shared/data/events';
import { Edit2 } from 'lucide-react';
import AttendeeEditModal from './AttendeeEditModal';

interface OrderSummarySectionProps {
  formState: FormState;
  selectedTicketData: TicketType | undefined;
  nextStep: () => void;
  prevStep: () => void;
}

const OrderSummarySection: React.FC<OrderSummarySectionProps> = ({
  formState,
  selectedTicketData,
  nextStep,
  prevStep
}) => {
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [currentEditAttendee, setCurrentEditAttendee] = useState<{
    type: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner';
    index: number;
  } | null>(null);

  // Define standard ticket packages
  const ticketPackages: TicketType[] = [
    {
      id: 'full',
      name: 'Full Package',
      description: 'Access to all events throughout the weekend',
      price: 350,
      includes: [
        'Welcome Reception (Friday)',
        'Installation Ceremony (Saturday)',
        'Gala Dinner (Saturday)',
        'Thanksgiving Service (Sunday)',
        'Farewell Lunch (Sunday)',
        'Commemorative Gift Package'
      ]
    },
    {
      id: 'ceremony',
      name: 'Ceremony Only',
      description: 'Access to the main installation ceremony only',
      price: 150,
      includes: [
        'Installation Ceremony (Saturday)',
        'Commemorative Program'
      ]
    },
    {
      id: 'social',
      name: 'Social Events',
      description: 'Access to all social events (no ceremony)',
      price: 250,
      includes: [
        'Welcome Reception (Friday)',
        'Gala Dinner (Saturday)',
        'Farewell Lunch (Sunday)'
      ]
    }
  ];

  // Helper to get friendly ticket name
  const getTicketName = (ticketId: string | undefined): string => {
    if (!ticketId) return '';
    
    if (ticketId === 'full') return 'Full Package';
    if (ticketId === 'ceremony') return 'Ceremony Only';
    if (ticketId === 'social') return 'Social Events';
    
    // If it's an individual event
    const event = events.find(e => e.id === ticketId);
    return event ? event.title : '';
  };

  // Helper to get ticket price by ID
  const getTicketPrice = (ticketId: string | undefined): number => {
    if (!ticketId) return 0;
    
    const ticketPackagePrices: {[key: string]: number} = {
      'full': 350,
      'ceremony': 150,
      'social': 250
    };
    
    // First check if it's a package
    if (ticketId in ticketPackagePrices) {
      return ticketPackagePrices[ticketId];
    }
    
    // Otherwise check if it's an individual event
    const event = events.find(e => e.id === ticketId);
    return event?.price || 0;
  };

  // Get package details for display
  const getPackageDetails = (ticketId: string | undefined) => {
    if (!ticketId || !['full', 'ceremony', 'social'].includes(ticketId)) return [];
    
    const ticket = ticketPackages.find(t => t.id === ticketId);
    return ticket ? ticket.includes : [];
  };

  // Find event details by ID
  const getEventById = (eventId: string) => {
    return events.find(e => e.id === eventId);
  };

  // Check if an event is included in a package
  const isEventIncludedInPackage = (eventId: string, packageId: string): boolean => {
    // Map package IDs to the events they include
    const packageEvents: {[key: string]: string[]} = {
      'full': ['welcome-reception', 'grand-installation-ceremony', 'gala-dinner', 'thanksgiving-service', 'farewell-lunch'],
      'ceremony': ['grand-installation-ceremony'],
      'social': ['welcome-reception', 'gala-dinner', 'farewell-lunch']
    };

    return packageEvents[packageId]?.includes(eventId) || false;
  };

  // Generate attendee entries in the required order
  const generateOrderedAttendeeEntries = () => {
    const orderedEntries = [];
    
    // 1. Mason - Primary Attendee
    if (formState.masons.length > 0) {
      const primaryMason = formState.masons[0];
      if (primaryMason.firstName) {
        orderedEntries.push({
          type: 'mason' as const,
          attendee: primaryMason,
          index: 0,
          ticketId: formState.useUniformTicketing ? formState.selectedTicket : primaryMason.ticket?.ticketId || '',
          relatedInfo: null
        });
      }

      // 2. Lady & Partner of Primary Mason (if exists)
      const primaryLadyPartner = formState.ladyPartners.find(lp => lp.masonIndex === 0);
      if (primaryLadyPartner) {
        orderedEntries.push({
          type: 'ladyPartner' as const,
          attendee: primaryLadyPartner,
          index: formState.ladyPartners.findIndex(lp => lp.masonIndex === 0),
          ticketId: formState.useUniformTicketing ? formState.selectedTicket : primaryLadyPartner.ticket?.ticketId || '',
          relatedInfo: {
            masonIndex: 0,
            relationship: primaryLadyPartner.relationship
          }
        });
      }
    }

    // 3. Additional Mason Attendees and their Lady/Partners
    for (let i = 1; i < formState.masons.length; i++) {
      const mason = formState.masons[i];
      if (mason.firstName) {
        orderedEntries.push({
          type: 'mason' as const,
          attendee: mason,
          index: i,
          ticketId: formState.useUniformTicketing ? formState.selectedTicket : mason.ticket?.ticketId || '',
          relatedInfo: null
        });

        // Lady & Partner of this additional Mason
        const ladyPartner = formState.ladyPartners.find(lp => lp.masonIndex === i);
        if (ladyPartner) {
          orderedEntries.push({
            type: 'ladyPartner' as const,
            attendee: ladyPartner,
            index: formState.ladyPartners.findIndex(lp => lp.masonIndex === i),
            ticketId: formState.useUniformTicketing ? formState.selectedTicket : ladyPartner.ticket?.ticketId || '',
            relatedInfo: {
              masonIndex: i,
              relationship: ladyPartner.relationship
            }
          });
        }
      }
    }

    // 4. Guest Attendees
    for (let i = 0; i < formState.guests.length; i++) {
      const guest = formState.guests[i];
      if (guest.firstName) {
        orderedEntries.push({
          type: 'guest' as const,
          attendee: guest,
          index: i,
          ticketId: formState.useUniformTicketing ? formState.selectedTicket : guest.ticket?.ticketId || '',
          relatedInfo: null
        });

        // Partner of this Guest
        const guestPartner = formState.guestPartners.find(gp => gp.guestIndex === i);
        if (guestPartner) {
          orderedEntries.push({
            type: 'guestPartner' as const,
            attendee: guestPartner,
            index: formState.guestPartners.findIndex(gp => gp.guestIndex === i),
            ticketId: formState.useUniformTicketing ? formState.selectedTicket : guestPartner.ticket?.ticketId || '',
            relatedInfo: {
              guestIndex: i,
              relationship: guestPartner.relationship
            }
          });
        }
      }
    }
    
    return orderedEntries;
  };

  // Check if an event is included in a package
  const getPackageIncludedEvents = (packageId: string): string[] => {
    // Map package IDs to the events they include
    const packageEvents: {[key: string]: string[]} = {
      'full': ['welcome-reception', 'grand-installation-ceremony', 'gala-dinner', 'thanksgiving-service', 'farewell-lunch'],
      'ceremony': ['grand-installation-ceremony'],
      'social': ['welcome-reception', 'gala-dinner', 'farewell-lunch']
    };

    return packageEvents[packageId] || [];
  };

  // Calculate total price
  const calculateTotalPrice = (): number => {
    const orderedEntries = generateOrderedAttendeeEntries();
    let total = 0;
    
    for (const entry of orderedEntries) {
      const ticketPrice = getTicketPrice(entry.ticketId);
      
      if (entry.ticketId) {
        total += ticketPrice;
      } else if (entry.attendee.ticket?.events && entry.attendee.ticket.events.length > 0) {
        // Sum prices of individual events
        let eventTotal = 0;
        for (const eventId of entry.attendee.ticket.events) {
          const event = events.find(e => e.id === eventId);
          if (event && event.price) {
            eventTotal += event.price;
          }
        }
        total += eventTotal;
      }
    }
    
    return total;
  };

  // Get Mason Grand Lodge display info
  const getMasonLodgeInfo = (mason: any) => {
    if (mason.rank === 'GL' && mason.grandOfficer === 'Current') {
      if (mason.grandOffice === 'Other' && mason.grandOfficeOther) {
        return `${mason.grandOfficeOther} of ${mason.grandLodge}`;
      } else if (mason.grandOffice && mason.grandOffice !== 'Please Select') {
        return `${mason.grandOffice} of ${mason.grandLodge}`;
      }
    }
    
    // Default to lodge info
    return mason.lodge ? `${mason.lodge} of ${mason.grandLodge}` : mason.grandLodge;
  };

  // Get contact details for display
  const getContactInfo = (attendee: any, type: string) => {
    if (!attendee) return '';
    
    if (type === 'mason' || type === 'guest' || type === 'ladyPartner' || type === 'guestPartner') {
      if (attendee.contactPreference === 'Directly' && attendee.phone && attendee.email) {
        // Convert international format (61...) to national format (04...)
        const formattedPhone = attendee.phone.startsWith('61') && attendee.phone.length > 2 && attendee.phone.charAt(2) === '4'
          ? '0' + attendee.phone.substring(2)
          : attendee.phone;
          
        return `${attendee.email} | ${formattedPhone}`;
      } else if (attendee.contactPreference === 'Primary Attendee') {
        return 'Contact via Primary Attendee';
      } else if (attendee.contactPreference === 'Provide Later') {
        return 'Contact details to be provided';
      } else if (type === 'ladyPartner' && attendee.contactPreference === 'Mason') {
        return 'Contact via Mason';
      } else if (type === 'guestPartner' && attendee.contactPreference === 'Guest') {
        return 'Contact via Guest';
      }
    }
    
    return '';
  };

  // Open edit modal for an attendee
  const handleEditAttendee = (e: React.MouseEvent, type: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner', index: number) => {
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

  // Calculate attendee total
  const calculateAttendeeTotal = (ticketId: string | undefined, attendee: any): number => {
    if (ticketId) {
      return getTicketPrice(ticketId);
    } else if (attendee.ticket?.events && attendee.ticket.events.length > 0) {
      // Sum prices of individual events
      let eventTotal = 0;
      for (const eventId of attendee.ticket.events) {
        const event = events.find(e => e.id === eventId);
        if (event && event.price) {
          eventTotal += event.price;
        }
      }
      return eventTotal;
    }
    return 0;
  };

  const totalPrice = calculateTotalPrice();
  const orderedEntries = generateOrderedAttendeeEntries();
  const primaryMason = formState.masons[0];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

      {/* Order Summary Content */}
      <div className="space-y-8 mb-8">
        {orderedEntries.map((entry, listIndex) => {
          const attendeeId = `${entry.type}-${entry.index}`;
          const ticketName = getTicketName(entry.ticketId);
          const attendeeTotal = calculateAttendeeTotal(entry.ticketId, entry.attendee);
          
          // Skip if no ticket or price
          if (!ticketName && attendeeTotal === 0) return null;
          
          // Get the proper heading based on attendee type
          let attendeeHeading = '';
          let secondRow = '';
          let thirdRow = '';
          
          if (entry.type === 'mason') {
            // Mason heading: [Masonic Title] [First Name] [Last Name] [Rank / Grand Rank]
            const mason = entry.attendee;
            attendeeHeading = `${mason.title} ${mason.firstName} ${mason.lastName} ${mason.rank === 'GL' ? mason.grandRank : mason.rank}`;
            secondRow = getMasonLodgeInfo(mason);
            thirdRow = getContactInfo(mason, entry.type);
          } else if (entry.type === 'guest') {
            // Guest heading: [Title] [First Name] [Last Name]
            const guest = entry.attendee;
            attendeeHeading = `${guest.title} ${guest.firstName} ${guest.lastName}`;
            // Add "Guest of Primary Mason" line
            secondRow = `Guest of ${primaryMason.title} ${primaryMason.firstName} ${primaryMason.lastName}`;
            thirdRow = getContactInfo(guest, entry.type);
          } else if (entry.type === 'ladyPartner') {
            // Lady & Partner heading: [Title] [First Name] [Last Name]
            const partner = entry.attendee;
            const relatedMason = formState.masons[partner.masonIndex];
            attendeeHeading = `${partner.title} ${partner.firstName} ${partner.lastName}`;
            secondRow = `${partner.relationship} of ${relatedMason.title} ${relatedMason.firstName} ${relatedMason.lastName}`;
            thirdRow = getContactInfo(partner, entry.type);
          } else if (entry.type === 'guestPartner') {
            // Guest Partner heading: [Title] [First Name] [Last Name]
            const partner = entry.attendee;
            const relatedGuest = formState.guests[partner.guestIndex];
            attendeeHeading = `${partner.title} ${partner.firstName} ${partner.lastName}`;
            secondRow = `${partner.relationship} of ${relatedGuest.title} ${relatedGuest.firstName} ${relatedGuest.lastName}`;
            thirdRow = getContactInfo(partner, entry.type);
          }
          
          return (
            <div 
              key={attendeeId} 
              className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm order-summary-table"
            >
              {/* Attendee Header */}
              <div className="bg-primary/10 p-4 border-b border-slate-200">
                <div className="flex justify-between">
                  <h3 className="font-bold text-primary flex items-center">
                    {entry.type === 'mason' && (
                      <div className="mr-2 w-6 h-6 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 600" className="w-full h-full" fill="currentColor">
                          <path d="M223.88 61.4L345.1 172.5L296.7 183.5L264.2 156.2L264.6 200.7L217.3 217.7L217.6 262.3L171.1 245.1L170.8 200.5L124.3 183.3L123.8 138.7L91.08 166.1L42.59 155.2L223.88 61.4zM44.77 210.1L87.48 219.7L87.89 268.6L148 288.8L147.6 239.8L188.1 252.2L188.4 301.3L246.9 320.1L247.3 271.9L287.8 284.1L289 332.1L340.4 346.2L341.6 385L360.3 367.5L367 403.4L347.1 426.2L223.7 399.9L-0.44 458.6L43.01 405.7V210.1H44.77z"/>
                        </svg>
                      </div>
                    )}
                    {attendeeHeading}
                  </h3>
                  <button
                    onClick={(e) => handleEditAttendee(e, entry.type, entry.index)}
                    className="text-primary hover:text-primary/80 p-1"
                    aria-label="Edit attendee"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                {secondRow && (
                  <p className="text-sm text-slate-700">{secondRow}</p>
                )}
                {thirdRow && (
                  <p className="text-sm text-slate-600">{thirdRow}</p>
                )}
              </div>
              
              {/* Package or Event Table - always shown (not collapsible) */}
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
                    {/* If it's a package ticket, display package info */}
                    {entry.ticketId && ['full', 'ceremony', 'social'].includes(entry.ticketId) ? (
                      <>
                        <tr>
                          <td colSpan={5} className="p-4 font-medium text-slate-800 border-b border-slate-200">
                            {ticketName} Package
                          </td>
                        </tr>
                        
                        {/* Events included in the package */}
                        {events.map(event => {
                          // Only show events that are included in the package
                          if (isEventIncludedInPackage(event.id, entry.ticketId)) {
                            return (
                              <tr key={event.id} className="border-b border-slate-100 last:border-b-0">
                                <td className="p-4 pl-8 text-slate-700">
                                  {event.title} <span className="italic text-slate-500">(Included)</span>
                                </td>
                                <td className="p-4 text-slate-700">{event.day}</td>
                                <td className="p-4 text-slate-700">{event.time}</td>
                                <td className="p-4 text-slate-700">{event.location}</td>
                                <td className="p-4 text-right text-slate-700">
                                  <span className="italic">Included</span>
                                </td>
                              </tr>
                            );
                          }
                          return null;
                        })}
                      </>
                    ) : (
                      <>
                        {/* For individual event selections */}
                        {Array.isArray(entry.attendee.ticket?.events) && entry.attendee.ticket?.events.length > 0 ? (
                          // For custom event selection
                          entry.attendee.ticket.events.map((eventId: string) => {
                            const event = getEventById(eventId);
                            
                            if (!event) return null;
                            
                            return (
                              <tr key={event.id} className="border-b border-slate-100 last:border-b-0">
                                <td className="p-4 text-slate-700">
                                  {event.title}
                                </td>
                                <td className="p-4 text-slate-700">{event.day}</td>
                                <td className="p-4 text-slate-700">{event.time}</td>
                                <td className="p-4 text-slate-700">{event.location}</td>
                                <td className="p-4 text-right text-slate-700">
                                  ${event.price || 0}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          // If no events or tickets selected, display nothing
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-500">
                              No events selected
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                    
                    {/* Attendee Total - Only show if there's a ticket or events */}
                    {(entry.ticketId || (entry.attendee.ticket?.events && entry.attendee.ticket.events.length > 0)) && (
                      <tr className="bg-slate-50 font-medium">
                        <td colSpan={4} className="p-4 text-right border-t border-slate-200">
                          Attendee Total:
                        </td>
                        <td className="p-4 text-right border-t border-slate-200">
                          ${attendeeTotal}
                        </td>
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
            <span className="text-xl font-bold text-primary">${totalPrice}</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button 
          type="button" 
          onClick={prevStep}
          className="btn-outline"
        >
          Back to Tickets
        </button>
        <button 
          type="button" 
          onClick={nextStep}
          className="btn-primary"
        >
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
        />
      )}
    </div>
  );
};

export default OrderSummarySection;