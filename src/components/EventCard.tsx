import React from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EventType } from '../types';

interface EventCardProps {
  event: EventType;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow">
      {event.imageSrc && (
        <div className="h-48 overflow-hidden">
          <img 
            src={event.imageSrc} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        {event.type && (
          <div className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-4">
            {event.type}
          </div>
        )}
        
        <h3 className="text-xl font-bold mb-2">{event.title}</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-slate-600">
            <Calendar className="w-4 h-4 mr-2 text-primary" />
            {event.day}
          </div>
          
          <div className="flex items-center text-sm text-slate-600">
            <Clock className="w-4 h-4 mr-2 text-primary" />
            {event.time}
          </div>
          
          <div className="flex items-center text-sm text-slate-600">
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            {event.location}
          </div>
          
          {event.maxAttendees && (
            <div className="flex items-center text-sm text-slate-600">
              <Users className="w-4 h-4 mr-2 text-primary" />
              {event.maxAttendees} attendees max
            </div>
          )}
        </div>
        
        <p className="text-slate-700 mb-4">
          {event.description.length > 100 
            ? `${event.description.substring(0, 100)}...` 
            : event.description}
        </p>
        
        <div className="flex justify-between items-center">
          {event.price ? (
            <div className="font-bold text-primary">${event.price}</div>
          ) : (
            <div className="text-green-600 font-medium">Free</div>
          )}
          
          <Link to={`/events/${event.id}`} className="btn-outline py-2">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;