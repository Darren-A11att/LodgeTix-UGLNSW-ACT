import React, { useEffect, useRef } from 'react';
import { MasonData, LadyPartnerData, GuestData, GuestPartnerData, FormState } from '../../shared/types/register';
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
  const getAttendeeData = (): MasonData | LadyPartnerData | GuestData | GuestPartnerData | null => {
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

    // Handle ESC key to close the modal
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Add event listener when modal is open
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscKey);
    
    // Prevent scrolling on the body when modal is open
    document.body.style.overflow = 'hidden';
    
    // Add inert attribute to main content to improve accessibility
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.setAttribute('inert', '');
    }
    
    return () => {
      // Clean up event listener and restore scrolling when modal closes
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
      
      // Remove inert attribute when modal closes
      if (mainContent) {
        mainContent.removeAttribute('inert');
      }
    };
  }, [onClose]);
  
  if (!attendeeData) {
    return null;
  }

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
            aria-label="Close"
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
                    <label htmlFor="edit-mason-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input 
                      id="edit-mason-title"
                      type="text" 
                      value={attendeeData.title} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-mason-rank" className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
                    <input 
                      id="edit-mason-rank"
                      type="text" 
                      value={(attendeeData as MasonData).rank}
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-mason-firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input 
                      id="edit-mason-firstName"
                      type="text" 
                      value={attendeeData.firstName} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-mason-lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input 
                      id="edit-mason-lastName"
                      type="text" 
                      value={attendeeData.lastName} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
                
                {(attendeeData as MasonData).rank === 'GL' && (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="edit-mason-grandRank" className="block text-sm font-medium text-gray-700 mb-1">Grand Rank</label>
                      <input 
                        id="edit-mason-grandRank"
                        type="text" 
                        value={(attendeeData as MasonData).grandRank}
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="edit-mason-lodge" className="block text-sm font-medium text-gray-700 mb-1">Lodge</label>
                  <input 
                    id="edit-mason-lodge"
                    type="text" 
                    value={(attendeeData as MasonData).lodge}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label htmlFor="edit-mason-grandLodge" className="block text-sm font-medium text-gray-700 mb-1">Grand Lodge</label>
                  <input 
                    id="edit-mason-grandLodge"
                    type="text" 
                    value={(attendeeData as MasonData).grandLodge}
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
                    <label htmlFor="edit-lp-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input 
                      id="edit-lp-title"
                      type="text" 
                      value={attendeeData.title} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-lp-firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input 
                      id="edit-lp-firstName"
                      type="text" 
                      value={attendeeData.firstName} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-lp-lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input 
                      id="edit-lp-lastName"
                      type="text" 
                      value={attendeeData.lastName} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="edit-lp-relationship" className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <input 
                    id="edit-lp-relationship"
                    type="text" 
                    value={(attendeeData as LadyPartnerData).relationship}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="edit-lp-relatedMason" className="block text-sm font-medium text-gray-700 mb-1">Related to Mason</label>
                    <input 
                      id="edit-lp-relatedMason"
                      type="text" 
                      value={`${formState.masons[(attendeeData as LadyPartnerData).masonIndex]?.title || ''} ${formState.masons[(attendeeData as LadyPartnerData).masonIndex]?.firstName || ''} ${formState.masons[(attendeeData as LadyPartnerData).masonIndex]?.lastName || ''}`}
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
                    <label htmlFor={`edit-${attendeeType}-title`} className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input 
                      id={`edit-${attendeeType}-title`}
                      type="text" 
                      value={attendeeData.title} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label htmlFor={`edit-${attendeeType}-firstName`} className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input 
                      id={`edit-${attendeeType}-firstName`}
                      type="text" 
                      value={attendeeData.firstName} 
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label htmlFor={`edit-${attendeeType}-lastName`} className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input 
                      id={`edit-${attendeeType}-lastName`}
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
                      <label htmlFor="edit-gp-relationship" className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                      <input 
                        id="edit-gp-relationship"
                        type="text" 
                        value={(attendeeData as GuestPartnerData).relationship}
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-gp-relatedGuest" className="block text-sm font-medium text-gray-700 mb-1">Related to Guest</label>
                      <input 
                        id="edit-gp-relatedGuest"
                        type="text" 
                        value={`${formState.guests[(attendeeData as GuestPartnerData).guestIndex]?.title || ''} ${formState.guests[(attendeeData as GuestPartnerData).guestIndex]?.firstName || ''} ${formState.guests[(attendeeData as GuestPartnerData).guestIndex]?.lastName || ''}`}
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
                  <label htmlFor={`edit-${attendeeType}-email`} className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    id={`edit-${attendeeType}-email`}
                    type="email" 
                    value={attendeeData.email || '—'} 
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label htmlFor={`edit-${attendeeType}-phone`} className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    id={`edit-${attendeeType}-phone`}
                    type="text" 
                    value={attendeeData.phone ? (attendeeData.phone.startsWith('61') && attendeeData.phone.charAt(2) === '4' ? '0' + attendeeData.phone.substring(2) : attendeeData.phone) : '—'} 
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor={`edit-${attendeeType}-contactPreference`} className="block text-sm font-medium text-gray-700 mb-1">Contact Preference</label>
                  <input 
                    id={`edit-${attendeeType}-contactPreference`}
                    type="text" 
                    value={(attendeeData as MasonData | LadyPartnerData | GuestData | GuestPartnerData).contactPreference || '—'}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="font-bold mb-3">Additional Information</h3>
              <div>
                <label htmlFor={`edit-${attendeeType}-dietary`} className="block text-sm font-medium text-gray-700 mb-1">Dietary Requirements</label>
                <input 
                  id={`edit-${attendeeType}-dietary`}
                  type="text" 
                  value={(attendeeData as MasonData | LadyPartnerData | GuestData | GuestPartnerData).dietary || '—'}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              {(attendeeData as MasonData | LadyPartnerData | GuestData | GuestPartnerData).specialNeeds !== undefined && (
                <div className="mt-3">
                  <label htmlFor={`edit-${attendeeType}-specialNeeds`} className="block text-sm font-medium text-gray-700 mb-1">Special Needs</label>
                  <textarea 
                    id={`edit-${attendeeType}-specialNeeds`}
                    value={(attendeeData as MasonData | LadyPartnerData | GuestData | GuestPartnerData).specialNeeds || '—'}
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