import React from 'react';
import { MasonData } from '../../../shared/types/register';
import { HelpCircle } from 'lucide-react';
import PhoneInputWrapper from '../PhoneInputWrapper';

interface MasonContactInfoProps {
  mason: MasonData;
  index: number;
  onChange: (index: number, field: string, value: string | boolean) => void;
  handlePhoneChange: (value: string) => void;
  isPrimary: boolean;
  hideContactFields: boolean;
  showConfirmation: boolean;
  getConfirmationMessage: () => string;
}

const MasonContactInfo: React.FC<MasonContactInfoProps> = ({
  mason,
  index,
  onChange,
  handlePhoneChange,
  isPrimary,
  hideContactFields,
  showConfirmation,
  getConfirmationMessage
}) => {
  const contactOptions = ["Please Select", "Primary Attendee", "Directly", "Provide Later"];

  return (
    <>
      {/* Contact Section - Different for Primary vs Additional */}
      {isPrimary ? (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`phone-${index}`}>
              Mobile Number *
            </label>
            <PhoneInputWrapper
              value={mason.phone}
              onChange={handlePhoneChange}
              name={`phone-${index}`}
              inputProps={{
                id: `phone-${index}`,
                name: `phone-${index}`
              }}
              required={true}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`email-${index}`}>
              Email Address *
            </label>
            <input
              type="email"
              id={`email-${index}`}
              name={`email-${index}`}
              value={mason.email}
              onChange={(e) => onChange(index, 'email', e.target.value)}
              required={true}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      ) : (
        /* Contact Preference Section for Additional Masons */
        <div className="mb-4">
          <div className="grid grid-cols-12 gap-4">
            {/* Contact dropdown */}
            <div className="col-span-4">
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`contactPreference-${index}`}>
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
                id={`contactPreference-${index}`}
                name={`contactPreference-${index}`}
                value={mason.contactPreference ?? 'Please Select'}
                onChange={(e) => onChange(index, 'contactPreference', e.target.value)}
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
                    id={`contactConfirmed-${index}`}
                    checked={mason.contactConfirmed ?? false}
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
              !hideContactFields && (
                <>
                  {/* Phone input */}
                  <div className="col-span-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`phone-${index}`}>
                      Mobile Number *
                    </label>
                    <PhoneInputWrapper
                      value={mason.phone}
                      onChange={handlePhoneChange}
                      name={`phone-${index}`}
                      inputProps={{
                        id: `phone-${index}`,
                        name: `phone-${index}`
                      }}
                      required={true}
                    />
                  </div>
                  
                  {/* Email input */}
                  <div className="col-span-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor={`email-${index}`}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id={`email-${index}`}
                      name={`email-${index}`}
                      value={mason.email}
                      onChange={(e) => onChange(index, 'email', e.target.value)}
                      required={true}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
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