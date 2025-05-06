import React from 'react';
import { AttendeeData } from '../../../lib/api/registrations';
import { User, Users, UserCheck, Trash2 } from 'lucide-react'; // Add Trash2 icon
import { useRegistrationStore } from '../../../store/registrationStore';
import { UnifiedAttendeeData } from '../../../store/registrationStore';
// Import the context hook
// import { useRegisterForm } from '../../hooks/useRegisterForm';

const AttendeeSummary: React.FC = () => {
  // Access state from the registration store
  const { attendees, removeAttendee } = useRegistrationStore();

  // Create a sorted list that keeps related attendees together
  const sortedAttendees = [...attendees].sort((a, b) => {
    // Primary mason first
    if (a.attendeeType === 'mason' && a.isPrimary) return -1;
    if (b.attendeeType === 'mason' && b.isPrimary) return 1;

    // For partners, always keep them right after their related attendee
    if ((b.attendeeType === 'lady_partner' || b.attendeeType === 'guest_partner') && 
        b.relatedAttendeeId === a.attendeeId) {
      return -1; // a should come before b
    }
    
    if ((a.attendeeType === 'lady_partner' || a.attendeeType === 'guest_partner') && 
        a.relatedAttendeeId === b.attendeeId) {
      return 1; // b should come before a
    }
    
    return (attendees.findIndex(att => att.attendeeId === a.attendeeId)) - 
           (attendees.findIndex(att => att.attendeeId === b.attendeeId));
  });

  // Only log in development environment and with less frequency
  if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
    console.log("AttendeeSummary received:", { 
      attendees: attendees.length,
      byType: attendees.reduce((acc, att) => {
        acc[att.attendeeType] = (acc[att.attendeeType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });
  }

  const totalAttendees = sortedAttendees.length;

  if (totalAttendees === 0) {
    return null;
  }

  const getAttendeeDisplay = (attendee: UnifiedAttendeeData): string => {
    const hasName = attendee.firstName && attendee.lastName;
    
    switch (attendee.attendeeType) {
      case 'mason': {
        let rankDisplay = '';
        if (attendee.rank === 'GL' && attendee.grandRank) {
          rankDisplay = attendee.grandRank;
        } else if (attendee.rank && attendee.rank !== 'GL') {
          rankDisplay = attendee.rank;
        }
        return hasName 
          ? `${attendee.title} ${attendee.firstName} ${attendee.lastName}${rankDisplay ? ` ${rankDisplay}` : ''}` 
          : `Mason Attendee`;
      }
      case 'lady_partner': {
        return hasName 
          ? `${attendee.title} ${attendee.firstName} ${attendee.lastName}` 
          : `Partner Attendee`;
      }
      case 'guest': {
        return hasName 
          ? `${attendee.title} ${attendee.firstName} ${attendee.lastName}` 
          : `Guest Attendee`;
      }
      case 'guest_partner': {
        return hasName 
          ? `${attendee.title} ${attendee.firstName} ${attendee.lastName}` 
          : `Partner Attendee`;
      }
      default: {
        return 'Unknown Attendee';
      }
    }
  };

  const getAttendeeIcon = (type: UnifiedAttendeeData['attendeeType']) => {
    switch (type) {
      case 'mason': return <User className="w-5 h-5 mr-3 text-primary flex-shrink-0" />;
      case 'lady_partner': return <UserCheck className="w-5 h-5 mr-3 text-pink-500 flex-shrink-0" />;
      case 'guest': return <Users className="w-5 h-5 mr-3 text-indigo-500 flex-shrink-0" />;
      case 'guest_partner': return <Users className="w-5 h-5 mr-3 text-pink-500 flex-shrink-0" />;
      default: return null;
    }
  };

  const handleRemove = (attendee: UnifiedAttendeeData) => {
    const isPrimaryMason = attendee.attendeeType === 'mason' && attendee.isPrimary;
    if (isPrimaryMason) return; // Can't remove primary mason
    
    removeAttendee(attendee.attendeeId);
  };

  // Find out if this is a partner attendee
  const isPartnerOf = (attendee: UnifiedAttendeeData): string | null => {
    if ((attendee.attendeeType === 'lady_partner' || attendee.attendeeType === 'guest_partner') && attendee.relatedAttendeeId) {
      const relatedAttendee = attendees.find(a => a.attendeeId === attendee.relatedAttendeeId);
      if (relatedAttendee && relatedAttendee.firstName && relatedAttendee.lastName) {
        return `Partner of ${relatedAttendee.firstName} ${relatedAttendee.lastName}`;
      }
    }
    return null;
  };

  return (
    <div className="bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold mb-3 text-slate-800 border-b pb-2">Attendee Summary</h3>
      <ul className="space-y-2">
        {sortedAttendees.map((attendee) => {
          const isPrimaryMason = attendee.attendeeType === 'mason' && attendee.isPrimary;
          const partnerInfo = isPartnerOf(attendee);
          
          return (
            <li key={attendee.attendeeId} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
              <div className="flex flex-col min-w-0 mr-2">
                <div className="flex items-center">
                  {getAttendeeIcon(attendee.attendeeType)}
                  <span className="text-slate-700 truncate" title={getAttendeeDisplay(attendee)}>
                    {getAttendeeDisplay(attendee)}
                  </span>
                </div>
                {partnerInfo && (
                  <span className="text-xs text-slate-500 ml-8">{partnerInfo}</span>
                )}
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