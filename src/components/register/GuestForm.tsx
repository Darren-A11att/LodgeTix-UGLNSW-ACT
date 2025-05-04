import React from 'react';
import 'react-phone-input-2/lib/style.css';
import { GuestData, GuestPartnerData, MasonData } from '../../shared/types/register';
import GuestPartnerForm from './GuestPartnerForm';
import { X } from 'lucide-react';
import GuestBasicInfo from './guest/GuestBasicInfo';
import GuestContactInfo from './guest/GuestContactInfo';
import GuestAdditionalInfo from './guest/GuestAdditionalInfo';
import GuestPartnerToggle from './guest/GuestPartnerToggle';

interface GuestFormProps {
  guest: GuestData;
  id: string;
  attendeeNumber: number;
  onChange: (id: string, field: string, value: string | boolean) => void;
  onToggleHasPartner?: (checked: boolean) => void;
  partnerData?: GuestPartnerData;
  updatePartnerField?: (partnerId: string, field: string, value: string | boolean) => void;
  primaryMasonData?: MasonData;
  onRemove?: (id: string) => void;
}

const GuestForm: React.FC<GuestFormProps> = ({
  guest,
  id,
  attendeeNumber,
  onChange,
  onToggleHasPartner,
  partnerData,
  updatePartnerField,
  primaryMasonData,
  onRemove
}) => {
  const handlePhoneChange = (value: string) => {
    onChange(id, 'phone', value);
  };

  const handlePartnerToggle = () => {
    console.log("Toggling guest partner to TRUE for Guest:", id);
    if (onToggleHasPartner) {
      onToggleHasPartner(true);
    }
  };

  const handleRemovePartner = () => {
    console.log("Removing guest partner (setting to FALSE) for Guest:", id);
    if (onToggleHasPartner) {
      onToggleHasPartner(false);
    }
  };

  // Expanded titles to include more options
  const titles = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev", "Prof", "Rabbi", "Hon", "Sir", "Madam", "Lady", "Dame"];
  const contactOptions = ["Please Select", "Primary Attendee", "Directly", "Provide Later"];
  
  const showContactFields = guest.contactPreference === "Directly";
  const showConfirmation = guest.contactPreference !== "Directly" && guest.contactPreference !== "Please Select";

  // Generate dynamic confirmation message
  const getConfirmationMessage = () => {
    if (!primaryMasonData) return "";
    
    // For Primary Attendee option
    if (guest.contactPreference === "Primary Attendee") {
      const primaryFullName = `${primaryMasonData.firstName} ${primaryMasonData.lastName}`;
      return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee`;
    }
    
    // For Provide Later option
    if (guest.contactPreference === "Provide Later") {
      const primaryFullName = `${primaryMasonData.firstName} ${primaryMasonData.lastName}`;
      return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee until their contact details have been updated in their profile`;
    }
    
    return "";
  };

  return (
    <div className="bg-slate-50 p-6 rounded-lg mb-4 relative">
      {/* Show Remove button for guests */}
      {onRemove && (
        <button 
          type="button"
          onClick={() => onRemove(id)}
          className="absolute top-3 right-3 text-red-500 hover:text-red-700 flex items-center text-sm"
          aria-label="Remove this guest"
        >
          <X className="w-4 h-4 mr-1" />
          <span>Remove</span>
        </button>
      )}
      
      <h3 className="text-lg font-bold mb-4">Guest Attendee</h3>
      
      <GuestBasicInfo
        guest={guest}
        id={id}
        onChange={onChange}
        titles={titles}
      />
      
      <GuestContactInfo
        guest={guest}
        id={id}
        onChange={onChange}
        handlePhoneChange={handlePhoneChange}
        contactOptions={contactOptions}
        showContactFields={showContactFields}
        showConfirmation={showConfirmation}
        getConfirmationMessage={getConfirmationMessage}
      />
      
      <GuestAdditionalInfo
        guest={guest}
        id={id}
        onChange={onChange}
      />

      {/* --- Guest Partner Section --- */}
      {/* Add horizontal line divider above partner section */}
      {onToggleHasPartner && (
          <>
              <hr className="mt-6 mb-4 border-t border-slate-300" />
              
              {/* Show toggle button only if no partner is registered AND toggle function is provided */}
              {!guest.hasPartner && (
                  <GuestPartnerToggle
                    onAdd={handlePartnerToggle}
                  />
              )}

              {/* Show Partner form if checkbox is checked */} 
              {guest.hasPartner && partnerData && updatePartnerField && (
                  <GuestPartnerForm 
                    partner={partnerData}
                    id={partnerData.id}
                    updateField={updatePartnerField}
                    relatedGuestName={`${guest.firstName} ${guest.lastName}`.trim() || `Guest ${attendeeNumber}`}
                    primaryMasonData={primaryMasonData}
                    onRemove={handleRemovePartner}
                  />
              )}
          </>
      )}
    </div>
  );
};

export default GuestForm;