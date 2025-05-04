import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import 'react-phone-input-2/lib/style.css';
import { MasonData, LadyPartnerData, AttendeeTicket, GuestData, GuestPartnerData } from '../../shared/types/register';
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
import { X } from 'lucide-react';
import PhoneInputWrapper from './PhoneInputWrapper';
import { useLocationStore } from '../../store/locationStore';
import { AttendeeData as UnifiedAttendeeData } from '../../lib/api/registrations';

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
type SimpleOnChange = (id: string, field: string, value: string | boolean) => void;

interface MasonFormProps {
  mason: UnifiedAttendeeData;
  id: string;
  attendeeNumber: number;
  onChange: (attendeeId: string, field: keyof UnifiedAttendeeData, value: any) => void;
  isPrimary?: boolean;
  onToggleSameLodge?: (checked: boolean) => void;
  onToggleHasLadyPartner?: (checked: boolean) => void;
  ladyPartnerData?: UnifiedAttendeeData | undefined;
  primaryMasonData?: UnifiedAttendeeData | undefined;
  onRemove?: (id: string) => void;
}

const MasonForm: React.FC<MasonFormProps> = ({
  mason,
  id,
  attendeeNumber,
  onChange,
  isPrimary = false,
  onToggleSameLodge,
  onToggleHasLadyPartner,
  ladyPartnerData,
  primaryMasonData,
  onRemove
}) => {
  // --- Store Data ---
  // Use individual selectors to avoid selector warning and prevent unnecessary re-renders
  const grandLodges = useLocationStore(state => state.grandLodges);
  const isLoadingGrandLodges = useLocationStore(state => state.isLoadingGrandLodges);
  const grandLodgeError = useLocationStore(state => state.grandLodgeError);
  
  // Store store actions in a ref to prevent re-renders when they're dependencies in effects
  const storeActionsRef = useRef({
    searchGrandLodges: useLocationStore.getState().searchGrandLodges,
    fetchInitialGrandLodges: useLocationStore.getState().fetchInitialGrandLodges,
    fetchIpData: useLocationStore.getState().fetchIpData,
    getLodgesByGrandLodge: useLocationStore.getState().getLodgesByGrandLodge
  });
  
  // Subscribe to store updates to keep action refs current
  useEffect(() => {
    const unsubscribe = useLocationStore.subscribe(
      (state) => {
        storeActionsRef.current = {
          searchGrandLodges: state.searchGrandLodges,
          fetchInitialGrandLodges: state.fetchInitialGrandLodges,
          fetchIpData: state.fetchIpData,
          getLodgesByGrandLodge: state.getLodgesByGrandLodge
        };
      }
    );
    
    return unsubscribe;
  }, []);
  
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
  
  // Reset preselection flag when component unmounts and remounts
  useEffect(() => {
    // This will ensure we attempt to preselect again when navigating back
    return () => {
      hasAttemptedGLPreselection.current = false;
    };
  }, []);

  // Check if the title is one that should automatically select GL rank
  const isGrandTitle = (title: string) => {
    return ["VW Bro", "RW Bro", "MW Bro"].includes(title);
  };

  // --- Effects ---
  // Initial data fetching effect - using refs to avoid infinite loops
  const didInitialFetch = useRef(false);
  
  useEffect(() => {
    // Only run once, using a ref to track
    if (didInitialFetch.current) return;
    didInitialFetch.current = true;
    
    // Initialize Grand Lodges from cache if needed
    if (grandLodges.length === 0 && !isLoadingGrandLodges) {
      storeActionsRef.current.fetchInitialGrandLodges();
    }
    
    // Note: We've removed fetchIpData here because it's already called in App.tsx
    // and multiple components calling it causes infinite loops
  }, [grandLodges.length, isLoadingGrandLodges]);
  
  // Effect for Grand Rank
  useEffect(() => {
    if (isGrandTitle(mason.title || '') && mason.rank !== "GL") {
      onChange(id, 'rank', 'GL');
    }
  }, [mason.title, mason.rank, id, onChange]);

  // Effect for pre-selecting Grand Lodge (using mason.grandLodgeId)
  const hasAttemptedGLPreselection = useRef(false); 
  useEffect(() => {
    const currentGLId = mason.grandLodgeId;
    
    if (
      !isLoadingGrandLodges && 
      grandLodges.length > 0 && 
      !selectedGrandLodge && 
      currentGLId && 
      !hasAttemptedGLPreselection.current
    ) {
        hasAttemptedGLPreselection.current = true; 
        const found = grandLodges.find((gl: GrandLodgeRow) => gl.id === currentGLId);
        if (found) {
            if (process.env.NODE_ENV === 'development') {
              console.log("Pre-selecting Grand Lodge:", found.name);
            }
            setSelectedGrandLodge(found);
            setGrandLodgeInputValue(found.name);
        } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Pre-selection: Grand Lodge ID '${currentGLId}' not found.`);
            }
        }
    }
  }, [isLoadingGrandLodges, grandLodges, selectedGrandLodge, mason.grandLodgeId]);

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

  // Effect to initialize lodgeInputValue based on mason data (using lodgeId)
  useEffect(() => {
    if (mason.lodgeId) {
      const foundLodge = lodgeOptions.find(l => l.id === mason.lodgeId);
      if (foundLodge) {
        setSelectedLodge(foundLodge);
        const displayValue = foundLodge.display_name || `${foundLodge.name} No. ${foundLodge.number || 'N/A'}`;
        setLodgeInputValue(displayValue);
      } else {
        setLodgeInputValue(`Lodge ID: ${mason.lodgeId}`);
      }
    } else {
      setLodgeInputValue('');
    }
  }, [mason.lodgeId, lodgeOptions]);

  // --- Handlers --- 
  // Reset Lodge Creation UI 
  const resetLodgeCreationUI = useCallback(() => {
    setIsCreatingLodgeUI(false);
    setNewLodgeName('');
    setNewLodgeNumber('');
    setShowLodgeNumberInput(false);
  }, []);

  // Grand Lodge selection handler
  const handleGrandLodgeSelect = useCallback((grandLodge: GrandLodgeRow | null) => { 
    if (selectedGrandLodge?.id !== grandLodge?.id) {
      setSelectedGrandLodge(grandLodge);
      const glName = grandLodge ? grandLodge.name : '';
      setGrandLodgeInputValue(glName);
      onChange(id, 'grandLodgeId', grandLodge ? grandLodge.id : null);
      onChange(id, 'lodgeId', null);
      setSelectedLodge(null);
      resetLodgeCreationUI();
    }
  }, [selectedGrandLodge, onChange, id, resetLodgeCreationUI]);

  // Debounced search function using ref to avoid re-renders
  const debouncedSearch = useDebouncedCallback((term: string) => {
    storeActionsRef.current.searchGrandLodges(term);
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
          storeActionsRef.current.searchGrandLodges(''); 
      }
  }, [isLoadingGrandLodges]);

  // Debounced Lodge Search Function - Now uses cached getLodgesByGrandLodge via ref
  const debouncedLodgeSearch = useDebouncedCallback(async (term: string) => {
    if (!selectedGrandLodge?.id) {
      setLodgeOptions([]);
      return; // Don't search without a GL
    }
    setIsLoadingLodges(true);
    setLodgeError(null);
    try {
      // Use the enhanced store function that's cache-aware via ref
      // This will check the cache before making an API call
      const data = await storeActionsRef.current.getLodgesByGrandLodge(selectedGrandLodge.id, term);
      
      // If we have a search term, use direct API call to get fresh results
      // but if empty term or just browsing, use the cached data
      const convertedData = data.map(lodge => {
        if (typeof lodge.id === 'string') {
          return lodge as LodgeRow; 
        }
        return convertToLodgeRow(lodge);
      });
      
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
        onChange(id, 'lodgeId', lodge ? lodge.id : null);
        resetLodgeCreationUI();
    }
  }, [selectedLodge, onChange, id, resetLodgeCreationUI]);
  
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
    console.warn('handleConfirmNewLodge needs rework for UnifiedAttendeeData');
    resetLodgeCreationUI();
  }, [id, onChange, resetLodgeCreationUI, selectedGrandLodge?.id]);

  // Phone change handler
  const handlePhoneChange = useCallback((value: string) => {
    onChange(id, 'primaryPhone', value);
  }, [id, onChange]);

  // Checkbox change handler - Now calls prop with just 'checked'
  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.warn('toggleSameLodge logic needs rework for UnifiedAttendeeData');
  }, [onToggleSameLodge]);

  // Lady Partner toggle handler - Using true to add a partner and logging
  const handleLadyPartnerToggle = useCallback(() => {
    console.log("Toggling lady partner to TRUE for Mason:", id);
    if (onToggleHasLadyPartner) {
      onToggleHasLadyPartner(true);
    }
  }, [onToggleHasLadyPartner, id]);
  
  // Remove Lady Partner handler - Using false to remove and logging
  const handleRemoveLadyPartner = useCallback(() => {
    console.log("Removing lady partner (setting to FALSE) for Mason:", id);
    if (onToggleHasLadyPartner) {
      onToggleHasLadyPartner(false);
    }
  }, [onToggleHasLadyPartner, id]);

  // Handle title change and automatically set rank 
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTitle = e.target.value;
    onChange(id, 'title', newTitle);
    
    // If selecting a Grand title, automatically set rank to GL
    if (isGrandTitle(newTitle)) {
      if (mason.rank !== 'GL') onChange(id, 'rank', 'GL');
    } 
    // If selecting W Bro, set rank to IM
    else if (newTitle === 'W Bro') {
      if (mason.rank !== 'IM') onChange(id, 'rank', 'IM');
    }
    // No change for other titles like "Bro"

  }, [id, onChange, mason.rank]);

  // Lodge Input Change Handler
  const handleLodgeInputChange = useCallback((value: string) => {
    setLodgeInputValue(value);
    if (selectedLodge) {
       const currentDisplay = selectedLodge.display_name || `${selectedLodge.name} No. ${selectedLodge.number || 'N/A'}`; 
       if (value !== currentDisplay && currentDisplay !== '') { 
          setSelectedLodge(null);
          onChange(id, 'lodgeId', null);
      }
    }
    if (selectedGrandLodge?.id) {
      debouncedLodgeSearch(value);
    } else {
      setLodgeOptions([]); 
    }
  }, [debouncedLodgeSearch, selectedLodge, selectedGrandLodge?.id, onChange, id]);

  // Ensure getConfirmationMessage is defined using useCallback
  const getConfirmationMessage = useCallback(() => {
      // Use primaryMasonData passed as prop
      if (!primaryMasonData) return "";
      const primaryFullName = `${primaryMasonData.firstName || ''} ${primaryMasonData.lastName || ''}`.trim();
      // Use mason prop for contactPreference
      if (mason.contactPreference === "PrimaryAttendee") {
          return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee`;
      } else if (mason.contactPreference === "ProvideLater") {
          return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee until their contact details have been updated in their profile`;
      }
      return "";
  // Add dependencies: mason object (or specific fields if stable) and primaryMasonData
  }, [primaryMasonData, mason.contactPreference, mason.firstName, mason.lastName]); 

  // --- Render Logic --- 
  // Remove the helper function, as the logic is integrated into useEffect and handlers
  // const getLodgeDisplayValue = () => { ... };

  // --- TODO: Transform partner data --- 
  // Transform ladyPartnerData (UnifiedAttendeeData) to old LadyPartnerData format 
  // expected by LadyPartnerForm.
  const transformedPartnerData: LadyPartnerData | undefined = useMemo(() => {
    if (!ladyPartnerData) return undefined;
    return {
      id: ladyPartnerData.attendeeId,
      title: ladyPartnerData.title || '',
      firstName: ladyPartnerData.firstName || '',
      lastName: ladyPartnerData.lastName || '',
      dietary: ladyPartnerData.dietaryRequirements || '',
      specialNeeds: ladyPartnerData.specialNeeds || '',
      relationship: ladyPartnerData.relationship || 'Partner', // Default?
      masonId: ladyPartnerData.relatedAttendeeId || '', // Map related ID
      contactPreference: ladyPartnerData.contactPreference, // Assume type matches?
      phone: ladyPartnerData.primaryPhone || '',
      email: ladyPartnerData.primaryEmail || '',
      contactConfirmed: !!ladyPartnerData.contactConfirmed,
      // Ticket data needs careful mapping if LadyPartnerForm expects {ticketId, events}
      ticket: ladyPartnerData.ticket ? { ticketId: ladyPartnerData.ticket.ticketDefinitionId, events: [] } : undefined 
    };
  }, [ladyPartnerData]);
  // --- End TODO section ---

  return (
    <div className="bg-slate-50 p-6 rounded-lg mb-8 relative">
       {/* Restore Header & Remove Button */}
       <div className="flex justify-between items-center mb-4">
         <h3 className="text-xl font-semibold text-gray-700">
           {isPrimary ? 'Primary Mason Attendee' : `Mason Attendee`}
         </h3>
         {!isPrimary && onRemove && (
           <button 
             onClick={() => onRemove(id)} 
             className="text-red-500 hover:text-red-700 transition-colors text-sm flex items-center"
             aria-label={`Remove Mason Attendee`}
           >
             <X className="w-4 h-4 mr-1" /> Remove
           </button>
         )}
       </div>

       {/* Basic Info */} 
       <MasonBasicInfo 
          mason={mason as any} 
          id={id} 
          isPrimary={isPrimary} 
          onChange={onChange} 
          handleTitleChange={handleTitleChange}
          titles={titles}
          ranks={ranks}
       />
       
       {/* Grand Lodge Fields - Conditional rendering & NO extra props */}
       {mason.rank === 'GL' && (
         <MasonGrandLodgeFields 
            mason={mason as any} 
            id={id} 
            onChange={onChange} 
            isPrimary={isPrimary}
         />
       )}

       {/* Restore Lodge Info Toggle */} 
       {!isPrimary && onToggleSameLodge && (
          <div className="mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
               <input
                 type="checkbox"
                 checked={false}
                 onChange={handleCheckboxChange}
                 className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
               />
               <span className="text-sm font-medium text-gray-700">Same Lodge as Primary Mason</span>
             </label>
          </div>
       )}

       {/* Lodge Info Section - Pass unified onChange */} 
       {(!false || isPrimary) && (
          <MasonLodgeInfo 
              mason={mason as any}
              id={id}
              onChange={onChange} 
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
          mason={mason as any} 
          id={id}
          onChange={onChange}
          handlePhoneChange={handlePhoneChange} 
          isPrimary={isPrimary}
          hideContactFields={!isPrimary && mason.contactPreference !== 'Directly'}
          showConfirmation={!isPrimary && (mason.contactPreference === 'PrimaryAttendee' || mason.contactPreference === 'ProvideLater')}
          // Pass the defined function
          getConfirmationMessage={getConfirmationMessage} 
       />

       {/* Restore Additional Info */} 
       <MasonAdditionalInfo 
          mason={mason as any} 
          id={id}
          onChange={onChange} 
       />

       {/* --- Lady Partner Section --- */}
       {/* Add horizontal line divider above partner section */}
       {onToggleHasLadyPartner && (
           <hr className="mt-6 mb-4 border-t border-slate-300" />
       )}
       
       {/* Show Toggle Button ONLY when NO partner exists */} 
       {!ladyPartnerData && onToggleHasLadyPartner && (
           <LadyPartnerToggle 
             onAdd={handleLadyPartnerToggle} 
           />
       )}

       {/* Show Partner Form when partner data exists */} 
       {transformedPartnerData && (
           <LadyPartnerForm 
             partner={transformedPartnerData}
             id={transformedPartnerData.id}
             updateField={onChange as any}
             onRemove={handleRemoveLadyPartner}
             relatedMasonName={`${mason.firstName || ''} ${mason.lastName || ''}`.trim()}
           />
       )}
    </div> // Closing tag for the main component div
  ); // Closing parenthesis for the return statement
}; // Closing brace for the component function

export default MasonForm;