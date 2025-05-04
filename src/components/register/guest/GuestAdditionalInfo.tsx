import React from 'react';
import { AttendeeData as UnifiedAttendeeData } from '../../../lib/api/registrations';

interface GuestAdditionalInfoProps {
  guest: UnifiedAttendeeData;
  id: string;
  onChange: (attendeeId: string, field: keyof UnifiedAttendeeData, value: any) => void;
}

const GuestAdditionalInfo: React.FC<GuestAdditionalInfoProps> = ({
  guest,
  id,
  onChange
}) => {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestDietary-${id}`}>
          Dietary Requirements
        </label>
        <input
          type="text"
          id={`guestDietary-${id}`}
          name={`guestDietary-${id}`}
          value={guest.dietaryRequirements ?? ''}
          onChange={(e) => onChange(id, 'dietaryRequirements', e.target.value)}
          placeholder="E.g., vegetarian, gluten-free, allergies"
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestSpecialNeeds-${id}`}>
          Special Needs or Accessibility Requirements
        </label>
        <textarea
          id={`guestSpecialNeeds-${id}`}
          name={`guestSpecialNeeds-${id}`}
          value={guest.specialNeeds ?? ''}
          onChange={(e) => onChange(id, 'specialNeeds', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        ></textarea>
      </div>
    </>
  );
};

export default GuestAdditionalInfo;