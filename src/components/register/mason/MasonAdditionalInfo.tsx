import React from 'react';
import { MasonData } from '../../shared/types/register';

interface MasonAdditionalInfoProps {
  mason: MasonData;
  index: number;
  onChange: (index: number, field: string, value: string | boolean) => void;
}

const MasonAdditionalInfo: React.FC<MasonAdditionalInfoProps> = ({
  mason,
  index,
  onChange,
}) => {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`dietary-${index}`}>
          Dietary Requirements
        </label>
        <input
          type="text"
          id={`dietary-${index}`}
          name={`dietary-${index}`}
          value={mason.dietary}
          onChange={(e) => onChange(index, 'dietary', e.target.value)}
          placeholder="E.g., vegetarian, gluten-free, allergies"
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="specialNeeds">
          Special Needs or Accessibility Requirements
        </label>
        <textarea
          id="specialNeeds"
          name="specialNeeds"
          value={mason.specialNeeds}
          onChange={(e) => onChange(index, 'specialNeeds', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        ></textarea>
      </div>
    </>
  );
};

export default MasonAdditionalInfo;