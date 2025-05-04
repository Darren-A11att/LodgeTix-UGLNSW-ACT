import React from 'react';
import { GuestData } from '../../shared/types/register';

interface GuestAdditionalInfoProps {
  guest: GuestData;
  index: number;
  onChange: (index: number, field: string, value: string | boolean) => void;
}

const GuestAdditionalInfo: React.FC<GuestAdditionalInfoProps> = ({
  guest,
  index,
  onChange
}) => {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestDietary-${index}`}>
          Dietary Requirements
        </label>
        <input
          type="text"
          id={`guestDietary-${index}`}
          name={`guestDietary-${index}`}
          value={guest.dietary}
          onChange={(e) => onChange(index, 'dietary', e.target.value)}
          placeholder="E.g., vegetarian, gluten-free, allergies"
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestSpecialNeeds-${index}`}>
          Special Needs or Accessibility Requirements
        </label>
        <textarea
          id={`guestSpecialNeeds-${index}`}
          name={`guestSpecialNeeds-${index}`}
          value={guest.specialNeeds}
          onChange={(e) => onChange(index, 'specialNeeds', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        ></textarea>
      </div>
    </>
  );
};

export default GuestAdditionalInfo;