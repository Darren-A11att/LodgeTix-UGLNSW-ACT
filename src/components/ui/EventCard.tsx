import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDaysIcon, MapPinIcon, UsersIcon, ClockIcon } from '@heroicons/react/24/outline';
import Button from './Button'; // Import Button component
// Assume Button component exists and handles variants
// import Button from './Button'; 

export interface EventCardProps {
  id: string | number;
  slug: string; // For linking to event details page
  imageUrl: string;
  imageAlt: string;
  category: string; // e.g., "Social", "Ceremony"
  title: string;
  date: string;
  time?: string;
  location: string;
  attendeeInfo?: string;
  description: string;
  price?: number | string; // Optional price
}

const EventCard: React.FC<EventCardProps> = ({
  id,
  slug,
  imageUrl,
  imageAlt,
  category,
  title,
  date,
  time,
  location,
  attendeeInfo,
  description,
  price,
}) => {
  const eventUrl = `/events/${slug}`;

  return (
    <div key={id} className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="aspect-w-3 aspect-h-2 bg-gray-200 group-hover:opacity-75 sm:aspect-none sm:h-48">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="h-full w-full object-cover object-center sm:h-full sm:w-full"
        />
      </div>
      <div className="flex flex-1 flex-col space-y-2 p-4">
        <p className="text-xs font-medium text-primary-700 uppercase tracking-wider">{category}</p>
        <h3 className="text-lg font-semibold text-gray-900">
          <Link to={eventUrl}>
            <span aria-hidden="true" className="absolute inset-0" />
            {title}
          </Link>
        </h3>
        {/* Event Details List */}
        <ul className="space-y-1 text-sm text-gray-500 mt-1">
          <li className="flex items-center">
            <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-gray-400" />
            {date}
          </li>
          {time && (
            <li className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
              {time}
            </li>
          )}
           <li className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400" />
            {location}
          </li>
          {attendeeInfo && (
             <li className="flex items-center">
               <UsersIcon className="h-4 w-4 mr-1.5 text-gray-400" />
               {attendeeInfo}
             </li>
          )}
        </ul>
        <p className="text-sm text-gray-500 flex-grow pt-2">{description}</p>
        <div className="flex flex-1 flex-col justify-end pt-2">
          <div className="flex items-center justify-between">
            {price !== undefined && (
              <p className="text-base font-medium text-gray-900">
                {typeof price === 'number' ? `$${price.toFixed(2)}` : price}
              </p>
            )}
            {/* Use Button component with secondary variant */}
            <Button href={eventUrl} variant="secondary" size="sm" className="ml-auto"> 
              View Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard; 