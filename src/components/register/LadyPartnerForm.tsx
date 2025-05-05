import React, { useState } from 'react';
import "react-phone-input-2/lib/style.css";
import { LadyPartnerData, MasonData } from "../../shared/types/register";
import { HelpCircle, X } from "lucide-react";
import PhoneInputWrapper from "./PhoneInputWrapper";

interface LadyPartnerFormProps {
  partner: LadyPartnerData;
  id: string;
  updateField: (id: string, field: string, value: string | boolean) => void;
  relatedMasonName: string;
  onRemove?: () => void;
}

const LadyPartnerForm: React.FC<LadyPartnerFormProps> = ({
  partner,
  id,
  updateField,
  relatedMasonName,
  onRemove,
}) => {
  const titles = [
    "Mrs",
    "Ms",
    "Miss",
    "Dr",
    "Rev",
    "Prof",
    "Hon",
    "Lady",
    "Madam",
    "Dame",
  ];
  const relationships = ["Wife", "Partner", "Fiancée", "Husband", "Fiancé"];

  // Determine available contact options
  const contactOptions = ["Please Select", "Directly", "PrimaryAttendee", "Mason", "ProvideLater"];

  // Interaction states
  const [relationshipInteracted, setRelationshipInteracted] = useState(false);
  const [titleInteracted, setTitleInteracted] = useState(false);
  const [firstNameInteracted, setFirstNameInteracted] = useState(false);
  const [lastNameInteracted, setLastNameInteracted] = useState(false);
  const [contactPreferenceInteracted, setContactPreferenceInteracted] = useState(false);
  const [phoneInteracted, setPhoneInteracted] = useState(false);
  const [emailInteracted, setEmailInteracted] = useState(false);

  const handlePhoneChange = (value: string) => {
    updateField(id, "phone", value);
  };

  const showContactFields = partner.contactPreference === "Directly";
  const showConfirmation =
    partner.contactPreference !== "Directly" &&
    partner.contactPreference !== "" &&
    partner.contactPreference !== "Please Select";

  // Generate dynamic confirmation message
  const getConfirmationMessage = () => {
    if (partner.contactPreference === "Mason") {
      return `I confirm that ${relatedMasonName} will be responsible for all communication with this attendee`;
    }
    if (partner.contactPreference === "PrimaryAttendee") {
      return `I confirm that the primary contact will be responsible for all communication with this attendee`;
    }
    if (partner.contactPreference === "ProvideLater") {
      return `I confirm that the primary contact will be responsible for all communication with this attendee until their contact details have been updated in their profile`;
    }
    return "";
  };

  return (
    <div className="border-t border-slate-200 pt-6 mt-6 relative">
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
        Lady & Partner Details
      </h4>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-2">
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor={`relationship-${id}`}
          >
            Relationship *
          </label>
          <select
            id={`relationship-${id}`}
            name={`relationship-${id}`}
            value={partner.relationship}
            onChange={(e) => updateField(id, "relationship", e.target.value)}
            onBlur={() => setRelationshipInteracted(true)}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${relationshipInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          >
            <option value="" disabled>Please Select</option>
            {relationships.map((rel) => (
              <option key={rel} value={rel}>
                {rel}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor={`ladyTitle-${id}`}
          >
            Title *
          </label>
          <select
            id={`ladyTitle-${id}`}
            name={`ladyTitle-${id}`}
            value={partner.title}
            onChange={(e) => updateField(id, "title", e.target.value)}
            onBlur={() => setTitleInteracted(true)}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${titleInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          >
            <option value="" disabled>Please Select</option>
            {titles.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-4">
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor={`ladyFirstName-${id}`}
          >
            First Name *
          </label>
          <input
            type="text"
            id={`ladyFirstName-${id}`}
            name={`ladyFirstName-${id}`}
            value={partner.firstName}
            onChange={(e) => updateField(id, "firstName", e.target.value)}
            onBlur={() => setFirstNameInteracted(true)}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${firstNameInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                       focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          />
        </div>

        <div className="col-span-4">
          <label
            className="block text-sm font-medium text-slate-700 mb-1"
            htmlFor={`ladyLastName-${id}`}
          >
            Last Name *
          </label>
          <input
            type="text"
            id={`ladyLastName-${id}`}
            name={`ladyLastName-${id}`}
            value={partner.lastName}
            onChange={(e) => updateField(id, "lastName", e.target.value)}
            onBlur={() => setLastNameInteracted(true)}
            required
            className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                       ${lastNameInteracted ? 'interacted' : ''} 
                       [&.interacted:invalid]:border-red-500 [&.interacted:invalid]:text-red-600 
                       focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
          />
        </div>
      </div>

      <div className="mb-3">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <label
              className="block text-sm font-medium text-slate-700 mb-1"
              htmlFor={`contactPreference-${id}`}
            >
              Contact *{" "}
              <span className="inline-block ml-1">
                <div className="relative inline-block group">
                  <HelpCircle className="h-4 w-4 text-primary cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 invisible group-hover:visible bg-white text-slate-700 text-xs p-2 rounded shadow-lg w-48 z-10">
                    Where necessary we'd like to communicate with your Lady or
                    Partner directly about events which they are registered for
                  </div>
                </div>
              </span>
            </label>
            <select
              id={`contactPreference-${id}`}
              name={`contactPreference-${id}`}
              value={partner.contactPreference}
              onChange={(e) =>
                updateField(id, "contactPreference", e.target.value)
              }
              onBlur={() => setContactPreferenceInteracted(true)}
              required
              className={`w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 
                         ${contactPreferenceInteracted ? 'interacted' : ''} 
                         [&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:border-red-500 focus:[&.interacted:invalid]:ring-red-500`}
            >
              {contactOptions.map((option) => (
                <option key={option} value={option === 'Please Select' ? '' : option} disabled={option === 'Please Select'}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {showConfirmation ? (
            <div className="col-span-8 flex items-center">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`contactConfirmed-${id}`}
                  checked={partner.contactConfirmed}
                  onChange={(e) =>
                    updateField(id, "contactConfirmed", e.target.checked)
                  }
                  required
                  className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                />
                <label
                  htmlFor={`contactConfirmed-${id}`}
                  className="ml-2 text-sm text-slate-700"
                >
                  {getConfirmationMessage()} *
                </label>
              </div>
            </div>
          ) : (
            showContactFields && (
              <>
                <div className="col-span-4">
                  <label
                    className="block text-sm font-medium text-slate-700 mb-1"
                    htmlFor={`ladyPhone-${id}`}
                  >
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
                      value={partner.phone}
                      onChange={handlePhoneChange}
                      name={`ladyPhone-${id}`}
                      inputProps={{
                        id: `ladyPhone-${id}`,
                        name: `ladyPhone-${id}`,
                      }}
                      required={true}
                    />
                   </div>
                </div>

                <div className="col-span-5">
                  <label
                    className="block text-sm font-medium text-slate-700 mb-1"
                    htmlFor={`ladyEmail-${id}`}
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id={`ladyEmail-${id}`}
                    name={`ladyEmail-${id}`}
                    value={partner.email}
                    onChange={(e) =>
                      updateField(id, "email", e.target.value)
                    }
                    onBlur={() => setEmailInteracted(true)}
                    required
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

      <div className="mb-4">
        <label
          className="block text-sm font-medium text-slate-700 mb-1"
          htmlFor={`ladyDietary-${id}`}
        >
          Dietary Requirements
        </label>
        <input
          type="text"
          id={`ladyDietary-${id}`}
          name={`ladyDietary-${id}`}
          value={partner.dietary}
          onChange={(e) => updateField(id, "dietary", e.target.value)}
          placeholder="E.g., vegetarian, gluten-free, allergies"
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-700 mb-1"
          htmlFor={`ladySpecialNeeds-${id}`}
        >
          Special Needs or Accessibility Requirements
        </label>
        <textarea
          id={`ladySpecialNeeds-${id}`}
          name={`ladySpecialNeeds-${id}`}
          value={partner.specialNeeds}
          onChange={(e) => updateField(id, "specialNeeds", e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        ></textarea>
      </div>
    </div>
  );
};

export default LadyPartnerForm;
