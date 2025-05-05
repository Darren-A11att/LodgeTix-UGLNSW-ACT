import React from 'react';

interface GuestPartnerToggleProps {
  hasPartner: boolean;
  onToggle: () => void;
}

const GuestPartnerToggle: React.FC<GuestPartnerToggleProps> = ({
  hasPartner,
  onToggle
}) => {
  return (
    <div className="mt-6 border-t border-slate-200 pt-4 flex justify-center">
      <button
        type="button"
        onClick={onToggle}
        className={`py-2 px-6 rounded-md flex items-center justify-center font-medium transition-colors ${
          hasPartner 
            ? 'bg-white border-2 border-secondary text-primary'
            : 'btn-secondary'
        }`}
      >
        {hasPartner ? 'Remove Partner' : 'Register Partner'}
      </button>
    </div>
  );
};

export default GuestPartnerToggle;