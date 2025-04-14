import React from 'react';
import 'react-phone-input-2/lib/style.css';
import { LadyPartnerData, MasonData } from '../../shared/types/register';
import { HelpCircle, X } from 'lucide-react';
import PhoneInputWrapper from './PhoneInputWrapper';

interface LadyPartnerFormProps {
  ladyPartner: LadyPartnerData;
  index: number;
  onChange: (index: number, field: string, value: string | boolean) => void;
  masonData?: MasonData; // Associated mason data
  isPrimaryMason?: boolean; // Whether this is attached to primary or additional mason
  primaryMasonData?: MasonData; // Primary mason data for reference
  onRemove?: () => void; // New prop to handle removal
}

const LadyPartnerForm: React.FC<LadyPartnerFormProps> = ({
  ladyPartner,
  index,
  onChange,
  masonData,
  isPrimaryMason = false,
  primaryMasonData,
  onRemove
}) => {
  const titles = ["Mrs", "Ms", "Miss", "Dr", "Rev", "Prof", "Hon", "Lady", "Madam", "Dame"];
  const relationships = ["Wife", "Partner", "Fiancée", "Husband", "Fiancé"];
  
  // Determine available contact options based on associated mason's contact preference
  let contactOptions = ["Please Select", "Directly", "Provide Later"];
  
  // For primary mason's lady partner or when mason has direct contact
  if (isPrimaryMason || (masonData && masonData.contactPreference === "Directly")) {
    // Include mason option
    contactOptions = ["Please Select", "Mason", "Directly", "Provide Later"];
  }
  
  // For additional mason's lady partner, include primary attendee option
  if (!isPrimaryMason) {
    // Add Primary Attendee to the options
    contactOptions = ["Please Select", "Primary Attendee", ...contactOptions.slice(1)];
  }

  const handlePhoneChange = (value: string) => {
    onChange(index, 'phone', value);
  };

  const showContactFields = ladyPartner.contactPreference === "Directly";
  const showConfirmation = ladyPartner.contactPreference !== "Directly" && ladyPartner.contactPreference !== "Please Select";

  // Generate dynamic confirmation message
  const getConfirmationMessage = () => {
    if (!masonData) return "";
    
    // For Primary Attendee option (for Additional Mason's Lady Partner)
    if (ladyPartner.contactPreference === "Primary Attendee" && primaryMasonData) {
      const primaryFullName = `${primaryMasonData.firstName} ${primaryMasonData.lastName}`;
      return `I confirm that ${primaryFullName} will be responsible for all communication with this attendee`;
    }
    
    // For Mason option
    if (ladyPartner.contactPreference === "Mason") {
      const masonFullName = `${masonData.firstName} ${masonData.lastName}`;
      return `I confirm that ${masonFullName} will be responsible for all communication with this attendee`;
    }
    
    // For Provide Later option
    if (ladyPartner.contactPreference === "Provide Later") {
      const responsibleName = isPrimaryMason || !primaryMasonData
        ? `${masonData.firstName} ${masonData.lastName}`
        : `${primaryMasonData.firstName} ${primaryMasonData.lastName}`;
      
      return `I confirm that ${responsibleName} will be responsible for all communication with this attendee until their contact details have been updated in their profile`;
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
        Lady & Partner Details
      </h4>
      
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Reduced width for Relationship */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`relationship-${index}`}>
            Relationship *
          </label>
          <select
            id={`relationship-${index}`}
            name={`relationship-${index}`}
            value={ladyPartner.relationship}
            onChange={(e) => onChange(index, 'relationship', e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {relationships.map(rel => (
              <option key={rel} value={rel}>{rel}</option>
            ))}
          </select>
        </div>
        
        {/* Reduced width for Title */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`ladyTitle-${index}`}>
            Title *
          </label>
          <select
            id={`ladyTitle-${index}`}
            name={`ladyTitle-${index}`}
            value={ladyPartner.title}
            onChange={(e) => onChange(index, 'title', e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {titles.map(title => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
        </div>
        
        {/* Increased width for First Name */}
        <div className="col-span-4">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`ladyFirstName-${index}`}>
            First Name *
          </label>
          <input
            type="text"
            id={`ladyFirstName-${index}`}
            name={`ladyFirstName-${index}`}
            value={ladyPartner.firstName}
            onChange={(e) => onChange(index, 'firstName', e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        
        {/* Increased width for Last Name */}
        <div className="col-span-4">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`ladyLastName-${index}`}>
            Last Name *
          </label>
          <input
            type="text"
            id={`ladyLastName-${index}`}
            name={`ladyLastName-${index}`}
            value={ladyPartner.lastName}
            onChange={(e) => onChange(index, 'lastName', e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
      
      {/* Contact Preference Section - Modified layout */}
      <div className="mb-4">
        <div className="flex items-center mb-1">
          <label className="block text-sm font-medium text-slate-700" htmlFor={`contactPreference-${index}`}>
            Contact *
          </label>
          <div className="relative inline-block ml-2 group">
            <HelpCircle className="h-4 w-4 text-primary cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 invisible group-hover:visible bg-white text-slate-700 text-xs p-2 rounded shadow-lg w-48 z-10">
              Where necessary we'd like to communicate with your Lady or Partner directly about events which they are registered for
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-12 gap-4">
          {/* Contact dropdown */}
          <div className={showConfirmation ? "col-span-3" : "col-span-3"}>
            <select
              id={`contactPreference-${index}`}
              name={`contactPreference-${index}`}
              value={ladyPartner.contactPreference}
              onChange={(e) => onChange(index, 'contactPreference', e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {contactOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          {/* Confirmation checkbox - show inline with dropdown */}
          {showConfirmation && (
            <div className="col-span-9 flex items-center">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`contactConfirmed-${index}`}
                  checked={ladyPartner.contactConfirmed}
                  onChange={(e) => onChange(index, 'contactConfirmed', e.target.checked)}
                  required
                  className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                />
                <label htmlFor={`contactConfirmed-${index}`} className="ml-2 text-sm text-slate-700">
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
                <PhoneInputWrapper
                  value={ladyPartner.phone}
                  onChange={handlePhoneChange}
                  inputProps={{
                    id: `ladyPhone-${index}`,
                    name: `ladyPhone-${index}`,
                    placeholder: "Mobile Number"
                  }}
                  required={showContactFields}
                />
              </div>
              
              {/* Email input */}
              <div className="col-span-5">
                <input
                  type="email"
                  id={`ladyEmail-${index}`}
                  name={`ladyEmail-${index}`}
                  value={ladyPartner.email}
                  onChange={(e) => onChange(index, 'email', e.target.value)}
                  required={showContactFields}
                  placeholder="Email Address"
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`ladyDietary-${index}`}>
          Dietary Requirements
        </label>
        <input
          type="text"
          id={`ladyDietary-${index}`}
          name={`ladyDietary-${index}`}
          value={ladyPartner.dietary}
          onChange={(e) => onChange(index, 'dietary', e.target.value)}
          placeholder="E.g., vegetarian, gluten-free, allergies"
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`ladySpecialNeeds-${index}`}>
          Special Needs or Accessibility Requirements
        </label>
        <textarea
          id={`ladySpecialNeeds-${index}`}
          name={`ladySpecialNeeds-${index}`}
          value={ladyPartner.specialNeeds}
          onChange={(e) => onChange(index, 'specialNeeds', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        ></textarea>
      </div>
    </div>
  );
};

export default LadyPartnerForm;