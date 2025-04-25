import React, { useEffect, useState } from 'react';
import 'react-phone-input-2/lib/style.css';
import { MasonData, LadyPartnerData } from '../../shared/types/register';
import LadyPartnerForm from './LadyPartnerForm';
import { X } from 'lucide-react';
import { grandLodges, GrandLodgeType } from '../../shared/data/grandLodges';
import { LodgeType, getLodgesByGrandLodge } from '../../shared/data/lodges';
import MasonBasicInfo from './mason/MasonBasicInfo';
import MasonGrandLodgeFields from './mason/MasonGrandLodgeFields';
import MasonLodgeInfo from './mason/MasonLodgeInfo';
import MasonContactInfo from './mason/MasonContactInfo';
import MasonAdditionalInfo from './mason/MasonAdditionalInfo';
import LadyPartnerToggle from './mason/LadyPartnerToggle';

interface MasonFormProps {
  mason: MasonData;
  index: number;
  onChange: (index: number, field: string, value: string | boolean) => void;
  isPrimary?: boolean;
  isSameLodgeAsFirst?: boolean;
  onToggleSameLodge?: (checked: boolean) => void;
  onToggleHasLadyPartner?: (checked: boolean) => void;
  ladyPartnerIndex?: number;
  updateLadyPartnerField?: (index: number, field: string, value: string | boolean) => void;
  ladyPartnerData?: LadyPartnerData;
  primaryMasonData?: MasonData; // For accessing primary mason data in additional mason forms
  onRemove?: () => void; // New prop for removing this mason
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
  // State for tracking selected Grand Lodge
  const [selectedGrandLodge, setSelectedGrandLodge] = useState<GrandLodgeType | null>(null);
  // State for filtered lodges based on selected Grand Lodge
  const [filteredLodges, setFilteredLodges] = useState<LodgeType[]>([]);
  // State for selected lodge
  const [selectedLodge, setSelectedLodge] = useState<LodgeType | null>(null);
  
  // New Lodge Creation States
  const [isCreatingLodge, setIsCreatingLodge] = useState(false);
  const [newLodgeName, setNewLodgeName] = useState('');
  const [newLodgeNumber, setNewLodgeNumber] = useState('');
  const [similarLodges, setSimilarLodges] = useState<LodgeType[]>([]);
  const [showLodgeNumberInput, setShowLodgeNumberInput] = useState(false);
  const [showSimilarLodgesWarning, setShowSimilarLodgesWarning] = useState(false);

  // Check if the title is one that should automatically select GL rank
  const isGrandTitle = (title: string) => {
    return ["VW Bro", "RW Bro", "MW Bro"].includes(title);
  };

  // Effect to automatically set rank to GL when certain titles are selected
  useEffect(() => {
    if (isGrandTitle(mason.title) && mason.rank !== "GL") {
      onChange(index, 'rank', 'GL');
    }
  }, [mason.title, index, onChange, mason.rank]);

  // Load the selected grand lodge from existing value when component mounts
  useEffect(() => {
    if (mason.grandLodge && !selectedGrandLodge) {
      const found = grandLodges.find(gl => 
        gl.name.toLowerCase() === mason.grandLodge.toLowerCase() ||
        (gl.abbreviation && gl.abbreviation.toLowerCase() === mason.grandLodge.toLowerCase())
      );
      
      if (found) {
        setSelectedGrandLodge(found);
        // Also update filtered lodges for this Grand Lodge
        setFilteredLodges(getLodgesByGrandLodge(found.id));
      }
    }
  }, [mason.grandLodge, selectedGrandLodge]);

  // Effect to update filtered lodges when Grand Lodge changes
  useEffect(() => {
    if (selectedGrandLodge) {
      setFilteredLodges(getLodgesByGrandLodge(selectedGrandLodge.id));
    } else {
      setFilteredLodges([]);
    }
  }, [selectedGrandLodge]);

  // Try to match lodge name to a lodge in the filtered list
  useEffect(() => {
    if (mason.lodge && filteredLodges.length > 0 && !selectedLodge && !isCreatingLodge) {
      const found = filteredLodges.find(lodge => 
        lodge.displayName.toLowerCase() === mason.lodge.toLowerCase() ||
        `${lodge.name} No ${lodge.number}`.toLowerCase() === mason.lodge.toLowerCase()
      );
      
      if (found) {
        setSelectedLodge(found);
      }
    }
  }, [mason.lodge, filteredLodges, selectedLodge, isCreatingLodge]);

