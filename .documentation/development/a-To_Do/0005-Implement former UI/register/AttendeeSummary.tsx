import React from 'react';
import { MasonData, GuestData, LadyPartnerData, GuestPartnerData } from '../../shared/types/register';
import { User, Users, UserCheck, Trash2 } from 'lucide-react'; // Add Trash2 icon

interface AttendeeSummaryProps {
  masons: MasonData[];
  guests: GuestData[];
  ladyPartners: LadyPartnerData[];
  guestPartners: GuestPartnerData[];
  // Add functions for removal
  removeMasonByIndex: (index: number) => void;
  removeGuestByIndex: (index: number) => void;
  toggleHasLadyPartner: (masonIndex: number, checked: boolean) => void;
  toggleGuestHasPartner: (guestIndex: number, checked: boolean) => void;
}

// Define a unified attendee type for easier mapping
type UnifiedAttendee = {
  id: string;
  type: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner';
  data: MasonData | GuestData | LadyPartnerData | GuestPartnerData;
  originalIndex: number; // Original index within its type array (e.g., index in masons array)
  masonIndex?: number; // For partners, the index of the associated mason
  guestIndex?: number; // For partners, the index of the associated guest
};

const AttendeeSummary: React.FC<AttendeeSummaryProps> = ({
  masons,
  guests,
  ladyPartners,
  guestPartners,
  removeMasonByIndex,
  removeGuestByIndex,
  toggleHasLadyPartner,
  toggleGuestHasPartner
}) => {

  // Create the unified list in the desired order
  const unifiedAttendees: UnifiedAttendee[] = [];
  masons.forEach((mason, index) => {
    unifiedAttendees.push({ id: mason.id, type: 'mason', data: mason, originalIndex: index });
    const partner = ladyPartners.find(lp => lp.masonIndex === index);
    if (partner) {
      unifiedAttendees.push({ id: partner.id, type: 'ladyPartner', data: partner, originalIndex: ladyPartners.indexOf(partner), masonIndex: index });
    }
  });
  guests.forEach((guest, index) => {
    unifiedAttendees.push({ id: guest.id, type: 'guest', data: guest, originalIndex: index });
    const partner = guestPartners.find(gp => gp.guestIndex === index);
    if (partner) {
      unifiedAttendees.push({ id: partner.id, type: 'guestPartner', data: partner, originalIndex: guestPartners.indexOf(partner), guestIndex: index });
    }
  });

  const totalAttendees = unifiedAttendees.length;

  if (totalAttendees === 0) {
    return null;
  }

  const getAttendeeDisplay = (attendee: UnifiedAttendee): string => {
    const data = attendee.data;
    const hasName = data.firstName && data.lastName;
    
    switch (attendee.type) {
      case 'mason': {
        const masonData = data as MasonData;
        let rankDisplay = '';
        if (masonData.rank === 'GL' && masonData.grandRank) {
          rankDisplay = masonData.grandRank;
        } else if (masonData.rank && masonData.rank !== 'GL') {
          rankDisplay = masonData.rank;
        }
        return hasName 
          ? `${masonData.title} ${masonData.firstName} ${masonData.lastName}${rankDisplay ? ` ${rankDisplay}` : ''}` 
          : `Mason ${attendee.originalIndex + 1}`;
      }
      case 'ladyPartner': {
        const lpData = data as LadyPartnerData;
        return hasName 
          ? `${lpData.title} ${lpData.firstName} ${lpData.lastName}` 
          : `Lady/Partner ${attendee.originalIndex + 1}`;
      }
      case 'guest': {
        const guestData = data as GuestData;
        return hasName 
          ? `${guestData.title} ${guestData.firstName} ${guestData.lastName}` 
          : `Guest ${attendee.originalIndex + 1}`;
      }
      case 'guestPartner': {
        const gpData = data as GuestPartnerData;
        return hasName 
          ? `${gpData.title} ${gpData.firstName} ${gpData.lastName}` 
          : `Guest Partner ${attendee.originalIndex + 1}`;
      }
      default: {
        return 'Unknown Attendee';
      }
    }
  };

  const getAttendeeIcon = (type: UnifiedAttendee['type']) => {
    switch (type) {
      case 'mason': return <User className="w-5 h-5 mr-3 text-primary flex-shrink-0" />;
      case 'ladyPartner': return <UserCheck className="w-5 h-5 mr-3 text-pink-500 flex-shrink-0" />;
      case 'guest': return <Users className="w-5 h-5 mr-3 text-indigo-500 flex-shrink-0" />;
      case 'guestPartner': return <Users className="w-5 h-5 mr-3 text-pink-500 flex-shrink-0" />;
      default: return null;
    }
  };

  const handleRemove = (attendee: UnifiedAttendee) => {
    if (attendee.type === 'mason' && attendee.originalIndex > 0) {
      removeMasonByIndex(attendee.originalIndex);
    } else if (attendee.type === 'guest') {
      removeGuestByIndex(attendee.originalIndex);
    } else if (attendee.type === 'ladyPartner' && attendee.masonIndex !== undefined) {
      toggleHasLadyPartner(attendee.masonIndex, false);
    } else if (attendee.type === 'guestPartner' && attendee.guestIndex !== undefined) {
      toggleGuestHasPartner(attendee.guestIndex, false);
    }
  };

  return (
    <div className="bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold mb-3 text-slate-800 border-b pb-2">Attendee Summary</h3>
      <ul className="space-y-2">
        {unifiedAttendees.map((attendee) => {
          const isPrimaryMason = attendee.type === 'mason' && attendee.originalIndex === 0;
          return (
            <li key={attendee.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
              <div className="flex items-center min-w-0 mr-2">
                {getAttendeeIcon(attendee.type)}
                <span className="text-slate-700 truncate" title={getAttendeeDisplay(attendee)}>
                  {getAttendeeDisplay(attendee)}
                </span>
              </div>
              {!isPrimaryMason && (
                <button 
                  type="button" 
                  onClick={() => handleRemove(attendee)}
                  className="text-red-500 hover:text-red-700 flex-shrink-0 p-1 -mr-1 rounded-full hover:bg-red-100 transition-colors"
                  aria-label={`Remove ${getAttendeeDisplay(attendee)}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <div className="border-t border-slate-200 pt-3 mt-3 text-right">
          <span className="font-semibold text-sm text-slate-800">Total Attendees: {totalAttendees}</span>
      </div>
    </div>
  );
};

export default AttendeeSummary;