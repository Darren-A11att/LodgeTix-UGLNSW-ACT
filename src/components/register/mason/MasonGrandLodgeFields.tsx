import React, { useState } from 'react';
import { UnifiedAttendeeData } from '../../../store/registrationStore';

interface MasonGrandLodgeFieldsProps {
  mason: UnifiedAttendeeData;
  id: string;
  onChange: (attendeeId: string, field: keyof UnifiedAttendeeData, value: any) => void;
  isPrimary: boolean;
}

const MasonGrandLodgeFields: React.FC<MasonGrandLodgeFieldsProps> = ({
  mason,
  id,
  onChange,
  isPrimary,
}) => {
  // Interaction tracking state (optional, keep if needed for validation styling)
  const [grandRankInteracted, setGrandRankInteracted] = useState(false);
  const [grandOfficeInteracted, setGrandOfficeInteracted] = useState(false);
  const [pastGrandOfficeInteracted, setPastGrandOfficeInteracted] = useState(false);

  // Combined handler for input/select
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange(id, name as keyof UnifiedAttendeeData, value);
  };
  
  // Checkbox handler
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      onChange(id, name as keyof UnifiedAttendeeData, checked);
  };

  return (
    <div className="bg-sky-50 p-4 rounded-md border border-sky-100 my-4">
      <h4 className="text-md font-semibold text-sky-800 mb-3">Grand Lodge Office Information</h4>
      {/* Simplified Grid */} 
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Grand Rank Field */} 
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`grandRank-${id}`}>
            Grand Rank {isPrimary && "*"} {/* Keep required based on rank? */}
          </label>
          <input // Changed back to input based on previous state? Check definition
            type="text" 
            id={`grandRank-${id}`}
            name="grandRank"
            value={mason.grandRank || ''}
            onChange={handleInputChange}
            onBlur={() => setGrandRankInteracted(true)} // Keep interaction if needed
            required={isPrimary && mason.rank === "GL"} // Keep required if rank is GL?
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${grandRankInteracted ? 'interacted' : ''} [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
            maxLength={6} // Keep if applicable
            placeholder="PGRNK" // Keep if applicable
         />
        </div>

        {/* Current Grand Office Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`grandOffice-${id}`}>
            Current Grand Office
          </label>
          <input
            type="text"
            id={`grandOffice-${id}`}
            name="grandOffice"
            value={mason.grandOffice || ''}
            onChange={handleInputChange}
            onBlur={() => setGrandOfficeInteracted(true)} // Keep interaction if needed
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${grandOfficeInteracted ? 'interacted' : ''}`}
          />
        </div>

        {/* Past Grand Office Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`pastGrandOffice-${id}`}>
            Past Grand Office
          </label>
          <input
            type="text"
            id={`pastGrandOffice-${id}`}
            name="pastGrandOffice"
            value={mason.pastGrandOffice || ''}
            onChange={handleInputChange}
             onBlur={() => setPastGrandOfficeInteracted(true)} // Keep interaction if needed
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${pastGrandOfficeInteracted ? 'interacted' : ''}`}
          />
        </div>

        {/* Past Grand Master Checkbox (adjust grid span if needed) */} 
        <div className="md:col-span-3 flex items-center mt-2">
          <input
            type="checkbox"
            id={`isPastGrandMaster-${id}`}
            name="isPastGrandMaster"
            checked={!!mason.isPastGrandMaster}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
          />
          <label htmlFor={`isPastGrandMaster-${id}`} className="ml-2 block text-sm text-slate-900">
            Past Grand Master?
          </label>
        </div>
      </div>
    </div>
  );
};

export default MasonGrandLodgeFields;