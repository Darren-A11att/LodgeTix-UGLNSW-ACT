import React from "react";
import { User, Users, Star } from "lucide-react";

interface RegistrationTypeSelectionProps {
  setRegistrationType: (type: string) => void;
  disabled?: boolean;
}

const RegistrationTypeSelection: React.FC<RegistrationTypeSelectionProps> = ({
  setRegistrationType,
  disabled,
}) => {
  const handleSelectType = (type: string) => {
    if (disabled) return;
    setRegistrationType(type);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Select Registration Type</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Myself & Others */}
        <button
          className={`border rounded-lg p-6 hover:border-primary transition-all hover:shadow-md bg-white text-left ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
          onClick={() => handleSelectType("individual")}
          aria-label="Register myself and others"
          disabled={disabled}
        >
          <div className="flex flex-col items-center text-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary">Myself & Others</h3>
            <p className="text-slate-600 mt-2">
              Register yourself and any accompanying guests for the Grand
              Proclamation events
            </p>
          </div>

          <ul className="text-sm text-slate-700 space-y-2 mb-4">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              <span>For individual Masons and their guests</span>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              <span>Register multiple Masons and guests</span>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              <span>Simple registration process</span>
            </li>
          </ul>

          <div className="w-full btn-primary mt-2 text-center">Select</div>
        </button>

        {/* Lodge Registration */}
        <div className="border rounded-lg p-6 hover:border-primary cursor-not-allowed opacity-70 transition-all bg-white">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary">
              Lodge Registration
            </h3>
            <p className="text-slate-600 mt-2">
              Register an entire Lodge for Grand Proclamation events
            </p>
          </div>

          <ul className="text-sm text-slate-700 space-y-2 mb-4">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              <span>Register your entire Lodge</span>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              <span>Bulk registration of members</span>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              <span>Special group rates available</span>
            </li>
          </ul>

          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 text-center text-sm text-yellow-800 mb-2">
            Coming Soon
          </div>
        </div>

        {/* Official Delegation */}
        <div className="border rounded-lg p-6 hover:border-primary cursor-not-allowed opacity-70 transition-all bg-white">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Star className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary">
              Official Delegation
            </h3>
            <p className="text-slate-600 mt-2">
              For official delegations from Grand Lodges
            </p>
          </div>

          <ul className="text-sm text-slate-700 space-y-2 mb-4">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              <span>For Grand Lodge officers</span>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              <span>Register entire delegation</span>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              <span>Priority seating arranged</span>
            </li>
          </ul>

          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 text-center text-sm text-yellow-800 mb-2">
            Coming Soon
          </div>
        </div>
      </div>

      <div className="text-center mt-8 p-4 bg-slate-50 rounded-md">
        <p className="text-slate-700">
          Need help with registration?{" "}
          <a href="/contact" className="text-primary font-medium">
            Contact our support team
          </a>
        </p>
      </div>
      
      {disabled && (
        <p className="text-center text-gray-500 text-sm mt-4">Loading registration data...</p>
      )}
    </div>
  );
};

export default RegistrationTypeSelection;