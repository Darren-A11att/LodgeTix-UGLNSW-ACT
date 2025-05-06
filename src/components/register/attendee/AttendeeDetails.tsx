import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle,
  Trash2,
  ChevronUp,
  ChevronDown,
  Minus,
  Plus
} from 'lucide-react';
import { useRegistrationStore, UnifiedAttendeeData, RegistrationState } from '../../../store/registrationStore';
import MasonForm from '../forms/mason/MasonForm';
import GuestForm from '../forms/guest/GuestForm';
import TermsAndConditions from '../functions/TermsAndConditions';
import AddRemoveControl from '../functions/AddRemoveControl';

interface AttendeeDetailsProps {
  agreeToTerms: boolean;
  onAgreeToTermsChange: (checked: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  validationErrors: string[];
}

const AttendeeDetails: React.FC<AttendeeDetailsProps> = ({
  agreeToTerms,
  onAgreeToTermsChange,
  nextStep,
  prevStep,
  validationErrors,
}) => {
  const attendees = useRegistrationStore((state: RegistrationState) => state.attendees);
  const addAttendee = useRegistrationStore((state: RegistrationState) => state.addAttendee);
  const removeAttendee = useRegistrationStore((state: RegistrationState) => state.removeAttendee);
  const registrationType = useRegistrationStore((state: RegistrationState) => state.registrationType);
  const [showErrors, setShowErrors] = useState(false);

  const canAddMason = useMemo(() => {
    const masonCount = attendees.filter((att: UnifiedAttendeeData) => att.attendeeType === 'mason' || att.attendeeType === 'lodge_contact' || att.attendeeType === 'delegation_contact' || att.attendeeType === 'delegation_member').length;
    return registrationType === 'lodge' || registrationType === 'delegation' ? masonCount < 10 : masonCount < 1; // Allow multiple for lodge/delegation
  }, [attendees, registrationType]);

  const canAddGuest = useMemo(() => {
    return attendees.filter((att: UnifiedAttendeeData) => att.attendeeType === 'guest').length < 10; // Example limit
  }, [attendees]);

  const addMasonButtonLabel = useMemo(() => {
    const masonCount = attendees.filter((att: UnifiedAttendeeData) => att.attendeeType === 'mason' || att.attendeeType === 'lodge_contact' || att.attendeeType === 'delegation_contact' || att.attendeeType === 'delegation_member').length;
    return masonCount === 0 ? 'Add Primary Mason' : 'Add Additional Mason';
  }, [attendees]);

  const handleAddMason = () => {
    // Determine correct type based on registration
    const typeToAdd = registrationType === 'lodge' ? 'lodge_contact' :
                      registrationType === 'delegation' ? 'delegation_contact' : 'mason';
    addAttendee({
        attendeeType: typeToAdd,
        isPrimary: attendees.length === 0, // Simplified primary logic
        // Provide required defaults for UnifiedAttendeeData
        title: 'Bro', // Default title
        firstName: '', // string, ok
        lastName: '', // string, ok
        suffix: undefined, // string | undefined
        lodgeNameNumber: undefined, // string | undefined
        memberNumber: undefined, // string | undefined
        rank: undefined, // string | undefined
        primaryPhone: undefined, // string | undefined
        primaryEmail: undefined, // string | undefined
        dietaryRequirements: undefined, // string | undefined
        otherDietaryRequirements: undefined, // string | undefined
        ticket: undefined,
        partnerId: undefined, // string | undefined
        relatedAttendeeId: undefined, // string | undefined
        relationship: undefined, // string | undefined
        contactPreference: 'PrimaryAttendee', // Use allowed literal
        contactConfirmed: false,
        grandOffice: undefined, // string | undefined
        pastGrandOffice: undefined // string | undefined
        // Add any other non-optional fields from UnifiedAttendeeData here
      } as Omit<UnifiedAttendeeData, 'attendeeId'>);
  };

  const handleAddGuest = () => {
    addAttendee({
        attendeeType: 'guest',
        isPrimary: attendees.length === 0, // Simplified primary logic
        // Provide required defaults for UnifiedAttendeeData
        title: '', // string, ok
        firstName: '', // string, ok
        lastName: '', // string, ok
        suffix: undefined, // string | undefined
        lodgeNameNumber: undefined, // string | undefined
        memberNumber: undefined, // string | undefined
        rank: undefined, // string | undefined
        primaryPhone: undefined, // string | undefined
        primaryEmail: undefined, // string | undefined
        dietaryRequirements: undefined, // string | undefined
        otherDietaryRequirements: undefined, // string | undefined
        ticket: undefined,
        partnerId: undefined, // string | undefined
        relatedAttendeeId: undefined, // string | undefined
        relationship: undefined, // string | undefined
        contactPreference: 'PrimaryAttendee', // Use allowed literal
        contactConfirmed: false,
        grandOffice: undefined, // string | undefined
        pastGrandOffice: undefined // string | undefined
        // Add any other non-optional fields from UnifiedAttendeeData here
      } as Omit<UnifiedAttendeeData, 'attendeeId'>);
  };

  // Get masons and guests
  const masons = useMemo(() =>
    attendees.filter((att: UnifiedAttendeeData) =>
      att.attendeeType === 'mason' ||
      att.attendeeType === 'lodge_contact' ||
      att.attendeeType === 'delegation_contact' ||
      att.attendeeType === 'delegation_member'
    ), [attendees]
  );

  const guests = useMemo(() =>
    attendees.filter((att: UnifiedAttendeeData) => att.attendeeType === 'guest'), [attendees]
  );

  const handleContinue = () => {
    setShowErrors(true);
    if (validationErrors.length === 0 && agreeToTerms) {
      nextStep();
    } else {
      console.log("Validation errors or terms not agreed:", validationErrors);
    }
  };

  // Restore the useEffect that correctly adds the initial primary attendee
  useEffect(() => {
    if (attendees.length === 0) {
      console.log("[AttendeeDetails] Adding initial primary attendee");
      // Ensure addPrimaryAttendee is available before calling
      const addPrimaryAttendeeAction = useRegistrationStore.getState().addPrimaryAttendee;
      if (addPrimaryAttendeeAction) {
         addPrimaryAttendeeAction();
      }
    }
    // Depend only on attendees length, as addPrimaryAttendee action should be stable
  }, [attendees]); 

  return (
    <div className="">
      <h2 className="text-2xl font-bold mb-6">Attendee Details</h2>

      {/* Primary Mason (Always render first) */}
      {masons.filter(att => att.isPrimary).map((mason, idx) => (
        <MasonForm
          key={mason.attendeeId}
          attendeeId={mason.attendeeId}
          attendeeNumber={idx + 1} // Or maybe always 1 if only one primary?
          isPrimary={true}
        />
      ))}

      {/* Additional Masons */}
      {masons.filter(att => !att.isPrimary).map((mason, idx) => (
        <MasonForm
          key={mason.attendeeId}
          attendeeId={mason.attendeeId}
          attendeeNumber={idx + 1} // Adjust numbering if needed
          isPrimary={false}
        />
      ))}

      {/* Guests */}
      {guests.map((guest, idx) => (
        <GuestForm
          key={guest.attendeeId}
          attendeeId={guest.attendeeId}
          attendeeNumber={idx + 1}
          isPrimary={guest.isPrimary}
        />
      ))}

      <div className="mt-8 pt-6 border-t border-slate-200 space-y-6">
        {/* Add/Remove Controls */}
        <div className="flex items-center gap-4">
          <AddRemoveControl
            label="Mason"
            count={masons.length}
            onAdd={handleAddMason}
            onRemove={() => {
              const nonPrimaryMasons = masons.filter(m => !m.isPrimary);
              if (nonPrimaryMasons.length > 0) {
                removeAttendee(nonPrimaryMasons[nonPrimaryMasons.length - 1].attendeeId);
              }
            }}
            min={1} // Always need at least one (primary)
            max={10}
          />
          <AddRemoveControl
            label="Guest"
            count={guests.length}
            onAdd={handleAddGuest}
            onRemove={() => {
              if (guests.length > 0) {
                removeAttendee(guests[guests.length - 1].attendeeId);
              }
            }}
            min={0}
            max={10}
          />
        </div>
      </div>

      <div className="mt-8 border border-slate-200 rounded-md bg-slate-50">
          <TermsAndConditions
              checked={agreeToTerms}
              onChange={onAgreeToTermsChange}
          />
      </div>

      {showErrors && validationErrors.length > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2">Please address the following errors:</h3>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="btn-outline"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!agreeToTerms || validationErrors.length > 0} // Disable if terms not agreed or errors exist
          onClick={handleContinue}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Select Tickets
        </button>
      </div>
    </div>
  );
};

export default AttendeeDetails;