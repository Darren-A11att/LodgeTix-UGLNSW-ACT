import React, { useRef } from 'react';
import { CheckCircle, PrinterIcon } from 'lucide-react';
import { 
  FormState, 
  MasonData, 
  GuestData, 
  LadyPartnerData, 
  GuestPartnerData,
  TicketType
} from '../../shared/types/register';
import { events } from '../../shared/data/events';

interface ConfirmationSectionProps {
  formState: FormState;
  selectedTicketData: TicketType | undefined;
}

const ConfirmationSection: React.FC<ConfirmationSectionProps> = ({ 
  formState, 
  selectedTicketData 
}) => {
  const orderNumber = `GI-2025-${Math.floor(10000 + Math.random() * 90000)}`;
  const primaryMason = formState.masons[0];
  const printRef = useRef<HTMLDivElement>(null);
  
  // Helper function to get ticket name
  const getTicketName = (ticketId: string | undefined): string => {
    if (!ticketId) return 'No ticket';
    if (ticketId === 'full') return 'Full Package';
    if (ticketId === 'ceremony') return 'Ceremony Only';
    if (ticketId === 'social') return 'Social Events';
    
    // Check if it's an individual event
    const event = events.find(e => e.id === ticketId);
    return event ? event.title : ticketId;
  };

  // Generate summary of tickets
  const generateTicketSummary = () => {
    // If using uniform ticketing, return a simple summary
    if (formState.useUniformTicketing) {
      const ticketName = selectedTicketData?.name ?? getTicketName(formState.selectedTicket);
      const attendeeCount = formState.masons.length + formState.ladyPartners.length + 
                           formState.guests.length + formState.guestPartners.length;
      
      return `${attendeeCount} × ${ticketName}`;
    }
    
    // For individual tickets, count by type
    const ticketCounts: { [key: string]: number } = {};
    
    // Count tickets by ID
    formState.masons.forEach((mason: MasonData) => {
      const ticketId = mason.ticket?.ticketId ?? '';
      if (ticketId) {
        ticketCounts[ticketId] = (ticketCounts[ticketId] || 0) + 1;
      }
    });
    
    formState.ladyPartners.forEach((partner: LadyPartnerData) => {
      const ticketId = partner.ticket?.ticketId ?? '';
      if (ticketId) {
        ticketCounts[ticketId] = (ticketCounts[ticketId] || 0) + 1;
      }
    });
    
    formState.guests.forEach((guest: GuestData) => {
      const ticketId = guest.ticket?.ticketId ?? '';
      if (ticketId) {
        ticketCounts[ticketId] = (ticketCounts[ticketId] || 0) + 1;
      }
    });
    
    formState.guestPartners.forEach((partner: GuestPartnerData) => {
      const ticketId = partner.ticket?.ticketId ?? '';
      if (ticketId) {
        ticketCounts[ticketId] = (ticketCounts[ticketId] || 0) + 1;
      }
    });
    
    // Generate text summary
    return Object.entries(ticketCounts)
      .map(([ticketId, count]) => {
        const ticketName = getTicketName(ticketId);
        return `${count} × ${ticketName}`;
      })
      .join(', ');
  };
  
  const ticketSummary = generateTicketSummary();
  
  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Generate a list of all attendees in the proper order
  const getOrderedAttendeeList = () => {
    const orderedList: AttendeeListItem[] = [];
    
    // 1. Primary Mason
    if (formState.masons.length > 0) {
      const primaryMason = formState.masons[0];
      orderedList.push({
        type: 'mason',
        name: `${primaryMason.title} ${primaryMason.firstName} ${primaryMason.lastName}`,
        details: primaryMason
      });
      
      // 2. Primary Mason's Lady/Partner (if any)
      const primaryLadyPartner = formState.ladyPartners.find((lp: LadyPartnerData) => lp.masonIndex === 0);
      if (primaryLadyPartner) {
        orderedList.push({
          type: 'ladyPartner',
          name: `${primaryLadyPartner.title} ${primaryLadyPartner.firstName} ${primaryLadyPartner.lastName}`,
          details: primaryLadyPartner,
          relationshipInfo: {
            type: 'mason',
            index: 0,
            relationship: primaryLadyPartner.relationship
          }
        });
      }
    }
    
    // 3. Additional Masons and their Lady/Partners
    for (let i = 1; i < formState.masons.length; i++) {
      const mason = formState.masons[i];
      orderedList.push({
        type: 'mason',
        name: `${mason.title} ${mason.firstName} ${mason.lastName}`,
        details: mason
      });
      
      // Add Lady/Partner if exists
      const ladyPartner = formState.ladyPartners.find((lp: LadyPartnerData) => lp.masonIndex === i);
      if (ladyPartner) {
        orderedList.push({
          type: 'ladyPartner',
          name: `${ladyPartner.title} ${ladyPartner.firstName} ${ladyPartner.lastName}`,
          details: ladyPartner,
          relationshipInfo: {
            type: 'mason',
            index: i,
            relationship: ladyPartner.relationship
          }
        });
      }
    }
    
    // 4. Guests
    for (let i = 0; i < formState.guests.length; i++) {
      const guest = formState.guests[i];
      orderedList.push({
        type: 'guest',
        name: `${guest.title} ${guest.firstName} ${guest.lastName}`,
        details: guest
      });
      
      // Add Guest Partner if exists
      const guestPartner = formState.guestPartners.find((gp: GuestPartnerData) => gp.guestIndex === i);
      if (guestPartner) {
        orderedList.push({
          type: 'guestPartner',
          name: `${guestPartner.title} ${guestPartner.firstName} ${guestPartner.lastName}`,
          details: guestPartner,
          relationshipInfo: {
            type: 'guest',
            index: i,
            relationship: guestPartner.relationship
          }
        });
      }
    }
    
    return orderedList;
  };
  
  // Define type for items in orderedAttendeeList
  type AttendeeListItem = {
    type: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner';
    name: string;
    details: MasonData | LadyPartnerData | GuestData | GuestPartnerData;
    relationshipInfo?: {
      type: 'mason' | 'guest';
      index: number;
      relationship: string;
    };
  };
  
  // Get Mason Grand Lodge display info
  const getMasonLodgeInfo = (mason: MasonData) => {
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
  
  // Get relationship info display
  const getRelationshipInfo = (relationshipInfo: AttendeeListItem['relationshipInfo']) => {
    if (!relationshipInfo) return null;
    
    if (relationshipInfo.type === 'mason') {
      const relatedMason = formState.masons[relationshipInfo.index];
      return `${relationshipInfo.relationship} of ${relatedMason.title} ${relatedMason.firstName} ${relatedMason.lastName}`;
    } else if (relationshipInfo.type === 'guest') {
      const relatedGuest = formState.guests[relationshipInfo.index];
      return `${relationshipInfo.relationship} of ${relatedGuest.title} ${relatedGuest.firstName} ${relatedGuest.lastName}`;
    }
    
    return null;
  };

  // Get contact details for display
  const getContactInfo = (attendee: AttendeeListItem['details']) => {
    if (!attendee) return '';
    
    if (attendee.contactPreference === 'Directly') {
      if ('phone' in attendee && attendee.phone && 'email' in attendee && attendee.email) {
        return `${attendee.email} | ${attendee.phone.startsWith('61') ? '0' + attendee.phone.substring(2) : attendee.phone}`;
      } else {
        return 'Contact details incomplete';
      }
    } else if (attendee.contactPreference === 'Primary Attendee') {
      return 'Contact via Primary Attendee';
    } else if (attendee.contactPreference === 'Provide Later') {
      return 'Contact details to be provided';
    } else if (attendee.contactPreference === 'Mason') {
      return 'Contact via Mason';
    } else if (attendee.contactPreference === 'Guest') {
      return 'Contact via Guest';
    }
    
    return '';
  };
  
  // List of ordered attendees
  const orderedAttendeeList = getOrderedAttendeeList();

  return (
    <div className="text-center print:font-serif print:text-black print:bg-white">
      <div className="mb-6 print:hidden">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Registration Complete!</h2>
        <p className="text-slate-700">
          Thank you for registering for the Grand Installation 2025.
        </p>
      </div>
 
      <div className="bg-slate-50 p-6 rounded-lg mb-4 max-w-lg mx-auto">
        <h3 className="font-bold mb-4 text-primary">Registration Details</h3>
        <div className="text-left">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="text-slate-600">Name:</div>
            <div>{primaryMason.firstName} {primaryMason.lastName}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="text-slate-600">Email:</div>
            <div>{primaryMason.email}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="text-slate-600">Tickets:</div>
            <div>{ticketSummary}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="text-slate-600">Attendees:</div>
            <div>
              {formState.masons.length} Masons, 
              {formState.ladyPartners.length > 0 && ` ${formState.ladyPartners.length} Lady & Partners,`} 
              {formState.guests.length > 0 && ` ${formState.guests.length} Guests`}
              {formState.guestPartners && formState.guestPartners.length > 0 && `, ${formState.guestPartners.length} Guest Partners`}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-slate-600">Order #:</div>
            <div>{orderNumber}</div>
          </div>
        </div>
      </div>
      
      {/* Print Button */}
      <div className="mb-6 print:hidden">
        <button 
          type="button" 
          onClick={handlePrint}
          className="btn-outline flex items-center mx-auto print:hidden"
        >
          <PrinterIcon className="h-4 w-4 mr-2" />
          Print Registration Details
        </button>
      </div>
      
      <p className="mb-6 text-slate-700">
        A confirmation email has been sent to <strong>{primaryMason.email}</strong> with all the details.
      </p>
      
      {/* Print-friendly section (hidden on screen, visible when printing) */}
      <div className="hidden print:block" ref={printRef}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Grand Installation 2025 Registration</h1>
          <p className="text-lg mb-1">Registration ID: {orderNumber}</p>
          <p className="text-lg">Date: {new Date().toLocaleDateString()}</p>
        </div>
      
        <div className="space-y-8 mb-8">
          <div className="border-2 border-black p-4 mb-4">
            <h2 className="text-2xl font-bold mb-4 text-center">Attendee Details</h2>
          
            {orderedAttendeeList.map((attendee: AttendeeListItem, index) => (
              <div key={`${attendee.type}-${index}`} className="mb-8 border-b border-gray-300 pb-6 last:border-b-0 last:pb-0">
                {/* Header row with name */}
                <div className="flex items-center">
                  {attendee.type === 'mason' && (
                    <div className="mr-2 w-6 h-6 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 600" className="w-full h-full">
                        <path d="M223.88 61.4L345.1 172.5L296.7 183.5L264.2 156.2L264.6 200.7L217.3 217.7L217.6 262.3L171.1 245.1L170.8 200.5L124.3 183.3L123.8 138.7L91.08 166.1L42.59 155.2L223.88 61.4zM44.77 210.1L87.48 219.7L87.89 268.6L148 288.8L147.6 239.8L188.1 252.2L188.4 301.3L246.9 320.1L247.3 271.9L287.8 284.1L289 332.1L340.4 346.2L341.6 385L360.3 367.5L367 403.4L347.1 426.2L223.7 399.9L-0.44 458.6L43.01 405.7V210.1H44.77z"/>
                      </svg>
                    </div>
                  )}
                  <h3 className="font-bold">
                    {attendee.name} 
                    {attendee.type === 'mason' && (attendee.details as MasonData).rank && ` ${(attendee.details as MasonData).rank}`}
                    {attendee.type === 'mason' && (attendee.details as MasonData).rank === 'GL' && (attendee.details as MasonData).grandRank && ` ${(attendee.details as MasonData).grandRank}`}
                  </h3>
                </div>
                
                {/* Second row with additional info */}
                {attendee.type === 'mason' && (
                  <p className="text-sm mt-1">{getMasonLodgeInfo(attendee.details as MasonData)}</p>
                )}
                
                {(attendee.type === 'ladyPartner' || attendee.type === 'guestPartner') && attendee.relationshipInfo && (
                  <p className="text-sm mt-1">{getRelationshipInfo(attendee.relationshipInfo)}</p>
                )}
                
                {/* Third row with contact info */}
                <p className="text-sm text-gray-600 mt-1">{getContactInfo(attendee.details)}</p>
                
                {/* Additional details */}
                {attendee.details.dietary && (
                  <p className="text-sm mt-2"><span className="font-medium">Dietary Needs:</span> {attendee.details.dietary}</p>
                )}
                
                {('specialNeeds' in attendee.details && attendee.details.specialNeeds) && (
                  <p className="text-sm mt-1"><span className="font-medium">Special Needs:</span> {attendee.details.specialNeeds}</p>
                )}
                
                {/* Ticket information */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {(() => { // IIFE to calculate ticket name
                    let ticketName = 'No ticket selected';
                    if (formState.useUniformTicketing) {
                      ticketName = getTicketName(formState.selectedTicket);
                    } else if (attendee.details.ticket?.ticketId) {
                      ticketName = getTicketName(attendee.details.ticket.ticketId);
                    }
                    return <p className="font-medium">{ticketName}</p>;
                  })()}
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-2 border-black p-4 mb-4">
            <h2 className="text-xl font-bold mb-2 text-center">Payment Summary</h2>
            <div className="flex justify-between font-bold text-lg mb-2">
              <span>Total Paid:</span>
              <span>$350.00</span>
            </div>
            <p className="text-center text-sm">This is your official receipt for the Grand Installation 2025.</p>
          </div>
          
          <div className="text-center text-sm">
            <p className="mb-1">United Grand Lodge of NSW & ACT</p>
            <p>Sydney Masonic Centre, 66 Goulburn St, Sydney NSW 2000</p>
            <p>+61 2 9862 0400 | info@grandinstallation.org.au</p>
          </div>
        </div>
      </div>
      
      <div>
        <p className="font-medium mb-4">What happens next?</p>
        <ol className="text-left max-w-md mx-auto mb-8 space-y-2">
          <li className="flex items-start">
            <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0">1</span>
            <span>You'll receive a detailed confirmation email with your unique registration code.</span>
          </li>
          <li className="flex items-start">
            <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0">2</span>
            <span>One month before the event, you'll receive your official invitation and event details.</span>
          </li>
          <li className="flex items-start">
            <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0">3</span>
            <span>A week before the event, you'll get a final reminder with check-in instructions.</span>
          </li>
        </ol>
      </div>
      
      <button 
        type="button" 
        onClick={() => window.location.href = '/'}
        className="btn-primary print:hidden"
      >
        Return to Homepage
      </button>
    </div>
  );
};

export default ConfirmationSection;