import React, { useEffect, useRef, useCallback } from 'react';
import AutocompleteInput, { BaseOption } from '../../functions/AutocompleteInput';
import { GrandLodgeRow } from '../../../../lib/api/grandLodges';
import { LodgeRow } from '../../../../lib/api/lodges';
import { MasonData } from '../../../../shared/types/register';
import { useLocationStore } from '../../../../store/locationStore';

interface MasonLodgeInfoProps {
  mason: MasonData;
  id: string;
  onChange: (id: string, field: string, value: string | boolean) => void;
  isPrimary: boolean;
  
  // New props for 'Use same lodge' checkbox
  useSameLodge: boolean;
  onUseSameLodgeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
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
  onChange,
  isPrimary,
  // Destructure new props
  useSameLodge,
  onUseSameLodgeChange,
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
  // Store IP data and cache info in refs to avoid re-renders
  const ipDataRef = useRef(useLocationStore.getState().ipData);
  const lodgeCacheRef = useRef(useLocationStore.getState().lodgeCache);
  
  // Subscribe to IP data and lodge cache updates
  useEffect(() => {
    return useLocationStore.subscribe(
      (state) => [state.ipData, state.lodgeCache],
      ([newIpData, newLodgeCache]) => {
        ipDataRef.current = newIpData;
        lodgeCacheRef.current = newLodgeCache;
      }
    );
  }, []);
  
  // Use refs to avoid re-renders from store selectors
  const storeRef = useRef({
    getLodgesByGrandLodge: useLocationStore.getState().getLodgesByGrandLodge
  });
  
  // Effect to load lodges for initial Grand Lodge - with one-time flag
  const didInitialLoadRef = useRef(false);
  
  useEffect(() => {
    // Only run once when selectedGrandLodge first becomes available
    if (selectedGrandLodge?.id && lodgeOptions.length === 0 && !isLoadingLodges) {
      // Don't use didInitialLoadRef to make sure we load lodges after navigation
      
      // This will use the cache if available without triggering state updates in the store
      const loadInitialLodges = async () => {
        try {
          await storeRef.current.getLodgesByGrandLodge(selectedGrandLodge.id);
          // The parent component handles the lodge options via props
        } catch (error) {
          console.error("Error loading initial lodges:", error);
        }
      };
      
      loadInitialLodges();
    }
  }, [selectedGrandLodge?.id, lodgeOptions.length, isLoadingLodges]);
  
  // Reset load flag when component unmounts
  useEffect(() => {
    return () => {
      didInitialLoadRef.current = false;
    };
  }, []);

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

  // Get better default placeholder based on user's location from IP
  // Using plain functions instead of useCallback to avoid circular dependencies
  const getGrandLodgePlaceholder = () => {
    const defaultPlaceholder = "Search Grand Lodge by name, country...";
    
    // If we have country data, suggest it in the placeholder
    if (ipDataRef.current?.country_name) {
      return `Search Grand Lodge in ${ipDataRef.current.country_name} or globally...`;
    }
    
    return defaultPlaceholder;
  };

  // Get better default placeholder based on lodge cache and user's location
  // Using plain functions instead of useCallback to avoid circular dependencies
  const getLodgePlaceholder = () => {
    if (!selectedGrandLodge) {
      return "Select Grand Lodge first";
    }
    
    if (!selectedGrandLodge.id) {
      return "Search Lodge name, number, town...";
    }
    
    // Check if we have cached lodges for this Grand Lodge - safely
    const cacheForGl = lodgeCacheRef.current?.byGrandLodge?.[selectedGrandLodge.id];
    const hasCachedLodges = cacheForGl?.data?.length > 0;
    
    if (hasCachedLodges) {
      return "Select from cached lodges or search...";
    }
    
    return "Search Lodge name, number, town...";
  };

  return (
    <div className="mb-4">
      {/* Render checkbox only for additional masons */}
      {!isPrimary && (
        <div className="mb-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useSameLodge}
              onChange={onUseSameLodgeChange}
              className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out rounded"
            />
            <span className="text-sm text-slate-700">Use same Lodge details as Primary Mason</span>
          </label>
        </div>
      )}
      
      {/* Conditionally render GL/Lodge inputs */}
      {/* Show if primary OR if additional and checkbox is NOT checked */}
      {(isPrimary || !useSameLodge) && (
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
              placeholder={getGrandLodgePlaceholder()}
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
                 placeholder={getLodgePlaceholder()}
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
      )}
    </div>
  );
};

export default MasonLodgeInfo;