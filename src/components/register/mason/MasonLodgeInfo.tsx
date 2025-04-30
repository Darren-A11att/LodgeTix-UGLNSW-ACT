import React from 'react';
import AutocompleteInput, { BaseOption } from '../AutocompleteInput';
import { GrandLodgeType } from '../../../shared/data/grandLodges';
import { LodgeRow } from '../../../lib/api/lodges';
import { MasonData } from '../../../shared/types/register';

interface MasonLodgeInfoProps {
  mason: MasonData;
  index: number;
  onChange: (index: number, field: string, value: string | boolean) => void;
  isPrimary: boolean;
  
  grandLodgeOptions: GrandLodgeType[];
  isLoadingGrandLodges: boolean;
  grandLodgeError: string | null;
  selectedGrandLodge: GrandLodgeType | null;
  handleGrandLodgeSelect: (grandLodge: GrandLodgeType | null) => void;
  onGrandLodgeFocus?: () => void;
  onGrandLodgeThresholdReached?: () => void;

  lodgeOptions: LodgeRow[];
  isLoadingLodges: boolean;
  lodgeError: string | null;
  selectedLodge: LodgeRow | null;
  handleLodgeSelect: (lodge: LodgeRow | null) => void;

  isCreatingLodgeUI: boolean;
  showLodgeNumberInput: boolean;
  handleInitiateLodgeCreation: (lodgeName: string) => void;
  newLodgeName: string;
  setNewLodgeName: (name: string) => void;
  newLodgeNumber: string;
  handleLodgeNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showSimilarLodgesWarning: boolean;
  similarLodges: LodgeRow[];
  handleSelectSimilarLodge: (lodge: LodgeRow) => void;
  handleCreateLodge: () => void;
  handleCancelLodgeCreation: () => void;
  isCreatingLodgeApi: boolean;
  createLodgeError: string | null;
}

