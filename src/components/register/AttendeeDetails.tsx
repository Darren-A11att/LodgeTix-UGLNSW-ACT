import React, { useState, useEffect, useCallback } from 'react';
import MasonForm from './MasonForm';
import GuestForm from './GuestForm';
import { FormState, MasonData, GuestData, LadyPartnerData, GuestPartnerData } from '../../shared/types/register';
import AddRemoveControl from './AddRemoveControl';

interface AttendeeDetailsProps {
  formState: FormState;
  updateFormField: (field: string, value: unknown) => void;
  updateMasonField: (index: number, field: string, value: string | boolean) => void;
  updateGuestField: (index: number, field: string, value: string | boolean) => void;
  updateLadyPartnerField: (index: number, field: string, value: string | boolean) => void;
  updateGuestPartnerField?: (index: number, field: string, value: string | boolean) => void;
  toggleSameLodge: (index: number, checked: boolean) => void;
  toggleHasLadyPartner: (index: number, checked: boolean) => void;
  toggleGuestHasPartner?: (index: number, checked: boolean) => void;
  addMason: () => void;
  removeMason: () => void;
  removeMasonByIndex: (index: number) => void;
  addGuest: () => void;
  removeGuest: () => void;
  removeGuestByIndex: (index: number) => void;
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
  removeMason,
  removeMasonByIndex,
  addGuest,
  removeGuest,
  removeGuestByIndex,
  nextStep,
  prevStep
}) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Find lady partner data for each mason
  const findLadyPartnerForMason = (masonIndex: number) => {
    return formState.ladyPartners.find(lp => lp.masonIndex === masonIndex);
  };

  // Find the index of the lady partner in the array
  const findLadyPartnerIndex = (masonIndex: number) => {
    return formState.ladyPartners.findIndex(lp => lp.masonIndex === masonIndex);
  };

  // Find partner data for each guest
  const findPartnerForGuest = (guestIndex: number) => {
    return formState.guestPartners?.find(gp => gp.guestIndex === guestIndex);
  };

  // Find the index of the guest partner in the array
  const findGuestPartnerIndex = (guestIndex: number) => {
    return formState.guestPartners?.findIndex(gp => gp.guestIndex === guestIndex);
  };

  // Access primary mason data for use in confirmation messages
  const primaryMasonData = formState.masons[0];

  // *** ADDED: Helper for GL fields validation ***
  const validatePrimaryMasonGLFields = useCallback((mason: MasonData, desc: string): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!mason.grandRank) errors['mason-0-grandRank'] = `Grand Rank is required for ${desc}`;
    if (!mason.grandOfficer) errors['mason-0-grandOfficer'] = `Grand Officer status is required for ${desc}`;
    if (mason.grandOfficer === 'Current') {
      if (!mason.grandOffice || mason.grandOffice === 'Please Select') {
        errors['mason-0-grandOffice'] = `Grand Office is required for ${desc}`;
      }
      if (mason.grandOffice === 'Other' && !mason.grandOfficeOther) {
        errors['mason-0-grandOfficeOther'] = `Other Grand Office is required for ${desc}`;
      }
    }
    return errors;
  }, []); // No dependencies needed

  const validatePrimaryMason = useCallback((mason: MasonData): Record<string, string> => {
    const errors: Record<string, string> = {};
    const desc = `${mason.firstName || 'Primary Mason'} ${mason.lastName || ''}`.trim();
    if (!mason.title) errors['mason-0-title'] = `Masonic Title is required for ${desc}`;
    if (!mason.firstName) errors['mason-0-firstName'] = `First Name is required for Primary Mason`;
    if (!mason.lastName) errors['mason-0-lastName'] = `Last Name is required for Primary Mason`;
    if (!mason.rank) errors['mason-0-rank'] = `Rank is required for ${desc}`;
    if (!mason.phone) errors['mason-0-phone'] = `Mobile Number is required for ${desc}`;
    if (!mason.email) errors['mason-0-email'] = `Email Address is required for ${desc}`;
    if (!mason.grandLodge) errors['mason-0-grandLodge'] = `Grand Lodge is required for ${desc}`;
    if (!mason.lodge) errors['mason-0-lodge'] = `Lodge Name & Number is required for ${desc}`;
  
    if (mason.rank === 'GL') {
      const glErrors = validatePrimaryMasonGLFields(mason, desc);
      Object.assign(errors, glErrors); // Merge GL errors into main errors object
    }
    return errors;
  }, [validatePrimaryMasonGLFields]); // Added helper dependency

  // *** ADDED: Helper for Additional Mason GL fields ***
  const validateAdditionalMasonGLFields = useCallback((mason: MasonData, name: string, index: number): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!mason.grandRank) errors[`mason-${index}-grandRank`] = `Grand Rank is required for ${name}`;
    if (!mason.grandOfficer) errors[`mason-${index}-grandOfficer`] = `Grand Officer status is required for ${name}`;
    if (mason.grandOfficer === 'Current') {
      if (!mason.grandOffice || mason.grandOffice === 'Please Select') {
        errors[`mason-${index}-grandOffice`] = `Grand Office is required for ${name}`;
      }
      if (mason.grandOffice === 'Other' && !mason.grandOfficeOther) {
        errors[`mason-${index}-grandOfficeOther`] = `Other Grand Office is required for ${name}`;
      }
    }
    return errors;
  }, []); // No dependencies needed

  // *** ADDED: Helper for Additional Mason Contact fields ***
  const validateAdditionalMasonContact = useCallback((mason: MasonData, name: string, index: number): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (mason.contactPreference === 'Directly') {
      if (!mason.phone) errors[`mason-${index}-phone`] = `Mobile Number is required for ${name} when contact is 'Directly'`;
      if (!mason.email) errors[`mason-${index}-email`] = `Email Address is required for ${name} when contact is 'Directly'`;
    } else if (mason.contactPreference === 'Primary Attendee' || mason.contactPreference === 'Provide Later') {
      if (!mason.contactConfirmed) errors[`mason-${index}-contactConfirmed`] = `Contact confirmation is required for ${name}`;
    } else if (!mason.contactPreference || mason.contactPreference === 'Please Select') {
      errors[`mason-${index}-contactPreference`] = `Contact preference is required for ${name}`;
    }
    return errors;
  }, []); // No dependencies needed

  const validateAdditionalMason = useCallback((mason: MasonData, index: number): Record<string, string> => {
    const errors: Record<string, string> = {};
    const masonLabel = `Additional Mason ${index + 1}`;
    const name = `${mason.firstName || masonLabel} ${mason.lastName || ''}`.trim();
    
    // Basic fields
    if (!mason.title) errors[`mason-${index}-title`] = `Masonic Title is required for ${name}`;
    if (!mason.firstName) errors[`mason-${index}-firstName`] = `First Name is required for ${masonLabel}`;
    if (!mason.lastName) errors[`mason-${index}-lastName`] = `Last Name is required for ${masonLabel}`;
    if (!mason.rank) errors[`mason-${index}-rank`] = `Rank is required for ${name}`;
  
    // Lodge fields (conditional)
    if (!mason.sameLodgeAsPrimary) {
      if (!mason.grandLodge) errors[`mason-${index}-grandLodge`] = `Grand Lodge is required for ${name}`;
      if (!mason.lodge) errors[`mason-${index}-lodge`] = `Lodge Name & Number is required for ${name}`;
    }
  
    // *** UPDATED: Call helper for GL fields ***
    if (mason.rank === 'GL') {
      const glErrors = validateAdditionalMasonGLFields(mason, name, index);
      Object.assign(errors, glErrors);
    }
    
    // *** UPDATED: Call helper for Contact fields ***
    const contactErrors = validateAdditionalMasonContact(mason, name, index);
    Object.assign(errors, contactErrors);
    
    return errors;
  // Added helper dependencies
  }, [validateAdditionalMasonGLFields, validateAdditionalMasonContact]); 

  const validateGuest = useCallback((guest: GuestData, index: number): Record<string, string> => {
    const errors: Record<string, string> = {};
    const guestLabel = `Guest ${index + 1}`;
    const name = `${guest.firstName || guestLabel} ${guest.lastName || ''}`.trim();
    if (!guest.title) errors[`guest-${index}-title`] = `Title is required for ${name}`;
    if (!guest.firstName) errors[`guest-${index}-firstName`] = `First Name is required for ${guestLabel}`;
    if (!guest.lastName) errors[`guest-${index}-lastName`] = `Last Name is required for ${guestLabel}`;
    
    // Only require phone and email when contact preference is 'Directly'
    if (guest.contactPreference === 'Directly') {
      if (!guest.phone) errors[`guest-${index}-phone`] = `Mobile Number is required for ${name} when contact is 'Directly'`;
      if (!guest.email) errors[`guest-${index}-email`] = `Email Address is required for ${name} when contact is 'Directly'`;
    } else if (guest.contactPreference === 'Primary Attendee' || guest.contactPreference === 'Provide Later') {
      if (!guest.contactConfirmed) errors[`guest-${index}-contactConfirmed`] = `Contact confirmation is required for ${name}`;
    } else if (!guest.contactPreference || guest.contactPreference === 'Please Select') {
      errors[`guest-${index}-contactPreference`] = `Contact preference is required for ${name}`;
    }
    
    return errors;
  }, []); // No dependencies needed

  const validateLadyPartner = useCallback((partner: LadyPartnerData, index: number, relatedMason?: MasonData): Record<string, string> => {
    const errors: Record<string, string> = {};
    const relatedMasonName = relatedMason ? `${relatedMason.firstName} ${relatedMason.lastName}`.trim() : `Mason ${partner.masonIndex + 1}`;
    const partnerLabel = `Partner of ${relatedMasonName}`;
    const partnerName = `${partner.firstName || partnerLabel} ${partner.lastName || ''}`.trim();
  
    if (!partner.title) errors[`ladyPartner-${index}-title`] = `Title is required for ${partnerName}`;
    if (!partner.firstName) errors[`ladyPartner-${index}-firstName`] = `First Name is required for ${partnerLabel}`;
    if (!partner.lastName) errors[`ladyPartner-${index}-lastName`] = `Last Name is required for ${partnerLabel}`;
    if (!partner.relationship || partner.relationship === 'Please Select') errors[`ladyPartner-${index}-relationship`] = `Relationship is required for ${partnerName}`;
  
    if (partner.contactPreference === 'Directly') {
      if (!partner.phone) errors[`ladyPartner-${index}-phone`] = `Mobile Number is required for ${partnerName} when contact is 'Directly'`;
      if (!partner.email) errors[`ladyPartner-${index}-email`] = `Email Address is required for ${partnerName} when contact is 'Directly'`;
    } else if (partner.contactPreference === 'Mason' || partner.contactPreference === 'Primary Attendee' || partner.contactPreference === 'Provide Later') {
      if (!partner.contactConfirmed) errors[`ladyPartner-${index}-contactConfirmed`] = `Contact confirmation is required for ${partnerName}`;
    } else if (!partner.contactPreference || partner.contactPreference === 'Please Select') {
      errors[`ladyPartner-${index}-contactPreference`] = `Contact preference is required for ${partnerName}`;
    }
    return errors;
  }, []); // No dependencies needed

  const validateGuestPartner = useCallback((partner: GuestPartnerData, index: number, relatedGuest?: GuestData): Record<string, string> => {
    const errors: Record<string, string> = {};
    const relatedGuestName = relatedGuest ? `${relatedGuest.firstName} ${relatedGuest.lastName}`.trim() : `Guest ${partner.guestIndex + 1}`;
    const partnerLabel = `Partner of ${relatedGuestName}`;
    const partnerName = `${partner.firstName || partnerLabel} ${partner.lastName || ''}`.trim();
  
    if (!partner.title) errors[`guestPartner-${index}-title`] = `Title is required for ${partnerName}`;
    if (!partner.firstName) errors[`guestPartner-${index}-firstName`] = `First Name is required for ${partnerLabel}`;
    if (!partner.lastName) errors[`guestPartner-${index}-lastName`] = `Last Name is required for ${partnerLabel}`;
    if (!partner.relationship || partner.relationship === 'Please Select') errors[`guestPartner-${index}-relationship`] = `Relationship is required for ${partnerName}`;
  
    if (partner.contactPreference === 'Directly') {
      if (!partner.phone) errors[`guestPartner-${index}-phone`] = `Mobile Number is required for ${partnerName} when contact is 'Directly'`;
      if (!partner.email) errors[`guestPartner-${index}-email`] = `Email Address is required for ${partnerName} when contact is 'Directly'`;
    } else if (partner.contactPreference === 'Primary Attendee' || partner.contactPreference === 'Provide Later') {
      if (!partner.contactConfirmed) errors[`guestPartner-${index}-contactConfirmed`] = `Contact confirmation is required for ${partnerName}`;
    } else if (!partner.contactPreference || partner.contactPreference === 'Please Select') {
      errors[`guestPartner-${index}-contactPreference`] = `Contact preference is required for ${partnerName}`;
    }
    return errors;
  }, []); // No dependencies needed

  // Main validation function (memoized, depends on helpers and formState)
  const validateStep2 = useCallback((): Record<string, string> => {
    let combinedErrors: Record<string, string> = {};
    const { masons, guests, ladyPartners, guestPartners, agreeToTerms } = formState;

    // Use the memoized helper functions
    if (masons.length > 0) {
        combinedErrors = { ...combinedErrors, ...validatePrimaryMason(masons[0]) };
    }
    masons.slice(1).forEach((mason, relativeIndex) => {
      const index = relativeIndex + 1;
      combinedErrors = { ...combinedErrors, ...validateAdditionalMason(mason, index) };
    });
    guests.forEach((guest, index) => {
      combinedErrors = { ...combinedErrors, ...validateGuest(guest, index) };
    });
    ladyPartners.forEach((partner, index) => {
      const relatedMason = masons[partner.masonIndex];
      combinedErrors = { ...combinedErrors, ...validateLadyPartner(partner, index, relatedMason) };
    });
    guestPartners?.forEach((partner, index) => {
      const relatedGuest = guests[partner.guestIndex];
      combinedErrors = { ...combinedErrors, ...validateGuestPartner(partner, index, relatedGuest) };
    });

    if (!agreeToTerms) combinedErrors['terms'] = 'You must agree to the Terms and Conditions';
    return combinedErrors;
  }, [formState, validatePrimaryMason, validateAdditionalMason, validateGuest, validateLadyPartner, validateGuestPartner]); // Add helpers as dependencies

  // useEffect depends on memoized validateStep2
  useEffect(() => {
    if (formState.agreeToTerms) {
        const errors = validateStep2();
        setValidationErrors(errors);
    } else {
        setValidationErrors({});
    }
  }, [formState, validateStep2]); // Dependencies are correct

  // Handle moving to the next step (simplified)
  const handleNext = () => {
    nextStep(); 
  };

  return (
    <div>
      {/* Put the heading back */}
      <h2 className="text-2xl font-bold mb-6">Attendee Details</h2>

      {/* Mason Attendee - Primary (Always render first) */}
      {formState.masons.length > 0 && (
        <MasonForm
          mason={formState.masons[0]}
          index={0}
          onChange={updateMasonField}
          isPrimary={true}
          onToggleHasLadyPartner={(checked) => toggleHasLadyPartner(0, checked)}
          ladyPartnerData={findLadyPartnerForMason(0)}
          ladyPartnerIndex={findLadyPartnerIndex(0)}
          updateLadyPartnerField={updateLadyPartnerField}
          primaryMasonData={primaryMasonData}
        />
      )}

      {/* Render Additional Masons and Guests based on attendeeAddOrder */}
      {formState.attendeeAddOrder?.map((orderItem) => {
        if (orderItem.type === 'mason') {
          const masonIndex = formState.masons.findIndex(m => m.id === orderItem.id);
          // Ensure mason exists and is not the primary (index 0)
          if (masonIndex > 0) {
            const mason = formState.masons[masonIndex];
            return (
              <MasonForm
                key={mason.id}
                mason={mason}
                index={masonIndex}
                onChange={updateMasonField}
                isSameLodgeAsFirst={mason.sameLodgeAsPrimary}
                onToggleSameLodge={(checked) => toggleSameLodge(masonIndex, checked)}
                onToggleHasLadyPartner={(checked) => toggleHasLadyPartner(masonIndex, checked)}
                ladyPartnerData={findLadyPartnerForMason(masonIndex)}
                ladyPartnerIndex={findLadyPartnerIndex(masonIndex)}
                updateLadyPartnerField={updateLadyPartnerField}
                primaryMasonData={primaryMasonData}
                onRemove={() => removeMasonByIndex(masonIndex)}
              />
            );
          }
        } else if (orderItem.type === 'guest') {
          const guestIndex = formState.guests.findIndex(g => g.id === orderItem.id);
          if (guestIndex !== -1) { // Ensure guest exists
            const guest = formState.guests[guestIndex];
            return (
              <GuestForm
                key={guest.id}
                guest={guest}
                index={guestIndex}
                onChange={updateGuestField}
                onToggleHasPartner={toggleGuestHasPartner}
                partnerData={findPartnerForGuest(guestIndex)}
                partnerIndex={findGuestPartnerIndex(guestIndex)}
                updatePartnerField={updateGuestPartnerField}
                primaryMasonData={primaryMasonData}
                onRemove={() => removeGuestByIndex(guestIndex)}
              />
            );
          }
        }
        return null; // Should not happen if state is managed correctly
      })}

      {/* Re-add Add/Remove, T&C, and Buttons sections */}
      <div className="mt-8 pt-6 border-t border-slate-200 space-y-6">
        {/* Add/Remove Controls */}
        <div className="flex items-center gap-4">
          <AddRemoveControl
            label="Mason"
            count={formState.masons.length}
            onAdd={addMason}
            onRemove={removeMason}
            min={1}
            max={10}
          />
          <AddRemoveControl
            label="Guest"
            count={formState.guests.length}
            onAdd={addGuest}
            onRemove={removeGuest}
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