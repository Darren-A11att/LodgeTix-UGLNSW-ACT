import React from 'react';

interface GuestPartnerToggleProps {
  onAdd: () => void;
}

const GuestPartnerToggle: React.FC<GuestPartnerToggleProps> = ({
  onAdd,
}) => {
  return (
    <div className="mb-6 flex justify-center">
      <button
        type="button"
        onClick={onAdd}
        className="py-2 px-6 rounded-md flex items-center justify-center font-medium transition-colors bg-secondary text-white hover:bg-secondary/90"
      >
        Register Partner
      </button>
    </div>
  );
};

export default GuestPartnerToggle;