const MasonLodgeInfo: React.FC<MasonLodgeInfoProps> = ({
  mason,
  index,
  onChange,
  isPrimary,
  grandLodgeOptions,
  isLoadingGrandLodges,
  grandLodgeError,
  selectedGrandLodge,
  handleGrandLodgeSelect,
  onGrandLodgeFocus,
  onGrandLodgeThresholdReached,
  lodgeOptions,
  isLoadingLodges,
  lodgeError,
  selectedLodge,
  handleLodgeSelect,
  isCreatingLodgeUI,
  showLodgeNumberInput,
  handleInitiateLodgeCreation,
  newLodgeName,
  setNewLodgeName,
  newLodgeNumber,
  handleLodgeNumberChange,
  showSimilarLodgesWarning,
  similarLodges,
  handleSelectSimilarLodge,
  handleCreateLodge,
  handleCancelLodgeCreation,
  isCreatingLodgeApi,
  createLodgeError
}) => {
  const handleGrandLodgeSelectInternal = (option: GrandLodgeType | null) => {
    handleGrandLodgeSelect(option);
  };

  const getGrandLodgeLabel = (option: GrandLodgeType): string => option.name;
  const getGrandLodgeValue = (option: GrandLodgeType): string => option.id;

  const renderGrandLodgeOption = (option: GrandLodgeType): React.ReactNode => (
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

  return (
    <div className="mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`grandLodge-${index}`}>
            Grand Lodge {isPrimary && "*"}
          </label>
          <AutocompleteInput<GrandLodgeType>
            id={`grandLodge-${index}`}
            name={`grandLodge-${index}`}
            value={selectedGrandLodge ? getGrandLodgeLabel(selectedGrandLodge) : ''}
            onChange={(value) => {
              onChange(index, 'grandLodge', value);
              if (selectedGrandLodge && value !== getGrandLodgeLabel(selectedGrandLodge)) {
                handleGrandLodgeSelectInternal(null);
              }
              if (value.length >= 10 && onGrandLodgeThresholdReached) {
                onGrandLodgeThresholdReached();
              }
            }}
            onSelect={handleGrandLodgeSelectInternal}
            options={grandLodgeOptions}
            getOptionLabel={getGrandLodgeLabel}
            getOptionValue={getGrandLodgeValue}
            placeholder="Start typing to search Grand Lodges..."
            required={isPrimary}
            renderOption={renderGrandLodgeOption}
            onFocus={onGrandLodgeFocus}
            isLoading={isLoadingGrandLodges}
            error={grandLodgeError}
          />
        </div>
        
        <div className={`${!selectedGrandLodge ? 'opacity-50' : ''}`}>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`lodge-${index}`}>
             {getUILodgeLabel()}
          </label>
          {!isCreatingLodgeUI && (
             <AutocompleteInput<LodgeRow>
               id={`lodge-${index}`}
               name={`lodge-${index}`}
               value={selectedLodge ? getLodgeLabelForOption(selectedLodge) : ''}
               onChange={(value) => {
                 onChange(index, 'lodge', value);
                 if (selectedLodge && value !== getLodgeLabelForOption(selectedLodge)) {
                   handleLodgeSelectInternal(null);
                 }
               }}
               onSelect={handleLodgeSelectInternal}
               onCreateNew={handleInitiateLodgeCreation}
               options={lodgeOptions}
               getOptionLabel={getLodgeLabelForOption}
               getOptionValue={getLodgeValue}
               placeholder={selectedGrandLodge ? "Search or Create Lodge..." : "Select Grand Lodge first"}
               required={isPrimary}
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
                 <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`newLodgeName-${index}`}>
                   Lodge Name *
                 </label>
                 <input
                   type="text"
                   id={`newLodgeName-${index}`}
                   name={`newLodgeName-${index}`}
                   value={newLodgeName}
                   onChange={(e) => setNewLodgeName(e.target.value)}
                   required
                   className="w-full px-3 py-1.5 border border-green-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                   placeholder="Enter the lodge name"
                 />
               </div>
               
               <div className="mb-4">
                 <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`newLodgeNumber-${index}`}>
                   Lodge Number 
                 </label>
                 <input
                   type="text"
                   id={`newLodgeNumber-${index}`}
                   name={`newLodgeNumber-${index}`}
                   value={newLodgeNumber}
                   onChange={handleLodgeNumberChange}
                   className="w-full px-3 py-1.5 border border-green-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                   placeholder="Enter lodge number (optional)"
                 />
               </div>
               
               {showSimilarLodgesWarning && similarLodges.length > 0 && (
                 <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mb-4 text-sm">
                   <h5 className="font-medium text-yellow-800 mb-2">Similar Lodge Found:</h5>
                   <p className="text-yellow-700 mb-3">
                     A lodge with number {newLodgeNumber} already exists in {selectedGrandLodge.name}.
                   </p>
                   <ul className="mb-4 space-y-2">
                     {similarLodges.map(lodge => (
                       <li key={lodge.id} className="flex items-center justify-between bg-white p-2 rounded border border-yellow-100">
                         <span className="font-medium">{lodge.display_name ?? `${lodge.name} No. ${lodge.number}`}</span>
                         <button
                           type="button"
                           onClick={() => handleSelectSimilarLodge(lodge)}
                           className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                         >
                           Select This One
                         </button>
                       </li>
                     ))}
                   </ul>
                    <p className="text-yellow-700">If this isn't correct, proceed to create the new lodge.</p>
                 </div>
               )}
               
               {createLodgeError && <div className="text-sm text-red-500 mb-2">{createLodgeError}</div>}
               
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
                   onClick={handleCreateLodge}
                   disabled={!newLodgeName || isCreatingLodgeApi}
                   className={`px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 ${
                     !newLodgeName || isCreatingLodgeApi ? 'opacity-50 cursor-not-allowed' : ''
                   }`}
                 >
                   {isCreatingLodgeApi ? 'Creating...' : 'Create Lodge'}
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