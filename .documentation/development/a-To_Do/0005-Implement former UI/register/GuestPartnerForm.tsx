import React, { useState } from 'react';
import 'react-phone-input-2/lib/style.css';
import { GuestPartnerData, GuestData } from '../../shared/types/register';
import { HelpCircle, X } from 'lucide-react';
import PhoneInputWrapper from './PhoneInputWrapper';
import { useRegisterForm } from '../../hooks/useRegisterForm';

interface GuestPartnerFormProps {
  partner: GuestPartnerData;
  index: number;
  guestIndex: number;
  guestData: GuestData;
  onChange: (index: number, field: string, value: string | boolean) => void;
  primaryMasonData?: any; // For accessing primary mason data in guest partner forms
  onRemove?: () => void; // New prop to handle removal
}

const GuestPartnerForm: React.FC<GuestPartnerFormProps> = ({
  partner,
  index,
  guestIndex,
  guestData,
  onChange,
  primaryMasonData,
  onRemove
}) => {
  // Get context functions/state
  const { 
    formState, 
    updateGuestPartnerField, 
    checkEmailOnBlur, 
    clearEmailConflictFlag 
  } = useRegisterForm();

  // Expanded titles to include more options
  const titles = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev", "Prof", "Rabbi", "Hon", "Sir", "Madam", "Lady", "Dame"];
  const relationships = ["Wife", "Partner", "Fiancée", "Husband", "Fiancé"];
  const contactOptions = ["Please Select", "Primary Attendee", "Guest", "Directly", "Provide Later"];

  // Interaction states
  const [relationshipInteracted, setRelationshipInteracted] = useState(false);
  const [titleInteracted, setTitleInteracted] = useState(false);
  const [firstNameInteracted, setFirstNameInteracted] = useState(false);
  const [lastNameInteracted, setLastNameInteracted] = useState(false);
  const [contactPreferenceInteracted, setContactPreferenceInteracted] = useState(false);
  const [phoneInteracted, setPhoneInteracted] = useState(false);
  const [emailInteracted, setEmailInteracted] = useState(false);

  // Generate partner ID for conflict flag key
  const partnerId = `guest-${index}`;
  const hasConflictError = !!formState.emailConflictFlags[partnerId];

  // Specific handler for phone input using context function
  const handlePhoneChange = (value: string) => {
    updateGuestPartnerField(index, 'phone', value);
  };

  // Specific handler for email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateGuestPartnerField(index, 'email', e.target.value);
    clearEmailConflictFlag('guest', index);
  };

  // Specific handler for email input blur
  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setEmailInteracted(true);
      checkEmailOnBlur('guestPartner', index, e.target.value);
  };

  const showContactFields = partner.contactPreference === "Directly";
  const showConfirmation = partner.contactPreference !== "Directly" && partner.contactPreference !== "";
  
  // Generate dynamic confirmation message
  const getConfirmationMessage = () => {
    if (!guestData) return ""; // Simplified check
    
    const primaryFullName = primaryMasonData ? `${primaryMasonData.firstName} ${primaryMasonData.lastName}` : "Primary Attendee"; // Fallback if masonData is missing
    const guestFullName = `${guestData.firstName} ${guestData.lastName}`;

    if (partner.contactPreference === "Primary Attendee") {
      return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee`;
    }
    if (partner.contactPreference === "Guest") {
      const nameToShow = guestFullName.trim() ? guestFullName : `Guest Attendee ${guestIndex + 1}`; 
      return `I confirm that ${nameToShow} will be responsible for all communication with this attendee`;
    }
    if (partner.contactPreference === "Provide Later") {
       // This case might need review depending on who is responsible - assuming primary booking holder
      return `I confirm that the primary booking holder will be responsible for all communication with this attendee until their contact details have been updated`;
    }
    return "";
  };

  return (
    <div className="border-t border-slate-200 pt-6 mt-6 relative">
      {/* Add a Remove button in the top right */}
      {onRemove && (
        <button 
          type="button"
          onClick={onRemove}
          className="absolute top-6 right-0 text-red-500 hover:text-red-700 flex items-center text-sm"
          aria-label="Remove partner"
        >
          <X className="w-4 h-4 mr-1" />
          <span>Remove</span>
        </button>
      )}
      
      <h4 className="text-lg font-bold mb-4 text-primary flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
        Partner Details
      </h4>
      
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Reduced width for Relationship */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerRelationship-${index}`}>
            Relationship *
          </label>
          <select
            id={`partnerRelationship-${index}`}
            name={`partnerRelationship-${index}`}
            value={partner.relationship}
            onChange={(e) => onChange(index, 'relationship', e.target.value)}
            onBlur={() => setRelationshipInteracted(true)}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${relationshipInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          >
            <option value="">Please Select</option>
            {relationships.map(rel => (
              <option key={rel} value={rel}>{rel}</option>
            ))}
          </select>
        </div>
        
        {/* Reduced width for Title */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerTitle-${index}`}>
            Title *
          </label>
          <select
            id={`partnerTitle-${index}`}
            name={`partnerTitle-${index}`}
            value={partner.title}
            onChange={(e) => onChange(index, 'title', e.target.value)}
            onBlur={() => setTitleInteracted(true)}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${titleInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          >
            <option value="">Please Select</option>
            {titles.map(title => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
        </div>
        
        {/* Increased width for First Name */}
        <div className="col-span-4">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerFirstName-${index}`}>
            First Name *
          </label>
          <input
            type="text"
            id={`partnerFirstName-${index}`}
            name={`partnerFirstName-${index}`}
            value={partner.firstName}
            onChange={(e) => onChange(index, 'firstName', e.target.value)}
            onBlur={() => setFirstNameInteracted(true)}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${firstNameInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                       focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          />
        </div>
        
        {/* Increased width for Last Name */}
        <div className="col-span-4">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerLastName-${index}`}>
            Last Name *
          </label>
          <input
            type="text"
            id={`partnerLastName-${index}`}
            name={`partnerLastName-${index}`}
            value={partner.lastName}
            onChange={(e) => onChange(index, 'lastName', e.target.value)}
            onBlur={() => setLastNameInteracted(true)}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${lastNameInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                       focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          />
        </div>
      </div>
      
      {/* Contact Preference Section */}
      <div className="mb-4">
        <div className="flex items-center mb-1">
          <label className="block text-sm font-medium text-slate-700" htmlFor={`partnerContactPreference-${index}`}>
            Contact *
          </label>
          <div className="relative inline-block ml-2 group">
            <HelpCircle className="h-4 w-4 text-primary cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 invisible group-hover:visible bg-white text-slate-700 text-xs p-2 rounded shadow-lg w-48 z-10">
              Select how we should contact this attendee regarding event information
            </div>
          </div>
        </div>
        
        {/* --- RESTRUCTURED GRID --- */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* Case 1: Show Contact Fields (Dropdown + Phone + Email) */}
          {showContactFields && !showConfirmation && (
            <>
              {/* Contact dropdown - col-span-4 */}
              <div className="col-span-3"> 
                <select
                  id={`partnerContactPreference-${index}`}
                  name={`partnerContactPreference-${index}`}
                  value={partner.contactPreference}
                  onChange={(e) => onChange(index, 'contactPreference', e.target.value)}
                  onBlur={() => setContactPreferenceInteracted(true)}
                  required
                  className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                            ${contactPreferenceInteracted ? 'interacted' : ''} 
                            [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
                >
                  {contactOptions.map(option => (
                    <option key={option} value={option === 'Please Select' ? '' : option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Phone input - col-span-4 */}
              <div className="col-span-4">
                 <div 
                     className={`${phoneInteracted ? 'interacted' : ''} 
                               /* ... phone interaction classes ... */`}
                     onBlur={(e) => {
                       if (!e.currentTarget.contains(e.relatedTarget)) {
                         setPhoneInteracted(true);
                       }
                     }}
                  >
                   <PhoneInputWrapper
                     value={partner.phone}
                     onChange={handlePhoneChange}
                     name={`partnerPhone-${index}`}
                     inputProps={{ id: `partnerPhone-${index}`, name: `partnerPhone-${index}` }}
                     required={showContactFields}
                   />
                 </div>
              </div>
              
              {/* Email input - col-span-4 */}
              <div className="col-span-5">
                 <input
                   type="email"
                   id={`partnerEmail-${index}`}
                   name={`partnerEmail-${index}`}
                   value={partner.email} 
                   onChange={handleEmailChange} 
                   onBlur={handleEmailBlur} 
                   required={showContactFields}
                   placeholder="Email Address"
                   className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                             ${emailInteracted ? 'interacted' : ''} 
                             border-slate-300
                             ${hasConflictError ? 
                                'border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500' : 
                                '[&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500'
                             }`}
                   pattern="^.+@.+\..+$"
                   title={hasConflictError
                            ? `Email conflicts with ${formState.emailConflictFlags[partnerId]?.conflictingAttendeeName}. Resolve preference.`
                            : "Please enter a valid email address (e.g., user@example.com)"}
                 />
              </div>
            </>
          )}
          
          {/* Case 2: Show Confirmation (Dropdown + Checkbox) */}
          {showConfirmation && (
            <>
              {/* Contact dropdown - col-span-4 */}
              <div className="col-span-4"> 
                 <select
                  id={`partnerContactPreference-${index}`}
                  name={`partnerContactPreference-${index}`}
                  value={partner.contactPreference}
                  onChange={(e) => onChange(index, 'contactPreference', e.target.value)}
                  onBlur={() => setContactPreferenceInteracted(true)}
                  required
                  className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                            ${contactPreferenceInteracted ? 'interacted' : ''} 
                            [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
                >
                  {contactOptions.map(option => (
                    <option key={option} value={option === 'Please Select' ? '' : option}>{option}</option>
                  ))}
                </select>
              </div>
              {/* Confirmation checkbox - col-span-8 */} 
              <div className="col-span-8 flex items-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`partnerContactConfirmed-${index}`}
                    checked={partner.contactConfirmed}
                    onChange={(e) => onChange(index, 'contactConfirmed', e.target.checked)}
                    required
                    className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                  />
                  <label htmlFor={`partnerContactConfirmed-${index}`} className="ml-2 text-sm text-slate-700">
                    {getConfirmationMessage()} *
                  </label>
                </div>
              </div>
            </>
          )}

           {/* Case 3: Neither (Should not happen if preference is required, but handle just in case) - Render only dropdown? */}
           {!showContactFields && !showConfirmation && (
              <div className="col-span-4"> 
                <select
                   id={`partnerContactPreference-${index}`}
                   name={`partnerContactPreference-${index}`}
                   value={partner.contactPreference}
                   onChange={(e) => onChange(index, 'contactPreference', e.target.value)}
                   onBlur={() => setContactPreferenceInteracted(true)}
                   required
                   className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                             ${contactPreferenceInteracted ? 'interacted' : ''} 
                             [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
                 >
                   {contactOptions.map(option => (
                     <option key={option} value={option === 'Please Select' ? '' : option}>{option}</option>
                   ))}
                 </select>
               </div>
           )}

        </div> {/* End grid */}
      </div> {/* End mb-4 wrapper */}
      
      {/* Dietary Requirements Section */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerDietary-${index}`}>
          Dietary Requirements
        </label>
        <input
          type="text"
          id={`partnerDietary-${index}`}
          name={`partnerDietary-${index}`}
          value={partner.dietary}
          onChange={(e) => onChange(index, 'dietary', e.target.value)}
          placeholder="E.g., vegetarian, gluten-free, allergies"
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      
      {/* Special Needs Section */}
      <div> 
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerSpecialNeeds-${index}`}>
          Special Needs or Accessibility Requirements
        </label>
        <textarea
          id={`partnerSpecialNeeds-${index}`}
          name={`partnerSpecialNeeds-${index}`}
          value={partner.specialNeeds}
          onChange={(e) => onChange(index, 'specialNeeds', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        ></textarea>
      </div>
    </div>
  );
};

export default GuestPartnerForm;