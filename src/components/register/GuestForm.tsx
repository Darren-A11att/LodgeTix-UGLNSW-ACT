import React, { useState, useCallback, useMemo } from 'react';
import 'react-phone-input-2/lib/style.css';
import { GuestPartnerData } from '../../shared/types/register';
import GuestPartnerForm from './GuestPartnerForm';
import { X } from 'lucide-react';
import GuestBasicInfo from './guest/GuestBasicInfo';
import GuestContactInfo from './guest/GuestContactInfo';
import GuestAdditionalInfo from './guest/GuestAdditionalInfo';
import GuestPartnerToggle from './guest/GuestPartnerToggle';
import { UnifiedAttendeeData, useRegistrationStore } from '../../store/registrationStore';
import PhoneInputWrapper from './PhoneInputWrapper';

interface GuestFormProps {
  attendeeId: string;
  attendeeNumber: number;
  isPrimary?: boolean; // Guests typically aren't primary, but keep for consistency?
}

const GuestForm: React.FC<GuestFormProps> = ({
  attendeeId,
  attendeeNumber,
  isPrimary = false, // Default to false
}) => {
  // --- Store Actions (these are stable and don't cause re-renders) ---
  const updateAttendee = useRegistrationStore(state => state.updateAttendee);
  const removeAttendee = useRegistrationStore(state => state.removeAttendee);
  const addAttendee = useRegistrationStore(state => state.addAttendee);
  
  // --- Store Data (wrapped with stable selector functions) ---
  // Use a simple identity function for stable referential equality
  const attendees = useRegistrationStore(state => state.attendees);
  
  // Derive values from attendees in a memoized function
  const guest = useMemo(() => 
    attendees.find(att => att.attendeeId === attendeeId),
    [attendees, attendeeId]
  );
  
  const partnerData = useMemo(() => 
    attendees.find(att => att.relatedAttendeeId === attendeeId && att.attendeeType === 'guest_partner'),
    [attendees, attendeeId]
  );
  
  // Find primary attendee for contact confirmation message
  const primaryAttendeeData = useMemo(() => 
    attendees.find(att => att.isPrimary),
    [attendees]
  );

  if (!guest) {
    return null; // Guest data not found
  }

  // --- Handlers ---
  const handleFieldChange = useCallback((id: string, field: keyof UnifiedAttendeeData, value: any) => {
      if (id === attendeeId) {
          updateAttendee(attendeeId, { [field]: value });
      }
  }, [updateAttendee, attendeeId]);

  const handlePhoneChange = useCallback((value: string) => {
      handleFieldChange(attendeeId, 'primaryPhone', value);
  }, [handleFieldChange, attendeeId]);

  const handleRemoveSelf = useCallback(() => {
      // Remove confirmation based on feedback
      removeAttendee(attendeeId); 
  }, [removeAttendee, attendeeId]);

  const handlePartnerToggle = useCallback(() => {
      if (partnerData) {
          // Confirmation removed based on AddRemoveControl design elsewhere
          removeAttendee(partnerData.attendeeId);
      } else {
          addAttendee({
              attendeeType: 'guest_partner',
              relatedAttendeeId: attendeeId, 
              registrationId: guest.registrationId,
              // Provide required defaults
              firstName: '', 
              lastName: '',
              title: '', // Default
              suffix: undefined,
              primaryPhone: undefined,
              primaryEmail: undefined,
              dietaryRequirements: undefined,
              otherDietaryRequirements: undefined,
              ticket: undefined,
              partnerId: undefined,
              relationship: undefined,
              contactPreference: 'PrimaryAttendee',
              contactConfirmed: false,
              grandOffice: undefined,
              pastGrandOffice: undefined,
              lodgeNameNumber: undefined, 
              memberNumber: undefined, 
              rank: undefined, 
          } as Omit<UnifiedAttendeeData, 'attendeeId'>);
      }
  }, [partnerData, addAttendee, removeAttendee, attendeeId, guest.registrationId]);

  const getConfirmationMessage = useCallback(() => {
    if (!primaryAttendeeData) return "";
    const primaryFullName = `${primaryAttendeeData.firstName || ''} ${primaryAttendeeData.lastName || ''}`.trim();
    
    if (guest.contactPreference === "PrimaryAttendee") { 
        return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee`;
    } else if (guest.contactPreference === "ProvideLater") { 
        return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee until their contact details have been updated in their profile`;
    } else if (guest.contactPreference === "Guest") { 
        // Added case for 'Guest' preference
        return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee`;
    }
    return "";
  }, [primaryAttendeeData, guest.contactPreference]);

  // --- Transform Partner Data for Old GuestPartnerForm ---
  const transformedPartnerData = useMemo(() => {
      if (!partnerData) return undefined;
      return { 
          id: partnerData.attendeeId,
          title: partnerData.title || '',
          firstName: partnerData.firstName || '',
          lastName: partnerData.lastName || '',
          email: partnerData.primaryEmail || '',
          phone: partnerData.primaryPhone || '',
          dietary: partnerData.dietaryRequirements || '',
          specialNeeds: partnerData.specialNeeds || '', // Assuming this exists
          relationship: partnerData.relationship || '',
          guestId: partnerData.relatedAttendeeId || '',
          contactPreference: partnerData.contactPreference || 'Directly',
          contactConfirmed: !!partnerData.contactConfirmed,
          attendeeType: 'Guest Partner', // Add attendeeType required by GuestPartnerData
      };
  }, [partnerData]);

  // Expanded titles to include more options
  const titles = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev", "Prof", "Rabbi", "Hon", "Sir", "Madam", "Lady", "Dame"];
  const contactOptions = ["Please Select", "Primary Attendee", "Directly", "Provide Later"];

  const showConfirmation = guest.contactPreference !== "Directly" && guest.contactPreference !== undefined && guest.contactPreference !== null;
  const hideContactFields = !showConfirmation && guest.contactPreference !== "Directly";

  return (
    <div className="bg-slate-50 p-6 rounded-lg mb-8 relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-800">Guest Attendee</h3>
        <button 
          type="button"
          onClick={handleRemoveSelf}
          className="text-red-500 hover:text-red-700 transition-colors text-sm flex items-center"
          aria-label={`Remove Guest Attendee ${attendeeNumber}`}
        >
          <X className="w-4 h-4 mr-1" />
          <span>Remove</span>
        </button>
      </div>
      
      <GuestBasicInfo
        guest={guest as any}
        id={attendeeId}
        onChange={handleFieldChange as any}
        titles={titles}
      />
      
      <GuestContactInfo
        guest={guest as any}
        id={attendeeId}
        onChange={handleFieldChange as any}
        handlePhoneChange={handlePhoneChange}
        getConfirmationMessage={getConfirmationMessage}
        contactOptions={contactOptions}
        showContactFields={guest.contactPreference === 'Directly'}
        showConfirmation={showConfirmation}
      />
      
      <GuestAdditionalInfo
        guest={guest as any}
        id={attendeeId}
        onChange={handleFieldChange as any}
      />

      {!partnerData && (
        <div className="mt-6 text-center">
        <GuestPartnerToggle 
          hasPartner={false}
          onToggle={handlePartnerToggle}
        />
        </div>
      )}

      {/* Guest Partner Form */} 
      {partnerData && transformedPartnerData && (
          <GuestPartnerForm
              partner={transformedPartnerData}
              id={partnerData.attendeeId}
              updateField={(id, field, value) => {
                  let unifiedField: keyof UnifiedAttendeeData | null = null;
                  switch (field as keyof GuestPartnerData) {
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
                       default: console.warn(`Unhandled GuestPartnerForm field: ${field}`); return;
                  }
                  if (unifiedField) {
                      updateAttendee(id, { [unifiedField]: value });
                  }
              }}
              onRemove={handlePartnerToggle}
              relatedGuestName={`${guest.firstName || ''} ${guest.lastName || ''}`.trim()}
              primaryMasonData={primaryAttendeeData}
          />
      )}
    </div>
  );
};

export default GuestForm;