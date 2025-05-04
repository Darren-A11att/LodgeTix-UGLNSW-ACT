import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MasonForm from './MasonForm';
import GuestForm from './GuestForm';
import { FormState, MasonData, GuestData, LadyPartnerData, GuestPartnerData, AttendeeType, AttendeeTicket } from '../../shared/types/register';
import AddRemoveControl from './AddRemoveControl';
import { AttendeeData as UnifiedAttendeeData } from '../../lib/api/registrations';

interface AttendeeDetailsProps {
  formState: FormState;
  updateFormField: (field: string, value: unknown) => void;
  updateMasonField: (id: string, field: string, value: string | boolean) => void;
  updateGuestField: (id: string, field: string, value: string | boolean) => void;
  updateLadyPartnerField: (id: string, field: string, value: string | boolean) => void;
  updateGuestPartnerField?: (id: string, field: string, value: string | boolean) => void;
  toggleSameLodge: (id: string, checked: boolean) => void;
  toggleHasLadyPartner: (masonId: string, checked: boolean) => void;
  toggleGuestHasPartner?: (guestId: string, checked: boolean) => void;
  addMason: () => void;
  removeMasonById: (id: string) => void;
  addGuest: () => void;
  removeGuestById: (id: string) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const AttendeeDetails: React.FC<AttendeeDetailsProps> = ({
  formState,
  updateFormField,
  updateMasonField,
  updateGuestField,
  updateLadyPartnerField,
  updateGuestPartnerField,
  toggleSameLodge,
  toggleHasLadyPartner,
  toggleGuestHasPartner,
  addMason,
  removeMasonById,
  addGuest,
  removeGuestById,
  nextStep,
  prevStep
}) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Find the primary mason from the unified attendees array
  const primaryMasonData = useMemo(() => 
    formState.attendees?.find(att => att.attendeeType === 'Mason' && att.isPrimary)
  , [formState.attendees]);

  // Find lady partner data using relatedAttendeeId (use unified attendees)
  const findLadyPartnerForMason = useCallback((masonId: string): UnifiedAttendeeData | undefined => {
    const partner = formState.attendees?.find(att => att.attendeeType === 'LadyPartner' && att.relatedAttendeeId === masonId);
    return partner;
  }, [formState.attendees]); 

  // Find partner data using guestId (use unified attendees)
  const findPartnerForGuest = useCallback((guestId: string): UnifiedAttendeeData | undefined => {
    const partner = formState.attendees?.find(att => att.attendeeType === 'GuestPartner' && att.relatedAttendeeId === guestId);
    return partner;
  }, [formState.attendees]);

