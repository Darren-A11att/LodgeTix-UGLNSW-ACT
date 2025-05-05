import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import PhoneInputWrapper from '../PhoneInputWrapper';
import { AttendeeData as UnifiedAttendeeData } from '../../../lib/api/registrations';

interface GuestBasicInfoProps {
  guest: UnifiedAttendeeData;
  id: string;
  onChange: (attendeeId: string, field: keyof UnifiedAttendeeData, value: any) => void;
  titles: string[];
}

const GuestBasicInfo: React.FC<GuestBasicInfoProps> = ({
  guest,
  id,
  onChange,
  titles,
}) => {
  // Interaction states
  const [titleInteracted, setTitleInteracted] = useState(false);
  const [firstNameInteracted, setFirstNameInteracted] = useState(false);
  const [lastNameInteracted, setLastNameInteracted] = useState(false);

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestTitle-${id}`}>
          Title *
        </label>
        <select
          id={`guestTitle-${id}`}
          name={`guestTitle-${id}`}
          value={guest.title ?? ''}
          onChange={(e) => onChange(id, 'title', e.target.value)}
          onBlur={() => setTitleInteracted(true)}
          required
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${titleInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        >
          <option value="" disabled>Please Select</option>
          {titles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>
      </div>
      
      {/* First Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestFirstName-${id}`}>
          First Name *
        </label>
        <input
          type="text"
          id={`guestFirstName-${id}`}
          name={`guestFirstName-${id}`}
          value={guest.firstName ?? ''}
          onChange={(e) => onChange(id, 'firstName', e.target.value)}
          onBlur={() => setFirstNameInteracted(true)}
          required
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${firstNameInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                     focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        />
      </div>
      
      {/* Last Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestLastName-${id}`}>
          Last Name *
        </label>
        <input
          type="text"
          id={`guestLastName-${id}`}
          name={`guestLastName-${id}`}
          value={guest.lastName ?? ''}
          onChange={(e) => onChange(id, 'lastName', e.target.value)}
          onBlur={() => setLastNameInteracted(true)}
          required
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${lastNameInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                     focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        />
      </div>
    </div>
  );
};

export default GuestBasicInfo;