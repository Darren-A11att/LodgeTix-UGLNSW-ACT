import React, { useState, useEffect, useRef, InputHTMLAttributes, useCallback } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';

interface PhoneInputWrapperProps {
  value: string;
  onChange: (value: string) => void;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  className?: string;
  required?: boolean;
}

const PhoneInputWrapper: React.FC<PhoneInputWrapperProps> = ({
  value,
  onChange,
  inputProps = {},
  className = '',
  required = false
}) => {
  const [isValid, setIsValid] = useState(true);
  const [helperText, setHelperText] = useState('');
  const [userCountry, setUserCountry] = useState('au'); // Default to Australia
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputRef = useRef<any>(null); // Use any to allow access to .numberInputElement

  // Detect user's country based on IP address
  useEffect(() => {
    const fetchUserCountry = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          if (data.country_code) {
            setUserCountry(data.country_code.toLowerCase());
          }
        }
      } catch (error) {
        console.warn('Country detection failed, using default country (au):', error);
      }
    };
    fetchUserCountry().catch(() => {
      console.warn('Additional error handling: Using default country (au)');
    });
  }, []); // Run only once on mount

  // Format Australian mobile for display (04XX XXX XXX)
  const formatAustralianMobileForDisplay = useCallback((val: string): string => {
    if (val.startsWith('0') && val.length > 1) {
      const digitsOnly = val.replace(/\D/g, '');
      if (digitsOnly.length >= 4) {
        let formatted = digitsOnly.substring(0, 4);
        if (digitsOnly.length >= 7) {
          formatted += ' ' + digitsOnly.substring(4, 7);
          if (digitsOnly.length >= 10) {
            formatted += ' ' + digitsOnly.substring(7, 10);
          } else {
            formatted += ' ' + digitsOnly.substring(7);
          }
        } else {
          formatted += ' ' + digitsOnly.substring(4);
        }
        return formatted;
      }
      return digitsOnly;
    }
    if (val.startsWith('61') && val.length > 2 && val.charAt(2) === '4') {
      return formatAustralianMobileForDisplay(`0${val.substring(2)}`);
    }
    return val;
  }, []); // Memoized, no dependencies

  // Format to international format for storage
  const formatForStorage = useCallback((val: string): string => {
    if (!val) return '';
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.startsWith('04')) {
      return `61${digitsOnly.substring(1)}`;
    }
    if (digitsOnly.startsWith('61') && digitsOnly.length > 2 && digitsOnly.charAt(2) === '4') {
      return digitsOnly;
    }
    return digitsOnly;
  }, []); // Memoized, no dependencies

  // Validate phone number
  const validatePhoneNumber = useCallback((val: string): boolean => {
    if (!val) return !required; // Empty is valid unless required
    const normalized = formatForStorage(val);
    try {
        // Use isValidPhoneNumber from libphonenumber-js
        // Pass the country code derived from the normalized number if possible, or undefined
        const countryCode = normalized.startsWith('61') ? 'AU' : undefined;
        return isValidPhoneNumber(`+${normalized}`, countryCode);
    } catch {
      return false;
    }
  }, [required, formatForStorage]); // Depends on required prop and formatForStorage

  // Format for helper text display (international format with +)
  const formatInternational = useCallback((val: string): string => {
    if (!val) return '';
    const normalized = formatForStorage(val);
    try {
      const phoneNumber = parsePhoneNumberFromString(`+${normalized}`);
      if (phoneNumber) {
        return phoneNumber.formatInternational();
      }
    } catch {
      // Fallback if parsing fails
    }
    return `+${normalized}`; // Simple fallback
  }, [formatForStorage]); // Depends on formatForStorage

  // Handle input change
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const handleChange = (inputValue: string, _country: any) => {
    if (!inputValue) {
      onChange('');
      setIsValid(true);
      setHelperText('');
      return;
    }
    const storageValue = formatForStorage(inputValue);
    const valid = validatePhoneNumber(storageValue); // Use updated validation function
    setIsValid(valid);
    onChange(storageValue); // Report storage value

    // Update display format for Australian mobiles (workaround)
    if (storageValue.startsWith('61') && storageValue.length > 2 && storageValue.charAt(2) === '4') {
      const displayValue = formatAustralianMobileForDisplay(storageValue);
      setTimeout(() => {
        if (inputRef.current?.numberInputElement) {
          // NOTE: Direct DOM manipulation workaround
          inputRef.current.numberInputElement.value = displayValue;
        }
      }, 0);
      setHelperText(formatInternational(storageValue));
    } else {
      setHelperText(formatInternational(storageValue));
    }
  };

  // Update helper text and validation when value changes externally
  useEffect(() => {
    if (value) {
      setIsValid(validatePhoneNumber(value)); // Use updated validation function
      setHelperText(formatInternational(value));
      // Update display for Australian mobiles (workaround)
      if (value.startsWith('61') && value.length > 2 && value.charAt(2) === '4' && inputRef.current?.numberInputElement) {
        const displayValue = formatAustralianMobileForDisplay(value);
        // NOTE: See comment in handleChange for explanation of direct DOM update.
        inputRef.current.numberInputElement.value = displayValue;
      }
    } else {
      setIsValid(!required); // Valid if empty and not required
      setHelperText('');
    }
  // Add memoized functions to dependency array
  }, [value, required, validatePhoneNumber, formatInternational, formatAustralianMobileForDisplay]);

  return (
    <div className="relative">
      <PhoneInput
        country={userCountry}
        value={value} // Controlled by parent state (should be 61...)
        onChange={handleChange}
        inputClass="form-control" // Base styling
        containerClass={`w-full ${className}`} // Container styling
        inputProps={{ // Props passed to the underlying <input>
          required,
          ...inputProps, // Allow overriding/adding props
          // Combine base class with any passed inputProps className
          className: `w-full h-11 px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${inputProps?.className ?? ''}`,
          ref: inputRef // Pass the ref here
        }}
        enableSearch={true} // Allow searching for countries
        autoFormat={false} // Disable library's auto-formatting to use our own
        disableSearchIcon={true} // Hide default search icon
        countryCodeEditable={false} // Don't allow editing country code directly
        buttonStyle={{ // Style for the country dropdown button
          border: '1px solid rgb(203 213 225)',
          borderRight: 'none',
          borderTopLeftRadius: '0.375rem',
          borderBottomLeftRadius: '0.375rem',
          backgroundColor: 'white'
        }}
        dropdownStyle={{ // Style for the dropdown menu
          border: '1px solid rgb(203 213 225)',
          borderRadius: '0.375rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        }}
        searchStyle={{ // Style for the search input within dropdown
          padding: '10px',
          borderBottom: '1px solid rgb(203 213 225)'
        }}
        specialLabel={''} // Remove default label
        placeholder="04XX XXX XXX" // Placeholder specific to AU format
        masks={{au: '.... ... ...'}} // Input mask for Australia
      />

      {/* Helper text showing the international format */}
      {helperText && (
        <div className="mt-1 text-xs text-slate-500 pl-12"> {/* Adjusted padding */}
          {isValid ? 'Format: ' : 'Invalid number: '} {helperText}
        </div>
      )}

      {/* Specific error message for invalid numbers */}
      {!isValid && value && ( // Show only if invalid and not empty
          <div className="mt-1 text-xs text-red-500 pl-12"> {/* Adjusted padding */}
              Please enter a valid phone number.
          </div>
      )}

      {/* Success indicator for valid numbers */}
      {isValid && value && ( // Show only if valid and not empty
        <div className="absolute right-3 top-1/2 -translate-y-1/2 transform text-green-500 pointer-events-none"> {/* Position checkmark */}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default PhoneInputWrapper;