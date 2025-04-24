import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./PhoneInputWrapper.css"; // Import external CSS file

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
  const [userCountry, setUserCountry] = useState<Country>("AU"); // Default to Australia

  // Detect user's country based on IP address
  useEffect(() => {
    const fetchUserCountry = async () => {
      try {
        // Set a timeout for the fetch operation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout

        const response = await fetch("https://ipapi.co/json/", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.country_code) {
            setUserCountry(data.country_code.toUpperCase() as Country);
          }
        }
      } catch (error) {
        // Silently handle the error - just use the default country
        console.warn(
          "Country detection failed, using default country (AU):",
          error,
        );
      }
    };

    fetchUserCountry().catch((error) => {
      console.warn(
        "Additional error handling: Using default country (AU)",
        error,
      );
    });
  }, []);

  // Type-safe wrapper for the onChange handler
  const handlePhoneChange = (newValue: string | undefined) => {
    onChange(newValue ?? "");
  };

  return (
    <div className={className}>
      {/* Apply specific props directly instead of spreading */}
      <PhoneInput
        international={isInternational}
        defaultCountry={userCountry}
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
