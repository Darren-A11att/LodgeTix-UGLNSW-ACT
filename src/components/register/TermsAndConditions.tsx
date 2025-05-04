import React from 'react';

interface TermsAndConditionsProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ checked, onChange }) => {
  // Basic structure matching usage in AttendeeDetails
  return (
    <div>
      <label className="flex items-center space-x-2 cursor-pointer">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)}
          className="form-checkbox h-4 w-4 text-primary focus:ring-primary-dark border-gray-300 rounded"
        />
        <span className="text-sm text-gray-700">I agree to the Terms and Conditions</span>
      </label>
      {/* Optional: Add a link to view full terms */}
      {/* <button type="button" className="text-sm text-blue-600 hover:underline ml-6">View Terms</button> */}
      
      {/* Placeholder for full terms content (could be shown in a modal) */}
      <div className="mt-3 text-xs text-gray-500 prose prose-sm max-w-none">
        <p>
          By registering for the Grand Proclamation event, you agree to the following terms:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>All registration information provided is accurate and complete.</li>
          <li>You understand that tickets are non-refundable but may be transferable subject to approval.</li>
          <li>Photography and video recording may take place during the event and may be used for promotional purposes.</li>
          <li>The United Grand Lodge of NSW & ACT reserves the right to modify the event program if necessary.</li>
          <li>You agree to follow all venue rules and COVID-19 safety requirements in place at the time of the event.</li>
        </ul>
      </div>
    </div>
  );
};

export default TermsAndConditions; 