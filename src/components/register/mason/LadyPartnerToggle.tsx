import React from 'react';
import { UserPlus, UserMinus } from 'lucide-react';

interface LadyPartnerToggleProps {
  onAdd: () => void;
  onRemove: () => void;
  hasPartner: boolean;
}

const LadyPartnerToggle: React.FC<LadyPartnerToggleProps> = ({ onAdd, onRemove, hasPartner }) => {
  return (
    <div className="mt-6 mb-4">
      <hr className="border-t border-slate-300 mb-4" />
      <div className="flex justify-end">
        {hasPartner ? (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center text-sm text-red-600 hover:text-red-800"
          >
            <UserMinus className="w-4 h-4 mr-1" />
            Remove Lady/Partner
          </button>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center text-sm text-sky-600 hover:text-sky-800"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Add Lady/Partner
          </button>
        )}
      </div>
    </div>
  );
};

export default LadyPartnerToggle;