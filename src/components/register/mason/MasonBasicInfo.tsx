import React, { useState } from 'react';
import { MasonData } from '../../../shared/types/register';

interface MasonBasicInfoProps {
  mason: MasonData;
  id: string;
  onChange: (id: string, field: string, value: string | boolean) => void;
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

  return (
    <div className="grid grid-cols-12 gap-4 mb-4">
      {/* Masonic Title */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`title-${id}`}>
          Masonic Title {isPrimary && "*"}
        </label>
        <select
          id={`title-${id}`}
          name={`title-${id}`}
          value={mason.title}
          onChange={handleTitleChange}
          onBlur={() => setTitleInteracted(true)}
          required={isPrimary}
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
      <div className="col-span-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`firstName-${id}`}>
          First Name {isPrimary && "*"}
        </label>
        <input
          type="text"
          id={`firstName-${id}`}
          name={`firstName-${id}`}
          value={mason.firstName}
          onChange={(e) => onChange(id, 'firstName', e.target.value)}
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
          name={`lastName-${id}`}
          value={mason.lastName}
          onChange={(e) => onChange(id, 'lastName', e.target.value)}
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
          name={`rank-${id}`}
          value={mason.rank}
          onChange={(e) => onChange(id, 'rank', e.target.value)}
          onBlur={() => setRankInteracted(true)}
          required={isPrimary}
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${rankInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        >
          <option value="">Please Select</option>
          {ranks.map(rank => (
            <option key={rank.value} value={rank.value}>{rank.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default MasonBasicInfo;