  // Function to check for similar lodges by number
  const checkSimilarLodgesByNumber = (lodgeNumber: string) => {
    if (!selectedGrandLodge || !lodgeNumber) return [];
    
    const similar = filteredLodges.filter(lodge => 
      lodge.number === lodgeNumber
    );
    
    setSimilarLodges(similar);
    setShowSimilarLodgesWarning(similar.length > 0);
    return similar;
  };

  const handlePhoneChange = (value: string) => {
    onChange(index, 'phone', value);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onToggleSameLodge) {
      onToggleSameLodge(e.target.checked);
    }
  };

  const handleLadyPartnerToggle = () => {
    if (onToggleHasLadyPartner) {
      onToggleHasLadyPartner(!mason.hasLadyPartner);
    }
  };
  
  // Handler to remove lady partner
  const handleRemoveLadyPartner = () => {
    if (onToggleHasLadyPartner) {
      onToggleHasLadyPartner(false);
    }
  };
  
  // Handle title change and automatically set rank to GL for Grand titles
  const handleTitleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTitle = e.target.value;
    onChange(index, 'title', newTitle);
    
    // If selecting a Grand title, automatically set rank to GL
    if (isGrandTitle(newTitle)) {
      onChange(index, 'rank', 'GL');
    } 
    // *** ADDED: If selecting W Bro, set rank to IM ***
    else if (newTitle === 'W Bro') {
      onChange(index, 'rank', 'IM');
    }
    // *** END ADDED ***
  };

  // Handle Grand Lodge selection
  const handleGrandLodgeSelect = (grandLodge: GrandLodgeType) => {
    setSelectedGrandLodge(grandLodge);
    onChange(index, 'grandLodge', grandLodge.name);
    // Clear the lodge field since Grand Lodge changed
    onChange(index, 'lodge', '');
    setSelectedLodge(null);
    resetLodgeCreation();
  };

  // Handle Lodge selection
  const handleLodgeSelect = (lodge: LodgeType) => {
    setSelectedLodge(lodge);
    onChange(index, 'lodge', lodge.displayName);
    resetLodgeCreation();
  };

  // Start the lodge creation process
  const handleInitiateLodgeCreation = (lodgeName: string) => {
    if (!selectedGrandLodge) return;
    
    setIsCreatingLodge(true);
    setNewLodgeName(lodgeName);
    setNewLodgeNumber('');
    setShowLodgeNumberInput(true);
    setSimilarLodges([]);
    setShowSimilarLodgesWarning(false);
  };

  // Handle lodge number input when creating a new lodge
  const handleLodgeNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value.trim();
    setNewLodgeNumber(number);
    
    // Check for similar lodges when number is entered
    if (number) {
      checkSimilarLodgesByNumber(number);
    } else {
      setSimilarLodges([]);
      setShowSimilarLodgesWarning(false);
    }
  };

  // Handle click on Create Lodge button
  const handleCreateLodge = () => {
    if (!newLodgeName || !newLodgeNumber || !selectedGrandLodge) return;
    
    // Check for similar lodges one more time before creating
    const similar = checkSimilarLodgesByNumber(newLodgeNumber);
    
    if (similar.length > 0) {
      // If similar lodges exist, show warning but don't create yet
      setShowSimilarLodgesWarning(true);
    } else {
      // No similar lodges, proceed with creating
      finalizeLodgeCreation();
    }
  };

  // Finalize the lodge creation
  const finalizeLodgeCreation = () => {
    if (!selectedGrandLodge) return;
    // Create the lodge display name format: "Lodge Name No Number"
    const lodgeDisplayName = `${newLodgeName} No ${newLodgeNumber}`;
    onChange(index, 'lodge', lodgeDisplayName);
    
    // In a real application, we would save this new lodge to the database here
    // For now, we'll just update the UI
    setIsCreatingLodge(false);
    setShowLodgeNumberInput(false);
    setShowSimilarLodgesWarning(false);
    
    // We could add the new lodge to our local list for the session
    // This would be a temp solution until page refresh
    const newLodge: LodgeType = {
      id: `new-lodge-${Date.now()}`,
      name: newLodgeName,
      number: newLodgeNumber,
      displayName: lodgeDisplayName,
      grandLodgeId: selectedGrandLodge.id
    };
    
    setSelectedLodge(newLodge);
    
    // In a real implementation, we would make an API call to save this new lodge
    console.log('New lodge created:', newLodge);
  };

  // Handle selecting a similar lodge
  const handleSelectSimilarLodge = (lodge: LodgeType) => {
    setSelectedLodge(lodge);
    onChange(index, 'lodge', lodge.displayName);
    resetLodgeCreation();
  };

  // Reset all lodge creation state
  const resetLodgeCreation = () => {
    setIsCreatingLodge(false);
    setNewLodgeName('');
    setNewLodgeNumber('');
    setShowLodgeNumberInput(false);
    setSimilarLodges([]);
    setShowSimilarLodgesWarning(false);
  };

  // Cancel lodge creation
  const handleCancelLodgeCreation = () => {
    resetLodgeCreation();
  };

  const isGrandLodge = mason.rank === "GL";
  
  // Only for additional Masons
  // Changed logic: Only hide contact fields when selecting Primary Attendee or Provide Later
  const hideContactFields = !isPrimary && (mason.contactPreference === "Primary Attendee" || mason.contactPreference === "Provide Later");
  const showConfirmation = !isPrimary && mason.contactPreference !== "Directly" && mason.contactPreference !== "Please Select";

  // Generate dynamic confirmation message based on contact preference
  const getConfirmationMessage = () => {
    if (!primaryMasonData) return "";
    
    const primaryFullName = `${primaryMasonData.firstName} ${primaryMasonData.lastName}`;
    
    if (mason.contactPreference === "Primary Attendee") {
      return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee`;
    } else if (mason.contactPreference === "Provide Later") {
      return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee until their contact details have been updated in their profile`;
    }
    
    return "";
  };

  return (
    <div className="bg-slate-50 p-6 rounded-lg mb-8 relative">
      {/* Show Remove button for additional Masons */}
      {!isPrimary && onRemove && (
        <button 
          type="button"
          onClick={onRemove}
          className="absolute top-3 right-3 text-red-500 hover:text-red-700 flex items-center text-sm"
          aria-label="Remove this attendee"
        >
          <X className="w-4 h-4 mr-1" />
          <span>Remove</span>
        </button>
      )}
      
      <h3 className="text-lg font-bold mb-4">
        {isPrimary ? "Mason Attendee - Primary" : "Mason Attendee - Additional"}
      </h3>
      
      <MasonBasicInfo
        mason={mason}
        index={index}
        onChange={onChange}
        isPrimary={isPrimary}
        handleTitleChange={handleTitleChange}
      />
      
      {/* Conditional fields for Grand Lodge Rank */}
      {isGrandLodge && (
        <MasonGrandLodgeFields
          mason={mason}
          index={index}
          onChange={onChange}
          isPrimary={isPrimary}
        />
      )}
      
      {!isPrimary && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id={`sameLodge-${index}`}
              name={`sameLodge-${index}`}
              checked={isSameLodgeAsFirst}
              onChange={handleCheckboxChange}
              className="h-5 w-5 text-primary border-slate-300 rounded focus:ring-primary"
            />
            <label className="ml-2 block text-sm font-medium text-slate-700" htmlFor={`sameLodge-${index}`}>
              Same Lodge as Primary Mason
            </label>
          </div>
        </div>
      )}
      
      {!isSameLodgeAsFirst && (
        <MasonLodgeInfo
          mason={mason}
          index={index}
          onChange={onChange}
          isPrimary={isPrimary}
          selectedGrandLodge={selectedGrandLodge}
          handleGrandLodgeSelect={handleGrandLodgeSelect}
          isCreatingLodge={isCreatingLodge}
          showLodgeNumberInput={showLodgeNumberInput}
          filteredLodges={filteredLodges}
          handleLodgeSelect={handleLodgeSelect}
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
        />
      )}
      
      <MasonContactInfo
        mason={mason}
        index={index}
        onChange={onChange}
        handlePhoneChange={handlePhoneChange}
        isPrimary={isPrimary}
        hideContactFields={hideContactFields}
        showConfirmation={showConfirmation}
        getConfirmationMessage={getConfirmationMessage}
      />
      
      <MasonAdditionalInfo 
        mason={mason}
        index={index}
        onChange={onChange}
      />

      {/* Show toggle button only if no Lady/Partner is registered AND toggle function is provided */}
      {!mason.hasLadyPartner && onToggleHasLadyPartner && (
        <LadyPartnerToggle
          hasLadyPartner={mason.hasLadyPartner}
          onToggle={handleLadyPartnerToggle}
        />
      )}

      {/* Show Lady/Partner form when checkbox is checked */}
      {mason.hasLadyPartner && ladyPartnerData && updateLadyPartnerField && (
        <LadyPartnerForm 
          ladyPartner={ladyPartnerData}
          index={ladyPartnerIndex || 0}
          onChange={updateLadyPartnerField}
          masonData={mason}
          isPrimaryMason={isPrimary}
          primaryMasonData={primaryMasonData}
          onRemove={handleRemoveLadyPartner}
        />
      )}
    </div>
  );
};

export default MasonForm;