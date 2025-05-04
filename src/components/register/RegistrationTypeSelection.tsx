import React from "react";
import { User, Users, Star } from "lucide-react";

interface RegistrationTypeSelectionProps {
  setRegistrationType: (type: string) => void;
}

const RegistrationTypeSelection: React.FC<RegistrationTypeSelectionProps> = ({
  setRegistrationType,
}) => {
  const handleSelectType = (type: string) => {
    setRegistrationType(type);
  };

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-6">Select Registration Type</h2>

      {/* Mobile View - Only visible on small screens */}
      <div className="space-y-3 mb-4 sm:hidden">
        {/* Myself & Others - Mobile */}
        <div className="w-full border rounded-lg p-3 text-left flex border-primary bg-primary/5">
          <div className="pr-3 pt-1">
            <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-primary mb-1.5">Myself & Others</h3>
            <ul className="text-xs text-slate-700 space-y-1.5">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5 mt-1 flex-shrink-0"></span>
                <span>For individual Masons and their guests</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5 mt-1 flex-shrink-0"></span>
                <span>Register multiple Masons and guests</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5 mt-1 flex-shrink-0"></span>
                <span>Simple registration process</span>
              </li>
            </ul>
            
            <button
              className="mt-3 w-full text-center py-2 px-4 bg-primary text-white text-sm font-medium rounded"
              onClick={() => handleSelectType("individual")}
              aria-label="Register as Myself & Others"
            >
              Register
            </button>
          </div>
        </div>
        
        {/* Lodge Registration - Mobile */}
        <div className="w-full border rounded-lg p-3 text-left flex opacity-70">
          <div className="pr-3 pt-1">
            <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-primary mb-1.5">Lodge Registration</h3>
            <ul className="text-xs text-slate-700 space-y-1.5">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5 mt-1 flex-shrink-0"></span>
                <span>Register your entire Lodge</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5 mt-1 flex-shrink-0"></span>
                <span>Bulk registration of members</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5 mt-1 flex-shrink-0"></span>
                <span>Special group rates available</span>
              </li>
            </ul>
            
            <div className="mt-3 text-center py-2 px-4 bg-yellow-50 text-yellow-800 text-xs border border-yellow-100 rounded cursor-not-allowed">
              Coming Soon
            </div>
          </div>
        </div>
        
        {/* Official Delegation - Mobile */}
        <div className="w-full border rounded-lg p-3 text-left flex opacity-70">
          <div className="pr-3 pt-1">
            <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
              <Star className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-primary mb-1.5">Official Delegation</h3>
            <ul className="text-xs text-slate-700 space-y-1.5">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5 mt-1 flex-shrink-0"></span>
                <span>For Sister Grand Lodge Delegations</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5 mt-1 flex-shrink-0"></span>
                <span>Appended & Other Masonic Orders</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5 mt-1 flex-shrink-0"></span>
                <span>Register entire delegation</span>
              </li>
            </ul>
            
            <div className="mt-3 text-center py-2 px-4 bg-yellow-50 text-yellow-800 text-xs border border-yellow-100 rounded cursor-not-allowed">
              Coming Soon
            </div>
          </div>
        </div>
      </div>

      {/* Desktop View - Only visible on medium screens and larger */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-6 mb-8">
        {/* Myself & Others - Desktop */}
        <button
          className="border rounded-lg p-6 hover:border-primary transition-all hover:shadow-md bg-white text-left"
          onClick={() => handleSelectType("individual")}
          aria-label="Register myself and others"
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

        {/* Lodge Registration - Desktop */}
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

        {/* Official Delegation - Desktop */}
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
              <span>For Sister Grand Lodge Delegations</span>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              <span>Appended & Other Masonic Orders</span>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              <span>Register entire delegation</span>
            </li>
          </ul>

          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 text-center text-sm text-yellow-800 mb-2">
            Coming Soon
          </div>
        </div>
      </div>

      <div className="text-center mt-4 sm:mt-8 p-3 sm:p-4 bg-slate-50 rounded-md">
        <p className="text-slate-700 text-sm sm:text-base">
          Need help?{" "}
          <a href="/contact" className="text-primary font-medium">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegistrationTypeSelection;