import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { useLocationStore } from '../../store/locationStore'; // Corrected path
import type { LocationState } from '../../store/locationStore'; // Import state type

interface PhoneInputWrapperProps {
  value: string;
  onChange: (value: string) => void;
  inputProps?: any;
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
  const [displayValue, setDisplayValue] = useState('');

  // Get country code from global store
  const detectedCountryCode = useLocationStore(
    (state: LocationState) => state.ipData?.country_code // Added type for state
  );

  // Determine the country to use: detected or default 'au' (lowercase for react-phone-input-2)
  const country = detectedCountryCode?.toLowerCase() || 'au';
  
  // Initialize display value and validation on mount/external value change
  useEffect(() => {
    const storageValue = formatForStorage(value); // Use the prop value
    const valid = validateAustralianMobile(storageValue);
    setIsValid(valid);
    setHelperText(formatInternational(storageValue));

    // Set initial display value
    if (storageValue.startsWith('61') && storageValue.length > 2 && storageValue.charAt(2) === '4') {
      setDisplayValue(formatAustralianMobileForDisplay(storageValue));
    } else {
      // For non-Australian or incomplete numbers, display the raw input for better UX
      // Or use the storageValue if value prop might be formatted differently
      setDisplayValue(value); // Or potentially formatForStorage(value) depending on expected `value` prop format
    }

  }, [value, required]); // Rerun when external value changes

  // Format Australian mobile for display (04XX XXX XXX)
  const formatAustralianMobileForDisplay = (numberValue: string): string => {
    // Expects international format (61...) input
    if (numberValue.startsWith('61') && numberValue.length > 2 && numberValue.charAt(2) === '4') {
      const nationalPart = numberValue.substring(2);
      const digitsOnly = nationalPart.replace(/\D/g, '');

      // Format as 04XX XXX XXX
      if (digitsOnly.length >= 2) { // Start with 04
        let formatted = '0' + digitsOnly.substring(0, 2);
        if (digitsOnly.length >= 5) {
          formatted += ' ' + digitsOnly.substring(2, 5);
          if (digitsOnly.length >= 8) {
            formatted += ' ' + digitsOnly.substring(5, 8);
          } else {
            formatted += ' ' + digitsOnly.substring(5);
          }
        } else {
          formatted += ' ' + digitsOnly.substring(2);
        }
        return formatted;
      }
      return '0' + digitsOnly; // Fallback if less than 2 digits after 61
    }
    return numberValue; // Return as is if not Australian mobile
  };

  // Format to international format for storage
  const formatForStorage = (value: string): string => {
    // If empty, return empty
    if (!value) return '';
    
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    
    // If starting with 0 and followed by 4 (Australian mobile)
    if (digitsOnly.startsWith('04')) {
      // Convert to international format (61...)
      return `61${digitsOnly.substring(1)}`;
    }
    
    // If already in international format
    if (digitsOnly.startsWith('61') && digitsOnly.length > 2 && digitsOnly.charAt(2) === '4') {
      return digitsOnly;
    }
    
    // For other numbers, return as is
    return digitsOnly;
  };

  // Validate Australian mobile number
  const validateAustralianMobile = (value: string): boolean => {
    if (!value) return !required; // Empty is valid (unless required, but that's handled by form validation)
    
    const normalized = formatForStorage(value);
    
    // Check if it's an Australian mobile number
    if (normalized.startsWith('61') && normalized.length > 2 && normalized.charAt(2) === '4') {
      // Australian mobiles should be exactly 11 digits in international format
      return normalized.length === 11;
    }
    
    // For non-Australian mobile numbers, use libphonenumber-js validation
    try {
      return isValidPhoneNumber(`+${normalized}`);
    } catch (e) {
      return false;
    }
  };

  // Format for helper text display (international format with +)
  const formatInternational = (value: string): string => {
    if (!value) return '';
    
    const normalized = formatForStorage(value);
    
    // For Australian mobiles, format nicely
    if (normalized.startsWith('61') && normalized.length > 2 && normalized.charAt(2) === '4') {
      return `+61 4${normalized.substring(3, 6)} ${normalized.substring(6)}`;
    }
    
    // For other numbers, use libphonenumber-js if possible
    try {
      const phoneNumber = parsePhoneNumber(`+${normalized}`);
      if (phoneNumber) {
        return phoneNumber.formatInternational();
      }
    } catch (e) {
      // Fallback if parsing fails
    }
    
    // Simple fallback
    return `+${normalized}`;
  };

  // Handle input change
  const handleChange = (rawInputValue: string, countryData: any, event: React.ChangeEvent<HTMLInputElement>) => {
    const currentInputVal = event.target.value; // Use the direct input value for display state
    setDisplayValue(currentInputVal);

    // Determine the value to store (international format)
    // react-phone-input-2 usually provides the full number including dial code in rawInputValue
    const storageValue = formatForStorage(rawInputValue); 

    // Validate the number
    const valid = validateAustralianMobile(storageValue);
    setIsValid(valid);
    setHelperText(formatInternational(storageValue));

    // Call the parent onChange with the standardized international format
    onChange(storageValue);
  };

  return (
    <div className="relative">
      <PhoneInput
        country={country}
        value={displayValue}
        onChange={handleChange}
        inputClass="form-control"
        containerClass={`w-full ${className}`}
        inputProps={{
          required,
          ...inputProps,
          className: "w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        }}
        enableSearch={true}
        autoFormat={false}
        disableSearchIcon={true}
        countryCodeEditable={false}
        buttonStyle={{ 
          border: '1px solid rgb(203 213 225)', 
          borderRight: 'none',
          borderTopLeftRadius: '0.375rem', 
          borderBottomLeftRadius: '0.375rem',
          backgroundColor: 'white'
        }}
        dropdownStyle={{
          border: '1px solid rgb(203 213 225)',
          borderRadius: '0.375rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        }}
        searchStyle={{
          padding: '10px',
          borderBottom: '1px solid rgb(203 213 225)'
        }}
        specialLabel={''}
        placeholder="04XX XXX XXX"
        masks={{au: '.... ... ...'}}
      />
      
      {/* Helper text showing the international format */}
      {helperText && (
        <div className="mt-1 text-xs text-slate-500 pl-12">
          {isValid ? 'Format: ' : 'Invalid format: '}{helperText}
        </div>
      )}
      
      {/* Error message for invalid Australian mobile */}
      {!isValid && value && value.startsWith('61') && value.length > 2 && value.charAt(2) === '4' && (
        <div className="mt-1 text-xs text-red-500 pl-12">
          Australian mobile numbers must be exactly 10 digits (04XX XXX XXX)
        </div>
      )}
      
      {/* Success indicator for valid numbers */}
      {isValid && value && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default PhoneInputWrapper;