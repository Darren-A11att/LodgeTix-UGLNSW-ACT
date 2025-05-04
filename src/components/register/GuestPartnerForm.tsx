import React, { useState } from 'react';
import 'react-phone-input-2/lib/style.css';
import { GuestPartnerData, GuestData } from '../../shared/types/register';
import { HelpCircle, X } from 'lucide-react';
import PhoneInputWrapper from './PhoneInputWrapper';

interface GuestPartnerFormProps {
  partner: GuestPartnerData;
  id: string;
  relatedGuestName: string;
  updateField: (id: string, field: string, value: string | boolean) => void;
  primaryMasonData?: any;
  onRemove?: () => void;
}

const GuestPartnerForm: React.FC<GuestPartnerFormProps> = ({
  partner,
  id,
  relatedGuestName,
  updateField,
  primaryMasonData,
  onRemove
}) => {
  const titles = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev", "Prof", "Rabbi", "Hon", "Sir", "Madam", "Lady", "Dame"];
  const relationships = ["Wife", "Partner", "Fiancée", "Husband", "Fiancé"];
  const contactOptions = ["Please Select", "Primary Attendee", "Guest", "Directly", "Provide Later"];

  const [relationshipInteracted, setRelationshipInteracted] = useState(false);
  const [titleInteracted, setTitleInteracted] = useState(false);
  const [firstNameInteracted, setFirstNameInteracted] = useState(false);
  const [lastNameInteracted, setLastNameInteracted] = useState(false);
  const [contactPreferenceInteracted, setContactPreferenceInteracted] = useState(false);
  const [phoneInteracted, setPhoneInteracted] = useState(false);
  const [emailInteracted, setEmailInteracted] = useState(false);

  const handlePhoneChange = (value: string) => {
    updateField(id, 'phone', value);
  };

  const showContactFields = partner.contactPreference === "Directly";
  const showConfirmation = partner.contactPreference !== "Directly" && partner.contactPreference !== "Please Select";
  
  const getConfirmationMessage = () => {
    if (!primaryMasonData) return ""; 
    const primaryFullName = `${primaryMasonData?.firstName ?? 'Primary'} ${primaryMasonData?.lastName ?? 'Attendee'}`;

    if (partner.contactPreference === "Primary Attendee") {
      return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee`;
    }
    if (partner.contactPreference === "Guest") {
      const nameToShow = relatedGuestName.trim() ? relatedGuestName : `Guest Attendee`; 
      return `I confirm that ${nameToShow} will be responsible for all communication with this attendee`;
    }
    if (partner.contactPreference === "Provide Later") {
      return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee until their contact details have been updated in their profile`;
    }
    return "";
  };

  return (
    <div className="relative">
      {onRemove && (
        <button 
          type="button"
          onClick={onRemove}
          className="absolute top-0 right-0 text-red-500 hover:text-red-700 flex items-center text-sm"
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
        Partner Attendee
      </h4>
      
      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerRelationship-${id}`}>
            Relationship *
          </label>
          <select
            id={`partnerRelationship-${id}`}
            name={`partnerRelationship-${id}`}
            value={partner.relationship}
            onChange={(e) => updateField(id, 'relationship', e.target.value)}
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
        
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerTitle-${id}`}>
            Title *
          </label>
          <select
            id={`partnerTitle-${id}`}
            name={`partnerTitle-${id}`}
            value={partner.title}
            onChange={(e) => updateField(id, 'title', e.target.value)}
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
        
        <div className="col-span-4">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerFirstName-${id}`}>
            First Name *
          </label>
          <input
            type="text"
            id={`partnerFirstName-${id}`}
            name={`partnerFirstName-${id}`}
            value={partner.firstName}
            onChange={(e) => updateField(id, 'firstName', e.target.value)}
            onBlur={() => setFirstNameInteracted(true)}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${firstNameInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                       focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          />
        </div>
        
        <div className="col-span-4">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerLastName-${id}`}>
            Last Name *
          </label>
          <input
            type="text"
            id={`partnerLastName-${id}`}
            name={`partnerLastName-${id}`}
            value={partner.lastName}
            onChange={(e) => updateField(id, 'lastName', e.target.value)}
            onBlur={() => setLastNameInteracted(true)}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${lastNameInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                       focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          />
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center mb-1">
          <label className="block text-sm font-medium text-slate-700" htmlFor={`partnerContactPreference-${id}`}>
            Contact *
          </label>
          <div className="relative inline-block ml-2 group">
            <HelpCircle className="h-4 w-4 text-primary cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 invisible group-hover:visible bg-white text-slate-700 text-xs p-2 rounded shadow-lg w-48 z-10">
              Select how we should contact this attendee regarding event information
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-12 gap-4">
          <div className={showConfirmation ? "col-span-3" : "col-span-3"}>
            <select
              id={`partnerContactPreference-${id}`}
              name={`partnerContactPreference-${id}`}
              value={partner.contactPreference}
              onChange={(e) => updateField(id, 'contactPreference', e.target.value)}
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
          
          {showConfirmation && (
            <div className="col-span-9 flex items-center">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`partnerContactConfirmed-${id}`}
                  checked={partner.contactConfirmed}
                  onChange={(e) => updateField(id, 'contactConfirmed', e.target.checked)}
                  required
                  className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                />
                <label htmlFor={`partnerContactConfirmed-${id}`} className="ml-2 text-sm text-slate-700">
                  {getConfirmationMessage()} *
                </label>
              </div>
            </div>
          )}
          
          {/* Contact fields */}
          {showContactFields && !showConfirmation && (
            <>
              {/* Phone input */}
              <div className="col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerPhone-${id}`}>Mobile Number *</label>
                <div 
                    className={`${phoneInteracted ? 'interacted' : ''} 
                               [&.interacted:invalid]:[&>.custom-phone-input>input]:border-red-500 
                               focus-within:[&.interacted:invalid]:[&>.custom-phone-input>input]:border-red-500 
                               focus-within:[&.interacted:invalid]:[&>.custom-phone-input>input]:ring-red-500 
                               focus-within:[&.interacted:invalid]:[&>.custom-phone-input>input]:ring-2 
                               focus-within:[&.interacted:invalid]:[&>.custom-phone-input>input]:ring-offset-0`}
                    onBlur={(e) => {
                      // Set interacted only if focus moves outside the wrapper
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setPhoneInteracted(true);
                      }
                    }}
                 >
                  <PhoneInputWrapper
                    value={partner.phone}
                    onChange={handlePhoneChange}
                    name={`partnerPhone-${id}`}
                    inputProps={{ id: `partnerPhone-${id}`, name: `partnerPhone-${id}` }}
                    required={showContactFields}
                  />
                </div>
              </div>
              
              {/* Email input */}
              <div className="col-span-5">
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerEmail-${id}`}>Email Address *</label>
                <input
                  type="email"
                  id={`partnerEmail-${id}`}
                  name={`partnerEmail-${id}`}
                  value={partner.email}
                  onChange={(e) => updateField(id, 'email', e.target.value)}
                  onBlur={() => setEmailInteracted(true)}
                  required={showContactFields}
                  placeholder="Email Address"
                  className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                             ${emailInteracted ? 'interacted' : ''} 
                             [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                             focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
                  title="Please enter a valid email address (e.g., user@example.com)"
                />
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerDietary-${id}`}>
          Dietary Requirements
        </label>
        <input
          type="text"
          id={`partnerDietary-${id}`}
          name={`partnerDietary-${id}`}
          value={partner.dietary}
          onChange={(e) => updateField(id, 'dietary', e.target.value)}
          placeholder="E.g., vegetarian, gluten-free, allergies"
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`partnerSpecialNeeds-${id}`}>
          Special Needs or Accessibility Requirements
        </label>
        <textarea
          id={`partnerSpecialNeeds-${id}`}
          name={`partnerSpecialNeeds-${id}`}
          value={partner.specialNeeds}
          onChange={(e) => updateField(id, 'specialNeeds', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        ></textarea>
      </div>
    </div>
  );
};

export default GuestPartnerForm;