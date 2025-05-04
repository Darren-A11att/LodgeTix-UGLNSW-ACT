import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { EventType } from '../../../shared/types/event';

interface EventSelectionListProps {
  events: EventType[];
  selectedEvents: string[];
  isReserving?: boolean;
  toggleEvent: (eventId: string) => void;
  showEligibilityBadges?: boolean;
  attendeeType?: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner';
}

const EventSelectionList: React.FC<EventSelectionListProps> = ({
  events,
  selectedEvents,
  isReserving = false,
  toggleEvent,
  showEligibilityBadges = true,
  attendeeType
}) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-6 bg-slate-50 rounded-md border border-slate-200">
        <p className="text-slate-600">No eligible events found for this attendee.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map(event => (
        <div 
          key={event.id}
          className={`border rounded-md p-3 cursor-pointer ${
            selectedEvents.includes(event.id)
              ? 'border-primary bg-primary/5' 
              : 'border-slate-200 hover:border-primary/30'
          }`}
          onClick={() => !isReserving && toggleEvent(event.id)}
          style={{ opacity: isReserving ? 0.7 : 1, cursor: isReserving ? 'not-allowed' : 'pointer' }}
        >
          <div className="flex justify-between">
            <div>
              <div className="font-medium flex items-center">
                {event.title}
                {showEligibilityBadges && (
                  <>
                    {event.id === 'grand-officers-meeting' && attendeeType === 'mason' && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">
                        Grand Officers Only
                      </span>
                    )}
                    {event.id === 'ladies-program' && (attendeeType === 'ladyPartner' || attendeeType === 'guestPartner') && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                        Partners Only
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center text-xs text-slate-500 mt-1">
                <Calendar className="w-3 h-3 mr-1" />
                {event.day}
                <Clock className="w-3 h-3 ml-2 mr-1" />
                {event.time}
              </div>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-primary mr-2">
                {event.price ? `$${event.price}` : 'Free'}
              </span>
              <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                selectedEvents.includes(event.id)
                  ? 'bg-primary border-primary text-white' 
                  : 'border-slate-300'
              }`}>
                {selectedEvents.includes(event.id) && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventSelectionList;