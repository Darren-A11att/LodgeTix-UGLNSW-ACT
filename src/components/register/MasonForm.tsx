import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const hasLoadedAllGrandLodges = useLocationStore((state) => state.hasLoadedAllGrandLodges);
  const fetchAllGrandLodges = useLocationStore((state) => state.fetchAllGrandLodges);
  
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
  // Keep all local state for lodge, selection, and creation
  const [lodgeOptions, setLodgeOptions] = useState<LodgeRow[]>([]); 
  const [isLoadingLodges, setIsLoadingLodges] = useState(false);
  const [lodgeError, setLodgeError] = useState<string | null>(null);
  const [isCreatingLodgeApi, setIsCreatingLodgeApi] = useState(false);
  const [createLodgeError, setCreateLodgeError] = useState<string | null>(null);
  const [selectedGrandLodge, setSelectedGrandLodge] = useState<GrandLodgeRow | null>(null); 
  const [selectedLodge, setSelectedLodge] = useState<LodgeRow | null>(null); 
  const [similarLodges, setSimilarLodges] = useState<LodgeRow[]>([]);
  const [isCreatingLodgeUI, setIsCreatingLodgeUI] = useState(false); 
  const [newLodgeName, setNewLodgeName] = useState('');
  const [newLodgeNumber, setNewLodgeNumber] = useState('');
  const [showLodgeNumberInput, setShowLodgeNumberInput] = useState(false);
  const [showSimilarLodgesWarning, setShowSimilarLodgesWarning] = useState(false);
  const initialGrandLodgeRef = useRef(mason.grandLodge); // Store initial value
  const initialLodgeRef = useRef(mason.lodge); // Store initial value

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

  // Effect for fetching Lodges (and pre-selecting Lodge using initial value)
  const hasAttemptedLodgePreselection = useRef(false);
  useEffect(() => {
    const initialLodge = initialLodgeRef.current; // Use initial value
    if (selectedGrandLodge?.id) {
      hasAttemptedLodgePreselection.current = false; 
      const fetchLodges = async () => {
        setIsLoadingLodges(true);
        setLodgeError(null);
        setLodgeOptions([]); 
        try {
          console.log(`Fetching lodges for GL: ${selectedGrandLodge.name}`);
          const data = await getLodgesByGrandLodgeId(selectedGrandLodge.id); 
          const convertedData = data.map(convertToLodgeRow);
          console.log(`Fetched ${convertedData.length} lodges:`, convertedData); // Log fetched data
          setLodgeOptions(convertedData);
          
          // Pre-select Lodge using initial value
          if (initialLodge && convertedData.length > 0 && !selectedLodge && !hasAttemptedLodgePreselection.current) {
             hasAttemptedLodgePreselection.current = true; 
             const foundLodge = convertedData.find(lodge => 
               lodge.display_name?.toLowerCase() === initialLodge.toLowerCase() ||
               `${lodge.name} No. ${lodge.number}`.toLowerCase() === initialLodge.toLowerCase()
             );
             if (foundLodge) {
                console.log("Pre-selecting Lodge:", foundLodge.display_name);
                setSelectedLodge(foundLodge);
             } else {
                console.warn(`Pre-selection: Initial Lodge string '${initialLodge}' not found for GL ${selectedGrandLodge.name}.`);
             }
          }
        } catch (error) {
          console.error(`Error fetching lodges for GL ${selectedGrandLodge.id}:`, error);
          setLodgeError("Failed to load Lodges.");
        } finally {
          setIsLoadingLodges(false);
        }
      };
      fetchLodges();
    } else {
      setLodgeOptions([]);
      setSelectedLodge(null); 
      setIsLoadingLodges(false);
      setLodgeError(null);
    }
  }, [selectedGrandLodge?.id]); // REMOVED mason.lodge dependency

  // --- Handlers --- 
  const checkAndFetchAllGrandLodges = useCallback(() => {
      if (!hasLoadedAllGrandLodges && !isLoadingGrandLodges) {
          fetchAllGrandLodges(); 
      }
  }, [hasLoadedAllGrandLodges, isLoadingGrandLodges, fetchAllGrandLodges]);

  // Restore Lodge Creation UI reset function
  const resetLodgeCreationUI = useCallback(() => {
    setIsCreatingLodgeUI(false);
    setNewLodgeName('');
    setNewLodgeNumber('');
    setShowLodgeNumberInput(false);
    setSimilarLodges([]);
    setShowSimilarLodgesWarning(false);
    setCreateLodgeError(null);
  }, []);

  // Grand Lodge selection handler
  const handleGrandLodgeSelect = useCallback((grandLodge: GrandLodgeRow | null) => { 
    if (selectedGrandLodge?.id !== grandLodge?.id) {
      setSelectedGrandLodge(grandLodge);
      onChange(index, 'grandLodge' as keyof MasonData, grandLodge ? grandLodge.name : '');
      onChange(index, 'lodge' as keyof MasonData, '');
      setSelectedLodge(null);
      resetLodgeCreationUI(); // Use the restored function
    }
  }, [selectedGrandLodge, onChange, index, resetLodgeCreationUI]);

  // Lodge selection handler
  const handleLodgeSelect = useCallback((lodge: LodgeRow | null) => { 
    if (selectedLodge?.id !== lodge?.id) {
        setSelectedLodge(lodge);
        const displayValue = lodge ? (lodge.display_name || `${lodge.name} No. ${lodge.number || 'N/A'}`) : '';
        onChange(index, 'lodge' as keyof MasonData, displayValue);
        resetLodgeCreationUI(); // Use the restored function
    }
  }, [selectedLodge, onChange, index, resetLodgeCreationUI]);
  
  // Restore other handlers (Lodge Creation, Phone, Checkbox, Partner, Title, etc.)
  // Start the UI part of lodge creation
  const handleInitiateLodgeCreation = useCallback((initialLodgeName: string) => {
    if (!selectedGrandLodge) return; 
    setIsCreatingLodgeUI(true);
    setNewLodgeName(initialLodgeName);
    setNewLodgeNumber('');
    setShowLodgeNumberInput(true);
    setSimilarLodges([]);
    setShowSimilarLodgesWarning(false);
    setCreateLodgeError(null); 
  }, [selectedGrandLodge]);

  // Check for similar lodges by number
  const checkSimilarLodgesByNumber = useCallback((lodgeNumber: string) => {
    if (!selectedGrandLodge || !lodgeNumber || lodgeOptions.length === 0) return [];
    const similar = lodgeOptions.filter(lodge => lodge.number === lodgeNumber);
    setSimilarLodges(similar);
    setShowSimilarLodgesWarning(similar.length > 0);
    return similar;
  }, [selectedGrandLodge, lodgeOptions]);

  // Handle Lodge Number input change
  const handleLodgeNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value;
    setNewLodgeNumber(number);
    checkSimilarLodgesByNumber(number);
  }, [checkSimilarLodgesByNumber]);

  // Handle selecting a similar lodge
  const handleSelectSimilarLodge = useCallback((lodge: LodgeRow) => { 
    handleLodgeSelect(lodge); // Reuse existing lodge select logic
  }, [handleLodgeSelect]);

  // Cancel lodge creation UI
  const handleCancelLodgeCreation = useCallback(() => {
    resetLodgeCreationUI();
  }, [resetLodgeCreationUI]);

  // Handle creating the lodge via API call
  const handleCreateLodge = useCallback(async () => {
    if (!selectedGrandLodge || !newLodgeName) {
      setCreateLodgeError("Missing required information."); return;
    }
    setIsCreatingLodgeApi(true);
    setCreateLodgeError(null);
    try {
      const createdLodge = await createLodge({ 
        name: newLodgeName,
        number: newLodgeNumber, grand_lodge_id: selectedGrandLodge.id
      });
      if (createdLodge) {
        const convertedLodge = convertToLodgeRow(createdLodge);
        setLodgeOptions(prev => [...prev, convertedLodge]); 
        handleLodgeSelect(convertedLodge); // Select the newly created lodge
      } else {
        setCreateLodgeError("Failed to create lodge. It might already exist.");
      }
    } catch (error) {
      console.error("Lodge creation API error:", error);
      setCreateLodgeError("An error occurred creating the lodge.");
    } finally {
      setIsCreatingLodgeApi(false);
    }
  }, [selectedGrandLodge, newLodgeName, newLodgeNumber, handleLodgeSelect]);
  
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

  // --- Render Logic --- 
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

       {/* Pass updated props to MasonLodgeInfo */} 
       {(!isPrimary && !isSameLodgeAsFirst) || isPrimary ? (
         <MasonLodgeInfo 
            mason={mason}
            index={index}
            onChange={simpleOnChange} 
            isPrimary={isPrimary}
            grandLodgeOptions={grandLodges} 
            isLoadingGrandLodges={isLoadingGrandLodges} 
            grandLodgeError={grandLodgeError} 
            selectedGrandLodge={selectedGrandLodge} 
            handleGrandLodgeSelect={handleGrandLodgeSelect} 
            onGrandLodgeFocus={checkAndFetchAllGrandLodges} // Trigger check on focus
            onGrandLodgeThresholdReached={checkAndFetchAllGrandLodges} // Trigger check on length
            lodgeOptions={lodgeOptions}
            isLoadingLodges={isLoadingLodges}
            lodgeError={lodgeError}
            selectedLodge={selectedLodge}
            handleLodgeSelect={handleLodgeSelect}
            isCreatingLodgeUI={isCreatingLodgeUI}
            showLodgeNumberInput={showLodgeNumberInput}
            handleInitiateLodgeCreation={handleInitiateLodgeCreation}
            newLodgeName={newLodgeName}
            setNewLodgeName={setNewLodgeName}
            newLodgeNumber={newLodgeNumber}
            handleLodgeNumberChange={handleLodgeNumberChange}
            showSimilarLodgesWarning={showSimilarLodgesWarning}
            similarLodges={similarLodges}
            handleSelectSimilarLodge={handleSelectSimilarLodge}
            handleCreateLodge={handleCreateLodge}
            handleCancelLodgeCreation={handleCancelLodgeCreation}
            isCreatingLodgeApi={isCreatingLodgeApi}
            createLodgeError={createLodgeError}
         />
       ) : null}

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