import React from 'react';
import { UnifiedAttendeeData } from '../../../store/registrationStore';

interface MasonAdditionalInfoProps {
  mason: UnifiedAttendeeData;
  id: string;
  onChange: (attendeeId: string, field: keyof UnifiedAttendeeData, value: any) => void;
}

const MasonAdditionalInfo: React.FC<MasonAdditionalInfoProps> = ({
  mason,
  id,
  onChange,
}) => {
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange(id, name as keyof UnifiedAttendeeData, value);
  };

  return (
    <div className="mb-4">
      <h4 className="text-md font-semibold text-slate-700 mb-3 border-t pt-4 mt-4">Additional Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`dietaryRequirements-${id}`}>
            Dietary Requirements
          </label>
          <textarea
            id={`dietaryRequirements-${id}`}
            name="dietaryRequirements"
            value={mason.dietaryRequirements || ''}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="e.g., Vegetarian, Gluten Free, Allergies"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`specialNeeds-${id}`}>
            Special Needs / Seating
          </label>
          <textarea
            id={`specialNeeds-${id}`}
            name="specialNeeds"
            value={mason.specialNeeds || ''}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="e.g., Wheelchair access, Hearing loop"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`honours-${id}`}>
            Honours / Decorations
          </label>
          <input
            type="text"
            id={`honours-${id}`}
            name="honours"
            value={mason.honours || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="e.g., OAM, JP"
          />
        </div>
      </div>
    </div>
  );
};

export default MasonAdditionalInfo;