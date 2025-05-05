import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import 'react-phone-input-2/lib/style.css';
import LadyPartnerForm from './LadyPartnerForm';
import { GrandLodgeRow } from '../../lib/api/grandLodges';
import { createLodge, LodgeRow } from '../../lib/api/lodges';
import MasonBasicInfo from './mason/MasonBasicInfo';
import MasonGrandLodgeFields from './mason/MasonGrandLodgeFields';
import MasonLodgeInfo from './mason/MasonLodgeInfo';
import MasonContactInfo from './mason/MasonContactInfo';
import MasonAdditionalInfo from './mason/MasonAdditionalInfo';
import LadyPartnerToggle from './mason/LadyPartnerToggle';
import { FaTrash } from 'react-icons/fa';
import { X } from 'lucide-react';
import PhoneInputWrapper from './PhoneInputWrapper';
import { useLocationStore, IpApiData } from '../../store/locationStore';
import { useRegistrationStore, UnifiedAttendeeData } from '../../store/registrationStore';
import { v4 as uuidv4 } from 'uuid';
import { LadyPartnerData as OldLadyPartnerData } from '../../shared/types/register';
import { Card, CardHeader, CardTitle, CardBody } from '../../../shared/components/catalyst';

interface MasonFormProps {
  attendeeId: string;
  attendeeNumber: number;
  isPrimary?: boolean;
}

