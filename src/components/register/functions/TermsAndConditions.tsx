import React from 'react';

interface TermsAndConditionsProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ checked, onChange }) => {
  return (
    <div className="p-4">
      <label className="flex items-start space-x-2 cursor-pointer">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)}
          className="h-5 w-5 text-primary border-slate-300 rounded mt-0.5"
        />
        <div>
          <span className="text-sm font-medium text-slate-700">I agree to the Terms and Conditions</span>
          <div className="mt-3 text-xs text-slate-600 prose prose-sm max-w-none">
            <p className="mb-2">
              By registering for the Grand Proclamation event, you agree to the following terms:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All registration information provided is accurate and complete.</li>
              <li>You understand that tickets are non-refundable but may be transferable subject to approval.</li>
              <li>Photography and video recording may take place during the event and may be used for promotional purposes.</li>
              <li>The United Grand Lodge of NSW & ACT reserves the right to modify the event program if necessary.</li>
              <li>You agree to follow all venue rules and COVID-19 safety requirements in place at the time of the event.</li>
            </ul>
          </div>
        </div>
      </label>
    </div>
  );
};

export default TermsAndConditions; 