import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FormState } from '../../shared/types/register';
import { AttendeeData as UnifiedAttendeeData } from '../../lib/api/registrations';
import { X, AlertTriangle } from 'lucide-react';
import MasonForm from './MasonForm';
import GuestForm from './GuestForm';

type FieldValue = string | boolean | number | undefined | null; // Allow null

interface AttendeeEditModalProps {
  attendeeId: string;
  formState: FormState;
  onClose: () => void;
  updateAttendeeField: (attendeeId: string, field: keyof UnifiedAttendeeData, value: any) => void;
}

const AttendeeEditModal: React.FC<AttendeeEditModalProps> = ({
  attendeeId,
  formState,
  onClose,
  updateAttendeeField,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // --- State Management ---
  const [initialData] = useState<UnifiedAttendeeData | null>(() => {
     return formState.attendees.find(att => att.attendeeId === attendeeId) || null;
  });
  const [editedData, setEditedData] = useState<UnifiedAttendeeData | null>(initialData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showUnsavedConfirmAlert, setShowUnsavedConfirmAlert] = useState<boolean>(false);

  // Get attendeeType from the data itself
  const attendeeType = editedData?.attendeeType.toLowerCase() as 'mason' | 'ladypartner' | 'guest' | 'guestpartner' | undefined;

  // --- Change Tracking & Handling (Memoized) ---
  const checkChanges = useCallback((newData: UnifiedAttendeeData | null): boolean => {
      if (!initialData || !newData) return false;
      for (const key in initialData) {
          if (initialData.hasOwnProperty(key)) {
              const typedKey = key as keyof UnifiedAttendeeData;
              if (typedKey === 'ticket' && initialData.ticket && newData.ticket) {
                  if (initialData.ticket.ticketDefinitionId !== newData.ticket.ticketDefinitionId) {
                      return true;
                  }
              } else if (initialData[typedKey] !== newData[typedKey]) {
                 return true;
              }
          }
      }
      return false;
  }, [initialData]);

  const handleLocalChange = useCallback((_attendeeId: string, field: keyof UnifiedAttendeeData, value: FieldValue) => {
    setEditedData(prevData => {
      if (!prevData) return prevData;
      const newData: UnifiedAttendeeData = { 
        ...prevData, 
        [field]: value 
      };
      const changed = checkChanges(newData);
      setHasUnsavedChanges(changed);
      return newData;
    });
  }, [checkChanges]);

  // --- Save Logic (Memoized) ---
  const performActualSave = useCallback(() => {
    if (!editedData || !initialData) return;

    for (const key in editedData) {
        if (editedData.hasOwnProperty(key)) {
            const typedKey = key as keyof UnifiedAttendeeData;
            let valueChanged = false;
            if (typedKey === 'ticket' && initialData.ticket && editedData.ticket) {
                valueChanged = initialData.ticket.ticketDefinitionId !== editedData.ticket.ticketDefinitionId;
            } else {
                valueChanged = initialData[typedKey] !== editedData[typedKey];
            }

            if (valueChanged) {
               updateAttendeeField(attendeeId, typedKey, editedData[typedKey]);
            }
        }
    }

    setHasUnsavedChanges(false);
  }, [editedData, initialData, attendeeId, updateAttendeeField]);

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
    setEditedData(initialData); 
    onClose();
  }, [onClose, initialData]);

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
     // Use editedData which holds the current attendee being edited
     const attendeeData = editedData;

     if (!attendeeData) return 'Edit Attendee'; // Return default if data not found
     
     const type = attendeeData.attendeeType.toLowerCase(); // Get type from current data

     // Construct title based on the attendee data
     let namePart = `${attendeeData.title || ''} ${attendeeData.firstName || ''} ${attendeeData.lastName || ''}`.trim();
     if (!namePart) namePart = attendeeData.attendeeType; // Fallback if no name yet
     
     if (type === 'mason') {
       let rankInfo = '';
       if (attendeeData.rank === 'GL' && attendeeData.grandRank) {
         rankInfo = ` ${attendeeData.grandRank}`;
       } else if (attendeeData.rank && attendeeData.rank !== 'GL') {
         rankInfo = ` ${attendeeData.rank}`;
       }
       return `Edit Mason: ${namePart}${rankInfo}`;
     } else if (type === 'ladypartner') {
       return `Edit Lady/Partner: ${namePart}`;
     } else if (type === 'guest') {
       return `Edit Guest: ${namePart}`;
     } else if (type === 'guestpartner') {
       return `Edit Guest Partner: ${namePart}`;
     }
     return 'Edit Attendee';
  }, [editedData]); // Depend on editedData state

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
  if (!editedData) {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white p-4 rounded-md shadow-lg">
                Loading attendee data...
             </div>
        </div>
    );
  }

  // --- Partner Data Lookup (using formState.attendees) ---
  const ladyPartnerData = (attendeeType === 'mason') 
      ? formState.attendees.find(att => att.attendeeType === 'LadyPartner' && att.relatedAttendeeId === attendeeId) 
      : undefined;
      
  const guestPartnerData = (attendeeType === 'guest') 
      ? formState.attendees.find(att => att.attendeeType === 'GuestPartner' && att.relatedAttendeeId === attendeeId) 
      : undefined;

  // --- Disable Save Button Logic --- 
  const isConfirmationRequired = (attendeeType === 'ladypartner' || attendeeType === 'guestpartner') && editedData?.contactPreference !== 'Directly';
  const isSaveDisabled = isConfirmationRequired && !editedData?.contactConfirmed;

  console.log('Rendering AttendeeEditModal. showUnsavedConfirmAlert:', showUnsavedConfirmAlert);

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
              mason={editedData}
              id={attendeeId}
              attendeeNumber={formState.attendees.findIndex(att => att.attendeeId === attendeeId) + 1}
              onChange={handleLocalChange}
              isPrimary={editedData.isPrimary}
              ladyPartnerData={ladyPartnerData}
              primaryMasonData={formState.attendees.find(att => att.attendeeType === 'Mason' && att.isPrimary)}
            />
          )}
           {attendeeType === 'guest' && (
            <GuestForm
              guest={editedData}
              id={attendeeId}
              attendeeNumber={formState.attendees.findIndex(att => att.attendeeId === attendeeId) + 1}
              onChange={handleLocalChange}
              partnerData={guestPartnerData}
              primaryMasonData={formState.attendees.find(att => att.attendeeType === 'Mason' && att.isPrimary)}
            />
          )}
          {/* Direct editing for LadyPartner */}
          {attendeeType === 'ladypartner' && (
              <div className="space-y-6">
                  {/* Line 1: Title, First Name, Last Name */}
                  <div className="grid grid-cols-3 gap-4">
                      <InputField label="Title" field="title" value={(editedData as UnifiedAttendeeData).title} onChange={handleLocalChange} attendeeId={attendeeId} />
                      <InputField label="First Name" field="firstName" value={(editedData as UnifiedAttendeeData).firstName} onChange={handleLocalChange} attendeeId={attendeeId} required={true} />
                      <InputField label="Last Name" field="lastName" value={(editedData as UnifiedAttendeeData).lastName} onChange={handleLocalChange} attendeeId={attendeeId} required={true} />
                  </div>

                  {/* Line 2: Relationship, Contact Preference */}
                  <div className="grid grid-cols-2 gap-4">
                      <InputField label="Relationship" field="relationship" value={(editedData as UnifiedAttendeeData).relationship} onChange={handleLocalChange} attendeeId={attendeeId} required={true} />
                      <SelectField 
                          label="Contact Preference" 
                          field="contactPreference" 
                          value={(editedData as UnifiedAttendeeData).contactPreference} 
                          onChange={handleLocalChange} 
                          attendeeId={attendeeId}
                          options={['Directly', 'Mason', 'Provide Later']} // Options for LadyPartner
                          required={true} 
                      />
                  </div>

                  {/* Line 3: Conditional Contact Details or Confirmation */}
                  {(editedData as UnifiedAttendeeData).contactPreference === 'Directly' ? (
                      <div className="grid grid-cols-2 gap-4">
                           <InputField label="Mobile" field="primaryPhone" type="tel" value={(editedData as UnifiedAttendeeData).primaryPhone} onChange={handleLocalChange} attendeeId={attendeeId} required={true} />
                           <InputField label="Email" field="primaryEmail" type="email" value={(editedData as UnifiedAttendeeData).primaryEmail} onChange={handleLocalChange} attendeeId={attendeeId} required={true} />
                      </div>
                  ) : (
                       <div className="text-sm p-3 bg-blue-50 border border-blue-200 rounded-md">
                           {/* Confirmation Text based on selection */} 
                           {(editedData as UnifiedAttendeeData).contactPreference === 'Mason' && "Contact details will be managed by the associated Mason."}
                           {(editedData as UnifiedAttendeeData).contactPreference === 'Provide Later' && "Contact details will be provided later."}
                           {/* Confirmation Checkbox */}
                           <div className="mt-2 flex items-start">
                              <div className="flex items-center h-5">
                                 <input
                                     id={`edit-lp-contactConfirmed-${attendeeId}`}
                                     name={`edit-lp-contactConfirmed-${attendeeId}`}
                                     type="checkbox"
                                     checked={(editedData as UnifiedAttendeeData).contactConfirmed || false}
                                     onChange={(e) => handleLocalChange(attendeeId, 'contactConfirmed', e.target.checked)}
                                     className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                                 />
                              </div>
                              <div className="ml-3 text-xs">
                                 <label htmlFor={`edit-lp-contactConfirmed-${attendeeId}`} className="font-medium text-gray-700">
                                      I confirm the selected contact preference.
                                 </label>
                              </div>
                           </div>
                       </div>
                   )}

                  {/* Line 4: Dietary */}
                  <InputField label="Dietary Requirements" field="dietaryRequirements" value={(editedData as UnifiedAttendeeData).dietaryRequirements} onChange={handleLocalChange} attendeeId={attendeeId} />

                   {/* Line 5: Special Needs */}
                   <TextareaField label="Special Needs / Accessibility" field="specialNeeds" value={(editedData as UnifiedAttendeeData).specialNeeds} onChange={handleLocalChange} attendeeId={attendeeId} />
              </div>
          )}
           {/* Direct editing for GuestPartner */}
          {attendeeType === 'guestpartner' && (
              <div className="space-y-6">
                   {/* Line 1: Title, First Name, Last Name */}
                   <div className="grid grid-cols-3 gap-4">
                       <InputField label="Title" field="title" value={(editedData as UnifiedAttendeeData).title} onChange={handleLocalChange} attendeeId={attendeeId} />
                       <InputField label="First Name" field="firstName" value={(editedData as UnifiedAttendeeData).firstName} onChange={handleLocalChange} attendeeId={attendeeId} required={true} />
                       <InputField label="Last Name" field="lastName" value={(editedData as UnifiedAttendeeData).lastName} onChange={handleLocalChange} attendeeId={attendeeId} required={true} />
                   </div>

                   {/* Line 2: Relationship, Contact Preference */}
                   <div className="grid grid-cols-2 gap-4">
                       <InputField label="Relationship" field="relationship" value={(editedData as UnifiedAttendeeData).relationship} onChange={handleLocalChange} attendeeId={attendeeId} required={true} />
                       <SelectField 
                           label="Contact Preference" 
                           field="contactPreference" 
                           value={(editedData as UnifiedAttendeeData).contactPreference} 
                           onChange={handleLocalChange} 
                           attendeeId={attendeeId}
                           options={['Directly', 'Guest', 'Provide Later']} // Options for GuestPartner
                           required={true} 
                       />
                   </div>

                   {/* Line 3: Conditional Contact Details or Confirmation */}
                   {(editedData as UnifiedAttendeeData).contactPreference === 'Directly' ? (
                       <div className="grid grid-cols-2 gap-4">
                           <InputField label="Mobile" field="primaryPhone" type="tel" value={(editedData as UnifiedAttendeeData).primaryPhone} onChange={handleLocalChange} attendeeId={attendeeId} required={true} />
                           <InputField label="Email" field="primaryEmail" type="email" value={(editedData as UnifiedAttendeeData).primaryEmail} onChange={handleLocalChange} attendeeId={attendeeId} required={true} />
                       </div>
                   ) : (
                       <div className="text-sm p-3 bg-blue-50 border border-blue-200 rounded-md">
                           {/* Confirmation Text based on selection */} 
                           {(editedData as UnifiedAttendeeData).contactPreference === 'Guest' && "Contact details will be managed by the associated Guest."}
                           {(editedData as UnifiedAttendeeData).contactPreference === 'Provide Later' && "Contact details will be provided later."}
                           {/* Confirmation Checkbox */}
                           <div className="mt-2 flex items-start">
                               <div className="flex items-center h-5">
                                  <input
                                      id={`edit-gp-contactConfirmed-${attendeeId}`}
                                      name={`edit-gp-contactConfirmed-${attendeeId}`}
                                      type="checkbox"
                                      checked={(editedData as UnifiedAttendeeData).contactConfirmed || false}
                                      onChange={(e) => handleLocalChange(attendeeId, 'contactConfirmed', e.target.checked)}
                                      className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                                  />
                               </div>
                               <div className="ml-3 text-xs">
                                  <label htmlFor={`edit-gp-contactConfirmed-${attendeeId}`} className="font-medium text-gray-700">
                                       I confirm the selected contact preference.
                                  </label>
                               </div>
                           </div>
                       </div>
                   )}

                  {/* Line 4: Dietary */}
                  <InputField label="Dietary Requirements" field="dietaryRequirements" value={(editedData as UnifiedAttendeeData).dietaryRequirements} onChange={handleLocalChange} attendeeId={attendeeId} />

                   {/* Line 5: Special Needs */}
                   <TextareaField label="Special Needs / Accessibility" field="specialNeeds" value={(editedData as UnifiedAttendeeData).specialNeeds} onChange={handleLocalChange} attendeeId={attendeeId} />
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
    field: keyof UnifiedAttendeeData; // Use keyof for type safety
    value: string | number | undefined | null; // Allow null
    // Update onChange signature to include attendeeId
    onChange: (attendeeId: string, field: keyof UnifiedAttendeeData, value: string | number | boolean) => void;
    // Change index to attendeeId
    attendeeId: string;
    type?: string;
    required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, field, value, onChange, attendeeId, type = 'text', required = false }) => (
    <div>
        <label htmlFor={`edit-${field}-${attendeeId}`} className="block text-sm font-medium text-gray-700 mb-1">
            {label}{required && ' *'}
        </label>
        <input
            id={`edit-${field}-${attendeeId}`}
            type={type}
            value={value ?? ''}
            // Pass attendeeId to onChange
            onChange={(e) => onChange(attendeeId, field, e.target.value)}
            required={required}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
        />
    </div>
);

