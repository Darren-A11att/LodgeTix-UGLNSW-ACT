import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MasonData, LadyPartnerData, GuestData, GuestPartnerData, FormState } from '../../shared/types/register';
import { X, AlertTriangle } from 'lucide-react';
import MasonForm from './MasonForm';
import GuestForm from './GuestForm';

// Define AttendeeData type alias locally for clarity
type AttendeeData = MasonData | LadyPartnerData | GuestData | GuestPartnerData;

type FieldValue = string | boolean | number | undefined; // Define shared type for field values

interface AttendeeEditModalProps {
  attendeeType: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner';
  attendeeIndex: number;
  formState: FormState;
  onClose: () => void;
  updateMasonField: (index: number, field: string, value: FieldValue) => void;
  updateGuestField: (index: number, field: string, value: FieldValue) => void;
  updateLadyPartnerField: (index: number, field: string, value: FieldValue) => void;
  updateGuestPartnerField: (index: number, field: string, value: FieldValue) => void;
  toggleSameLodge: (index: number, checked: boolean) => void;
  toggleHasLadyPartner: (index: number, checked: boolean) => void;
  toggleGuestHasPartner: (index: number, checked: boolean) => void;
}

const AttendeeEditModal: React.FC<AttendeeEditModalProps> = ({
  attendeeType,
  attendeeIndex,
  formState,
  onClose,
  updateMasonField,
  updateGuestField,
  updateLadyPartnerField,
  updateGuestPartnerField,
  toggleSameLodge,
  toggleHasLadyPartner,
  toggleGuestHasPartner,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // --- State Management ---
  // Load initial data *unconditionally* using useState initializer
  const [initialData] = useState<AttendeeData | null>(() => {
     switch(attendeeType) {
          case 'mason': return formState.masons[attendeeIndex];
          case 'ladyPartner': return formState.ladyPartners[attendeeIndex];
          case 'guest': return formState.guests[attendeeIndex];
          case 'guestPartner': return formState.guestPartners[attendeeIndex];
          default: return null;
      }
  });
  const [editedData, setEditedData] = useState<AttendeeData | null>(initialData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showUnsavedConfirmAlert, setShowUnsavedConfirmAlert] = useState<boolean>(false);

  // --- Change Tracking & Handling (Memoized) ---
  const checkChanges = useCallback((newData: AttendeeData | null): boolean => {
      if (!initialData || !newData) return false; // Use initialData state
      for (const key in newData) {
          if (newData[key as keyof AttendeeData] !== initialData[key as keyof AttendeeData]) {
             return true;
          }
      }
      return false;
  }, [initialData]); // Depend on initialData state

  const handleLocalChange = useCallback((index: number, field: string, value: FieldValue) => {
    setEditedData(prevData => {
      if (!prevData || index !== attendeeIndex) return prevData;
      const newData = { ...prevData, [field]: value };

      const changed = checkChanges(newData);
      setHasUnsavedChanges(changed);
      return newData;
    });
  }, [attendeeIndex, checkChanges]);

  const handleLocalToggleSameLodge = useCallback((checked: boolean) => {
     setEditedData(prev => {
        if (!prev || attendeeType !== 'mason') return prev;
        const newData = { ...(prev as MasonData), sameLodgeAsPrimary: checked };
        const changed = checkChanges(newData);
        setHasUnsavedChanges(changed);
        return newData;
     });
  }, [attendeeType, checkChanges]); 

  // --- Save Logic (Memoized) ---
  const performActualSave = useCallback(() => {
    if (!editedData) return;
    // Choose the correct update function based on attendee type
    let updateFn: (index: number, field: string, value: FieldValue) => void;
    let keysToSkip: string[] = ['id', 'ticket']; // Base keys to skip

    switch(attendeeType) {
      case 'mason':
        updateFn = updateMasonField;
        // Skip fields managed by specific toggles or complex objects
        keysToSkip = [...keysToSkip, 'hasLadyPartner', 'ladyPartnerData', 'sameLodgeAsPrimary']; 
        break;
      case 'guest':
        updateFn = updateGuestField;
        keysToSkip = [...keysToSkip, 'hasPartner', 'partnerData'];
        break;
      case 'ladyPartner':
        updateFn = updateLadyPartnerField;
        keysToSkip = [...keysToSkip, 'masonIndex', 'contactConfirmed'];
        break;
      case 'guestPartner':
        updateFn = updateGuestPartnerField;
        keysToSkip = [...keysToSkip, 'guestIndex', 'contactConfirmed'];
        break;
      default:
        return; // Should not happen
    }

    // Iterate through the locally edited data and update the main form state
    Object.entries(editedData).forEach(([key, value]) => {
      if (!keysToSkip.includes(key)) {
        // Check if value is a simple type before updating
        if (typeof value !== 'object' || value === null) {
           updateFn(attendeeIndex, key, value as FieldValue);
        } else {
            console.warn(`Skipping update for potentially complex object field: ${key}`);
        }
      }
    });
    
    // Handle specific boolean toggles that were managed locally (only sameLodge for now)
    if (attendeeType === 'mason' && 'sameLodgeAsPrimary' in editedData) {
        // Use the original toggle function from context
        toggleSameLodge(attendeeIndex, (editedData as MasonData).sameLodgeAsPrimary ?? false);
    }
    // Note: hasLadyPartner/hasGuestPartner are handled by their own toggle functions passed to the forms

    if ((attendeeType === 'ladyPartner' || attendeeType === 'guestPartner') && 'contactConfirmed' in editedData) {
        // Use the original toggle function from context
        if (attendeeType === 'ladyPartner') {
            toggleHasLadyPartner(attendeeIndex, (editedData as LadyPartnerData).contactConfirmed || false);
        } else {
            toggleGuestHasPartner(attendeeIndex, (editedData as GuestPartnerData).contactConfirmed || false);
        }
    }

    setHasUnsavedChanges(false);
  }, [editedData, attendeeIndex, attendeeType, updateMasonField, updateGuestField, updateLadyPartnerField, updateGuestPartnerField, toggleSameLodge, toggleHasLadyPartner, toggleGuestHasPartner]);

  const handleSaveChanges = useCallback(() => {
    performActualSave();
    onClose();
  }, [performActualSave, onClose]);

  // --- Close Logic (Memoized) ---
  const requestClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedConfirmAlert(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  // --- Confirmation Alert Handlers (Memoized) ---
  const handleDiscardAndClose = useCallback(() => {
    setShowUnsavedConfirmAlert(false);
    setHasUnsavedChanges(false);
    // Reset editedData back to initial state when discarding
    setEditedData(initialData); 
    onClose();
  }, [onClose, initialData]); // Added initialData dependency

  const handleBackToEdit = useCallback(() => {
    setShowUnsavedConfirmAlert(false);
  }, []);

  const handleSaveAndClose = useCallback(() => {
    performActualSave();
    setShowUnsavedConfirmAlert(false);
    onClose();
  }, [performActualSave, onClose]);

   // --- Prevent Modal Content Click Propagation (Memoized) ---
   const handleModalContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // --- Title Logic (Memoized) ---
  const getFormTitle = useCallback((): string => {
     // Read directly from formState prop to ensure latest data for title
     let attendeeData: AttendeeData | undefined;
     switch(attendeeType) {
         case 'mason': attendeeData = formState.masons[attendeeIndex]; break;
         case 'ladyPartner': attendeeData = formState.ladyPartners[attendeeIndex]; break;
         case 'guest': attendeeData = formState.guests[attendeeIndex]; break;
         case 'guestPartner': attendeeData = formState.guestPartners[attendeeIndex]; break;
     }

     if (!attendeeData) return 'Edit Attendee'; // Return default if data not found in formState

     if (attendeeType === 'mason') {
       const mason = attendeeData as MasonData;
       let rankInfo = '';
       // Explicitly check for rank and append if it exists (and isn't GL unless grandRank also exists)
       if (mason.rank === 'GL' && mason.grandRank) {
         rankInfo = ` ${mason.grandRank}`;
       } else if (mason.rank && mason.rank !== 'GL') {
         rankInfo = ` ${mason.rank}`;
       }

       return `Edit Mason: ${mason.title} ${mason.firstName} ${mason.lastName}${rankInfo}`;
     } else if (attendeeType === 'ladyPartner') {
       const partner = attendeeData as LadyPartnerData;
       return `Edit Lady & Partner: ${partner.title} ${partner.firstName} ${partner.lastName}`;
     } else if (attendeeType === 'guest') {
       const guest = attendeeData as GuestData;
       return `Edit Guest: ${guest.title} ${guest.firstName} ${guest.lastName}`;
     } else if (attendeeType === 'guestPartner') {
       const partner = attendeeData as GuestPartnerData;
       return `Edit Guest Partner: ${partner.title} ${partner.firstName} ${partner.lastName}`;
     }
     return 'Edit Attendee';
  }, [formState, attendeeType, attendeeIndex]);

  // --- Effect for ESC key --- 
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
         if (showUnsavedConfirmAlert) {
             handleBackToEdit(); 
         } else {
            requestClose(); 
         }
      }
    };
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [requestClose, showUnsavedConfirmAlert, handleBackToEdit]);

  // --- Conditional Return --- 
  // Now safe to have conditional return after all hooks
  if (!editedData) {
    // Render loading/error state instead of null
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white p-4 rounded-md shadow-lg">
                Loading attendee data...
                {/* Optional: Add a close button here too? */} 
             </div>
        </div>
    );
  }

  // --- Partner Data Lookup (runs after null check) ---
  const ladyPartnerData = (attendeeType === 'mason') 
      ? formState.ladyPartners.find(lp => lp.masonIndex === attendeeIndex) 
      : undefined;
  const ladyPartnerIndex = (attendeeType === 'mason' && ladyPartnerData) 
      ? formState.ladyPartners.findIndex(lp => lp.id === ladyPartnerData.id) 
      : -1;
      
  const guestPartnerData = (attendeeType === 'guest') 
      ? formState.guestPartners.find(gp => gp.guestIndex === attendeeIndex) 
      : undefined;
  const guestPartnerIndex = (attendeeType === 'guest' && guestPartnerData) 
      ? formState.guestPartners.findIndex(gp => gp.id === guestPartnerData.id) 
      : -1;

  // --- Disable Save Button Logic --- 
  const isConfirmationRequired = (attendeeType === 'ladyPartner' || attendeeType === 'guestPartner') && editedData?.contactPreference !== 'Directly';
  const isSaveDisabled = isConfirmationRequired && !editedData?.contactConfirmed;

  // Log the state controlling the alert visibility just before render
  console.log('Rendering AttendeeEditModal. showUnsavedConfirmAlert:', showUnsavedConfirmAlert);

  // --- Render ---
  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === modalRef.current) { requestClose(); } }}
      role="dialog" 
      aria-modal="true"
      aria-labelledby="attendee-edit-modal-title"
    >
      {showUnsavedConfirmAlert && (
          <div 
             className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" 
             onClick={handleBackToEdit}
             role="alertdialog"
             aria-modal="true"
             aria-labelledby="unsaved-changes-alert-title"
          >
             <div
                className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 relative"
                onClick={(e) => e.stopPropagation()}
             >
                  <div className="flex items-start">
                       <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                          <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                       </div>
                       <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                          <h3 className="text-lg font-medium leading-6 text-gray-900" id="unsaved-changes-alert-title">
                             Unsaved Changes
                          </h3>
                          <div className="mt-2 mb-4">
                             <p className="text-sm text-gray-500">
                                You have unsaved changes. Closing now will discard them.
                             </p>
                          </div>
                       </div>
                  </div>
                  {/* Buttons justified across width */}
                  <div className="mt-5 pt-4 px-4 border-t border-slate-200 flex justify-between">
                      <button
                          type="button"
                          // Use btn-primary base for font/size, override colors
                          className="btn-primary bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700 focus:ring-red-500"
                          onClick={handleDiscardAndClose}
                      >
                          Discard & Close
                      </button>
                      <button
                          type="button"
                          // Use btn-primary base, override to appear as outline
                          className="btn-primary border border-primary text-primary bg-transparent hover:bg-primary/10 focus:ring-primary"
                          onClick={handleBackToEdit}
                      >
                          Back to Edit
                      </button>
                      <button
                          type="button"
                          // Use btn-primary base for font/size, override colors
                          className="btn-primary bg-green-600 border-green-600 text-white hover:bg-green-700 hover:border-green-700 focus:ring-green-500"
                          onClick={handleSaveAndClose}
                      >
                          Save & Close
                      </button>
                  </div>
             </div>
          </div>
      )}
      <div
        ref={modalContentRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={handleModalContentClick}
        role="document"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold" id="attendee-edit-modal-title">{getFormTitle()}</h2>
          <button
            onClick={requestClose}
            className="text-slate-500 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 flex-grow">
          {attendeeType === 'mason' && (
            <MasonForm
              mason={editedData as MasonData}
              index={attendeeIndex}
              onChange={handleLocalChange}
              isPrimary={attendeeIndex === 0}
              isSameLodgeAsFirst={(editedData as MasonData).sameLodgeAsPrimary}
              onToggleSameLodge={handleLocalToggleSameLodge}
              ladyPartnerData={ladyPartnerData}
              ladyPartnerIndex={ladyPartnerIndex >= 0 ? ladyPartnerIndex : undefined}
              primaryMasonData={formState.masons[0]}
            />
          )}
           {attendeeType === 'guest' && (
            <GuestForm
              guest={editedData as GuestData}
              index={attendeeIndex}
              onChange={handleLocalChange}
              partnerData={guestPartnerData}
              partnerIndex={guestPartnerIndex >= 0 ? guestPartnerIndex : undefined}
              primaryMasonData={formState.masons[0]}
            />
          )}
          {/* Direct editing for LadyPartner */}
          {attendeeType === 'ladyPartner' && (
              <div className="space-y-6">
                  {/* Line 1: Title, First Name, Last Name */}
                  <div className="grid grid-cols-3 gap-4">
                      <InputField label="Title" field="title" value={(editedData as LadyPartnerData).title} onChange={handleLocalChange} index={attendeeIndex} />
                      <InputField label="First Name" field="firstName" value={(editedData as LadyPartnerData).firstName} onChange={handleLocalChange} index={attendeeIndex} required={true} />
                      <InputField label="Last Name" field="lastName" value={(editedData as LadyPartnerData).lastName} onChange={handleLocalChange} index={attendeeIndex} required={true} />
                  </div>

                  {/* Line 2: Relationship, Contact Preference */}
                  <div className="grid grid-cols-2 gap-4">
                      <InputField label="Relationship" field="relationship" value={(editedData as LadyPartnerData).relationship} onChange={handleLocalChange} index={attendeeIndex} required={true} />
                      <SelectField 
                          label="Contact Preference" 
                          field="contactPreference" 
                          value={(editedData as LadyPartnerData).contactPreference} 
                          onChange={handleLocalChange} 
                          index={attendeeIndex}
                          options={['Directly', 'Mason', 'Provide Later']} // Options for LadyPartner
                          required={true} 
                      />
                  </div>

                  {/* Line 3: Conditional Contact Details or Confirmation */}
                  {(editedData as LadyPartnerData).contactPreference === 'Directly' ? (
                      <div className="grid grid-cols-2 gap-4">
                           <InputField label="Mobile" field="phone" type="tel" value={(editedData as LadyPartnerData).phone} onChange={handleLocalChange} index={attendeeIndex} required={true} />
                           <InputField label="Email" field="email" type="email" value={(editedData as LadyPartnerData).email} onChange={handleLocalChange} index={attendeeIndex} required={true} />
                      </div>
                  ) : (
                       <div className="text-sm p-3 bg-blue-50 border border-blue-200 rounded-md">
                           {/* Confirmation Text based on selection */} 
                           {(editedData as LadyPartnerData).contactPreference === 'Mason' && "Contact details will be managed by the associated Mason."}
                           {(editedData as LadyPartnerData).contactPreference === 'Provide Later' && "Contact details will be provided later."}
                           {/* Confirmation Checkbox */}
                           <div className="mt-2 flex items-start">
                              <div className="flex items-center h-5">
                                 <input
                                     id={`edit-lp-contactConfirmed-${attendeeIndex}`}
                                     name={`edit-lp-contactConfirmed-${attendeeIndex}`}
                                     type="checkbox"
                                     checked={(editedData as LadyPartnerData).contactConfirmed || false}
                                     onChange={(e) => handleLocalChange(attendeeIndex, 'contactConfirmed', e.target.checked)}
                                     className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                                 />
                              </div>
                              <div className="ml-3 text-xs">
                                 <label htmlFor={`edit-lp-contactConfirmed-${attendeeIndex}`} className="font-medium text-gray-700">
                                      I confirm the selected contact preference.
                                 </label>
                              </div>
                           </div>
                       </div>
                   )}

                  {/* Line 4: Dietary */}
                  <InputField label="Dietary Requirements" field="dietary" value={(editedData as LadyPartnerData).dietary} onChange={handleLocalChange} index={attendeeIndex} />

                   {/* Line 5: Special Needs */}
                   <TextareaField label="Special Needs / Accessibility" field="specialNeeds" value={(editedData as LadyPartnerData).specialNeeds} onChange={handleLocalChange} index={attendeeIndex} />
              </div>
          )}
           {/* Direct editing for GuestPartner */}
          {attendeeType === 'guestPartner' && (
              <div className="space-y-6">
                   {/* Line 1: Title, First Name, Last Name */}
                   <div className="grid grid-cols-3 gap-4">
                       <InputField label="Title" field="title" value={(editedData as GuestPartnerData).title} onChange={handleLocalChange} index={attendeeIndex} />
                       <InputField label="First Name" field="firstName" value={(editedData as GuestPartnerData).firstName} onChange={handleLocalChange} index={attendeeIndex} required={true} />
                       <InputField label="Last Name" field="lastName" value={(editedData as GuestPartnerData).lastName} onChange={handleLocalChange} index={attendeeIndex} required={true} />
                   </div>

                   {/* Line 2: Relationship, Contact Preference */}
                   <div className="grid grid-cols-2 gap-4">
                       <InputField label="Relationship" field="relationship" value={(editedData as GuestPartnerData).relationship} onChange={handleLocalChange} index={attendeeIndex} required={true} />
                       <SelectField 
                           label="Contact Preference" 
                           field="contactPreference" 
                           value={(editedData as GuestPartnerData).contactPreference} 
                           onChange={handleLocalChange} 
                           index={attendeeIndex}
                           options={['Directly', 'Guest', 'Provide Later']} // Options for GuestPartner
                           required={true} 
                       />
                   </div>

                   {/* Line 3: Conditional Contact Details or Confirmation */}
                   {(editedData as GuestPartnerData).contactPreference === 'Directly' ? (
                       <div className="grid grid-cols-2 gap-4">
                           <InputField label="Mobile" field="phone" type="tel" value={(editedData as GuestPartnerData).phone} onChange={handleLocalChange} index={attendeeIndex} required={true} />
                           <InputField label="Email" field="email" type="email" value={(editedData as GuestPartnerData).email} onChange={handleLocalChange} index={attendeeIndex} required={true} />
                       </div>
                   ) : (
                       <div className="text-sm p-3 bg-blue-50 border border-blue-200 rounded-md">
                           {/* Confirmation Text based on selection */} 
                           {(editedData as GuestPartnerData).contactPreference === 'Guest' && "Contact details will be managed by the associated Guest."}
                           {(editedData as GuestPartnerData).contactPreference === 'Provide Later' && "Contact details will be provided later."}
                           {/* Confirmation Checkbox */}
                           <div className="mt-2 flex items-start">
                               <div className="flex items-center h-5">
                                  <input
                                      id={`edit-gp-contactConfirmed-${attendeeIndex}`}
                                      name={`edit-gp-contactConfirmed-${attendeeIndex}`}
                                      type="checkbox"
                                      checked={(editedData as GuestPartnerData).contactConfirmed || false}
                                      onChange={(e) => handleLocalChange(attendeeIndex, 'contactConfirmed', e.target.checked)}
                                      className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                                  />
                               </div>
                               <div className="ml-3 text-xs">
                                  <label htmlFor={`edit-gp-contactConfirmed-${attendeeIndex}`} className="font-medium text-gray-700">
                                       I confirm the selected contact preference.
                                  </label>
                               </div>
                           </div>
                       </div>
                   )}

                  {/* Line 4: Dietary */}
                  <InputField label="Dietary Requirements" field="dietary" value={(editedData as GuestPartnerData).dietary} onChange={handleLocalChange} index={attendeeIndex} />

                   {/* Line 5: Special Needs */}
                   <TextareaField label="Special Needs / Accessibility" field="specialNeeds" value={(editedData as GuestPartnerData).specialNeeds} onChange={handleLocalChange} index={attendeeIndex} />
              </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-auto p-4 border-t border-slate-200 sticky bottom-0 bg-white z-10">
          <button
            type="button"
            onClick={requestClose}
            className="btn-outline mr-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className={`btn-primary ${isSaveDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSaveDisabled}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for input fields (define at bottom or import)
interface InputFieldProps {
    label: string;
    field: string;
    value: string | number | undefined;
    onChange: (index: number, field: string, value: string | number) => void;
    index: number;
    type?: string;
    required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, field, value, onChange, index, type = 'text', required = false }) => (
    <div>
        <label htmlFor={`edit-${field}-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            {label}{required && ' *'}
        </label>
        <input
            id={`edit-${field}-${index}`}
            type={type}
            value={value ?? ''}
            onChange={(e) => onChange(index, field, e.target.value)}
            required={required}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
        />
    </div>
);

// Helper component for Select fields
interface SelectFieldProps {
    label: string;
    field: string;
    value: string | undefined;
    onChange: (index: number, field: string, value: string) => void;
    index: number;
    options: string[];
    required?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, field, value, onChange, index, options, required = false }) => (
    <div>
        <label htmlFor={`edit-${field}-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            {label}{required && ' *'}
        </label>
        <select
            id={`edit-${field}-${index}`}
            value={value ?? ''}
            onChange={(e) => onChange(index, field, e.target.value)}
            required={required}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white"
        >
            <option value="" disabled>Please Select</option>
            {options.map(option => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    </div>
);

// Helper component for Textarea fields
interface TextareaFieldProps {
    label: string;
    field: string;
    value: string | undefined;
    onChange: (index: number, field: string, value: string) => void;
    index: number;
    rows?: number;
    required?: boolean;
}

const TextareaField: React.FC<TextareaFieldProps> = ({ label, field, value, onChange, index, rows = 3, required = false }) => (
    <div>
        <label htmlFor={`edit-${field}-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            {label}{required && ' *'}
        </label>
        <textarea
            id={`edit-${field}-${index}`}
            value={value ?? ''}
            onChange={(e) => onChange(index, field, e.target.value)}
            required={required}
            rows={rows}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
        />
    </div>
);

export default AttendeeEditModal;