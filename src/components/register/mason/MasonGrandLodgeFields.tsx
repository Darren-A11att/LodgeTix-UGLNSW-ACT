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
  // Internal definitions for GL options
  const grandOfficerStatusOptions = ["Current", "Past"]; // For the Officer status dropdown
  const grandOfficeOptions = [
    "Grand Master",
    "Deputy Grand Master",
    "Assistant Grand Master",
    "Grand Secretary",
    "Grand Director of Ceremonies",
    "Other"
  ];
  
  // Show "Other" input field for Grand Office when "Other" is selected
  const showOtherGrandOfficeInput = mason.grandOfficer === 'Current' && mason.grandOffice === 'Other';

  // Interaction states
  const [grandRankInteracted, setGrandRankInteracted] = useState(false);
  const [grandOfficerInteracted, setGrandOfficerInteracted] = useState(false);
  const [grandOfficeInteracted, setGrandOfficeInteracted] = useState(false);
  const [grandOfficeOtherInteracted, setGrandOfficeOtherInteracted] = useState(false);

  // Combined handler for input/select
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange(id, name as keyof UnifiedAttendeeData, value);
  };

  return (
    <div className="grid grid-cols-12 gap-4 mb-4 bg-primary/5 p-4 rounded-md border border-primary/10">
      {/* Grand Rank Input */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`grandRank-${id}`}>
          Grand Rank {isPrimary && "*"}
        </label>
        <input
          type="text"
          id={`grandRank-${id}`}
          name="grandRank"
          value={mason.grandRank || ''}
          onChange={handleInputChange}
          onBlur={() => setGrandRankInteracted(true)}
          required={isPrimary && mason.rank === "GL"}
          maxLength={6}
          placeholder="PGRNK"
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${grandRankInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                     focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        />
      </div>
      
      {/* Grand Officer */}
      <div className="col-span-3">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`grandOfficer-${id}`}>
          Grand Officer {isPrimary && "*"}
        </label>
        <select
          id={`grandOfficer-${id}`}
          name="grandOfficer"
          value={mason.grandOfficer || 'Past'}
          onChange={handleInputChange}
          onBlur={() => setGrandOfficerInteracted(true)}
          required={isPrimary && mason.rank === "GL"}
          className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                     ${grandOfficerInteracted ? 'interacted' : ''} 
                     [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
        >
          {grandOfficerStatusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
      
      {/* Show Grand Office field if Current is selected */}
      {mason.grandOfficer === 'Current' && (
        <>
          <div className={`${showOtherGrandOfficeInput ? 'col-span-3' : 'col-span-3'}`}>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`grandOffice-${id}`}>
              Grand Office {isPrimary && "*"}
            </label>
            <select
              id={`grandOffice-${id}`}
              name="grandOffice"
              value={mason.grandOffice || ''}
              onChange={handleInputChange}
              onBlur={() => setGrandOfficeInteracted(true)}
              required={isPrimary && mason.rank === "GL" && mason.grandOfficer === 'Current'}
              className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                         ${grandOfficeInteracted ? 'interacted' : ''} 
                         [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
            >
              <option value="">Please Select</option>
              {grandOfficeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          {/* Show text field if "Other" is selected */}
          {showOtherGrandOfficeInput && (
            <div className="col-span-4">
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`grandOfficeOther-${id}`}>
                Other Grand Office {isPrimary && "*"}
              </label>
              <input
                type="text"
                id={`grandOfficeOther-${id}`}
                name="grandOfficeOther"
                value={mason.grandOfficeOther || ''}
                onChange={handleInputChange}
                onBlur={() => setGrandOfficeOtherInteracted(true)}
                placeholder=""
                required={isPrimary && mason.rank === "GL" && mason.grandOfficer === 'Current' && mason.grandOffice === 'Other'}
                className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                           ${grandOfficeOtherInteracted ? 'interacted' : ''} 
                           [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                           focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MasonGrandLodgeFields;