  // Log form state changes to debug partner connections - with reduced frequency
  useEffect(() => {
    // Only log in development and with reduced frequency to avoid console spam
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.2) {
      // Log based on unified attendees array
      const partnerCounts = (formState.attendees || []).reduce((acc, att) => {
        if (att.attendeeType === 'LadyPartner') acc.ladyPartners++;
        if (att.attendeeType === 'GuestPartner') acc.guestPartners++;
        return acc;
      }, { ladyPartners: 0, guestPartners: 0 });

      console.log("Form state updated with partners:", {
        ladyPartners: partnerCounts.ladyPartners,
        guestPartners: partnerCounts.guestPartners
      });
    }
  // Update dependency to attendees array
  }, [formState.attendees]); 

  // *** Validation Helpers Refactored (where necessary) ***
  
  // Assuming validatePrimaryMason, validateAdditionalMason, validateGuest 
  // primarily validate fields present on UnifiedAttendeeData and only receive one attendee at a time,
  // they might not need significant changes beyond using attendeeId prefix.
  // However, validateLadyPartner and validateGuestPartner need refactoring 
  // because they receive the related Mason/Guest which needs to be looked up differently.

  const validatePrimaryMason = useCallback((mason: UnifiedAttendeeData): Record<string, string> => {
    const errors: Record<string, string> = {};
    const prefix = `attendee-${mason.attendeeId}`;
    // Example checks (ensure these fields exist or add guards)
    if (!mason.title) errors[`${prefix}-title`] = `Masonic Title is required`;
    if (!mason.firstName) errors[`${prefix}-firstName`] = `First Name is required`;
    // ... add all other necessary checks for primary mason ...
    return errors;
  }, []);
  
  const validateAdditionalMason = useCallback((mason: UnifiedAttendeeData): Record<string, string> => {
    const errors: Record<string, string> = {};
    // ... add all necessary checks for additional mason ...
    return errors;
  }, []);
  
  const validateGuest = useCallback((guest: UnifiedAttendeeData): Record<string, string> => {
    const errors: Record<string, string> = {};
    // ... add all necessary checks for guest ...
    return errors;
  }, []);

  // Refactored validateLadyPartner
  const validateLadyPartner = useCallback((partner: UnifiedAttendeeData, allAttendees: UnifiedAttendeeData[]): Record<string, string> => {
    const errors: Record<string, string> = {};
    const relatedMason = allAttendees.find(att => att.attendeeId === partner.relatedAttendeeId && att.attendeeType === 'Mason');
    const relatedMasonName = relatedMason ? `${relatedMason.firstName || ''} ${relatedMason.lastName || ''}`.trim() : `Related Mason`;
    const partnerLabel = `Partner of ${relatedMasonName}`;
    const partnerName = `${partner.firstName || partnerLabel} ${partner.lastName || ''}`.trim();
    const prefix = `attendee-${partner.attendeeId}`; 

    if (!partner.title) errors[`${prefix}-title`] = `Title is required for ${partnerName}`;
    if (!partner.firstName) errors[`${prefix}-firstName`] = `First Name is required for ${partnerLabel}`;
    // ... add other partner validation checks ...
    if (!partner.relationship || partner.relationship === 'Please Select') errors[`${prefix}-relationship`] = `Relationship is required for ${partnerName}`;
    // ... contact preference checks ...

    return errors;
  }, []);

  // Refactored validateGuestPartner
  const validateGuestPartner = useCallback((partner: UnifiedAttendeeData, allAttendees: UnifiedAttendeeData[]): Record<string, string> => {
    const errors: Record<string, string> = {};
    const relatedGuest = allAttendees.find(att => att.attendeeId === partner.relatedAttendeeId && att.attendeeType === 'Guest');
    const relatedGuestName = relatedGuest ? `${relatedGuest.firstName || ''} ${relatedGuest.lastName || ''}`.trim() : `Related Guest`;
    const partnerLabel = `Partner of ${relatedGuestName}`;
    const partnerName = `${partner.firstName || partnerLabel} ${partner.lastName || ''}`.trim();
    const prefix = `attendee-${partner.attendeeId}`; 
    
    if (!partner.title) errors[`${prefix}-title`] = `Title is required for ${partnerName}`;
    if (!partner.firstName) errors[`${prefix}-firstName`] = `First Name is required for ${partnerLabel}`;
    // ... add other partner validation checks ...
     if (!partner.relationship || partner.relationship === 'Please Select') errors[`${prefix}-relationship`] = `Relationship is required for ${partnerName}`;
     // ... contact preference checks ...

    return errors;
  }, []);

  // Main validation function - Refactored
  const validateStep2 = useCallback((): Record<string, string> => {
    let combinedErrors: Record<string, string> = {};
    const attendees = formState.attendees || [];
    const agreeToTerms = formState.agreeToTerms;

    attendees.forEach(attendee => {
      if (attendee.attendeeType === 'Mason') {
        if (attendee.isPrimary) {
          combinedErrors = { ...combinedErrors, ...validatePrimaryMason(attendee) };
        } else {
          combinedErrors = { ...combinedErrors, ...validateAdditionalMason(attendee) };
        }
      } else if (attendee.attendeeType === 'Guest') {
        combinedErrors = { ...combinedErrors, ...validateGuest(attendee) };
      } else if (attendee.attendeeType === 'LadyPartner') {
        combinedErrors = { ...combinedErrors, ...validateLadyPartner(attendee, attendees) };
      } else if (attendee.attendeeType === 'GuestPartner') {
        combinedErrors = { ...combinedErrors, ...validateGuestPartner(attendee, attendees) };
      }
    });

    if (!agreeToTerms) combinedErrors['terms'] = 'You must agree to the Terms and Conditions';
    return combinedErrors;
  }, [formState.attendees, formState.agreeToTerms, validatePrimaryMason, validateAdditionalMason, validateGuest, validateLadyPartner, validateGuestPartner]);

  useEffect(() => {
    if (!formState.agreeToTerms) {
      setValidationErrors({});
    } else {
      setValidationErrors({});
    }
  }, [formState.agreeToTerms]);

  const handleNext = () => {
    const errors = validateStep2();
    setValidationErrors(errors);
    if (Object.keys(errors).length === 0) {
        nextStep();
    } else {
        const errorElement = document.getElementById('validation-errors');
        errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Attendee Details</h2>

      {/* Mason Attendee - Primary */}
      {primaryMasonData && (
        <MasonForm
          // Pass the primary mason data found from attendees array
          mason={primaryMasonData as any} // Cast needed as MasonForm expects old type
          id={primaryMasonData.attendeeId}
          // Update functions likely need refactoring to use attendeeId
          onChange={updateMasonField as any} 
          isPrimary={true}
          onToggleHasLadyPartner={(checked: boolean) => toggleHasLadyPartner(primaryMasonData.attendeeId, checked)}
          // Pass the found partner data (already UnifiedAttendeeData)
          ladyPartnerData={findLadyPartnerForMason(primaryMasonData.attendeeId) as any} // Cast needed
          updateLadyPartnerField={updateLadyPartnerField as any}
          // Pass primaryMasonData itself
          primaryMasonData={primaryMasonData as any} // Cast needed
          attendeeNumber={1}
        />
      )}

      {/* Render Additional Masons and Guests based on attendeeAddOrder */}
      {formState.attendeeAddOrder?.map((orderItem, displayIndex) => {
        // Find attendee using id from orderItem, ensure orderItem is object
        const attendeeId = typeof orderItem === 'object' ? orderItem.id : null;
        if (!attendeeId) return null; // Skip if orderItem is not the expected object
        
        const attendee = formState.attendees?.find(att => att.attendeeId === attendeeId);
        if (!attendee) return null; 

        // Compare attendeeType using string literals
        if (attendee.attendeeType === 'Mason' && !attendee.isPrimary) {
            const actualAttendeeNumber = (formState.attendees?.filter(a => a.attendeeType === 'Mason').findIndex(m => m.attendeeId === attendee.attendeeId) ?? 0) + 1;
            return (
              <MasonForm
                key={attendee.attendeeId}
                mason={attendee as any} // Cast needed
                id={attendee.attendeeId}
                onChange={updateMasonField as any}
                // isSameLodgeAsFirst={attendee.sameLodgeAsPrimary} // Property might not exist
                onToggleSameLodge={(checked: boolean) => toggleSameLodge(attendee.attendeeId, checked)} // toggleSameLodge might be removed/refactored
                onToggleHasLadyPartner={(checked: boolean) => toggleHasLadyPartner(attendee.attendeeId, checked)}
                ladyPartnerData={findLadyPartnerForMason(attendee.attendeeId) as any} // Cast needed
                updateLadyPartnerField={updateLadyPartnerField as any}
                primaryMasonData={primaryMasonData as any} // Pass found primary mason
                onRemove={() => removeMasonById(attendee.attendeeId)}
                attendeeNumber={actualAttendeeNumber}
              />
            );
        } else if (attendee.attendeeType === 'Guest') {
            const actualAttendeeNumber = (formState.attendees?.filter(a => a.attendeeType === 'Guest').findIndex(g => g.attendeeId === attendee.attendeeId) ?? 0) + 1;
            return (
              <GuestForm
                key={attendee.attendeeId}
                guest={attendee as any} // Cast needed
                id={attendee.attendeeId}
                onChange={updateGuestField as any}
                onToggleHasPartner={(checked: boolean) => toggleGuestHasPartner && toggleGuestHasPartner(attendee.attendeeId, checked)}
                partnerData={findPartnerForGuest(attendee.attendeeId) as any} // Cast needed
                updatePartnerField={updateGuestPartnerField as any}
                primaryMasonData={primaryMasonData as any} // Pass found primary mason
                onRemove={() => removeGuestById(attendee.attendeeId)}
                attendeeNumber={actualAttendeeNumber}
              />
            );
        }
        // Note: Rendering for LadyPartner and GuestPartner happens within MasonForm/GuestForm
        return null;
      })}

      {/* Add/Remove, T&C, and Buttons sections */}
      <div className="mt-8 pt-6 space-y-6">
        {/* Add/Remove Controls - Update counts based on attendees array */}
        <div className="flex items-center gap-4">
          <AddRemoveControl
            label="Mason"
            // Count using unified array
            count={formState.attendees?.filter(att => att.attendeeType === 'Mason').length ?? 0}
            onAdd={addMason}
            onRemove={() => {
                // Find last added non-primary Mason ID
                const lastMason = [...(formState.attendees || [])].reverse().find(att => att.attendeeType === 'Mason' && !att.isPrimary);
                if (lastMason) removeMasonById(lastMason.attendeeId);
            }}
            min={1} 
            max={10}
          />
          <AddRemoveControl
            label="Guest"
            // Count using unified array
            count={formState.attendees?.filter(att => att.attendeeType === 'Guest').length ?? 0}
            onAdd={addGuest}
            onRemove={() => {
                const lastGuest = [...(formState.attendees || [])].reverse().find(att => att.attendeeType === 'Guest');
                if (lastGuest) removeGuestById(lastGuest.attendeeId);
            }}
            min={0}
            max={10}
          />
        </div>

        {/* T&C Checkbox Section */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="agreeToTerms"
              checked={formState.agreeToTerms}
              onChange={(e) => updateFormField('agreeToTerms', e.target.checked)}
              required
              className="h-5 w-5 text-primary border-slate-300 rounded focus:ring-primary"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="agreeToTerms" className="font-medium text-slate-700">
              I agree to the Terms and Conditions *
            </label>
            <p className="text-slate-500 text-xs mt-1">
              I understand that by registering I agree to the cancellation policy and privacy terms.
            </p>
          </div>
        </div>

        {/* Validation Error Display */}
        {Object.keys(validationErrors).length > 0 && (
          <div id="validation-errors" className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            <h4 className="font-bold mb-2">There {Object.keys(validationErrors).length === 1 ? 'was 1 error' : `were ${Object.keys(validationErrors).length} errors`} with your submission:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              {Object.entries(validationErrors).map(([key, error]) => (
                <li key={key}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Button Section */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            className="btn-outline"
          >
            Back to Registration Type
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!formState.agreeToTerms || Object.keys(validationErrors).length > 0}
            className={`btn-primary ${!formState.agreeToTerms || Object.keys(validationErrors).length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Continue to Select Tickets
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendeeDetails;