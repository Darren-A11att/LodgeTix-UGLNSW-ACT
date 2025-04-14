import React from 'react';
import AttendeeCounter from './AttendeeCounter';
import MasonForm from './MasonForm';
import GuestForm from './GuestForm';
import { FormState } from '../../context/RegisterFormContext';

interface AttendeeDetailsProps {
  formState: FormState;
  updateFormField: (field: string, value: any) => void;
  updateMasonField: (index: number, field: string, value: string | boolean) => void;
  updateGuestField: (index: number, field: string, value: string | boolean) => void;
  updateLadyPartnerField: (index: number, field: string, value: string | boolean) => void;
  updateGuestPartnerField?: (index: number, field: string, value: string | boolean) => void;
  toggleSameLodge: (index: number, checked: boolean) => void;
  toggleHasLadyPartner: (index: number, checked: boolean) => void;
  toggleGuestUseContact?: (index: number, checked: boolean) => void;
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
  toggleGuestUseContact,
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

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Attendee Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <AttendeeCounter 
          label="Number of Masons (+ Lady & Partners)"
          count={formState.masons.length}
          icon="Masons (+ Lady & Partners)"
          onIncrement={addMason}
          onDecrement={removeMason}
          min={1}
          max={10}
        />
        
        <AttendeeCounter 
          label="Number of Guests (+ Partners)"
          count={formState.guests.length}
          icon="Guests (+ Partners)"
          onIncrement={addGuest}
          onDecrement={removeGuest}
          min={0}
          max={10}
        />
      </div>
      
      {/* Primary Mason */}
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
      
      {/* Additional Masons */}
      {formState.masons.slice(1).map((mason, idx) => (
        <MasonForm
          key={idx + 1}
          mason={mason}
          index={idx + 1}
          onChange={updateMasonField}
          isSameLodgeAsFirst={mason.sameLodgeAsPrimary}
          onToggleSameLodge={(checked) => toggleSameLodge(idx + 1, checked)}
          onToggleHasLadyPartner={(checked) => toggleHasLadyPartner(idx + 1, checked)}
          ladyPartnerData={findLadyPartnerForMason(idx + 1)}
          ladyPartnerIndex={findLadyPartnerIndex(idx + 1)}
          updateLadyPartnerField={updateLadyPartnerField}
          primaryMasonData={primaryMasonData}
          onRemove={() => removeMasonByIndex(idx + 1)}
        />
      ))}
      
      {/* Guests */}
      {formState.guests.length > 0 && (
        <div className="mt-8 mb-4">
          <h2 className="text-2xl font-bold">Guest Details</h2>
        </div>
      )}
      
      {formState.guests.map((guest, idx) => (
        <GuestForm
          key={idx}
          guest={guest}
          index={idx}
          onChange={updateGuestField}
          onToggleHasPartner={toggleGuestHasPartner}
          partnerData={findPartnerForGuest(idx)}
          partnerIndex={findGuestPartnerIndex(idx)}
          updatePartnerField={updateGuestPartnerField}
          primaryMasonData={primaryMasonData}
          onRemove={() => removeGuestByIndex(idx)}
        />
      ))}
      
      <div className="mb-8 mt-8">
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
            <p className="text-slate-500">
              I understand that by registering for this event, I agree to the cancellation policy and privacy terms.
            </p>
          </div>
        </div>
      </div>

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
          onClick={nextStep}
          disabled={!formState.agreeToTerms}
          className={`btn-primary ${!formState.agreeToTerms ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue to Select Tickets
        </button>
      </div>
    </div>
  );
};

export default AttendeeDetails;