import React, { useState } from 'react';
import MasonForm from './MasonForm';
import GuestForm from './GuestForm';
import { FormState } from '../../shared/types/register';
import AddRemoveControl from './AddRemoveControl';
import ValidationErrorSummary from './ValidationErrorSummary';

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
  isStep2Complete: boolean;
  validationErrors: string[];
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
  prevStep,
  isStep2Complete,
  validationErrors
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

  // Validation function for Step 2
  const validateStep2 = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const { masons, guests, agreeToTerms } = formState;

    // Validate Primary Mason (always exists)
    const primaryMason = masons[0];
    if (!primaryMason.title) errors['mason-0-title'] = `Masonic Title is required for ${primaryMason.firstName || 'Primary Mason'} ${primaryMason.lastName || ''}`.trim();
    if (!primaryMason.firstName) errors['mason-0-firstName'] = `First Name is required for Primary Mason`;
    if (!primaryMason.lastName) errors['mason-0-lastName'] = `Last Name is required for Primary Mason`;
    if (!primaryMason.rank) errors['mason-0-rank'] = `Rank is required for ${primaryMason.firstName || 'Primary Mason'} ${primaryMason.lastName || ''}`.trim();
    if (!primaryMason.phone) errors['mason-0-phone'] = `Mobile Number is required for ${primaryMason.firstName || 'Primary Mason'} ${primaryMason.lastName || ''}`.trim();
    if (!primaryMason.email) errors['mason-0-email'] = `Email Address is required for ${primaryMason.firstName || 'Primary Mason'} ${primaryMason.lastName || ''}`.trim();
    if (!primaryMason.grandLodge) errors['mason-0-grandLodge'] = `Grand Lodge is required for ${primaryMason.firstName || 'Primary Mason'} ${primaryMason.lastName || ''}`.trim();
    if (!primaryMason.lodge) errors['mason-0-lodge'] = `Lodge Name & Number is required for ${primaryMason.firstName || 'Primary Mason'} ${primaryMason.lastName || ''}`.trim();
    
    // Validate GL fields only if rank is GL
    if (primaryMason.rank === 'GL') {
      if (!primaryMason.grandRank) errors['mason-0-grandRank'] = `Grand Rank is required for ${primaryMason.firstName || 'Primary Mason'} ${primaryMason.lastName || ''}`.trim();
      if (!primaryMason.grandOfficer) errors['mason-0-grandOfficer'] = `Grand Officer status is required for ${primaryMason.firstName || 'Primary Mason'} ${primaryMason.lastName || ''}`.trim();
      
      // Validate Grand Office *only* if Grand Officer is 'Current'
      if (primaryMason.grandOfficer === 'Current') {
        if (!primaryMason.grandOffice || primaryMason.grandOffice === 'Please Select') {
          errors['mason-0-grandOffice'] = `Grand Office is required for ${primaryMason.firstName || 'Primary Mason'} ${primaryMason.lastName || ''}`.trim();
        }
        // Validate Other Grand Office if 'Other' is selected
        if (primaryMason.grandOffice === 'Other' && !primaryMason.grandOfficeOther) {
          errors['mason-0-grandOfficeOther'] = `Other Grand Office is required for ${primaryMason.firstName || 'Primary Mason'} ${primaryMason.lastName || ''}`.trim();
        }
      }
    }

    // Validate Additional Masons (if any)
    masons.slice(1).forEach((mason, relativeIndex) => {
      const index = relativeIndex + 1;
      const name = `${mason.firstName || `Additional Mason ${index + 1}`} ${mason.lastName || ''}`.trim();
      if (!mason.title) errors[`mason-${index}-title`] = `Masonic Title is required for ${name}`;
      if (!mason.firstName) errors[`mason-${index}-firstName`] = `First Name is required for Additional Mason ${index + 1}`;
      if (!mason.lastName) errors[`mason-${index}-lastName`] = `Last Name is required for Additional Mason ${index + 1}`;
      if (!mason.rank) errors[`mason-${index}-rank`] = `Rank is required for ${name}`;
      
      const hideContact = mason.contactPreference === 'Primary Attendee' || mason.contactPreference === 'Provide Later';
      if (!hideContact && !mason.phone) errors[`mason-${index}-phone`] = `Mobile Number is required for ${name}`;
      if (!hideContact && !mason.email) errors[`mason-${index}-email`] = `Email Address is required for ${name}`;
      
      if (!mason.sameLodgeAsPrimary) {
         if (!mason.grandLodge) errors[`mason-${index}-grandLodge`] = `Grand Lodge is required for ${name}`;
         if (!mason.lodge) errors[`mason-${index}-lodge`] = `Lodge Name & Number is required for ${name}`;
      }
      
      // Validate GL fields only if rank is GL
      if (mason.rank === 'GL') {
        if (!mason.grandRank) errors[`mason-${index}-grandRank`] = `Grand Rank is required for ${name}`;
        if (!mason.grandOfficer) errors[`mason-${index}-grandOfficer`] = `Grand Officer status is required for ${name}`;
        
        // Validate Grand Office *only* if Grand Officer is 'Current'
        if (mason.grandOfficer === 'Current') {
          if (!mason.grandOffice || mason.grandOffice === 'Please Select') {
             errors[`mason-${index}-grandOffice`] = `Grand Office is required for ${name}`;
          }
           // Validate Other Grand Office if 'Other' is selected
          if (mason.grandOffice === 'Other' && !mason.grandOfficeOther) {
             errors[`mason-${index}-grandOfficeOther`] = `Other Grand Office is required for ${name}`;
          }
        }
      }
      
      // Validate contact confirmation if applicable
       if (mason.contactPreference === 'Primary Attendee' || mason.contactPreference === 'Provide Later') {
          if (!mason.contactConfirmed) errors[`mason-${index}-contactConfirmed`] = `Contact confirmation is required for ${name}`;
       } else if (!mason.contactPreference || mason.contactPreference === 'Please Select') {
         errors[`mason-${index}-contactPreference`] = `Contact preference is required for ${name}`;
       }
    });

    // Validate Guests (if any)
    guests.forEach((guest, index) => {
      const name = `${guest.firstName || `Guest ${index + 1}`} ${guest.lastName || ''}`.trim();
      if (!guest.title) errors[`guest-${index}-title`] = `Title is required for ${name}`;
      if (!guest.firstName) errors[`guest-${index}-firstName`] = `First Name is required for Guest ${index + 1}`;
      if (!guest.lastName) errors[`guest-${index}-lastName`] = `Last Name is required for Guest ${index + 1}`;
      if (!guest.phone) errors[`guest-${index}-phone`] = `Mobile Number is required for ${name}`;
      if (!guest.email) errors[`guest-${index}-email`] = `Email Address is required for ${name}`;
    });

    // Validate T&C
    if (!agreeToTerms) errors['terms'] = 'You must agree to the Terms and Conditions';

    return errors;
  };

  // Handle moving to the next step
  const handleNext = () => {
    const errors = validateStep2();
    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      nextStep(); // Call the original nextStep function from props
    } else {
       // Scroll to the error messages if there are any
       const errorElement = document.getElementById('validation-errors');
       errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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

<<<<<<< HEAD
        {/* Conditionally render the validation summary */}
        {!isStep2Complete && formState.agreeToTerms && validationErrors.length > 0 && (
          <ValidationErrorSummary errors={validationErrors} />
=======
        {/* Validation Error Display */}
        {Object.keys(validationErrors).length > 0 && (
          <div id="validation-errors" className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            <h4 className="font-bold mb-2">There {Object.keys(validationErrors).length === 1 ? 'was 1 error' : `were ${Object.keys(validationErrors).length} errors`} with your submission:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              {Object.values(validationErrors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
>>>>>>> db95628 (fix: Correct Grand Office validation and add error display)
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
<<<<<<< HEAD
          <button
            type="button"
            onClick={nextStep}
            disabled={!isStep2Complete}
            className={`btn-primary ${!isStep2Complete ? 'opacity-50 cursor-not-allowed' : ''}`}
=======
          <button 
            type="button" 
            onClick={handleNext}
            disabled={!formState.agreeToTerms}
            className={`btn-primary ${!formState.agreeToTerms ? 'opacity-50 cursor-not-allowed' : ''}`}
>>>>>>> db95628 (fix: Correct Grand Office validation and add error display)
          >
            Continue to Select Tickets
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendeeDetails;