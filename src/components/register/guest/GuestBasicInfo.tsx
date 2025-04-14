import React from 'react';
import { GuestData } from '../../../types/register';

interface GuestBasicInfoProps {
  guest: GuestData;
  index: number;
  onChange: (index: number, field: string, value: string | boolean) => void;
  titles: string[];
}

const GuestBasicInfo: React.FC<GuestBasicInfoProps> = ({
  guest,
  index,
  onChange,
  titles
}) => {
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
          required
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
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
          required
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
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
          required
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
    </div>
  );
};

export default GuestBasicInfo;