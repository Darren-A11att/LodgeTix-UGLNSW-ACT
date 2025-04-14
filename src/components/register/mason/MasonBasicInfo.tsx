import React from 'react';
import { MasonData } from '../../../types/register';

interface MasonBasicInfoProps {
  mason: MasonData;
  index: number;
  onChange: (index: number, field: string, value: string | boolean) => void;
  isPrimary?: boolean;
  handleTitleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const MasonBasicInfo: React.FC<MasonBasicInfoProps> = ({
  mason,
  index,
  onChange,
  isPrimary = false,
  handleTitleChange
}) => {
  // Updated with restricted options per requirements
  const titles = ["Bro", "W Bro", "VW Bro", "RW Bro", "MW Bro"];
  const ranks = ["EAF", "FCF", "MM", "IM", "GL"];

  return (
    <div className="grid grid-cols-12 gap-4 mb-4">
      {/* Masonic Title */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`title-${index}`}>
          Masonic Title {isPrimary && "*"}
        </label>
        <select
          id={`title-${index}`}
          name={`title-${index}`}
          value={mason.title}
          onChange={handleTitleChange}
          required={isPrimary}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {titles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>
      </div>
      
      {/* First Name */}
      <div className="col-span-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`firstName-${index}`}>
          First Name {isPrimary && "*"}
        </label>
        <input
          type="text"
          id={`firstName-${index}`}
          name={`firstName-${index}`}
          value={mason.firstName}
          onChange={(e) => onChange(index, 'firstName', e.target.value)}
          required={isPrimary}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      
      {/* Last Name */}
      <div className="col-span-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`lastName-${index}`}>
          Last Name {isPrimary && "*"}
        </label>
        <input
          type="text"
          id={`lastName-${index}`}
          name={`lastName-${index}`}
          value={mason.lastName}
          onChange={(e) => onChange(index, 'lastName', e.target.value)}
          required={isPrimary}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      
      {/* Rank */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`rank-${index}`}>
          Rank {isPrimary && "*"}
        </label>
        <select
          id={`rank-${index}`}
          name={`rank-${index}`}
          value={mason.rank}
          onChange={(e) => onChange(index, 'rank', e.target.value)}
          required={isPrimary}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {ranks.map(rank => (
            <option key={rank} value={rank}>{rank}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default MasonBasicInfo;