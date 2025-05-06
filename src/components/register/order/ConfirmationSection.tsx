import React, { useRef } from 'react';
import { CheckCircle, PrinterIcon } from 'lucide-react';
import { 
  FormState, 
  // Remove old types
  // MasonData, 
  // GuestData, 
  // LadyPartnerData, 
  // GuestPartnerData,
  // TicketType
} from '../../shared/types/register';
// Import UnifiedAttendeeData
import { AttendeeData as UnifiedAttendeeData } from '../../lib/api/registrations';
// import { events } from '../../shared/data/events'; // Remove this import

// Define the simplified ticket data type expected
interface SimpleTicketData {
  id: string; 
  title: string; 
  day: string; 
  time: string; 
  price: number; 
}

interface ConfirmationSectionProps {
  formState: FormState;
  selectedTicketData: SimpleTicketData | undefined;
}

const ConfirmationSection: React.FC<ConfirmationSectionProps> = ({ 
  formState, 
  selectedTicketData 
}) => {
  const orderNumber = `GI-2025-${Math.floor(10000 + Math.random() * 90000)}`;
  // Get primary mason from the unified attendees array
  const primaryMason = formState.attendees?.find(att => att.attendeeType === 'Mason' && att.isPrimary);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Helper function to get ticket name (needs update based on TicketDefinitions eventually)
  const getTicketName = (ticketDefId: string | undefined): string => {
    if (!ticketDefId) return 'No ticket';
    // Placeholder logic - needs update to use Ticket Definitions
    if (ticketDefId === 'full') return 'Full Package';
    if (ticketDefId === 'ceremony') return 'Ceremony Only';
    if (ticketDefId === 'social') return 'Social Events';
    
    // TODO: Look up actual ticket definition name based on ID
    // Can get this from store or pass down available ticket defs
    return `Ticket ID: ${ticketDefId}`; 
  };

  // Generate summary of tickets using the unified attendees array
  const generateTicketSummary = () => {
    const attendees = formState.attendees || [];
    // If using uniform ticketing, use selectedTicketData
    if (formState.useUniformTicketing) {
      const ticketName = selectedTicketData?.title ?? getTicketName(formState.selectedTicket);
      const attendeeCount = attendees.length;
      return `${attendeeCount} × ${ticketName}`;
    }
    
    // For individual tickets, count by ticketDefinitionId
    const ticketCounts: { [key: string]: number } = {};
    attendees.forEach((attendee) => {
      const ticketDefId = attendee.ticket?.ticketDefinitionId;
      if (ticketDefId) {
        ticketCounts[ticketDefId] = (ticketCounts[ticketDefId] || 0) + 1;
      }
    });
    
    // Generate text summary
    return Object.entries(ticketCounts)
      .map(([ticketDefId, count]) => {
        const ticketName = getTicketName(ticketDefId);
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

  // Define type for items in orderedAttendeeList (using UnifiedAttendeeData)
  type AttendeeListItem = {
    type: UnifiedAttendeeData['attendeeType'];
    name: string;
    details: UnifiedAttendeeData;
    relationshipInfo?: {
      relatedAttendeeName: string;
      relationship: string | null;
    };
  };

  // Generate a list of all attendees in the proper order
  const getOrderedAttendeeList = (): AttendeeListItem[] => {
    const orderedList: AttendeeListItem[] = [];
    const attendees = formState.attendees || [];
    const attendeeMap = new Map(attendees.map(att => [att.attendeeId, att]));

    // Sort: Primary Mason first, then others, keeping partners after their primary
    const sortedAttendees = [...attendees].sort((a, b) => {
      if (a.attendeeType === 'Mason' && a.isPrimary) return -1;
      if (b.attendeeType === 'Mason' && b.isPrimary) return 1;
      if (a.relatedAttendeeId === b.attendeeId) return 1; 
      if (b.relatedAttendeeId === a.attendeeId) return -1;
      return 0; 
    });

    sortedAttendees.forEach(attendee => {
      let relationshipInfo: AttendeeListItem['relationshipInfo'] | undefined = undefined;
      if (attendee.relatedAttendeeId) {
        const related = attendeeMap.get(attendee.relatedAttendeeId);
        if (related) {
          relationshipInfo = {
            relatedAttendeeName: `${related.title || ''} ${related.firstName || ''} ${related.lastName || ''}`.trim(),
            relationship: attendee.relationship
          };
        }
      }
      
      orderedList.push({
        type: attendee.attendeeType,
        name: `${attendee.title || ''} ${attendee.firstName || ''} ${attendee.lastName || ''}`.trim() || attendee.attendeeType,
        details: attendee,
        relationshipInfo: relationshipInfo
      });
    });
    
    return orderedList;
  };
  
  // Update helper to accept UnifiedAttendeeData
  const getMasonLodgeInfo = (mason: UnifiedAttendeeData): string => {
    if (mason.attendeeType !== 'Mason') return ''; // Ensure it's a Mason
    
    // TODO: Need to fetch actual names based on IDs
    if (mason.rank === 'GL' && mason.grandOfficer === 'Current' && mason.grandOffice) {
      return `${mason.grandOffice} of Grand Lodge ID: ${'UNKNOWN'}`; // Placeholder
    }
    return mason.lodgeId
      ? `Lodge ID: ${mason.lodgeId} of Grand Lodge ID: ${'UNKNOWN'}` // Placeholder
      : `Grand Lodge ID: ${'UNKNOWN'}`; // Placeholder
  };
  
  // Update helper to accept UnifiedAttendeeData
  const getContactInfo = (attendee: UnifiedAttendeeData): string => {
    if (!attendee) return '';
    
    if (attendee.contactPreference === 'Directly') {
      const phone = attendee.primaryPhone;
      const email = attendee.primaryEmail;
      if (phone && email) {
        const formattedPhone = phone.startsWith('61') ? '0' + phone.substring(2) : phone;
        return `${email} | ${formattedPhone}`;
      } else {
        return 'Contact details incomplete';
      }
    } else if (attendee.contactPreference === "PrimaryAttendee") {
      return 'Contact via Primary Attendee';
    } else if (attendee.contactPreference === "ProvideLater") {
      return 'Contact details to be provided';
    } else if (attendee.contactPreference === "Mason") {
      return 'Contact via Mason';
    } else if (attendee.contactPreference === "Guest") {
      return 'Contact via Guest';
    }
    
    return '';
  };
  
  // List of ordered attendees
  const orderedAttendeeList = getOrderedAttendeeList();

  // Render check: Ensure primaryMason is not null before accessing properties
  if (!primaryMason) {
    return <div>Error: Primary Mason details not found.</div>; // Or some loading/error state
  }

  return (
    <div className="text-center print:font-serif print:text-black print:bg-white">
      <div className="mb-6 print:hidden">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Registration Complete!</h2>
        <p className="text-slate-700">
          Thank you for registering for the Grand Proclamation 2025.
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
            <div>{primaryMason.primaryEmail}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="text-slate-600">Tickets:</div>
            <div>{ticketSummary}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="text-slate-600">Attendees:</div>
            <div>
              {(() => {
                const counts = (formState.attendees || []).reduce((acc, att) => {
                  acc[att.attendeeType] = (acc[att.attendeeType] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);
                
                const parts: string[] = [];
                if (counts.Mason) parts.push(`${counts.Mason} Mason(s)`);
                if (counts.LadyPartner) parts.push(`${counts.LadyPartner} Lady/Partner(s)`);
                if (counts.Guest) parts.push(`${counts.Guest} Guest(s)`);
                if (counts.GuestPartner) parts.push(`${counts.GuestPartner} Guest Partner(s)`);
                return parts.join(', ');
              })()}
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
        A confirmation email has been sent to <strong>{primaryMason.primaryEmail}</strong> with all the details.
      </p>
      
      {/* Print-friendly section (hidden on screen, visible when printing) */}
      <div className="hidden print:block" ref={printRef}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Grand Proclamation 2025 Registration</h1>
          <p className="text-lg mb-1">Registration ID: {orderNumber}</p>
          <p className="text-lg">Date: {new Date().toLocaleDateString()}</p>
        </div>
      
        <div className="space-y-8 mb-8">
          <div className="border-2 border-black p-4 mb-4">
            <h2 className="text-2xl font-bold mb-4 text-center">Attendee Details</h2>
          
            {orderedAttendeeList.map((attendeeItem: AttendeeListItem, index) => (
              <div key={attendeeItem.details.attendeeId} className="mb-8 border-b border-gray-300 pb-6 last:border-b-0 last:pb-0">
                {/* Header row with name */}
                <div className="flex items-center">
                  {attendeeItem.type === 'Mason' && (
                    <div className="mr-2 w-6 h-6 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 600" className="w-full h-full">
                        <path d="M223.88 61.4L345.1 172.5L296.7 183.5L264.2 156.2L264.6 200.7L217.3 217.7L217.6 262.3L171.1 245.1L170.8 200.5L124.3 183.3L123.8 138.7L91.08 166.1L42.59 155.2L223.88 61.4zM44.77 210.1L87.48 219.7L87.89 268.6L148 288.8L147.6 239.8L188.1 252.2L188.4 301.3L246.9 320.1L247.3 271.9L287.8 284.1L289 332.1L340.4 346.2L341.6 385L360.3 367.5L367 403.4L347.1 426.2L223.7 399.9L-0.44 458.6L43.01 405.7V210.1H44.77z"/>
                      </svg>
                    </div>
                  )}
                  <h3 className="font-bold">
                    {attendeeItem.name} 
                    {attendeeItem.type === 'Mason' && attendeeItem.details.rank && ` ${attendeeItem.details.rank}`}
                    {attendeeItem.type === 'Mason' && attendeeItem.details.rank === 'GL' && attendeeItem.details.grandRank && ` ${attendeeItem.details.grandRank}`}
                  </h3>
                </div>
                
                {/* Second row with additional info */}
                {attendeeItem.type === 'Mason' && (
                  <p className="text-sm mt-1">{getMasonLodgeInfo(attendeeItem.details)}</p>
                )}
                
                {attendeeItem.relationshipInfo && (
                  <p className="text-sm mt-1">{`${attendeeItem.relationshipInfo.relationship || 'Partner'} of ${attendeeItem.relationshipInfo.relatedAttendeeName}`}</p>
                )}
                
                {/* Third row with contact info */}
                <p className="text-sm text-gray-600 mt-1">{getContactInfo(attendeeItem.details)}</p>
                
                {/* Additional details */}
                {attendeeItem.details.dietaryRequirements && (
                  <p className="text-sm mt-2"><span className="font-medium">Dietary Needs:</span> {attendeeItem.details.dietaryRequirements}</p>
                )}
                
                {attendeeItem.details.specialNeeds && (
                  <p className="text-sm mt-1"><span className="font-medium">Special Needs:</span> {attendeeItem.details.specialNeeds}</p>
                )}
                
                {/* Ticket information */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {(() => { 
                    let ticketName = 'No ticket selected';
                    if (formState.useUniformTicketing) {
                      ticketName = selectedTicketData?.title ?? getTicketName(formState.selectedTicket);
                    } else if (attendeeItem.details.ticket?.ticketDefinitionId) {
                      ticketName = getTicketName(attendeeItem.details.ticket.ticketDefinitionId);
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
            <p className="text-center text-sm">This is your official receipt for the Grand Proclamation 2025.</p>
          </div>
          
          <div className="text-center text-sm">
            <p className="mb-1">United Grand Lodge of NSW & ACT</p>
            <p>Sydney Masonic Centre, 66 Goulburn St, Sydney NSW 2000</p>
            <p>+61 2 9862 0400 | info@grandProclamation.org.au</p>
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