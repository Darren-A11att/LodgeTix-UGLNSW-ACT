import React from 'react';
import MasonForm from './MasonForm';
import GuestForm from './GuestForm';
import { FormState } from '../../shared/types/register';
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
            onClick={nextStep}
            disabled={!formState.agreeToTerms}
            className={`btn-primary ${!formState.agreeToTerms ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Continue to Select Tickets
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendeeDetails;