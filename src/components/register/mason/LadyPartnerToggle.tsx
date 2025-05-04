import React from 'react';

interface LadyPartnerToggleProps {
  // hasLadyPartner: boolean; // Keep removed prop comment
  // onToggle: () => void; // Keep removed prop comment
  onAdd: () => void;
  // attendeeName: string; // Remove this prop
}

const LadyPartnerToggle: React.FC<LadyPartnerToggleProps> = ({
  // hasLadyPartner, // Keep removed prop comment
  // onToggle // Keep removed prop comment
  onAdd,
  // attendeeName // Remove this prop
}) => {
  return (
    <div className="mb-6 flex justify-center">
      <button
        type="button"
        onClick={onAdd} // Use onAdd
        // Apply consistent styling for an 'Add' button
        className="py-2 px-6 rounded-md flex items-center justify-center font-medium transition-colors bg-secondary text-white hover:bg-secondary/90"
      >
        {/* Revert button text */}
        Register Lady or Partner
      </button>
    </div>
  );
};

export default LadyPartnerToggle;