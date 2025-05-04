import React, { useState, useCallback, useMemo } from 'react';
import 'react-phone-input-2/lib/style.css';
import { GuestData, GuestPartnerData, MasonData } from '../../shared/types/register';
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
  // --- Store Data ---
  const { guest, partnerData, updateAttendee, removeAttendee, addAttendee } = useRegistrationStore(state => {
      const currentGuest = state.attendees.find(att => att.attendeeId === attendeeId);
      // Find associated guest partner
      const partner = state.attendees.find(att => att.relatedAttendeeId === attendeeId && att.attendeeType === 'guest_partner');
      return {
          guest: currentGuest,
          partnerData: partner, // UnifiedAttendeeData | undefined
          updateAttendee: state.updateAttendee,
          removeAttendee: state.removeAttendee,
          addAttendee: state.addAttendee,
      };
  });

  // Find primary attendee for contact confirmation message
  const primaryAttendeeData = useRegistrationStore(state => 
      state.attendees.find(att => att.isPrimary) 
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
      if (window.confirm("Are you sure you want to remove this guest?")) {
          removeAttendee(attendeeId);
      }
  }, [removeAttendee, attendeeId]);

  const handlePartnerToggle = useCallback(() => {
      if (partnerData) {
          if (window.confirm("Are you sure you want to remove this guest's partner?")) {
            removeAttendee(partnerData.attendeeId);
          }
      } else {
          // Fix addAttendee call: Ensure all required fields from UnifiedAttendeeData are present
          addAttendee({
              attendeeType: 'guest_partner',
              relatedAttendeeId: attendeeId, 
              registrationId: guest.registrationId, 
              // Add required fields with defaults
              firstName: '', 
              lastName: '',
              // Add other potentially required fields from UnifiedAttendeeData with defaults
              // personId: uuidv4(), // If needed
              // title: '' // If needed
              // primaryEmail: '' // If needed
              // primaryPhone: '' // If needed
              // contactPreference: 'PrimaryAttendee' // If needed
          } as Omit<UnifiedAttendeeData, 'attendeeId'>); // Cast might still be needed if defaults aren't exhaustive
      }
  }, [partnerData, addAttendee, removeAttendee, attendeeId, guest.registrationId]);

  const getConfirmationMessage = useCallback(() => {
    // Fix comparison: Check against actual values, not 'Please Select'
    if (!primaryAttendeeData) return "";
    const primaryFullName = `${primaryAttendeeData.firstName || ''} ${primaryAttendeeData.lastName || ''}`.trim();
    if (guest.contactPreference === "PrimaryAttendee") { 
        return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee`;
    } else if (guest.contactPreference === "ProvideLater") { 
        return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee until their contact details have been updated...`; // Shortened
    }
    return "";
  }, [primaryAttendeeData, guest.contactPreference]);

  // --- Transform Partner Data for Old GuestPartnerForm ---
  const transformedPartnerData = useMemo(() => {
      if (!partnerData) return undefined;
      // TODO: Map UnifiedAttendeeData (partnerData) to OldGuestPartnerData
      return { 
          id: partnerData.attendeeId,
          title: partnerData.title || '',
          firstName: partnerData.firstName || '',
          lastName: partnerData.lastName || '',
          email: partnerData.primaryEmail || '',
          phone: partnerData.primaryPhone || '',
          dietary: partnerData.dietaryRequirements || '',
          specialNeeds: partnerData.specialNeeds || '',
          relationship: partnerData.relationship || 'Partner',
          guestId: partnerData.relatedAttendeeId || '', // Check field name
      } as GuestPartnerData;
  }, [partnerData]);

  // Expanded titles to include more options
  const titles = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev", "Prof", "Rabbi", "Hon", "Sir", "Madam", "Lady", "Dame"];
  const contactOptions = ["Please Select", "PrimaryAttendee", "Directly", "ProvideLater"];
  
  const showContactFields = guest.contactPreference === "Directly";
  const showConfirmation = guest.contactPreference !== "Directly" && guest.contactPreference !== undefined && guest.contactPreference !== null;
  const hideContactFields = !showConfirmation && guest.contactPreference !== "Directly";

  return (
    <div className="bg-emerald-50 p-6 rounded-lg mb-8 relative">
      {/* Show Remove button for guests */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-700">Guest Attendee #{attendeeNumber}</h3>
        <button onClick={handleRemoveSelf} className="text-red-500 hover:text-red-700" aria-label={`Remove Guest ${attendeeNumber}`}>
          <X className="w-4 h-4"/>
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

      {/* Guest Partner Toggle */} 
      <GuestPartnerToggle 
          onAdd={handlePartnerToggle}
      />

      {/* Guest Partner Form */} 
      {partnerData && transformedPartnerData && (
          <GuestPartnerForm
              partner={transformedPartnerData} // Pass mapped old data
              id={partnerData.attendeeId}
              // Pass updateField mapping back to store
              updateField={(id, field, value) => {
                  let unifiedField: keyof UnifiedAttendeeData | null = null;
                  // Map OldGuestPartnerData field to UnifiedAttendeeData field
                  switch (field as keyof GuestPartnerData) {
                       case 'title': unifiedField = 'title'; break;
                       // ... other field mappings ...
                       default: console.warn(`Unhandled GuestPartnerForm field: ${field}`); return;
                  }
                  if (unifiedField) {
                      updateAttendee(id, { [unifiedField]: value });
                  }
              }}
              onRemove={() => handlePartnerToggle()} // Toggle removes if partner exists
              relatedGuestName={`${guest.firstName || ''} ${guest.lastName || ''}`.trim()}
          />
      )}
    </div>
  );
};

export default GuestForm;