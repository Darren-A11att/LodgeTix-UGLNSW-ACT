import React from 'react';
import { Dialog } from '@headlessui/react';
import { AlertTriangle, Save, FilePlus } from 'lucide-react';

interface DraftRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void; // Simple close action, handled by parent?
  onContinue: () => void;
  onStartNew: () => void;
}

const DraftRecoveryModal: React.FC<DraftRecoveryModalProps> = ({
  isOpen,
  onClose, 
  onContinue,
  onStartNew,
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        {/* The actual dialog panel */}
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="w-6 h-6 text-amber-500 mr-2" />
            Incomplete Registration Found
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-600">
            You have an existing registration draft that is incomplete. 
            Would you like to continue with that registration or start a new one?
          </Dialog.Description>

          <p className="mt-4 text-xs text-gray-500">
            Starting a new registration will discard your previous draft.
          </p>

          {/* Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onStartNew}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <FilePlus className="w-4 h-4 mr-1.5" />
              Start New
            </button>
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Continue Draft
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default DraftRecoveryModal; 