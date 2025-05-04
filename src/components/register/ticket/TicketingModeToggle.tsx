import React from 'react';

interface TicketingModeToggleProps {
  useUniformTicketing: boolean;
  toggleUniformTicketing: (enabled: boolean) => void;
}

const TicketingModeToggle: React.FC<TicketingModeToggleProps> = ({
  useUniformTicketing,
  toggleUniformTicketing
}) => {
  // When changing modes, ensure we prevent redirects
  const handleToggle = (useUniform: boolean) => {
    // Ensure redirect prevention is active
    localStorage.setItem('lodgetix_bypass_no_redirect', 'true');
    localStorage.setItem('lodgetix_disable_expiry', 'true');
    
    // Forward the toggle call
    toggleUniformTicketing(useUniform);
  };
  
  return (
    <div className="bg-slate-100 p-4 rounded-lg mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h3 className="font-bold mb-2">Ticket Selection Mode</h3>
          <p className="text-sm text-slate-600 mb-4 sm:mb-0">Choose how you want to select tickets for your attendees</p>
        </div>
        
        <div className="flex">
          <button 
            type="button"
            onClick={() => handleToggle(true)}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              useUniformTicketing 
                ? 'bg-primary text-white' 
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Same Tickets for All
          </button>
          <button 
            type="button"
            onClick={() => handleToggle(false)}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              !useUniformTicketing 
                ? 'bg-primary text-white' 
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Individual Tickets
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketingModeToggle;