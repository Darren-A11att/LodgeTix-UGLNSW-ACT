import React, { useState } from 'react';
import { GuestData } from '../../../shared/types/register';
import { HelpCircle } from 'lucide-react';
import PhoneInputWrapper from '../PhoneInputWrapper';

interface GuestContactInfoProps {
  guest: GuestData;
  index: number;
  onChange: (index: number, field: string, value: string | boolean) => void;
  handlePhoneChange: (value: string) => void;
  contactOptions: string[];
  showContactFields: boolean;
  showConfirmation: boolean;
  getConfirmationMessage: () => string;
}

const GuestContactInfo: React.FC<GuestContactInfoProps> = ({
  guest,
  index,
  onChange,
  handlePhoneChange,
  contactOptions,
  showContactFields,
  showConfirmation,
  getConfirmationMessage
}) => {
  const [emailInteracted, setEmailInteracted] = useState(false);
  const [contactPreferenceInteracted, setContactPreferenceInteracted] = useState(false);
  const [phoneInteracted, setPhoneInteracted] = useState(false);

  return (
    <div className="mb-4">
      <div className="grid grid-cols-12 gap-4">
        {/* Contact dropdown */}
        <div className="col-span-4">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`contactPreference-${index}`}>
            Contact *
            <span className="inline-block ml-1">
              <div className="relative inline-block group">
                <HelpCircle className="h-4 w-4 text-primary cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 invisible group-hover:visible bg-white text-slate-700 text-xs p-2 rounded shadow-lg w-48 z-10">
                  Select how we should contact this guest regarding event information
                </div>
              </div>
            </span>
          </label>
          <select
            id={`contactPreference-${index}`}
            name={`contactPreference-${index}`}
            value={guest.contactPreference}
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
        
        {/* Confirmation checkbox or input fields */}
        {showConfirmation ? (
          <div className="col-span-8 flex items-center">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`contactConfirmed-${index}`}
                checked={guest.contactConfirmed}
                onChange={(e) => onChange(index, 'contactConfirmed', e.target.checked)}
                required
                className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
              />
              <label htmlFor={`contactConfirmed-${index}`} className="ml-2 text-sm text-slate-700">
                {getConfirmationMessage()} *
              </label>
            </div>
          </div>
        ) : (
          showContactFields && (
            <>
              {/* Phone input */}
              <div className="col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestPhone-${index}`}>
                  Mobile Number *
                </label>
                <div 
                    className={`${phoneInteracted ? 'interacted' : ''} 
                               [&.interacted:invalid]:[&>.custom-phone-input>input]:border-red-500 
                               focus-within:[&.interacted:invalid]:[&>.custom-phone-input>input]:border-red-500 
                               focus-within:[&.interacted:invalid]:[&>.custom-phone-input>input]:ring-red-500 
                               focus-within:[&.interacted:invalid]:[&>.custom-phone-input>input]:ring-2 
                               focus-within:[&.interacted:invalid]:[&>.custom-phone-input>input]:ring-offset-0`}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setPhoneInteracted(true);
                      }
                    }}
                 >
                  <PhoneInputWrapper
                    value={guest.phone}
                    onChange={handlePhoneChange}
                    name={`guestPhone-${index}`}
                    inputProps={{ id: `guestPhone-${index}`, name: `guestPhone-${index}` }}
                    required={true}
                  />
                </div>
              </div>
              
              {/* Email input */}
              <div className="col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`guestEmail-${index}`}>
                  Email Address *
                </label>
                <input
                  type="email"
                  id={`guestEmail-${index}`}
                  name={`guestEmail-${index}`}
                  value={guest.email}
                  onChange={(e) => onChange(index, 'email', e.target.value)}
                  onBlur={() => setEmailInteracted(true)}
                  required={true}
                  className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                             ${emailInteracted ? 'interacted' : ''} 
                             [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                             focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
                  pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.{a-zA-Z]{2,}$"
                  title="Please enter a valid email address (e.g., user@example.com)"
                />
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default GuestContactInfo;