const MasonForm: React.FC<MasonFormProps> = ({
  attendeeId, 
  attendeeNumber,
  isPrimary = false,
}) => {
  // --- Get Data and Actions from Stores ---
  // Select individual state pieces and actions from useLocationStore
  const grandLodges = useLocationStore(state => state.grandLodges);
  const isLoadingGrandLodges = useLocationStore(state => state.isLoadingGrandLodges);
  const grandLodgeError = useLocationStore(state => state.grandLodgeError);
  const allLodgeSearchResults = useLocationStore(state => state.allLodgeSearchResults);
  const isLoadingAllLodges = useLocationStore(state => state.isLoadingAllLodges);
  const allLodgesError = useLocationStore(state => state.allLodgesError);
  const fetchInitialGrandLodges = useLocationStore(state => state.fetchInitialGrandLodges);
  const searchGrandLodges = useLocationStore(state => state.searchGrandLodges);
  const searchAllLodgesAction = useLocationStore(state => state.searchAllLodgesAction);
  const createLodge = useLocationStore(state => state.createLodge);

  // Get all attendees once
  const attendees = useRegistrationStore(state => state.attendees);
  
  // Derive individual attendee data using memoization
  const mason = useMemo(() => 
    attendees.find(att => att.attendeeId === attendeeId),
    [attendees, attendeeId]
  );
  
  const ladyPartnerData = useMemo(() => 
    attendees.find(att => att.relatedAttendeeId === attendeeId && att.attendeeType === 'lady_partner'),
    [attendees, attendeeId]
  );
  
  // Select actions separately (these are stable)
  const updateAttendee = useRegistrationStore(state => state.updateAttendee);
  const removeAttendee = useRegistrationStore(state => state.removeAttendee);
  const addAttendee = useRegistrationStore(state => state.addAttendee);

  if (!mason) {
      console.warn(`MasonForm rendered for non-existent attendeeId: ${attendeeId}`);
      return null; 
  }

  const primaryMasonData = useMemo(() => 
    attendees.find(att => att.isPrimary),
    [attendees]
  );
  
  // --- Local UI State (like selects, inputs, creation UI) ---
  const [selectedGrandLodge, setSelectedGrandLodge] = useState<GrandLodgeRow | null>(null);
  const [selectedLodge, setSelectedLodge] = useState<LodgeRow | null>(null);
  const [grandLodgeInputValue, setGrandLodgeInputValue] = useState('');
  const [lodgeInputValue, setLodgeInputValue] = useState('');
  const [isCreatingLodgeUI, setIsCreatingLodgeUI] = useState(false);
  const [newLodgeName, setNewLodgeName] = useState('');
  const [newLodgeNumber, setNewLodgeNumber] = useState('');

  // --- Component Constants ---
  const titles = ["Bro", "W Bro", "VW Bro", "RW Bro", "MW Bro"];
  const ranks = [
    { value: "EAF", label: "EAF" },
    { value: "FCF", label: "FCF" },
    { value: "MM", label: "MM" },
    { value: "IM", label: "IM" },
    { value: "GL", label: "GL" }
  ];
  const isGrandTitle = (title: string) => ["VW Bro", "RW Bro", "MW Bro"].includes(title);

  // --- Generic Field Update Handler ---
  const handleFieldChange = useCallback((id: string, field: keyof UnifiedAttendeeData, value: any) => {
      if (id === attendeeId) {
        updateAttendee(attendeeId, { [field]: value });
      } else {
        console.warn('handleFieldChange called with mismatched ID', { currentId: attendeeId, receivedId: id });
      }
  }, [updateAttendee, attendeeId]);

  // Specific handler needed for phone due to component library
  const handlePhoneChange = useCallback((value: string) => {
      handleFieldChange(attendeeId, 'primaryPhone', value);
  }, [handleFieldChange, attendeeId]);

  // Specific handler for title change to also handle rank logic
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      const newTitle = e.target.value;
      let rankUpdate: Partial<UnifiedAttendeeData> = { title: newTitle };
      if (isGrandTitle(newTitle) && mason.rank !== 'GL') {
          rankUpdate.rank = 'GL';
      } else if (newTitle === 'W Bro' && mason.rank !== 'IM') {
          rankUpdate.rank = 'IM';
      } else if (newTitle === 'Bro' && (mason.rank === 'GL' || mason.rank === 'IM')) {
         // Optionally reset rank if demoting title? Or leave as is?
         // rankUpdate.rank = 'MM'; // Example reset
      }
      updateAttendee(attendeeId, rankUpdate);
  }, [updateAttendee, attendeeId, mason.rank]);

  // --- Effects for GL/Lodge Selection and Initialization ---
  useEffect(() => {
      if (grandLodges.length === 0 && !isLoadingGrandLodges) {
          fetchInitialGrandLodges();
      }
  }, [grandLodges.length, isLoadingGrandLodges, fetchInitialGrandLodges]);

  useEffect(() => {
      if (mason.grandLodgeId && !selectedGrandLodge) {
          const initialGrandLodge = grandLodges.find(gl => gl.id === mason.grandLodgeId);
          if (initialGrandLodge) {
              setSelectedGrandLodge(initialGrandLodge);
              setGrandLodgeInputValue(initialGrandLodge.name);
          }
      }
  }, [mason.grandLodgeId, grandLodges, selectedGrandLodge]);

  useEffect(() => {
       if (mason.lodgeId && !selectedLodge) {
           const foundLodge = allLodgeSearchResults.find(l => l.id === mason.lodgeId);
           if (foundLodge) {
               setSelectedLodge(foundLodge);
               const displayValue = foundLodge.display_name || `${foundLodge.name} No. ${foundLodge.number || 'N/A'}`;
               setLodgeInputValue(displayValue);
               if (foundLodge.grand_lodge_id && !selectedGrandLodge) {
                    const initialGrandLodge = grandLodges.find(gl => gl.id === foundLodge.grand_lodge_id);
                    if (initialGrandLodge) {
                        setSelectedGrandLodge(initialGrandLodge);
                        setGrandLodgeInputValue(initialGrandLodge.name);
                    }
               }
           } else {
               setLodgeInputValue(`Lodge ID: ${mason.lodgeId}`); 
           }
       } else if (!mason.lodgeId) {
           setSelectedLodge(null);
           setLodgeInputValue('');
       }
  }, [mason.lodgeId, allLodgeSearchResults, selectedLodge, grandLodges, selectedGrandLodge]);

  // --- Handlers for GL/Lodge Selection and Creation --- 
  const resetLodgeCreationUI = useCallback(() => {
    setIsCreatingLodgeUI(false);
    setNewLodgeName('');
    setNewLodgeNumber('');
  }, []);
  
  const handleGrandLodgeSelect = useCallback((grandLodge: GrandLodgeRow | null) => {
       if (selectedGrandLodge?.id !== grandLodge?.id) {
           setSelectedGrandLodge(grandLodge);
           setGrandLodgeInputValue(grandLodge ? grandLodge.name : '');
           updateAttendee(attendeeId, { 
               grandLodgeId: grandLodge ? grandLodge.id : null, 
               lodgeId: null 
           });
           setSelectedLodge(null);
           setLodgeInputValue('');
           handleFieldChange(attendeeId, 'grandLodgeId', grandLodge ? grandLodge.id : null);
           handleFieldChange(attendeeId, 'lodgeId', null);
           resetLodgeCreationUI();
       }
   }, [selectedGrandLodge, updateAttendee, attendeeId, resetLodgeCreationUI, handleFieldChange]);

  const debouncedGrandLodgeSearch = useDebouncedCallback(searchGrandLodges, 300);

  const handleGrandLodgeInputChange = useCallback((value: string) => {
      setGrandLodgeInputValue(value);
      if (selectedGrandLodge && value !== selectedGrandLodge.name) {
          setSelectedGrandLodge(null);
      }
      debouncedGrandLodgeSearch(value);
  }, [debouncedGrandLodgeSearch, selectedGrandLodge]);

  const debouncedLodgeSearch = useDebouncedCallback(searchAllLodgesAction, 300);
  
  const handleLodgeSelect = useCallback((lodge: LodgeRow | null) => {
       setSelectedLodge(lodge);
       const displayValue = lodge ? (lodge.display_name || `${lodge.name} No. ${lodge.number || 'N/A'}`) : '';
       setLodgeInputValue(displayValue);
       let updates: Partial<UnifiedAttendeeData> = { lodgeId: lodge ? lodge.id : null };

       if (lodge?.grand_lodge_id) {
           const associatedGrandLodge = grandLodges.find(gl => gl.id === lodge.grand_lodge_id);
           if (associatedGrandLodge) {
               if (selectedGrandLodge?.id !== associatedGrandLodge.id) {
                   setSelectedGrandLodge(associatedGrandLodge);
                   setGrandLodgeInputValue(associatedGrandLodge.name);
                   updates.grandLodgeId = associatedGrandLodge.id;
               }
           } else {
               console.warn(`Grand Lodge ${lodge.grand_lodge_id} for selected lodge ${lodge.id} not found.`);
               setSelectedGrandLodge(null);
               setGrandLodgeInputValue('');
               updates.grandLodgeId = null;
           }
       }
       updateAttendee(attendeeId, updates);
       resetLodgeCreationUI();
   }, [updateAttendee, attendeeId, grandLodges, selectedGrandLodge, resetLodgeCreationUI]);

  const handleLodgeInputChange = useCallback((value: string) => {
      setLodgeInputValue(value);
      if (selectedLodge) {
          const currentDisplay = selectedLodge.display_name || `${selectedLodge.name} No. ${selectedLodge.number || 'N/A'}`; 
          if (value !== currentDisplay && currentDisplay !== '') { 
              handleLodgeSelect(null);
          }
      }
      if (value && value.trim().length > 0) {
        debouncedLodgeSearch(value.trim());
      }
  }, [debouncedLodgeSearch, selectedLodge, handleLodgeSelect]);

  const handleInitiateLodgeCreation = useCallback((initialLodgeName: string) => {
      if (!selectedGrandLodge) {
          alert("Please select a Grand Lodge before creating a new lodge.");
          return; 
      }
      setIsCreatingLodgeUI(true);
      setNewLodgeName(initialLodgeName);
      setNewLodgeNumber('');
  }, [selectedGrandLodge]);

  const handleLodgeNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLodgeNumber(e.target.value);
  }, []);
  const handleCancelLodgeCreation = useCallback(() => {
    resetLodgeCreationUI();
  }, [resetLodgeCreationUI]);

  const handleConfirmNewLodge = useCallback(async (details: { name: string; number: string }) => {
      if (!selectedGrandLodge?.id) return;
      try {
          const newLodgeData = { name: details.name, number: details.number || null, grand_lodge_id: selectedGrandLodge.id };
          const createdLodge = await createLodge(newLodgeData as any); 
          if (createdLodge) {
              handleLodgeSelect(createdLodge);
          }
      } catch (error) {
          console.error("Error during lodge creation process:", error);
      }
      resetLodgeCreationUI();
  }, [selectedGrandLodge?.id, createLodge, handleLodgeSelect, resetLodgeCreationUI]);

  // --- Lady Partner Handlers ---
  const handleLadyPartnerToggle = useCallback(() => {
      if (ladyPartnerData) {
          removeAttendee(ladyPartnerData.attendeeId);
      } else {
          addAttendee({
              attendeeType: 'lady_partner',
              relatedAttendeeId: attendeeId,
              registrationId: mason.registrationId,
              firstName: '',
              lastName: '',
          } as Omit<UnifiedAttendeeData, 'attendeeId'>);
      }
  }, [ladyPartnerData, addAttendee, removeAttendee, attendeeId, mason.registrationId]);

  // --- Other Handlers ---
  const getConfirmationMessage = useCallback(() => {
      if (!primaryMasonData) return "";
      const primaryFullName = `${primaryMasonData.firstName || ''} ${primaryMasonData.lastName || ''}`.trim();
      if (mason.contactPreference === "PrimaryAttendee") {
          return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee`;
      } else if (mason.contactPreference === "ProvideLater") {
          return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee until their contact details have been updated in their profile`;
      }
      return "";
  }, [primaryMasonData, mason.contactPreference]); 
  
  const handleRemoveSelf = useCallback(() => {
      if (window.confirm("Are you sure you want to remove this attendee?")) {
          removeAttendee(attendeeId);
      }
  }, [removeAttendee, attendeeId]);

  // --- Transform Partner Data for LadyPartnerForm ---
  const transformedPartnerData = useMemo(() => {
      if (!ladyPartnerData) return undefined;
      return {
          id: ladyPartnerData.attendeeId,
          title: ladyPartnerData.title || '',
          firstName: ladyPartnerData.firstName || '',
          lastName: ladyPartnerData.lastName || '',
          email: ladyPartnerData.primaryEmail || '',
          phone: ladyPartnerData.primaryPhone || '',
          dietary: ladyPartnerData.dietaryRequirements || '',
          specialNeeds: ladyPartnerData.specialNeeds || '',
          relationship: ladyPartnerData.relationship || 'Partner',
          masonId: ladyPartnerData.relatedAttendeeId || '',
          contactPreference: ladyPartnerData.contactPreference || 'Directly',
          contactConfirmed: !!ladyPartnerData.contactConfirmed,
      } as OldLadyPartnerData;
  }, [ladyPartnerData]);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>
          {isPrimary ? 'Mason Attendee - Primary' : `Mason Attendee ${attendeeNumber}`}
        </CardTitle>
        {!isPrimary && (
          <button 
            onClick={handleRemoveSelf} 
            className="text-red-500 hover:text-red-700 transition-colors text-sm flex items-center"
            aria-label={`Remove Mason Attendee ${attendeeNumber}`}
          >
            <X className="w-4 h-4 mr-1" /> Remove
          </button>
        )}
      </CardHeader>
      
      <CardBody>
        <MasonBasicInfo 
          mason={mason} 
          id={attendeeId} 
          isPrimary={isPrimary} 
          onChange={handleFieldChange}
          handleTitleChange={handleTitleChange}
          titles={titles}
          ranks={ranks}
        />
        
        {mason.rank === 'GL' && (
          <MasonGrandLodgeFields 
            mason={mason} 
            id={attendeeId} 
            onChange={handleFieldChange}
            isPrimary={isPrimary}
          />
        )}

        <MasonLodgeInfo 
          mason={mason}
          id={attendeeId}
          isPrimary={isPrimary}
          grandLodgeOptions={grandLodges} 
          isLoadingGrandLodges={isLoadingGrandLodges}
          grandLodgeError={grandLodgeError}
          selectedGrandLodge={selectedGrandLodge}
          handleGrandLodgeSelect={handleGrandLodgeSelect}
          grandLodgeInputValue={grandLodgeInputValue}
          onGrandLodgeInputChange={handleGrandLodgeInputChange}
          lodgeOptions={allLodgeSearchResults}
          isLoadingLodges={isLoadingAllLodges}
          lodgeError={allLodgesError}
          selectedLodge={selectedLodge}
          handleLodgeSelect={handleLodgeSelect}
          lodgeInputValue={lodgeInputValue}
          onLodgeInputChange={handleLodgeInputChange}
          isCreatingLodgeUI={isCreatingLodgeUI}
          showLodgeNumberInput={isCreatingLodgeUI}
          handleInitiateLodgeCreation={handleInitiateLodgeCreation}
          newLodgeName={newLodgeName}
          setNewLodgeName={setNewLodgeName}
          newLodgeNumber={newLodgeNumber}
          handleLodgeNumberChange={handleLodgeNumberChange}
          handleCancelLodgeCreation={handleCancelLodgeCreation}
          onConfirmNewLodge={handleConfirmNewLodge}
        />

        <MasonContactInfo 
          mason={mason} 
          id={attendeeId}
          onChange={handleFieldChange}
          handlePhoneChange={handlePhoneChange} 
          isPrimary={isPrimary}
          hideContactFields={!isPrimary && mason.contactPreference !== 'Directly'}
          showConfirmation={!isPrimary && (mason.contactPreference === 'PrimaryAttendee' || mason.contactPreference === 'ProvideLater')}
          getConfirmationMessage={getConfirmationMessage} 
        />

        <MasonAdditionalInfo 
          mason={mason} 
          id={attendeeId}
          onChange={handleFieldChange}
        />

        {!ladyPartnerData && (
          <LadyPartnerToggle
            hasPartner={false}
            onToggle={handleLadyPartnerToggle}
          />
        )}

        {ladyPartnerData && transformedPartnerData && (
          <LadyPartnerForm
            partner={transformedPartnerData}
            id={ladyPartnerData.attendeeId}
            updateField={ (id: string, field: string, value: any) => {
              let unifiedField: keyof UnifiedAttendeeData | null = null;
              switch (field as keyof OldLadyPartnerData) {
                case 'title': unifiedField = 'title'; break;
                case 'firstName': unifiedField = 'firstName'; break;
                case 'lastName': unifiedField = 'lastName'; break;
                case 'email': unifiedField = 'primaryEmail'; break;
                case 'phone': unifiedField = 'primaryPhone'; break;
                case 'dietary': unifiedField = 'dietaryRequirements'; break;
                case 'specialNeeds': unifiedField = 'specialNeeds'; break;
                case 'relationship': unifiedField = 'relationship'; break;
                case 'contactPreference': unifiedField = 'contactPreference'; break;
                case 'contactConfirmed': unifiedField = 'contactConfirmed'; break;
                default: console.warn(`Unhandled LadyPartnerForm field update: ${field}`); return;
              }
              if (unifiedField) {
                updateAttendee(id, { [unifiedField]: value });
              }
            }}
            onRemove={handleLadyPartnerToggle}
            relatedMasonName={`${mason.firstName || ''} ${mason.lastName || ''}`.trim()}
          />
        )}
      </CardBody>
    </Card>
  );
};

export default MasonForm;