import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import 'react-phone-input-2/lib/style.css';
import { MasonData, LadyPartnerData, AttendeeTicket } from '../../shared/types/register';
import LadyPartnerForm from './LadyPartnerForm';
import { GrandLodgeRow } from '../../lib/api/grandLodges';
import { getLodgesByGrandLodgeId, createLodge, LodgeRow } from '../../lib/api/lodges';
import { LodgeType } from '../../shared/data/lodges';
import MasonBasicInfo from './mason/MasonBasicInfo';
import MasonGrandLodgeFields from './mason/MasonGrandLodgeFields';
import MasonLodgeInfo from './mason/MasonLodgeInfo';
import MasonContactInfo from './mason/MasonContactInfo';
import MasonAdditionalInfo from './mason/MasonAdditionalInfo';
import LadyPartnerToggle from './mason/LadyPartnerToggle';
import { FaTrash } from 'react-icons/fa';
import PhoneInputWrapper from './PhoneInputWrapper';
import { useLocationStore } from '../../store/locationStore';

// Helper function to convert LodgeType to LodgeRow
const convertToLodgeRow = (lodge: LodgeType): LodgeRow => ({
  id: lodge.id,
  name: lodge.name,
  number: lodge.number,
  display_name: lodge.display_name,
  grand_lodge_id: lodge.grand_lodge_id,
  district: lodge.district || null,
  meeting_place: lodge.meeting_place || null,
  area_type: lodge.area_type || null,
  created_at: lodge.created_at || new Date().toISOString(),
});

// Revert to simpler onChange type, potentially use assertion where needed
type SimpleOnChange = (index: number, field: string, value: string | boolean) => void;

interface MasonFormProps {
  mason: MasonData;
  index: number;
  onChange: (index: number, field: keyof MasonData | keyof LadyPartnerData, value: string | boolean | AttendeeTicket | null) => void;
  isPrimary?: boolean;
  isSameLodgeAsFirst?: boolean;
  onToggleSameLodge?: (isSame: boolean) => void;
  onToggleHasLadyPartner?: (hasPartner: boolean) => void;
  ladyPartnerIndex?: number;
  updateLadyPartnerField?: (partnerIndex: number, field: keyof LadyPartnerData, value: string | boolean) => void;
  ladyPartnerData?: LadyPartnerData;
  primaryMasonData?: MasonData;
  onRemove?: (index: number) => void;
}

