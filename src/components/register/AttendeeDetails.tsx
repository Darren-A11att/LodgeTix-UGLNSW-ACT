import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MasonForm from './MasonForm';
import GuestForm from './GuestForm';
import { MasonData, GuestData, LadyPartnerData, GuestPartnerData, AttendeeTicket } from '../../shared/types/register';
import AddRemoveControl from './AddRemoveControl';
import { AttendeeData as UnifiedAttendeeData } from '../../lib/api/registrations';
import { useRegistrationStore, RegistrationType, UnifiedAttendeeData as StoreUnifiedAttendeeData } from '../../store/registrationStore';
import { PlusCircle, UserMinus } from 'lucide-react';
import TermsAndConditions from './TermsAndConditions.tsx';

interface AttendeeDetailsProps {
  agreeToTerms: boolean;
  onAgreeToTermsChange: (agreed: boolean) => void;
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
  const {
    attendees,
    addAttendee,
    removeAttendee,
    updateAttendee,
    setRegistrationType,
    registrationType,
    addPrimaryAttendee
  } = useRegistrationStore();

  const [showErrors, setShowErrors] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const hasPrimaryAttendee = attendees.some(att => att.isPrimary);
  const primaryMasonOrGuest = attendees.find(att => att.isPrimary);

  const handleAddMason = () => {
      const typeToAdd = registrationType === 'lodge' ? 'lodge_contact' : 
                       registrationType === 'delegation' ? 'delegation_contact' : 'mason';
      addAttendee({ 
          attendeeType: typeToAdd, 
          isPrimary: attendees.length === 0, 
          firstName:'', lastName:'' 
      } as Omit<StoreUnifiedAttendeeData, 'attendeeId'>);
  };

  const handleAddGuest = () => {
      addAttendee({ 
          attendeeType: 'guest', 
          isPrimary: attendees.length === 0, 
          firstName:'', lastName:'' 
      } as Omit<StoreUnifiedAttendeeData, 'attendeeId'>);
  };

  const handleContinue = () => {
    setShowErrors(true);
    if (validationErrors.length === 0) {
      nextStep();
    }
  };

  const canAddMason = registrationType === 'individual' || registrationType === 'lodge' || registrationType === 'delegation';
  const canAddGuest = registrationType === 'individual';
  const addMasonButtonLabel = registrationType === 'lodge' ? 'Add Lodge Contact' : 
                             registrationType === 'delegation' ? 'Add Delegation Contact' : 'Add Mason';

  console.log('[AttendeeDetails] Rendering with attendees from STORE:', JSON.stringify(attendees, null, 2));

  useEffect(() => {
    if (attendees.length === 0) {
      console.log("[AttendeeDetails] Attendees array is empty, calling addPrimaryAttendee.");
      addPrimaryAttendee();
    }
  }, [attendees, addPrimaryAttendee]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Attendee Details</h2>
      
      {attendees.map((attendee, index) => {
          console.log(`[AttendeeDetails] Mapping attendee ${index}:`, JSON.stringify(attendee, null, 2));
          if (['mason', 'individual', 'lodge_contact', 'delegation_contact', 'delegation_member'].includes(attendee.attendeeType)) { 
              console.log(`[AttendeeDetails] Rendering MasonForm for attendeeId: ${attendee.attendeeId}`);
              return (
                  <MasonForm
                      key={attendee.attendeeId}
                      attendeeId={attendee.attendeeId}
                      attendeeNumber={index + 1}
                      isPrimary={!!attendee.isPrimary}
                  />
              );
          } else if (attendee.attendeeType === 'guest') {
              console.log(`[AttendeeDetails] Rendering GuestForm for attendeeId: ${attendee.attendeeId}`);
              return (
                  <GuestForm
                      key={attendee.attendeeId}
                      attendeeId={attendee.attendeeId}
                      attendeeNumber={index + 1}
                      isPrimary={!!attendee.isPrimary}
                  />
              );
          } else if (attendee.attendeeType === 'lady_partner' || attendee.attendeeType === 'guest_partner'){
              console.log(`[AttendeeDetails] Skipping partner form render for attendeeId: ${attendee.attendeeId}`);
              return null;
          }
          console.warn(`[AttendeeDetails] Unknown attendee type encountered: ${attendee.attendeeType} for attendeeId: ${attendee.attendeeId}`);
          return <div key={attendee.attendeeId}>Unknown attendee type: {attendee.attendeeType}</div>;
      })}

      <div className="flex space-x-4 my-6">
        {canAddMason && (
          <button
            type="button"
            onClick={handleAddMason}
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> {addMasonButtonLabel}
          </button>
        )}
        {canAddGuest && (
          <button
            type="button"
            onClick={handleAddGuest}
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> Add Guest
          </button>
        )}
      </div>

      <div className="mt-8 p-4 border border-slate-200 rounded-md bg-slate-50">
          <TermsAndConditions 
              checked={agreeToTerms} 
              onChange={onAgreeToTermsChange}
          />
      </div>

      {showErrors && validationErrors.length > 0 && (
        <div className="mt-6 bg-red-50 p-4 rounded-md border border-red-100">
          <h3 className="text-sm font-medium text-red-800">Please correct the following errors:</h3>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => <li key={index}>{error}</li>)}
          </ul>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={prevStep}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Continue to Ticket Selection
        </button>
      </div>
    </div>
  );
};

export default AttendeeDetails;