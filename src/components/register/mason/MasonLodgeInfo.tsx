import React from 'react';
import AutocompleteInput from '../AutocompleteInput';
import { GrandLodgeType, grandLodges } from '../../../shared/data/grandLodges';
import { LodgeType } from '../../../shared/data/lodges';
import { MasonData } from '../../../shared/types/register';

interface MasonLodgeInfoProps {
  mason: MasonData;
  index: number;
  onChange: (index: number, field: string, value: string | boolean) => void;
  isPrimary: boolean;
  selectedGrandLodge: GrandLodgeType | null;
  handleGrandLodgeSelect: (grandLodge: GrandLodgeType) => void;
  isCreatingLodge: boolean;
  showLodgeNumberInput: boolean;
  filteredLodges: LodgeType[];
  handleLodgeSelect: (lodge: LodgeType) => void;
  handleInitiateLodgeCreation: (lodgeName: string) => void;
  newLodgeName: string;
  setNewLodgeName: (name: string) => void;
  newLodgeNumber: string;
  handleLodgeNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showSimilarLodgesWarning: boolean;
  similarLodges: LodgeType[];
  handleSelectSimilarLodge: (lodge: LodgeType) => void;
  handleCreateLodge: () => void;
  handleCancelLodgeCreation: () => void;
}

const MasonLodgeInfo: React.FC<MasonLodgeInfoProps> = ({
  mason,
  index,
  onChange,
  isPrimary,
  selectedGrandLodge,
  handleGrandLodgeSelect,
  isCreatingLodge,
  showLodgeNumberInput,
  filteredLodges,
  handleLodgeSelect,
  handleInitiateLodgeCreation,
  newLodgeName,
  setNewLodgeName,
  newLodgeNumber,
  handleLodgeNumberChange,
  showSimilarLodgesWarning,
  similarLodges,
  handleSelectSimilarLodge,
  handleCreateLodge,
  handleCancelLodgeCreation
}) => {
  // Format Grand Lodge option for display in dropdown
  const renderGrandLodgeOption = (option: GrandLodgeType) => (
    <div>
      <div className="font-medium">{option.name}</div>
      <div className="text-xs text-slate-500 flex justify-between">
        <span>{option.country}</span>
        {option.abbreviation && <span className="font-medium">{option.abbreviation}</span>}
      </div>
    </div>
  );

  // Format Lodge option for display in dropdown
  const renderLodgeOption = (option: LodgeType) => (
    <div>
      <div className="font-medium">{option.displayName}</div>
    </div>
  );

  return (
    <div className="mb-4">
      {/* Grand Lodge and Lodge Name & Number on the same line */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Grand Lodge Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`grandLodge-${index}`}>
            Grand Lodge {isPrimary && "*"}
          </label>
          <AutocompleteInput
            id={`grandLodge-${index}`}
            name={`grandLodge-${index}`}
            value={mason.grandLodge}
            onChange={(value) => onChange(index, 'grandLodge', value)}
            onSelect={handleGrandLodgeSelect}
            options={grandLodges}
            getOptionLabel={(option: GrandLodgeType) => option.name}
            getOptionValue={(option: GrandLodgeType) => option.id}
            placeholder="Start typing to search Grand Lodges..."
            required={isPrimary}
            renderOption={renderGrandLodgeOption}
          />
        </div>
        
        {/* Lodge Name & Number */}
        {selectedGrandLodge && !isCreatingLodge && !showLodgeNumberInput && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`lodge-${index}`}>
              Lodge Name & Number {isPrimary && "*"}
            </label>
            <AutocompleteInput
              id={`lodge-${index}`}
              name={`lodge-${index}`}
              value={mason.lodge}
              onChange={(value) => onChange(index, 'lodge', value)}
              onSelect={handleLodgeSelect}
              onCreateNew={handleInitiateLodgeCreation}
              options={filteredLodges}
              getOptionLabel={(option: LodgeType) => option.displayName}
              getOptionValue={(option: LodgeType) => option.id}
              placeholder="Start typing to search lodges..."
              required={isPrimary}
              renderOption={renderLodgeOption}
              allowCreate={true}
              createNewText="Create new Lodge"
            />
          </div>
        )}
      </div>
      
      {/* Lodge Creation Form */}
      {selectedGrandLodge && showLodgeNumberInput && (
        <div className="bg-green-50 p-4 rounded-md border border-green-100 mb-4">
          <h4 className="font-bold text-green-800 mb-4">Creating New Lodge</h4>
          
          {/* Lodge Name Field */}
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
              className="w-full px-4 py-2 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400/50"
              placeholder="Enter the lodge name"
            />
          </div>
          
          {/* Lodge Number Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`newLodgeNumber-${index}`}>
              Lodge Number *
            </label>
            <input
              type="text"
              id={`newLodgeNumber-${index}`}
              name={`newLodgeNumber-${index}`}
              value={newLodgeNumber}
              onChange={handleLodgeNumberChange}
              required
              className="w-full px-4 py-2 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400/50"
              placeholder="Enter lodge number"
            />
          </div>
          
          {/* Similar lodge warning if exists */}
          {showSimilarLodgesWarning && similarLodges.length > 0 && (
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mb-4">
              <h5 className="font-medium text-yellow-800 mb-2">Similar lodges found:</h5>
              <p className="text-sm text-yellow-700 mb-3">
                We found {similarLodges.length} lodge{similarLodges.length !== 1 ? 's' : ''} with the same number. 
                Please confirm if you'd like to select one of these or create a new lodge.
              </p>
              <ul className="mb-4 space-y-2">
                {similarLodges.map(lodge => (
                  <li key={lodge.id} className="flex items-center justify-between bg-white p-2 rounded border border-yellow-100">
                    <span className="font-medium">{lodge.displayName}</span>
                    <button
                      type="button"
                      onClick={() => handleSelectSimilarLodge(lodge)}
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      Select This Lodge
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <p className="text-sm text-slate-600 mb-4">
            You are creating a new lodge record for {selectedGrandLodge.name}.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancelLodgeCreation}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateLodge}
              disabled={!newLodgeName || !newLodgeNumber}
              className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${
                !newLodgeName || !newLodgeNumber ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Create Lodge
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasonLodgeInfo;