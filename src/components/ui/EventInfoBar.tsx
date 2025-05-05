import React from 'react';
import { CalendarDaysIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline';

interface EventInfoItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const EventInfoItem: React.FC<EventInfoItemProps> = ({ icon: Icon, title, description }) => (
  <div className="text-center sm:flex sm:text-left lg:block lg:text-center">
    <div className="sm:shrink-0">
      <div className="flow-root">
        {/* Use a styled div for the icon background */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary-100">
           <Icon className="h-8 w-8 text-primary-700" aria-hidden="true" />
        </div>
      </div>
    </div>
    <div className="mt-3 sm:mt-0 sm:ml-6 lg:mt-6 lg:ml-0">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-base text-gray-600">{description}</p>
    </div>
  </div>
);

interface EventInfoBarProps {
  date: string;
  location: string;
  attendance: string;
}

const EventInfoBar: React.FC<EventInfoBarProps> = ({ date, location, attendance }) => {
  const eventInfo = [
    { name: 'Date', description: date, icon: CalendarDaysIcon },
    { name: 'Location', description: location, icon: MapPinIcon },
    { name: 'Attendance', description: attendance, icon: UsersIcon },
  ];

  return (
    <div className="bg-gray-50">
      {/* Adjusted padding and removed inner rounded bg */}
      <div className="container-custom mx-auto max-w-7xl px-6 py-16 sm:px-6 lg:px-8">
        {/* Removed unnecessary nested divs and text-center */}
        <div className="mx-auto grid max-w-sm grid-cols-1 gap-x-8 gap-y-10 sm:max-w-none lg:grid-cols-3">
          {eventInfo.map((info) => (
            <EventInfoItem key={info.name} icon={info.icon} title={info.name} description={info.description} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventInfoBar; 