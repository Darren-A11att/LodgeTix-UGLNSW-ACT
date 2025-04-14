import React, { useEffect, useRef } from 'react';
import { MasonData, LadyPartnerData, GuestData, GuestPartnerData } from '../../shared/types/register';
import { FormState } from '../../context/RegisterFormContext';
import { X } from 'lucide-react';

interface AttendeeEditModalProps {
  attendeeType: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner';
  attendeeIndex: number;
  formState: FormState;
  onClose: () => void;
}

const AttendeeEditModal: React.FC<AttendeeEditModalProps> = ({
  attendeeType,
  attendeeIndex,
  formState,
  onClose
}) => {
  // Create refs for the modal elements
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  
  // Get the appropriate attendee data
  const getAttendeeData = (): any => {
    switch(attendeeType) {
      case 'mason':
        return formState.masons[attendeeIndex];
      case 'ladyPartner':
        return formState.ladyPartners[attendeeIndex];
      case 'guest':
        return formState.guests[attendeeIndex];
      case 'guestPartner':
        return formState.guestPartners[attendeeIndex];
      default:
        return null;
    }
  };

  const attendeeData = getAttendeeData();
  
  // Handle clicks outside the modal to close it
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        modalRef.current && 
        modalContentRef.current && 
        !modalContentRef.current.contains(event.target as Node)
      ) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    // Add event listener when modal is open
    document.addEventListener('mousedown', handleOutsideClick);
    
    // Prevent scrolling on the body when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Clean up event listener and restore scrolling when modal closes
      document.removeEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);
  
  if (!attendeeData) {
    return null;
  }

  // Get a human-readable label for the attendee type
  const getAttendeeTypeLabel = (): string => {
    switch(attendeeType) {
      case 'mason':
        return attendeeIndex === 0 ? 'Primary Mason' : 'Mason';
      case 'ladyPartner':
        return 'Lady & Partner';
      case 'guest':
        return 'Guest';
      case 'guestPartner':
        return 'Guest Partner';
      default:
        return 'Attendee';
    }
  };

  // Get a form title based on attendee name
  const getFormTitle = (): string => {
    if (!attendeeData) return 'Edit Attendee';
    
    if (attendeeType === 'mason') {
      // Format: "Edit Mason: [Masonic Title] [First Name] [Last Name] [Rank / Grand Rank]"
      const mason = attendeeData as MasonData;
      const rankInfo = mason.rank === 'GL' && mason.grandRank ? ` / ${mason.grandRank}` : ` / ${mason.rank}`;
      return `Edit Mason: ${mason.title} ${mason.firstName} ${mason.lastName}${rankInfo}`;
    } else if (attendeeType === 'ladyPartner') {
      // Format for Lady & Partner
      const partner = attendeeData as LadyPartnerData;
      return `Edit Lady & Partner: ${partner.title} ${partner.firstName} ${partner.lastName}`;
    } else if (attendeeType === 'guest') {
      // Format for Guest
      const guest = attendeeData as GuestData;
      return `Edit Guest: ${guest.title} ${guest.firstName} ${guest.lastName}`;
    } else if (attendeeType === 'guestPartner') {
      // Format for Guest Partner
      const partner = attendeeData as GuestPartnerData;
      return `Edit Guest Partner: ${partner.title} ${partner.firstName} ${partner.lastName}`;
    }
    
    return 'Edit Attendee';
  };

  // Handle modal close button click
  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  // Prevent clicks within the modal from propagating
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Only close if clicking the backdrop (not the modal content)
        if (e.target === modalRef.current) {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div 
        ref={modalContentRef}
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto"
        onClick={handleModalContentClick}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold">{getFormTitle()}</h2>
          <button 
            onClick={handleCloseClick}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4 bg-yellow-50 p-4 rounded-md border border-yellow-100">
            <p className="text-yellow-800 text-sm">
              This is a demonstration modal. In a real application, this would display editable fields for the selected attendee.
            </p>
          </div>
          
          <div className="space-y-4">
            {/* The form fields would depend on the attendee type */}
            {attendeeType === 'mason' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input 
                      type="text" 
                      value={attendeeData.title} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
                    <input 
                      type="text" 
                      value={attendeeData.rank} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input 
                      type="text" 
                      value={attendeeData.firstName} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={attendeeData.lastName} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
                
                {attendeeData.rank === 'GL' && (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grand Rank</label>
                      <input 
                        type="text" 
                        value={attendeeData.grandRank} 
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lodge</label>
                  <input 
                    type="text" 
                    value={attendeeData.lodge} 
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grand Lodge</label>
                  <input 
                    type="text" 
                    value={attendeeData.grandLodge} 
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </>
            )}
            {attendeeType === 'ladyPartner' && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input 
                      type="text" 
                      value={attendeeData.title} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input 
                      type="text" 
                      value={attendeeData.firstName} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={attendeeData.lastName} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <input 
                    type="text" 
                    value={attendeeData.relationship} 
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Related to Mason</label>
                    <input 
                      type="text" 
                      value={`${formState.masons[attendeeData.masonIndex]?.title || ''} ${formState.masons[attendeeData.masonIndex]?.firstName || ''} ${formState.masons[attendeeData.masonIndex]?.lastName || ''}`} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
              </>
            )}
            {(attendeeType === 'guest' || attendeeType === 'guestPartner') && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input 
                      type="text" 
                      value={attendeeData.title} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input 
                      type="text" 
                      value={attendeeData.firstName} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={attendeeData.lastName} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
                
                {attendeeType === 'guestPartner' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                      <input 
                        type="text" 
                        value={attendeeData.relationship} 
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Related to Guest</label>
                      <input 
                        type="text" 
                        value={`${formState.guests[attendeeData.guestIndex]?.title || ''} ${formState.guests[attendeeData.guestIndex]?.firstName || ''} ${formState.guests[attendeeData.guestIndex]?.lastName || ''}`} 
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                  </>
                )}
              </>
            )}
            
            {/* All attendee types have contact info */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="font-bold mb-3">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={attendeeData.email || '—'} 
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="text" 
                    value={attendeeData.phone ? (attendeeData.phone.startsWith('61') && attendeeData.phone.charAt(2) === '4' ? '0' + attendeeData.phone.substring(2) : attendeeData.phone) : '—'} 
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Preference</label>
                  <input 
                    type="text" 
                    value={attendeeData.contactPreference || '—'} 
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="font-bold mb-3">Additional Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Requirements</label>
                <input 
                  type="text" 
                  value={attendeeData.dietary || '—'} 
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              {attendeeData.specialNeeds !== undefined && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Needs</label>
                  <textarea 
                    value={attendeeData.specialNeeds || '—'} 
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    rows={2}
                  ></textarea>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
            <button
              onClick={handleCloseClick}
              className="btn-outline ml-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendeeEditModal;