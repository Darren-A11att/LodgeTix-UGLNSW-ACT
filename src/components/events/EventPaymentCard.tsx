import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { EventType } from '../shared/types/event';
import { getEventCapacity } from '../lib/api/events';
import { TrendingUp, AlertCircle, Users, Loader2 } from 'lucide-react';

interface EventPaymentCardProps {
  event: EventType;
}

const EventPaymentCard: React.FC<EventPaymentCardProps> = ({ event }) => {
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
        console.error('Error fetching capacity information:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCapacity();
  }, [event.id]);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-100 p-6">
      <div className="mb-6">
        <h3 className="font-bold text-2xl text-primary mb-2">
          {/* Price info now comes from ticket_definitions table */}
          See Ticket Options
        </h3>
        <p className="text-slate-600 text-sm">
          Select from available ticket types during registration
        </p>
      </div>
      
      <div className="space-y-4 mb-6">
        {/* Changed to always use the register link, whether paid or free */}
        <Link 
          to={`/register`}
          state={{ selectedEventId: event.id }}
          className={`btn-primary w-full flex justify-center items-center ${
            capacityInfo?.isSoldOut ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          {...(capacityInfo?.isSoldOut ? { onClick: (e) => e.preventDefault() } : {})}
        >
          {capacityInfo?.isSoldOut ? 'Sold Out' : 'Register Now'}
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
                <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>{' '}
                Official Program
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>{' '}
                Reserved Seating
              </li>
            </>
          )}
          {event.type === 'Social' && (
            <>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>{' '}
                {event.id.includes('dinner') ? 'Three-Course Dinner' : 'Refreshments'}
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>{' '}
                Entertainment
              </li>
            </>
          )}
          <li className="flex items-center">
            <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>{' '}
            Event Access
          </li>
        </ul>
      </div>
      
      {/* Capacity information from event_capacity table */}
      <div className={`mt-6 p-4 rounded-md border ${
        isLoading ? 'bg-slate-50 border-slate-200' :
        capacityInfo?.isSoldOut ? 'bg-red-50 border-red-200' : 
        capacityInfo?.isHighDemand ? 'bg-amber-50 border-amber-200' : 
        'bg-green-50 border-green-200'
      }`}>
        {isLoading ? (
          <div className="flex items-center text-slate-600">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <p className="text-sm">Loading capacity information...</p>
          </div>
        ) : capacityInfo ? (
          capacityInfo.isSoldOut ? (
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 text-red-500" />
              <div>
                <p className="text-red-700 font-medium text-sm">This event is sold out</p>
                <p className="text-red-600 text-xs mt-1">All {capacityInfo.totalCapacity} tickets have been reserved</p>
              </div>
            </div>
          ) : capacityInfo.isHighDemand ? (
            <div className="flex items-start">
              <TrendingUp className="w-4 h-4 mr-2 mt-0.5 text-amber-500" />
              <div>
                <p className="text-amber-700 font-medium text-sm">High demand! Limited seats available</p>
                <p className="text-amber-600 text-xs mt-1">Only {capacityInfo.availableCount} of {capacityInfo.totalCapacity} seats remaining</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start">
              <Users className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
              <div>
                <p className="text-green-700 font-medium text-sm">Seats available</p>
                <p className="text-green-600 text-xs mt-1">{capacityInfo.availableCount} of {capacityInfo.totalCapacity} seats remaining</p>
              </div>
            </div>
          )
        ) : (
          <p className="text-amber-800 text-sm">
            Limited availability. Register early to secure your place.
          </p>
        )}
      </div>
    </div>
  );
};

export default EventPaymentCard;