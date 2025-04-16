import React from 'react';
import 'react-phone-input-2/lib/style.css';
import { GuestData } from '../../shared/types/register';
import GuestPartnerForm from './GuestPartnerForm';
import { HelpCircle, X } from 'lucide-react';
import PhoneInputWrapper from './PhoneInputWrapper';
import GuestBasicInfo from './guest/GuestBasicInfo';
import GuestContactInfo from './guest/GuestContactInfo';
import GuestAdditionalInfo from './guest/GuestAdditionalInfo';
import GuestPartnerToggle from './guest/GuestPartnerToggle';

interface GuestFormProps {
  guest: GuestData;
  index: number;
  onChange: (index: number, field: string, value: string | boolean) => void;
  onToggleHasPartner?: (index: number, checked: boolean) => void;
  partnerData?: any;
  partnerIndex?: number;
  updatePartnerField?: (index: number, field: string, value: string | boolean) => void;
  primaryMasonData?: any; // For accessing primary mason data for confirmation messages
  onRemove?: () => void; // New prop for removing this guest
}

const GuestForm: React.FC<GuestFormProps> = ({
  guest,
  index,
  onChange,
  onToggleHasPartner,
  partnerData,
  partnerIndex,
  updatePartnerField,
  primaryMasonData,
  onRemove
}) => {
  const handlePhoneChange = (value: string) => {
    onChange(index, 'phone', value);
  };

  const handlePartnerToggle = () => {
    if (onToggleHasPartner) {
      onToggleHasPartner(index, !guest.hasPartner);
    }
  };

  // Handler to remove partner
  const handleRemovePartner = () => {
    if (onToggleHasPartner) {
      onToggleHasPartner(index, false);
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
          onClick={onRemove}
          className="absolute top-3 right-3 text-red-500 hover:text-red-700 flex items-center text-sm"
          aria-label="Remove this guest"
        >
          <X className="w-4 h-4 mr-1" />
          <span>Remove</span>
        </button>
      )}
      
      <h3 className="text-lg font-bold mb-4">Guest Attendee {index + 1}</h3>
      
      <GuestBasicInfo
        guest={guest}
        index={index}
        onChange={onChange}
        titles={titles}
      />
      
      <GuestContactInfo
        guest={guest}
        index={index}
        onChange={onChange}
        handlePhoneChange={handlePhoneChange}
        contactOptions={contactOptions}
        showContactFields={showContactFields}
        showConfirmation={showConfirmation}
        getConfirmationMessage={getConfirmationMessage}
      />
      
      <GuestAdditionalInfo
        guest={guest}
        index={index}
        onChange={onChange}
      />

      {/* Show toggle button only if no partner is registered */}
      {!guest.hasPartner && (
        <GuestPartnerToggle
          hasPartner={guest.hasPartner}
          onToggle={handlePartnerToggle}
        />
      )}

      {/* Show Partner form if checkbox is checked */}
      {guest.hasPartner && partnerData && updatePartnerField && (
        <GuestPartnerForm 
          partner={partnerData}
          index={partnerIndex || 0}
          onChange={updatePartnerField}
          guestIndex={index}
          guestData={guest}
          primaryMasonData={primaryMasonData}
          onRemove={handleRemovePartner}
        />
      )}
    </div>
  );
};

export default GuestForm;