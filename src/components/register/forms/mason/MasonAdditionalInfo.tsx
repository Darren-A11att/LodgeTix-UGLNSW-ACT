import React from 'react';
import { MasonData } from '../../../../shared/types/register';

interface MasonAdditionalInfoProps {
  mason: MasonData;
  id: string;
  onChange: (id: string, field: string, value: string | boolean) => void;
}

const MasonAdditionalInfo: React.FC<MasonAdditionalInfoProps> = ({
  mason,
  id,
  onChange,
}) => {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`dietary-${id}`}>
          Dietary Requirements
        </label>
        <input
          type="text"
          id={`dietary-${id}`}
          name={`dietary-${id}`}
          value={mason.dietary}
          onChange={(e) => onChange(id, 'dietary', e.target.value)}
          placeholder="E.g., vegetarian, gluten-free, allergies"
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`specialNeeds-${id}`}>
          Special Needs or Accessibility Requirements
        </label>
        <textarea
          id={`specialNeeds-${id}`}
          name={`specialNeeds-${id}`}
          value={mason.specialNeeds}
          onChange={(e) => onChange(id, 'specialNeeds', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        ></textarea>
      </div>
    </>
  );
};

export default MasonAdditionalInfo;