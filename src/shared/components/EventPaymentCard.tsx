import React from 'react';
import { Link } from 'react-router-dom';
import { EventType } from '../types/event';

interface EventPaymentCardProps {
  event: EventType;
}

const EventPaymentCard: React.FC<EventPaymentCardProps> = ({ event }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-100 p-6">
      <div className="mb-6">
        <h3 className="font-bold text-2xl text-primary mb-2">
          {event.price ? `$${event.price}` : 'Free'}
        </h3>
        {event.price ? (
          <p className="text-slate-600 text-sm">per person, inclusive of GST</p>
        ) : (
          <p className="text-green-600 text-sm">No registration fee required</p>
        )}
      </div>
      
      <div className="space-y-4 mb-6">
        {/* Changed to always use the register link, whether paid or free */}
        <Link 
          to={`/register`}
          state={{ selectedEventId: event.id }}
          className="btn-primary w-full flex justify-center items-center"
        >
          Register Now
        </Link>
        
        <Link 
          to={`/events`}
          className="btn-outline w-full flex justify-center items-center"
        >
          View All Events
        </Link>
      </div>
      
      <div className="border-t border-slate-200 pt-4">
        <h4 className="font-bold mb-2">Event Includes:</h4>
        <ul className="text-slate-700 space-y-2">
          {event.type === 'Ceremony' && (
            <>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                <span>Official Program</span>
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                <span>Reserved Seating</span>
              </li>
            </>
          )}
          {event.type === 'Social' && (
            <>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                <span>{event.id.includes('dinner') ? 'Three-Course Dinner' : 'Refreshments'}</span>
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                <span>Entertainment</span>
              </li>
            </>
          )}
          <li className="flex items-center">
            <span className="w-2 h-2 bg-primary rounded-full mr-2" />
            <span>Event Access</span>
          </li>
        </ul>
      </div>
      
      {event.maxAttendees && (
        <div className="mt-6 bg-yellow-50 p-4 rounded-md border border-yellow-100">
          <p className="text-amber-800 text-sm">
            Limited capacity of {event.maxAttendees} attendees. 
            Register early to secure your place.
          </p>
        </div>
      )}
    </div>
  );
};

export default EventPaymentCard;