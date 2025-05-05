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
    <div className="mb-6 pt-4 border-t border-slate-200">
      <h4 className="text-md font-semibold text-slate-700 mb-4">Additional Information</h4>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`dietaryRequirements-${id}`}>
          Dietary Requirements
        </label>
        <input
          type="text"
          id={`dietaryRequirements-${id}`}
          name="dietaryRequirements"
          value={mason.dietaryRequirements || ''}
          onChange={handleInputChange}
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
          name="specialNeeds"
          value={mason.specialNeeds || ''}
          onChange={handleInputChange}
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        ></textarea>
      </div>
    </div>
  );
};

export default MasonAdditionalInfo;