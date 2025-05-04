import React from 'react';

interface LadyPartnerToggleProps {
  hasLadyPartner: boolean;
  onToggle: () => void;
}

const LadyPartnerToggle: React.FC<LadyPartnerToggleProps> = ({
  hasLadyPartner,
  onToggle
}) => {
  return (
    <div className="mt-6 border-t border-slate-200 pt-4 flex justify-center">
      <button
        type="button"
        onClick={onToggle}
        className={`py-2 px-6 rounded-md flex items-center justify-center font-medium transition-colors ${
          hasLadyPartner 
            ? 'bg-white border-2 border-secondary text-primary' 
            : 'bg-secondary text-white'
        }`}
      >
        {hasLadyPartner ? 'Remove Lady & Partner' : 'Register Lady or Partner'}
      </button>
    </div>
  );
};

export default LadyPartnerToggle;