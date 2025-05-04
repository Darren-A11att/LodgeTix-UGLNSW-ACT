import React, { useEffect, useRef, useCallback } from 'react';
import AutocompleteInput, { BaseOption } from '../AutocompleteInput';
import { GrandLodgeRow } from '../../../lib/api/grandLodges';
import { LodgeRow } from '../../../lib/api/lodges';
import { UnifiedAttendeeData } from '../../../store/registrationStore';

interface MasonLodgeInfoProps {
  mason: UnifiedAttendeeData;
  id: string;
  isPrimary: boolean;
  
  grandLodgeOptions: GrandLodgeRow[];
  isLoadingGrandLodges: boolean;
  grandLodgeError: string | null;
  selectedGrandLodge: GrandLodgeRow | null;
  handleGrandLodgeSelect: (grandLodge: GrandLodgeRow | null) => void;
  grandLodgeInputValue: string;
  onGrandLodgeInputChange: (value: string) => void;

  lodgeOptions: LodgeRow[];
  isLoadingLodges: boolean;
  lodgeError: string | null;
  selectedLodge: LodgeRow | null;
  handleLodgeSelect: (lodge: LodgeRow | null) => void;
  lodgeInputValue: string;
  onLodgeInputChange: (value: string) => void;

  isCreatingLodgeUI: boolean;
  showLodgeNumberInput: boolean;
  handleInitiateLodgeCreation: (lodgeName: string) => void;
  newLodgeName: string;
  setNewLodgeName: (name: string) => void;
  newLodgeNumber: string;
  handleLodgeNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCancelLodgeCreation: () => void;
  onConfirmNewLodge: (details: { name: string; number: string }) => void;
}

