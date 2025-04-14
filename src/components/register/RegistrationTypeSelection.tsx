import React from 'react';
import { User, Users, Star } from 'lucide-react';

interface RegistrationTypeSelectionProps {
  setRegistrationType: (type: string) => void;
  nextStep: () => void;
}

const RegistrationTypeSelection: React.FC<RegistrationTypeSelectionProps> = ({
  setRegistrationType,
  nextStep
}) => {
  // Modified to only call setRegistrationType which already sets the step to 2
  const handleSelectType = (type: string) => {
    setRegistrationType(type);
    // nextStep removed to prevent double advancing
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Select Registration Type</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Myself & Others */}
        <div 
          className="border rounded-lg p-6 hover:border-primary cursor-pointer transition-all hover:shadow-md bg-white"
          onClick={() => handleSelectType('individual')}
        >
          <div className="flex flex-col items-center text-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary">Myself & Others</h3>
            <p className="text-slate-600 mt-2">
              Register yourself and any accompanying guests for the Grand Installation events
            </p>
          </div>
          
          <ul className="text-sm text-slate-700 space-y-2 mb-4">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              For individual Masons and their guests
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              Register multiple Masons and guests
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              Simple registration process
            </li>
          </ul>
          
          <button
            onClick={() => handleSelectType('individual')}
            className="w-full btn-primary mt-2"
          >
            Select
          </button>
        </div>
        
        {/* Lodge Registration */}
        <div className="border rounded-lg p-6 hover:border-primary cursor-not-allowed opacity-70 transition-all bg-white">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-primary">Lodge Registration</h3>
            <p className="text-slate-600 mt-2">
              Register an entire Lodge for Grand Installation events
            </p>
          </div>
          
          <ul className="text-sm text-slate-700 space-y-2 mb-4">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              Register your entire Lodge
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              Bulk registration of members
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              Special group rates available
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
            <h3 className="text-xl font-bold text-primary">Official Delegation</h3>
            <p className="text-slate-600 mt-2">
              For official delegations from Grand Lodges
            </p>
          </div>
          
          <ul className="text-sm text-slate-700 space-y-2 mb-4">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              For Grand Lodge officers
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              Register entire delegation
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              Priority seating arranged
            </li>
          </ul>
          
          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 text-center text-sm text-yellow-800 mb-2">
            Coming Soon
          </div>
        </div>
      </div>
      
      <div className="text-center mt-8 p-4 bg-slate-50 rounded-md">
        <p className="text-slate-700">
          Need help with registration? <a href="/contact" className="text-primary font-medium">Contact our support team</a>
        </p>
      </div>
    </div>
  );
};

export default RegistrationTypeSelection;