import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EventType } from '../shared/types/event';
import { getEventCapacity } from '../lib/api/events';

interface EventCardProps {
  event: EventType;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const [capacityInfo, setCapacityInfo] = useState<{
    totalCapacity: number;
    availableCount: number;
    usagePercentage: number;
    isHighDemand: boolean;
    isSoldOut: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCapacity = async () => {
      setIsLoading(true);
      try {
        const capacity = await getEventCapacity(event.id);
        if (capacity) {
          setCapacityInfo({
            totalCapacity: capacity.totalCapacity,
            availableCount: capacity.availableCount,
            usagePercentage: capacity.usagePercentage,
            isHighDemand: capacity.usagePercentage >= 80,
            isSoldOut: capacity.availableCount === 0
          });
        }
      } catch (error) {
        console.error('Error fetching capacity:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCapacity();
  }, [event.id]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow">
      {event.imageUrl && (
        <div className="h-48 overflow-hidden">
          <img 
            src={event.imageUrl} 
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
          
          {/* Capacity information from event_capacity table */}
          <div className="flex items-center text-sm">
            <Users className="w-4 h-4 mr-2 text-primary" />
            {isLoading ? (
              <span className="text-slate-500">Loading capacity...</span>
            ) : capacityInfo ? (
              capacityInfo.isSoldOut ? (
                <span className="text-red-600 font-medium">Sold Out</span>
              ) : capacityInfo.isHighDemand ? (
                <div className="flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-amber-500" />
                  <span className="text-amber-600 font-medium">
                    High demand! {capacityInfo.availableCount} seats left
                  </span>
                </div>
              ) : (
                <span className="text-slate-600">
                  {capacityInfo.availableCount} seats available
                </span>
              )
            ) : (
              <span className="text-slate-500">Limited availability</span>
            )}
          </div>
        </div>
        
        <p className="text-slate-700 mb-4">
          {event.description.length > 100 
            ? `${event.description.substring(0, 100)}...` 
            : event.description}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="font-bold text-primary">
            {/* Price info now comes from ticket_definitions table */}
            <span className="text-slate-600 text-sm">See ticket options</span>
          </div>
          
          <Link to={`/events/${event.id}`} className="btn-outline py-2">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;