// Helper component for Select fields
interface SelectFieldProps {
    label: string;
    field: keyof UnifiedAttendeeData; // Use keyof
    value: string | undefined;
    // Update onChange signature
    onChange: (attendeeId: string, field: keyof UnifiedAttendeeData, value: string | boolean) => void;
    // Change index to attendeeId
    attendeeId: string;
    options: string[];
    required?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, field, value, onChange, attendeeId, options, required = false }) => (
    <div>
        <label htmlFor={`edit-${field}-${attendeeId}`} className="block text-sm font-medium text-gray-700 mb-1">
            {label}{required && ' *'}
        </label>
        <select
            id={`edit-${field}-${attendeeId}`}
            value={value ?? ''}
            // Pass attendeeId to onChange
            onChange={(e) => onChange(attendeeId, field, e.target.value)}
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
    field: keyof UnifiedAttendeeData; // Use keyof
    value: string | undefined | null; // Allow null
    // Update onChange signature
    onChange: (attendeeId: string, field: keyof UnifiedAttendeeData, value: string | boolean) => void;
    // Change index to attendeeId
    attendeeId: string;
    rows?: number;
    required?: boolean;
}

const TextareaField: React.FC<TextareaFieldProps> = ({ label, field, value, onChange, attendeeId, rows = 3, required = false }) => (
    <div>
        <label htmlFor={`edit-${field}-${attendeeId}`} className="block text-sm font-medium text-gray-700 mb-1">
            {label}{required && ' *'}
        </label>
        <textarea
            id={`edit-${field}-${attendeeId}`}
            value={value ?? ''}
            // Pass attendeeId to onChange
            onChange={(e) => onChange(attendeeId, field, e.target.value)}
            required={required}
            rows={rows}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
        />
    </div>
);

export default AttendeeEditModal;