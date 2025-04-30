import React from "react";
import PhoneInput from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./PhoneInputWrapper.css"; // Import external CSS file
import { useLocationStore } from "../../store/locationStore"; // Import store

interface PhoneInputWrapperProps {
  value: string;
  onChange: (value: string) => void;
  name: string;
  isInternational?: boolean;
  className?: string;
  required?: boolean;
  inputProps?: {
    id?: string;
    name?: string;
  };
}

const PhoneInputWrapper: React.FC<PhoneInputWrapperProps> = ({
  value,
  onChange,
  name,
  isInternational = false,
  className = "",
  required = false,
  inputProps = {},
}) => {
  // Get country code from global store
  const detectedCountryCode = useLocationStore(
    (state) => state.ipData?.country_code
  );

  // Determine the country to use: detected or default 'AU'
  // Ensure it's cast to the Country type expected by PhoneInput
  const country = (detectedCountryCode?.toUpperCase() as Country) || "AU";

  // Type-safe wrapper for the onChange handler
  const handlePhoneChange = (newValue: string | undefined) => {
    onChange(newValue ?? "");
  };

  return (
    <div className={className}>
      {/* Apply specific props directly instead of spreading */}
      <PhoneInput
        international={isInternational}
        defaultCountry={country} // Use country from store or default
        value={value}
        onChange={(value) => handlePhoneChange(value ?? '')}
        className="custom-phone-input"
        name={name}
        id={inputProps.id}
      />
      {required && (
        <input
          type="hidden"
          required={required}
          value={value}
          onChange={() => {}}
        />
      )}
    </div>
  );
};

export default PhoneInputWrapper;
