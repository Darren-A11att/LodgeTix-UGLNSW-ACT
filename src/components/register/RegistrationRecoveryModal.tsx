import React from 'react';
import { RegistrationProgress, getStepName } from '../../lib/registrationProgressTracker';
import { X, UserCircle, Calendar, AlarmClock, Users } from 'lucide-react';
import { formatDateTime } from '../../lib/formatters';

interface RegistrationRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  registrationType: string;
  progressData: RegistrationProgress | null;
  onStartNew: () => void;
  onEditAttendees: () => void;
  onContinue: () => void;
  attendeeSummary?: string;
  attendeeTypes?: Array<{
    type: string;
    count: number;
  }>;
}

/**
 * Modal for handling existing registration drafts recovery
 */
const RegistrationRecoveryModal: React.FC<RegistrationRecoveryModalProps> = ({
  isOpen,
  onClose,
  registrationType,
  progressData,
  onStartNew,
  onEditAttendees,
  onContinue,
  attendeeSummary = '',
  attendeeTypes = []
}) => {
  // Check for bypass flag to prevent showing this modal when using the ticket reservation bypass
  const hasNoRedirectFlag = localStorage.getItem('lodgetix_bypass_no_redirect') === 'true';
  if (hasNoRedirectFlag || !isOpen || !progressData) return null;
  
  // Format the last updated date
  const formatLastUpdated = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If it's today, just show the time
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    // If it's yesterday, show "Yesterday"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    // Otherwise, show the full date
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  // Get readable registration type
  const getReadableRegistrationType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'individual':
        return 'Individual Registration';
      case 'lodge':
        return 'Lodge Registration';
      case 'delegation':
        return 'Official Delegation';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1) + ' Registration';
    }
  };
  
  const readableType = getReadableRegistrationType(registrationType);
  const lastStep = progressData ? getStepName(progressData.lastStep) : '';
  const lastUpdated = progressData ? formatLastUpdated(progressData.lastUpdated) : '';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-medium">Registration In Progress</h3>
          <button
            onClick={onClose}
            className="text-white hover:opacity-75 transition-opacity"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-slate-700 mb-4">
            We found a registration you started earlier. Would you like to continue where you left off?
          </p>
          
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-primary">{readableType}</h4>
            
            <div className="mt-3 space-y-2">
              <div className="flex items-start text-slate-700">
                <UserCircle className="w-5 h-5 mr-2 text-slate-500 mt-0.5" />
                {attendeeTypes && attendeeTypes.length > 0 ? (
                  <div>
                    <span className="font-medium">Attendees:</span>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      {attendeeTypes.map((type, index) => (
                        <li key={index} className="text-sm">
                          {type.count} {type.type}{type.count !== 1 ? 's' : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <span>
                    {attendeeSummary || 
                      `${progressData?.attendeeCount || 0} Attendee${progressData?.attendeeCount !== 1 ? 's' : ''}`}
                  </span>
                )}
              </div>
              
              <div className="flex items-center text-slate-700">
                <Calendar className="w-5 h-5 mr-2 text-slate-500" />
                <span>Last reached: {lastStep}</span>
              </div>
              
              <div className="flex items-center text-slate-700">
                <AlarmClock className="w-5 h-5 mr-2 text-slate-500" />
                <span>Last updated: {lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onStartNew}
            className="btn-outline-secondary order-3 sm:order-1"
          >
            Start New Registration
          </button>
          
          <button
            onClick={onEditAttendees}
            className="btn-outline order-2"
          >
            Edit Attendees
          </button>
          
          <button
            onClick={onContinue}
            className="btn-primary order-1 sm:order-3"
          >
            Continue Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationRecoveryModal;