import React from 'react';
import { User, Users } from 'lucide-react';
import { MasonData, LadyPartnerData, GuestData, GuestPartnerData } from '../../../shared/types/register';
import { AttendeeData as UnifiedAttendeeData } from '../../../lib/api/registrations';

interface AttendeeType {
  type: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner';
  index: number | string; // Can be numeric index (old format) or attendeeId string (new format)
  id?: string; // The attendeeId field when using new format
  name: string;
  title: string;
  data: MasonData | LadyPartnerData | GuestData | GuestPartnerData | UnifiedAttendeeData;
  relatedTo?: string;
}

interface AttendeeTicketItemProps {
  attendee: AttendeeType;
  isExpanded: boolean;
  selectedTicketId: string;
  ticketPrice: number;
  hasCustomEvents: boolean;
  onToggleExpand: () => void;
  children?: React.ReactNode;
}

const AttendeeTicketItem: React.FC<AttendeeTicketItemProps> = ({
  attendee,
  isExpanded,
  selectedTicketId,
  ticketPrice,
  hasCustomEvents,
  onToggleExpand,
  children
}) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Attendee header */}
      <div 
        className={`flex justify-between items-center p-4 cursor-pointer ${
          isExpanded ? 'bg-primary/10' : 'bg-slate-50'
        }`}
        onClick={onToggleExpand}
      >
        <div className="flex items-center">
          {attendee.type === 'mason' || attendee.type === 'guest' 
            ? <User className="w-5 h-5 text-primary mr-2" />
            : <Users className="w-5 h-5 text-primary mr-2" />
          }
          <div>
            <div className="font-medium">{attendee.title} {attendee.name}</div>
            {attendee.relatedTo && (
              <div className="text-xs text-slate-500">{attendee.relatedTo}</div>
            )}
          </div>
        </div>
        
        <div className="flex items-center">
          {selectedTicketId ? (
            <div className="text-sm text-slate-700 mr-2">
              {selectedTicketId === 'full' ? 'Full Package' : 
               selectedTicketId === 'ceremony' ? 'Ceremony Only' :
               selectedTicketId === 'social' ? 'Social Events' : 'Custom Selection'}
              <span className="ml-2 font-bold text-primary">
                ${ticketPrice || 0}
              </span>
            </div>
          ) : hasCustomEvents ? (
            <div className="text-sm text-slate-700 mr-2">
              Custom Events
            </div>
          ) : (
            <div className="text-sm text-red-500 mr-2">No ticket selected</div>
          )}
          
          <svg className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 border-t border-slate-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default AttendeeTicketItem;