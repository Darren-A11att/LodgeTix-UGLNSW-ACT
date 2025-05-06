import React, { useState } from 'react';
// import { MasonData } from '../../../shared/types/register'; // Remove old type
import { UnifiedAttendeeData } from '../../../../store/registrationStore'; // Import correct type
import { HelpCircle } from 'lucide-react';
import PhoneInputWrapper from '../../functions/PhoneInputWrapper';

interface MasonContactInfoProps {
  // mason: MasonData; // Remove old type
  mason: Pick<UnifiedAttendeeData, 'primaryPhone' | 'primaryEmail' | 'contactPreference' | 'contactConfirmed'>; // Use relevant fields from UnifiedAttendeeData
  id: string;
  onChange: (id: string, field: keyof UnifiedAttendeeData, value: string | boolean) => void; // Ensure field is keyof UnifiedAttendeeData
  handlePhoneChange: (value: string) => void;
  isPrimary: boolean;
  hideContactFields: boolean;
  showConfirmation: boolean;
  getConfirmationMessage: () => string;
}

const MasonContactInfo: React.FC<MasonContactInfoProps> = ({
  mason, // Now correctly typed (partially)
  id,
  onChange,
  handlePhoneChange,
  isPrimary,
  hideContactFields,
  showConfirmation,
  getConfirmationMessage,
}) => {
  const contactOptions = ["Please Select", "Primary Attendee", "Directly", "Provide Later"];
  const [emailInteracted, setEmailInteracted] = useState(false);
  const [phoneInteracted, setPhoneInteracted] = useState(false);

  return (
    <>
      {/* Contact Section - Different for Primary vs Additional */}
      {isPrimary ? (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`phone-${id}`}>
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
                value={mason.primaryPhone ?? ''}
                onChange={(value) => handlePhoneChange(value)}
                name={`phone-${id}`}
                inputProps={{
                  id: `phone-${id}`,
                  name: `phone-${id}`
                }}
                required={true}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`email-${id}`}>
              Email Address *
            </label>
            <input
              type="email"
              id={`email-${id}`}
              name={`email-${id}`}
              value={mason.primaryEmail ?? ''}
              onChange={(e) => onChange(id, 'primaryEmail', e.target.value)}
              onBlur={() => setEmailInteracted(true)}
              required={true}
              className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50
                         ${emailInteracted ? 'interacted' : ''}
                         [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600
                         focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}

              title="Please enter a valid email address (e.g., user@example.com)"
            />
          </div>
        </div>
      ) : (
        /* Contact Preference Section for Additional Masons */
        <div className="mb-4">
          <div className="grid grid-cols-12 gap-4">
            {/* Contact dropdown */}
            <div className="col-span-4">
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`contactPreference-${id}`}>
                <span>Contact *</span>
                <span className="inline-block ml-1">
                  <div className="relative inline-block group">
                    <HelpCircle className="h-4 w-4 text-primary cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 invisible group-hover:visible bg-white text-slate-700 text-xs p-2 rounded shadow-lg w-48 z-10">
                      Select how we should contact this attendee regarding event information
                    </div>
                  </div>
                </span>
              </label>
              <select
                id={`contactPreference-${id}`}
                name={`contactPreference-${id}`}
                value={mason.contactPreference ?? 'Please Select'}
                onChange={(e) => onChange(id, 'contactPreference', e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {contactOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            {/* Confirmation checkbox - displayed instead of input fields */}
            {showConfirmation ? (
              <div className="col-span-8 flex items-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`contactConfirmed-${id}`}
                    checked={mason.contactConfirmed ?? false}
                    onChange={(e) => onChange(id, 'contactConfirmed', e.target.checked)}
                    required
                    className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                  />
                  <label htmlFor={`contactConfirmed-${id}`} className="ml-2 text-sm text-slate-700">
                    {getConfirmationMessage()} *
                  </label>
                </div>
              </div>
            ) : (
              !hideContactFields && (
                <>
                  {/* Phone input */}
                  <div className="col-span-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`phone-${id}`}>
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
                        value={mason.primaryPhone ?? ''}
                        onChange={(value) => handlePhoneChange(value)}
                        name={`phone-${id}`}
                        inputProps={{
                          id: `phone-${id}`,
                          name: `phone-${id}`
                        }}
                        required={true}
                      />
                    </div>
                  </div>
                  
                  {/* Email input */}
                  <div className="col-span-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`email-${id}`}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id={`email-${id}`}
                      name={`email-${id}`}
                      value={mason.primaryEmail ?? ''}
                      onChange={(e) => onChange(id, 'primaryEmail', e.target.value)}
                      onBlur={() => setEmailInteracted(true)}
                      required={true}
                      className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50
                                 ${emailInteracted ? 'interacted' : ''}
                                 [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600
                                 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}

                      title="Please enter a valid email address (e.g., user@example.com)"
                    />
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MasonContactInfo;