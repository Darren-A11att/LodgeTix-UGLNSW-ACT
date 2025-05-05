import React, { useState } from 'react';
import { UnifiedAttendeeData } from '../../../store/registrationStore';

interface MasonBasicInfoProps {
  mason: UnifiedAttendeeData;
  id: string;
  onChange: (attendeeId: string, field: keyof UnifiedAttendeeData, value: any) => void;
  isPrimary?: boolean;
  handleTitleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  titles: string[];
  ranks: { value: string; label: string; }[];
}

const MasonBasicInfo: React.FC<MasonBasicInfoProps> = ({
  mason,
  id,
  onChange,
  isPrimary = false,
  handleTitleChange,
  titles,
  ranks,
}) => {
  // Interaction states
  const [titleInteracted, setTitleInteracted] = useState(false);
  const [firstNameInteracted, setFirstNameInteracted] = useState(false);
  const [lastNameInteracted, setLastNameInteracted] = useState(false);
  const [rankInteracted, setRankInteracted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange(id, name as keyof UnifiedAttendeeData, value);
  };

  return (
    <div className="grid grid-cols-12 gap-4 mb-4">
      {/* Masonic Title */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`title-${id}`}>
          Masonic Title {isPrimary && "*"}
        </label>
        <select
          id={`title-${id}`}
          name="title"
          value={mason.title ?? ''}
          onChange={handleTitleChange}
          onBlur={() => setTitleInteracted(true)}
          required={isPrimary}
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
      <div className="col-span-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`firstName-${id}`}>
          First Name {isPrimary && "*"}
        </label>
        <input
          type="text"
          id={`firstName-${id}`}
          name="firstName"
          value={mason.firstName ?? ''}
          onChange={handleInputChange}
          onBlur={() => setFirstNameInteracted(true)}
          required={isPrimary}
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${firstNameInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                     focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        />
      </div>
      
      {/* Last Name */}
      <div className="col-span-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`lastName-${id}`}>
          Last Name {isPrimary && "*"}
        </label>
        <input
          type="text"
          id={`lastName-${id}`}
          name="lastName"
          value={mason.lastName ?? ''}
          onChange={handleInputChange}
          onBlur={() => setLastNameInteracted(true)}
          required={isPrimary}
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${lastNameInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                     focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        />
      </div>
      
      {/* Rank */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`rank-${id}`}>
          Rank {isPrimary && "*"}
        </label>
        <select
          id={`rank-${id}`}
          name="rank"
          value={mason.rank ?? ''}
          onChange={handleInputChange}
          onBlur={() => setRankInteracted(true)}
          required={isPrimary}
          disabled={["VW Bro", "RW Bro", "MW Bro", "W Bro"].includes(mason.title || '')}
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${rankInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500 ${["VW Bro", "RW Bro", "MW Bro", "W Bro"].includes(mason.title || '') ? 'bg-slate-100 cursor-not-allowed' : ''}`}
        >
          <option value="" disabled>Please Select</option>
          {ranks.map(rank => (
            <option key={rank.value} value={rank.value}>{rank.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default MasonBasicInfo;