const MasonLodgeInfo: React.FC<MasonLodgeInfoProps> = ({
  mason,
  id,
  isPrimary,
  grandLodgeOptions,
  isLoadingGrandLodges,
  grandLodgeError,
  selectedGrandLodge,
  handleGrandLodgeSelect,
  grandLodgeInputValue,
  onGrandLodgeInputChange,
  lodgeOptions,
  isLoadingLodges,
  lodgeError,
  selectedLodge,
  handleLodgeSelect,
  lodgeInputValue,
  onLodgeInputChange,
  isCreatingLodgeUI,
  showLodgeNumberInput,
  handleInitiateLodgeCreation,
  newLodgeName,
  setNewLodgeName,
  newLodgeNumber,
  handleLodgeNumberChange,
  handleCancelLodgeCreation,
  onConfirmNewLodge
}) => {
  const handleGrandLodgeSelectInternal = (option: GrandLodgeRow | null) => {
    handleGrandLodgeSelect(option);
  };

  const getGrandLodgeLabel = (option: GrandLodgeRow): string => option.name;
  const getGrandLodgeValue = (option: GrandLodgeRow): string => option.id;

  const renderGrandLodgeOption = (option: GrandLodgeRow): React.ReactNode => (
    <div>
      <div className="font-medium">{option.name}</div>
      <div className="text-xs text-slate-500 flex justify-between">
        <span>{option.country ?? 'N/A'}</span> 
        {option.abbreviation && <span className="font-medium">{option.abbreviation}</span>}
      </div>
    </div>
  );

  const handleLodgeSelectInternal = (option: LodgeRow | null) => {
    handleLodgeSelect(option);
  };

  const getLodgeLabelForOption = (option: LodgeRow): string => option.display_name ?? `${option.name} No. ${option.number ?? 'N/A'}`;
  const getLodgeValue = (option: LodgeRow): string => option.id;

  const renderLodgeOption = (option: LodgeRow): React.ReactNode => (
    <div>
      <div className="font-medium">{option.display_name ?? `${option.name} No. ${option.number ?? 'N/A'}`}</div>
      {(option.district || option.meeting_place) && (
         <div className="text-xs text-slate-500 flex justify-between">
           <span>{option.district ?? ''}</span>
           <span className="truncate text-right">{option.meeting_place ?? ''}</span>
         </div>
      )}
    </div>
  );
  
  const getUILodgeLabel = () => {
      if (isCreatingLodgeUI) return "Create New Lodge";
      return `Lodge Name & Number ${isPrimary ? "*" : ""}`;
  }

  const handleConfirmClick = () => {
    if (newLodgeName && newLodgeNumber) {
        onConfirmNewLodge({ name: newLodgeName, number: newLodgeNumber });
    }
  };

  return (
    <div className="mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`grandLodge-${id}`}>
            Grand Lodge {isPrimary && "*"}
          </label>
          <AutocompleteInput<GrandLodgeRow>
            id={`grandLodge-${id}`}
            name={`grandLodge-${id}`}
            value={grandLodgeInputValue || ''}
            onChange={onGrandLodgeInputChange}
            onSelect={handleGrandLodgeSelectInternal}
            options={grandLodgeOptions}
            getOptionLabel={getGrandLodgeLabel}
            getOptionValue={getGrandLodgeValue}
            placeholder="Search Grand Lodge by name, country..."
            required={isPrimary}
            renderOption={renderGrandLodgeOption}
            isLoading={isLoadingGrandLodges}
            error={grandLodgeError}
          />
        </div>
        
        <div className={`${!selectedGrandLodge ? 'opacity-50' : ''}`}>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`lodge-${id}`}>
             {getUILodgeLabel()}
          </label>
          {!isCreatingLodgeUI && (
             <AutocompleteInput<LodgeRow>
               id={`lodge-${id}`}
               name={`lodge-${id}`}
               value={lodgeInputValue || ''}
               onChange={onLodgeInputChange}
               onSelect={handleLodgeSelectInternal}
               onCreateNew={handleInitiateLodgeCreation}
               options={lodgeOptions}
               getOptionLabel={getLodgeLabelForOption}
               getOptionValue={getLodgeValue}
               placeholder="Search Lodge Name or Number..."
               required={isPrimary && !isCreatingLodgeUI}
               renderOption={renderLodgeOption}
               allowCreate={true}
               createNewText="Create new Lodge..."
               isLoading={isLoadingLodges}
               error={lodgeError}
               disabled={!selectedGrandLodge}
             />
          )}
          
           {isCreatingLodgeUI && selectedGrandLodge && (
             <div className="bg-green-50 p-4 rounded-md border border-green-100 mt-1"> 
               <div className="mb-4">
                 <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`newLodgeName-${id}`}>
                   Lodge Name *
                 </label>
                 <input
                   type="text"
                   id={`newLodgeName-${id}`}
                   name={`newLodgeName-${id}`}
                   value={newLodgeName}
                   onChange={(e) => setNewLodgeName(e.target.value)}
                   required
                   className="w-full px-3 py-1.5 border border-green-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                   placeholder="Enter the lodge name"
                 />
               </div>
               
               <div className="mb-4">
                 <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`newLodgeNumber-${id}`}>
                   Lodge Number *
                 </label>
                 <input
                   type="number"
                   id={`newLodgeNumber-${id}`}
                   name={`newLodgeNumber-${id}`}
                   value={newLodgeNumber}
                   onChange={handleLodgeNumberChange}
                   required
                   className="w-full px-3 py-1.5 border border-green-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                   placeholder="Enter lodge number"
                 />
               </div>
               
               <div className="flex justify-end space-x-2">
                 <button
                   type="button"
                   onClick={handleCancelLodgeCreation}
                   className="px-3 py-1 text-sm text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
                 >
                   Cancel
                 </button>
                 <button
                   type="button"
                   onClick={handleConfirmClick}
                   disabled={!newLodgeName || !newLodgeNumber}
                   className={`px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 ${
                     (!newLodgeName || !newLodgeNumber) ? 'opacity-50 cursor-not-allowed' : ''
                   }`}
                 >
                   Confirm New Lodge
                 </button>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default MasonLodgeInfo;