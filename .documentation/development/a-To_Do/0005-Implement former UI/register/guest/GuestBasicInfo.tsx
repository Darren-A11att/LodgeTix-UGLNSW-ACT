import React, { useState } from 'react';
import { GuestData } from '../../../shared/types/register';
import { HelpCircle } from 'lucide-react';
import PhoneInputWrapper from '../PhoneInputWrapper';

interface GuestBasicInfoProps {
  guest: GuestData;
  index: number;
  onChange: (index: number, field: string, value: string) => void;
  titles: string[];
}

const GuestBasicInfo: React.FC<GuestBasicInfoProps> = ({
  guest,
  index,
  onChange,
  titles,
}) => {
  // Interaction states
  const [titleInteracted, setTitleInteracted] = useState(false);
  const [firstNameInteracted, setFirstNameInteracted] = useState(false);
  const [lastNameInteracted, setLastNameInteracted] = useState(false);

  return (
    <div className="grid grid-cols-12 gap-4 mb-4">
      {/* Title */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestTitle-${index}`}>
          Title *
        </label>
        <select
          id={`guestTitle-${index}`}
          name={`guestTitle-${index}`}
          value={guest.title}
          onChange={(e) => onChange(index, 'title', e.target.value)}
          onBlur={() => setTitleInteracted(true)}
          required
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${titleInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        >
          <option value="">Please Select</option>
          {titles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>
      </div>
      
      {/* First Name */}
      <div className="col-span-5">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestFirstName-${index}`}>
          First Name *
        </label>
        <input
          type="text"
          id={`guestFirstName-${index}`}
          name={`guestFirstName-${index}`}
          value={guest.firstName}
          onChange={(e) => onChange(index, 'firstName', e.target.value)}
          onBlur={() => setFirstNameInteracted(true)}
          required
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${firstNameInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                     focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        />
      </div>
      
      {/* Last Name */}
      <div className="col-span-5">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestLastName-${index}`}>
          Last Name *
        </label>
        <input
          type="text"
          id={`guestLastName-${index}`}
          name={`guestLastName-${index}`}
          value={guest.lastName}
          onChange={(e) => onChange(index, 'lastName', e.target.value)}
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