const MasonForm: React.FC<MasonFormProps> = ({
  mason,
  index,
  onChange,
  isPrimary = false,
  isSameLodgeAsFirst = false,
  onToggleSameLodge,
  onToggleHasLadyPartner,
  ladyPartnerIndex,
  updateLadyPartnerField,
  ladyPartnerData,
  primaryMasonData,
  onRemove
}) => {
  // --- Store Data ---
  const grandLodges = useLocationStore((state) => state.grandLodges);
  const isLoadingGrandLodges = useLocationStore((state) => state.isLoadingGrandLodges);
  const grandLodgeError = useLocationStore((state) => state.grandLodgeError);
  const searchGrandLodges = useLocationStore((state) => state.searchGrandLodges);
  
  // --- Component Constants ---
  const titles = ["Bro", "W Bro", "VW Bro", "RW Bro", "MW Bro"];
  const ranks = [
    { value: "EAF", label: "EAF" },
    { value: "FCF", label: "FCF" },
    { value: "MM", label: "MM" },
    { value: "IM", label: "IM" },
    { value: "GL", label: "GL" }
  ];

  // --- LOCAL State Variables --- 
  const [lodgeOptions, setLodgeOptions] = useState<LodgeRow[]>([]); 
  const [isLoadingLodges, setIsLoadingLodges] = useState(false);
  const [lodgeError, setLodgeError] = useState<string | null>(null);
  const [selectedGrandLodge, setSelectedGrandLodge] = useState<GrandLodgeRow | null>(null); 
  const [selectedLodge, setSelectedLodge] = useState<LodgeRow | null>(null); 
  const [showLodgeNumberInput, setShowLodgeNumberInput] = useState(false);
  const initialGrandLodgeRef = useRef(mason.grandLodge);
  const initialLodgeRef = useRef(mason.lodge);
  const [grandLodgeInputValue, setGrandLodgeInputValue] = useState('');
  const [lodgeInputValue, setLodgeInputValue] = useState('');
  
  // Restore state for lodge creation UI
  const [isCreatingLodgeUI, setIsCreatingLodgeUI] = useState(false); 
  const [newLodgeName, setNewLodgeName] = useState('');
  const [newLodgeNumber, setNewLodgeNumber] = useState('');

  // Check if the title is one that should automatically select GL rank
  const isGrandTitle = (title: string) => {
    return ["VW Bro", "RW Bro", "MW Bro"].includes(title);
  };

  // --- Effects --- 
  // Effect for Grand Rank
  useEffect(() => {
    if (isGrandTitle(mason.title) && mason.rank !== "GL") {
      onChange(index, 'rank' as keyof MasonData, 'GL');
    }
  }, [mason.title, mason.rank, index, onChange]); // Added mason.rank dependency

  // Effect for pre-selecting Grand Lodge (using initial value)
  const hasAttemptedGLPreselection = useRef(false); 
  useEffect(() => {
    const initialGL = initialGrandLodgeRef.current; // Use initial value
    if (
      !isLoadingGrandLodges && 
      grandLodges.length > 0 && 
      !selectedGrandLodge && 
      initialGL && // Check if initial value exists
      !hasAttemptedGLPreselection.current
    ) {
        hasAttemptedGLPreselection.current = true; 
        const found = grandLodges.find((gl: GrandLodgeRow) => 
            gl.name.toLowerCase() === initialGL.toLowerCase() ||
            (gl.abbreviation && gl.abbreviation.toLowerCase() === initialGL.toLowerCase())
        );
        if (found) {
            console.log("Pre-selecting Grand Lodge:", found.name);
            setSelectedGrandLodge(found);
        } else {
            console.warn(`Pre-selection: Initial Grand Lodge string '${initialGL}' not found.`);
        }
    }
  }, [isLoadingGrandLodges, grandLodges, selectedGrandLodge]); // REMOVED mason.grandLodge dependency

  // Effect for fetching/searching Lodges - Now ONLY runs when Grand Lodge changes
  useEffect(() => {
    if (selectedGrandLodge?.id) {
      setLodgeInputValue('');
      setSelectedLodge(null);
      debouncedLodgeSearch(''); 
    } else {
      setLodgeOptions([]);
      setSelectedLodge(null); 
      setLodgeInputValue('');
      setIsLoadingLodges(false);
      setLodgeError(null);
    }
  }, [selectedGrandLodge?.id]);

  // Effect to initialize lodgeInputValue based on mason data (including pending)
  // This runs separately and later, potentially after initial load
  useEffect(() => {
    if (mason.isPendingNewLodge && mason.lodge?.endsWith('##PENDING')) {
      const parts = mason.lodge.split('##');
      if (parts.length >= 3) {
        setLodgeInputValue(`${parts[0]} No. ${parts[1]}`); // Initialize without (Pending)
      }
    } else if (mason.lodge) {
      // If not pending, try to find selected lodge in options or use mason.lodge string
      const foundLodge = lodgeOptions.find(l => (l.display_name || `${l.name} No. ${l.number || 'N/A'}`) === mason.lodge);
      if (foundLodge) {
        setSelectedLodge(foundLodge);
        setLodgeInputValue(mason.lodge);
      } else {
        setLodgeInputValue(mason.lodge); // Use raw string if not found (might happen on initial load)
      }
    } else {
      setLodgeInputValue(''); // Clear if no lodge or pending lodge
    }
  }, [mason.lodge, mason.isPendingNewLodge, lodgeOptions]);

  // --- Handlers --- 
  // Reset Lodge Creation UI 
  const resetLodgeCreationUI = useCallback(() => {
    setIsCreatingLodgeUI(false);
    setNewLodgeName('');
    setNewLodgeNumber('');
    setShowLodgeNumberInput(false);
  }, []);

  // Grand Lodge selection handler (defined BEFORE handleGrandLodgeInputChange)
  const handleGrandLodgeSelect = useCallback((grandLodge: GrandLodgeRow | null) => { 
    if (selectedGrandLodge?.id !== grandLodge?.id) {
      setSelectedGrandLodge(grandLodge);
      const glName = grandLodge ? grandLodge.name : ''; // Use only .name
      setGrandLodgeInputValue(glName); // Sync input value on selection
      onChange(index, 'grandLodge' as keyof MasonData, glName);
      onChange(index, 'lodge' as keyof MasonData, '');
      setSelectedLodge(null);
      resetLodgeCreationUI();
    }
  }, [selectedGrandLodge, onChange, index, resetLodgeCreationUI]);

  // Debounced search function
  const debouncedSearch = useDebouncedCallback((term: string) => {
    searchGrandLodges(term);
  }, 300); // Debounce for 300ms

  // Handler for Grand Lodge input changes (defined AFTER handleGrandLodgeSelect)
  const handleGrandLodgeInputChange = useCallback((value: string) => {
    setGrandLodgeInputValue(value); // Update local input state
    // Deselect GL if input changes after selection
    if (selectedGrandLodge && value !== selectedGrandLodge.name) { // Use only .name
      handleGrandLodgeSelect(null); // Safe to call now
    }
    debouncedSearch(value); // Trigger debounced search
  }, [debouncedSearch, selectedGrandLodge, handleGrandLodgeSelect]);

  const checkAndFetchAllGrandLodges = useCallback(() => {
      if (!isLoadingGrandLodges) {
          searchGrandLodges(''); 
      }
  }, [isLoadingGrandLodges, searchGrandLodges]);

  // Debounced Lodge Search Function
  const debouncedLodgeSearch = useDebouncedCallback(async (term: string) => {
    if (!selectedGrandLodge?.id) {
      setLodgeOptions([]);
      return; // Don't search without a GL
    }
    setIsLoadingLodges(true);
    setLodgeError(null);
    try {
      // API call now handles numeric vs text search internally
      const data = await getLodgesByGrandLodgeId(selectedGrandLodge.id, term);
      const convertedData = data.map(convertToLodgeRow);
      setLodgeOptions(convertedData);
    } catch (error) {
      console.error(`Error searching lodges for GL ${selectedGrandLodge.id}:`, error);
      setLodgeError("Failed to search Lodges.");
      setLodgeOptions([]);
    } finally {
      setIsLoadingLodges(false);
    }
  }, 300); // Debounce for 300ms

  // Lodge selection handler
  const handleLodgeSelect = useCallback((lodge: LodgeRow | null) => { 
    if (selectedLodge?.id !== lodge?.id) {
        setSelectedLodge(lodge);
        const displayValue = lodge ? (lodge.display_name || `${lodge.name} No. ${lodge.number || 'N/A'}`) : '';
        setLodgeInputValue(displayValue);
        onChange(index, 'lodge' as keyof MasonData, displayValue);
        onChange(index, 'isPendingNewLodge', false);
        resetLodgeCreationUI();
    }
  }, [selectedLodge, onChange, index, resetLodgeCreationUI]);
  
  // Start the UI part of lodge creation
  const handleInitiateLodgeCreation = useCallback((initialLodgeName: string) => {
    if (!selectedGrandLodge) return; 
    setIsCreatingLodgeUI(true);
    setNewLodgeName(initialLodgeName);
    setNewLodgeNumber('');
    setShowLodgeNumberInput(true);
    setLodgeInputValue(''); // Clear existing input
    setIsLoadingLodges(false);
    setLodgeError(null);
  }, [selectedGrandLodge]);

  // Handle Lodge Number input change
  const handleLodgeNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLodgeNumber(e.target.value);
    // No need to check similar lodges here anymore
  }, []);

  // Handle selecting a similar lodge
  const handleSelectSimilarLodge = useCallback((lodge: LodgeRow) => { 
    handleLodgeSelect(lodge); // Reuse existing lodge select logic
  }, [handleLodgeSelect]);

  // Cancel lodge creation UI
  const handleCancelLodgeCreation = useCallback(() => {
    resetLodgeCreationUI();
  }, [resetLodgeCreationUI]);

  // Confirm New Lodge Details Handler
  const handleConfirmNewLodge = useCallback((details: { name: string; number: string }) => {
    if (!selectedGrandLodge?.id) return;

    const pendingDetails = { 
        name: details.name, 
        number: details.number, 
        grandLodgeId: selectedGrandLodge.id 
    };
    
    onChange(index, 'isPendingNewLodge', true);
    onChange(index, 'lodge', `${details.name}##${details.number}##${selectedGrandLodge.id}##PENDING`); 

    setSelectedLodge(null);
    resetLodgeCreationUI();

    setLodgeInputValue(`${details.name} No. ${details.number}`); 

  }, [index, onChange, resetLodgeCreationUI, selectedGrandLodge?.id]);

  // Phone change handler
  const handlePhoneChange = useCallback((value: string) => {
    onChange(index, 'phone' as keyof MasonData, value);
  }, [onChange, index]);

  // Checkbox change handler
  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onToggleSameLodge) {
      onToggleSameLodge(e.target.checked);
    }
  }, [onToggleSameLodge]);

  // Lady Partner toggle handler
  const handleLadyPartnerToggle = useCallback(() => {
    if (onToggleHasLadyPartner) {
      onToggleHasLadyPartner(!ladyPartnerData); 
    }
  }, [onToggleHasLadyPartner, ladyPartnerData]);
  
  // Remove Lady Partner handler
  const handleRemoveLadyPartner = useCallback(() => {
    if (onToggleHasLadyPartner) {
      onToggleHasLadyPartner(false); 
    }
  }, [onToggleHasLadyPartner]);

  // Handle title change and automatically set rank 
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTitle = e.target.value;
    onChange(index, 'title', newTitle);
    
    // If selecting a Grand title, automatically set rank to GL
    if (isGrandTitle(newTitle)) {
      if (mason.rank !== 'GL') onChange(index, 'rank', 'GL');
    } 
    // If selecting W Bro, set rank to IM
    else if (newTitle === 'W Bro') {
      if (mason.rank !== 'IM') onChange(index, 'rank', 'IM');
    }
    // No change for other titles like "Bro"

  }, [index, onChange, mason.rank]);

  // Simple onChange wrapper for basic fields
  const simpleOnChange: SimpleOnChange = useCallback((idx, field, value) => {
      onChange(idx, field as keyof MasonData, value);
  }, [onChange]);

  // Confirmation message getter
  const getConfirmationMessage = useCallback(() => {
      if (!primaryMasonData) return "";
      const primaryFullName = `${primaryMasonData.firstName} ${primaryMasonData.lastName}`;
      if (mason.contactPreference === "Primary Attendee") {
          return `I confirm that ${primaryFullName} will be responsible for all communication...`;
      } else if (mason.contactPreference === "Provide Later") {
          return `I confirm that ${primaryFullName} will be responsible... until updated...`;
      }
      return "";
  }, [primaryMasonData, mason.contactPreference]);

  // Simplified onChange handler for Basic Info
  const handleBasicInfoChange = useCallback((field: keyof MasonData, value: string | boolean) => {
    onChange(index, field, value);
  }, [index, onChange]);

  // Lodge Input Change Handler
  const handleLodgeInputChange = useCallback((value: string) => {
    setLodgeInputValue(value);
    if (selectedLodge || mason.isPendingNewLodge) {
       // Reconstruct expected display value if pending
       const currentDisplay = selectedLodge 
        ? (selectedLodge.display_name || `${selectedLodge.name} No. ${selectedLodge.number || 'N/A'}`) 
        : mason.isPendingNewLodge && mason.lodge?.endsWith('##PENDING')
          ? `${mason.lodge.split('##')[0]} No. ${mason.lodge.split('##')[1]}` // Reconstruct without (Pending)
          : ''; // Or maybe compare against raw mason.lodge? Check this logic.

      // Clear state if input value no longer matches the selected/pending display value
      if (value !== currentDisplay && currentDisplay !== '') { // Added check for empty currentDisplay
          setSelectedLodge(null);
          onChange(index, 'isPendingNewLodge', false); 
          if (mason.lodge?.endsWith('##PENDING')) {
             onChange(index, 'lodge', ''); // Clear special string
          }
      }
    }
    
    // Trigger search via debounce
    if (selectedGrandLodge?.id) {
      debouncedLodgeSearch(value);
    } else {
      // Clear options if GL is not selected and user types
      setLodgeOptions([]); 
    }
  }, [debouncedLodgeSearch, selectedLodge, selectedGrandLodge?.id, mason.isPendingNewLodge, mason.lodge, onChange, index]);

  // --- Render Logic --- 
  // Remove the helper function, as the logic is integrated into useEffect and handlers
  // const getLodgeDisplayValue = () => { ... };

  return (
    <div className="bg-slate-50 p-6 rounded-lg mb-8 relative">
       {/* Restore Header & Remove Button */}
       <div className="flex justify-between items-center mb-4">
         <h3 className="text-xl font-semibold text-gray-700">
           {isPrimary ? 'Primary Mason Attendee' : `Additional Mason ${index}`}
         </h3>
         {!isPrimary && onRemove && (
           <button 
             onClick={() => onRemove(index)} 
             className="text-red-500 hover:text-red-700 transition-colors text-sm flex items-center"
             aria-label={`Remove Additional Mason ${index}`}
           >
             <FaTrash className="mr-1" /> Remove
           </button>
         )}
       </div>

       {/* Basic Info */} 
       <MasonBasicInfo 
          mason={mason} index={index} isPrimary={isPrimary} 
          onChange={(idx, field, value) => handleBasicInfoChange(field as keyof MasonData, value)} 
          handleTitleChange={handleTitleChange}
          titles={titles}
          ranks={ranks}
       />
       
       {/* Grand Lodge Fields - Conditional rendering & NO extra props */}
       {mason.rank === 'GL' && (
         <MasonGrandLodgeFields 
            mason={mason} 
            index={index} 
            onChange={(idx, field, value) => handleBasicInfoChange(field as keyof MasonData, value)} 
            isPrimary={isPrimary}
         />
       )}

       {/* Restore Lodge Info Toggle */} 
       {!isPrimary && onToggleSameLodge && (
          <div className="mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
               <input
                 type="checkbox"
                 checked={isSameLodgeAsFirst} // Ensure this prop is passed correctly
                 onChange={handleCheckboxChange} // Use the restored handler
                 className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
               />
               <span className="text-sm font-medium text-gray-700">Same Lodge as Primary Mason</span>
             </label>
          </div>
       )}

       {/* Lodge Info Section - Pass new props */} 
       {(!isSameLodgeAsFirst || isPrimary) && (
          <MasonLodgeInfo 
              mason={mason}
              index={index}
              onChange={simpleOnChange} 
              isPrimary={isPrimary}
              
              // Grand Lodge Props
              grandLodgeOptions={grandLodges} 
              isLoadingGrandLodges={isLoadingGrandLodges}
              grandLodgeError={grandLodgeError}
              selectedGrandLodge={selectedGrandLodge}
              handleGrandLodgeSelect={handleGrandLodgeSelect}
              grandLodgeInputValue={grandLodgeInputValue}
              onGrandLodgeInputChange={handleGrandLodgeInputChange}

              // Lodge Props
              lodgeOptions={lodgeOptions}
              isLoadingLodges={isLoadingLodges}
              lodgeError={lodgeError}
              selectedLodge={selectedLodge}
              handleLodgeSelect={handleLodgeSelect}
              lodgeInputValue={lodgeInputValue}
              onLodgeInputChange={handleLodgeInputChange}

              // Lodge Creation UI Props
              isCreatingLodgeUI={isCreatingLodgeUI}
              showLodgeNumberInput={showLodgeNumberInput}
              handleInitiateLodgeCreation={handleInitiateLodgeCreation}
              newLodgeName={newLodgeName}
              setNewLodgeName={setNewLodgeName}
              newLodgeNumber={newLodgeNumber}
              handleLodgeNumberChange={handleLodgeNumberChange}
              handleCancelLodgeCreation={handleCancelLodgeCreation}
              onConfirmNewLodge={handleConfirmNewLodge}
          />
       )}

       {/* Restore Contact Info */} 
       <MasonContactInfo 
          mason={mason} index={index} onChange={simpleOnChange}
          handlePhoneChange={handlePhoneChange} isPrimary={isPrimary}
          hideContactFields={!isPrimary && mason.contactPreference !== 'Directly'}
          showConfirmation={!isPrimary && (mason.contactPreference === 'Primary Attendee' || mason.contactPreference === 'Provide Later')}
          getConfirmationMessage={getConfirmationMessage}
       />

       {/* Restore Additional Info */} 
       <MasonAdditionalInfo mason={mason} index={index} onChange={simpleOnChange} />

       {/* Restore Lady Partner Section */} 
       {!ladyPartnerData && onToggleHasLadyPartner && (
           <LadyPartnerToggle hasLadyPartner={!!ladyPartnerData} onToggle={handleLadyPartnerToggle} />
       )}
       {ladyPartnerData && typeof ladyPartnerIndex === 'number' && updateLadyPartnerField && (
           <LadyPartnerForm 
               ladyPartner={ladyPartnerData} index={ladyPartnerIndex} 
               // Simplified onChange for brevity - ensure full logic is present 
               onChange={(idx, field, value) => updateLadyPartnerField(ladyPartnerIndex, field as keyof LadyPartnerData, value)} 
               masonData={mason} isPrimaryMason={isPrimary}
               primaryMasonData={primaryMasonData} onRemove={handleRemoveLadyPartner}
           />
       )}
    </div> // Closing tag for the main component div
  ); // Closing parenthesis for the return statement
}; // Closing brace for the component function

export default MasonForm;