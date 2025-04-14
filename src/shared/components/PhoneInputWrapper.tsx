import React, { useState, useEffect, useRef } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

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
  const [userCountry, setUserCountry] = useState('au'); // Default to Australia
  const inputRef = useRef<any>(null);
  
  // Detect user's country based on IP address
  useEffect(() => {
    const fetchUserCountry = async () => {
      try {
        // Set a timeout for the fetch operation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout
        
        const response = await fetch('https://ipapi.co/json/', { 
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.country_code) {
            setUserCountry(data.country_code.toLowerCase());
          }
        }
      } catch (error) {
        // Silently handle the error - just use the default country
        console.warn('Country detection failed, using default country (au):', error);
        // No need to set userCountry again since we already defaulted it to 'au'
      }
    };

    fetchUserCountry().catch(() => {
      // Fallback error handler - just to be safe
      // Default is already set to 'au' so this is just for logging
      console.warn('Additional error handling: Using default country (au)');
    });
  }, []);
  
  // Format Australian mobile for display (04XX XXX XXX)
  const formatAustralianMobileForDisplay = (value: string): string => {
    // If it's already in national format (starting with 0)
    if (value.startsWith('0') && value.length > 1) {
      const digitsOnly = value.replace(/\D/g, '');
      
      // Format as 04XX XXX XXX
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
    
    // If it's in international format (61...)
    if (value.startsWith('61') && value.length > 2 && value.charAt(2) === '4') {
      // Convert to national format with leading 0
      return formatAustralianMobileForDisplay(`0${value.substring(2)}`);
    }
    
    return value;
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
  const handleChange = (inputValue: string, country: any) => {
    // Skip empty values
    if (!inputValue) {
      onChange('');
      setIsValid(true);
      setHelperText('');
      return;
    }
    
    // Store in international format
    const storageValue = formatForStorage(inputValue);
    
    // Validate the number
    const valid = validateAustralianMobile(storageValue);
    setIsValid(valid);
    
    // Set the storage value
    onChange(storageValue);
    
    // Update display format for Australian mobiles
    if (storageValue.startsWith('61') && storageValue.length > 2 && storageValue.charAt(2) === '4') {
      const displayValue = formatAustralianMobileForDisplay(storageValue);
      
      // Use setTimeout to let the component update first
      setTimeout(() => {
        if (inputRef.current?.numberInputElement) {
          inputRef.current.numberInputElement.value = displayValue;
        }
      }, 0);
      
      // Set helper text
      setHelperText(formatInternational(storageValue));
    } else {
      // For non-Australian numbers
      setHelperText(formatInternational(storageValue));
    }
  };

  // Update helper text and validation when value changes externally
  useEffect(() => {
    if (value) {
      setIsValid(validateAustralianMobile(value));
      setHelperText(formatInternational(value));
      
      // Update display for Australian mobiles
      if (value.startsWith('61') && value.length > 2 && value.charAt(2) === '4' && inputRef.current?.numberInputElement) {
        const displayValue = formatAustralianMobileForDisplay(value);
        inputRef.current.numberInputElement.value = displayValue;
      }
    } else {
      setIsValid(!required);
      setHelperText('');
    }
  }, [value, required]);

  return (
    <div className="relative">
      <PhoneInput
        country={userCountry}
        value={value}
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
        ref={inputRef}
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