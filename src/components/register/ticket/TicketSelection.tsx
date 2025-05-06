import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, TrendingUp, Users } from 'lucide-react';
// Store types (Source of formState)
import { RegistrationState, UnifiedAttendeeData as StoreUnifiedAttendeeData } from '../../../store/registrationStore'; 
// Legacy types (Target structure for child components)
import { TicketType, MasonData, LadyPartnerData, GuestData, GuestPartnerData, AttendeeType, AttendeeData } from '../../../shared/types/register'; 
// Import TicketDefinitionType separately
import { TicketDefinitionType } from '../../../shared/types/ticket'; 
import { getEvents } from '../../../lib/api/events';
import { EventType } from '../../../shared/types/event';
// EligibilityAttendeeData might need adjusting if it relies on legacy types
// Import the utility's specific AttendeeData type with an alias
import { sortEventsByDate, getEligibleEvents, AttendeeData as EligibilityAttendeeData } from '../../../shared/utils/eventEligibility';
import TicketingModeToggle from './TicketingModeToggle';
import UniformTicketing from './UniformTicketing';
import AttendeeTicketItem from './AttendeeTicketItem';
import EventSelectionList from './EventSelectionList';
import { useReservationBypass as useReservationHook } from '../../../hooks/useReservationBypass';
import { useReservation as useReservationContext } from '../../../context/ReservationContext';
import { preventRedirect, startRedirectPreventionKeepAlive } from '../../../lib/redirectPrevention';
// LINTER FIX: Import PackageType
import { PackageType } from '../../../lib/api/events';

// Type definition for the structure expected by child components like UniformTicketing/AttendeeTicketItem
// Based on the legacy types
interface MappedAttendeeItem {
  type: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner'; // Derived lowercase type
  index: number;
  id: string; // Original attendeeId
  name: string;
  title: string;
  data: AttendeeData; // The mapped legacy AttendeeData union type
  relatedTo?: string; 
}

// Create our own simple UUID generator...
function generateId() { 
  // Basic fallback if uuid package isn't available or fails
  try {
    // Use crypto.randomUUID() if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {
    // Ignore errors if crypto is not available
  }
  // Fallback to Math.random based approach (less robust)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface TicketSelectionProps {
  // LINTER FIX: Only require the attendees part of the state
  formState: { attendees: StoreUnifiedAttendeeData[] | undefined }; 
  // --- NEW PROPS for separate data sources ---
  availablePackages?: PackageType[];
  availableDefinitions?: TicketDefinitionType[];
  // --- Deprecated/Removed Props ---
  // tickets?: TicketType[]; // Replaced by availablePackages
  // availableTickets?: TicketType[]; // Replaced by availableDefinitions/availablePackages
  selectedEvent?: { id: string; title: string; day: string; time: string; price: number };
  // selectTicket?: (ticketId: string) => void; // Likely handled by applyTicketToAllAttendees now
  selectAttendeeTicket: (attendeeId: string, ticketDefinitionId: string | null) => void;
  toggleUniformTicketing?: (enabled: boolean) => void; // Keep if mode toggle is external
  applyTicketToAllAttendees?: (ticketId: string) => void; 
  nextStep: () => void;
  prevStep: () => void;
}

const TicketSelection: React.FC<TicketSelectionProps> = ({ 
  formState, 
  availablePackages = [], 
  availableDefinitions = [],
  selectedEvent, 
  selectAttendeeTicket,
  toggleUniformTicketing,
  applyTicketToAllAttendees,
  nextStep,
  prevStep
}) => {
  const [allEventsData, setAllEventsData] = useState<EventType[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true); // Placeholder
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ticketingMode, setTicketingMode] = useState<'uniform' | 'individual'>('individual');
  const [uniformTicketId, setUniformTicketId] = useState<string | null>(null);
  const [expandedAttendee, setExpandedAttendee] = useState<string | null>(null); // Track expanded attendee
  const [isReserving, setIsReserving] = useState(false);
  const [reservationResult, setReservationResult] = useState<any>(null); // TODO: Type this
  const reservationApi = useReservationHook(); // Use the bypass hook
  const { reservation } = useReservationContext(); // Get context reservation (may differ from hook)
  const [localRemainingTime, setLocalRemainingTime] = useState<number | null>(null); // Local state for timer

  // Use selectedEvent prop directly
  console.log('TicketSelection - selectedEvent:', selectedEvent); 
  // selectedEventId is not in formState
  // console.log('TicketSelection - formState.selectedEventId:', formState.selectedEventId);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      try {
        // Pass empty object {} as argument and extract .events
        const data = await getEvents({}); 
        setAllEventsData(data.events || []); 
      } catch (error) {
        console.error("Failed to fetch events:", error);
        setErrorMessage('Failed to load event data.');
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchEvents();
    // Simulate ticket loading - replace with actual API call if needed
    setIsLoadingTickets(false);
  }, []);

  // Derive sorted events once
  const sortedEvents = React.useMemo(() => {
    if (!allEventsData) return [];
    return sortEventsByDate([...allEventsData]);
  }, [allEventsData]);

  console.log('TicketSelection - formState:', formState); // Log incoming state

  // --- Helper Functions (Defined once) ---
  const getSelectedTicketId = (attendeeId: string): string | null => {
    // LINTER FIX: Add null check for formState.attendees
    const attendee = formState.attendees?.find((a: StoreUnifiedAttendeeData) => a.attendeeId === attendeeId);
    return attendee?.ticket?.ticketDefinitionId || null;
  };

  const getSelectedEvents = (attendeeId: string): string[] => {
    // LINTER FIX: Add null check for formState.attendees
    const attendee = formState.attendees?.find((a: StoreUnifiedAttendeeData) => a.attendeeId === attendeeId);
    return attendee?.ticket?.selectedEvents || [];
  };
  
  const isPackage = (ticketId: string | null): boolean => {
    if (!ticketId) return false;
    // Check against availablePackages
    return availablePackages.some((pkg: PackageType) => pkg.id === ticketId);
  };

  const getTicketPriceForAttendee = (attendeeId: string): number => {
      const ticketId = getSelectedTicketId(attendeeId);
      // Check both packages and definitions
      const ticket = availablePackages.find(p => p.id === ticketId) || availableDefinitions.find(d => d.id === ticketId);
      return ticket?.price ?? 0; 
  };
  
  const allAttendeesHaveTickets = (): boolean => {
    // LINTER FIX: Add null check for formState.attendees
    return formState.attendees?.every((attendee: StoreUnifiedAttendeeData) => 
      attendee.ticket?.ticketDefinitionId != null && attendee.ticket?.ticketDefinitionId !== ''
    ) ?? false;
  };

  // Get flat list of all attendees, mapping StoreUnifiedAttendeeData to MappedAttendeeItem
  // LINTER FIX: Add null check and default empty array
  const allAttendees: MappedAttendeeItem[] = (formState.attendees || []).map((attendee: StoreUnifiedAttendeeData, idx: number): MappedAttendeeItem => {
      
      // LINTER FIX: Add null check for formState.attendees inside map
      const currentAttendees = formState.attendees || [];
      const isPartnerCheck = attendee.attendeeType === 'lady_partner' || attendee.attendeeType === 'guest_partner';
      let relatedTo: string | undefined = undefined; 
      if (isPartnerCheck && attendee.relatedAttendeeId) { 
          const relatedAttendee = currentAttendees.find((a: StoreUnifiedAttendeeData) => a.attendeeId === attendee.relatedAttendeeId);
          if (relatedAttendee) {
              relatedTo = `${relatedAttendee.attendeeType} ${relatedAttendee.firstName} ${relatedAttendee.lastName}`.trim();
          }
      }

      // --- Map StoreUnifiedAttendeeData to Legacy AttendeeData Union --- 
      let mappedLegacyData: AttendeeData; // Target type is the legacy union

      // Map fields common to most legacy types (adjust based on exact legacy defs)
      const baseLegacyData = {
          id: attendee.attendeeId,
          title: attendee.title || '',
          firstName: attendee.firstName || '',
          lastName: attendee.lastName || '',
          email: attendee.primaryEmail || '', 
          phone: attendee.primaryPhone || '',
          dietary: attendee.dietaryRequirements || '',
          specialNeeds: attendee.specialNeeds || '',
          contactPreference: attendee.contactPreference || 'Directly', 
          contactConfirmed: !!attendee.contactConfirmed,
          ticket: undefined, // TODO: Map ticket structure correctly if needed by legacy types
      };

      // Use lowercase types from store data for switch
      switch (attendee.attendeeType) {
        case 'mason':
          mappedLegacyData = {
            ...baseLegacyData,
            attendeeType: AttendeeType.Mason, 
            rank: attendee.rank || '', 
            lodge: attendee.lodgeNameNumber || '', 
            grandLodge: '', 
            hasLadyPartner: currentAttendees.some((p: StoreUnifiedAttendeeData) => p.relatedAttendeeId === attendee.attendeeId && p.attendeeType === 'lady_partner'),
            grandRank: attendee.grandRank,
            grandOfficer: attendee.grandOfficer,
            grandOffice: attendee.grandOffice,
            email: attendee.primaryEmail || 'N/A', 
          } as MasonData;
          break;
        case 'lady_partner':
          mappedLegacyData = {
            ...baseLegacyData,
            attendeeType: AttendeeType.LadyPartner,
            relationship: attendee.relationship || '',
            masonId: attendee.relatedAttendeeId || '' 
          } as LadyPartnerData;
          break;
        case 'guest':
          mappedLegacyData = {
            ...baseLegacyData,
            attendeeType: AttendeeType.Guest, 
            hasPartner: currentAttendees.some((p: StoreUnifiedAttendeeData) => p.relatedAttendeeId === attendee.attendeeId && p.attendeeType === 'guest_partner'),
            relationship: attendee.relationship || '',
          } as GuestData;
          break;
        case 'guest_partner':
          mappedLegacyData = {
            ...baseLegacyData,
            attendeeType: AttendeeType.GuestPartner,
            relationship: attendee.relationship || '',
            guestId: attendee.relatedAttendeeId || '' 
          } as GuestPartnerData;
          break;
        case 'individual': 
        case 'lodge_contact':
        case 'delegation_contact':
             console.warn(`Mapping unhandled store attendee type [${attendee.attendeeType}] to legacy Guest`);
             mappedLegacyData = {
               ...baseLegacyData,
               attendeeType: AttendeeType.Guest, 
               hasPartner: false,
               // Add potentially missing required fields for GuestData
               relationship: '',
             } as GuestData;
             break;
        default:
          console.error("Unexpected attendee type in mapping (original value):", attendee.attendeeType);
          // Fallback to minimal legacy Guest structure, ensuring required fields
          mappedLegacyData = { 
              id: attendee.attendeeId,
              attendeeType: AttendeeType.Guest,
              title: attendee.title || '', // Ensure all fields from base + Guest specific are present
              firstName: attendee.firstName || 'Unknown',
              lastName: attendee.lastName || 'Attendee',
              email: attendee.primaryEmail || 'N/A', 
              phone: attendee.primaryPhone || 'N/A',
              dietary: attendee.dietaryRequirements || '',
              specialNeeds: attendee.specialNeeds || '',
              contactPreference: attendee.contactPreference || 'Directly',
              contactConfirmed: !!attendee.contactConfirmed,
              ticket: undefined,
              hasPartner: false,
              relationship: ''
          } as GuestData; // Cast here is okay as we manually ensure fields
      }
      
      // --- Final Return Object --- 
      return { 
        type: attendee.attendeeType.toLowerCase() as MappedAttendeeItem['type'], 
        index: idx, 
        id: attendee.attendeeId, 
        name: `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim(),
        title: attendee.title || '',
        data: mappedLegacyData, 
        ...(relatedTo && { relatedTo })
      };
    });

  // --- Handlers --- 
  const toggleExpandAttendee = (attendeeId: string) => {
    setExpandedAttendee(prev => (prev === attendeeId ? null : attendeeId));
  };

  const handleUniformTicketSelect = (ticketId: string) => {
    setUniformTicketId(ticketId);
    if (applyTicketToAllAttendees) applyTicketToAllAttendees(ticketId); 
  };

  const handleIndividualTicketSelect = (attendeeId: string, ticketId: string | null) => {
    selectAttendeeTicket(attendeeId, ticketId);
  };

  const handleModeChange = (mode: 'uniform' | 'individual') => {
    setTicketingMode(mode);
    if (toggleUniformTicketing) {
      toggleUniformTicketing(mode === 'uniform'); 
    }
  };

  const handleReservation = async () => {
    const eventIdToUse = selectedEvent?.id;
    const ticketId = uniformTicketId; 

    if (!eventIdToUse || !ticketId) {
      setErrorMessage('Please select an event and a ticket package.');
      return;
    }

    setIsReserving(true);
    setErrorMessage(null);
    setReservationResult(null);
    preventRedirect();
    startRedirectPreventionKeepAlive();

    try {
        console.log("Attempting reservations for:", { eventId: eventIdToUse, ticketId, attendees: allAttendees });

        const reservationPromises = allAttendees.map((attendeeItem: MappedAttendeeItem) => 
            reservationApi.reserve(eventIdToUse, ticketId, 1, attendeeItem.id) 
        );
        
        const results = await Promise.all(reservationPromises);
        setReservationResult(results);

        const allSucceeded = results.every((result: any) => result.success);
        
        if (allSucceeded) {
          console.log('All reservations successful!');
          if(applyTicketToAllAttendees && uniformTicketId) {
              applyTicketToAllAttendees(uniformTicketId);
          } else {
              console.warn("Reservation succeeded, but couldn't update central store state automatically.");
          }
        } else {
          const errors = results.filter((r: any) => !r.success).map((r: any) => r.error).join(', ');
          console.error('Some reservations failed:', results);
          setErrorMessage(`Failed to reserve tickets for all attendees: ${errors}. Please try again or select individually.`);
        }
    } catch (error: any) { 
      console.error('Reservation process failed:', error);
      setErrorMessage(error.message || 'An unexpected error occurred during reservation.');
    } finally {
      setIsReserving(false);
    }
  };

  const disableForm = isLoadingEvents || isLoadingTickets || isReserving;

  // --- Timer Calculation --- 
  useEffect(() => {
    // Use reservations from the hook OR the context as fallback
    const currentReservations = reservationApi.getStoredReservation(); // Use hook's function to get stored data
    
    if (!currentReservations || !Array.isArray(currentReservations) || currentReservations.length === 0) {
      setLocalRemainingTime(null);
      return;
    }
    
    // Use the expiry from the first reservation
    const expiresAt = new Date(currentReservations[0].expiresAt);
    
    const intervalId = setInterval(() => {
      const now = new Date();
      const timeLeft = expiresAt.getTime() - now.getTime();
      
      if (timeLeft <= 0) {
        setLocalRemainingTime(0);
        clearInterval(intervalId);
        console.log('[TicketSelection] Reservation timer expired (Bypass Mode)');
      } else {
        setLocalRemainingTime(timeLeft);
      }
    }, 1000);
    
    // Cleanup interval on unmount or when reservations change
    return () => clearInterval(intervalId);
  // Depend on a stable representation of the reservation data
  }, [reservationApi]); // Re-run if the hook instance changes (might need better dependency)

  // --- Render --- 
  if (isLoadingEvents || isLoadingTickets) {
    return <div className="text-center py-10">Loading event and ticket data...</div>;
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      <TicketingModeToggle 
        useUniformTicketing={ticketingMode === 'uniform'} 
        toggleUniformTicketing={(enabled) => handleModeChange(enabled ? 'uniform' : 'individual')} 
      />

      {ticketingMode === 'uniform' ? (
        <UniformTicketing
          selectedTicketId={uniformTicketId ?? ''}
          availableTickets={availablePackages}
          allAttendees={allAttendees} 
          onSelectTicket={handleUniformTicketSelect}
        />
      ) : (
        <div>
          <div className="space-y-4 mb-8">
            {allAttendees.map((attendeeItem: MappedAttendeeItem) => { 
              const attendeeId = attendeeItem.id; 
              const selectedTicketId = getSelectedTicketId(attendeeId);
              const selectedEvents = getSelectedEvents(attendeeId); 
              const ticketPrice = getTicketPriceForAttendee(attendeeId);
              const hasCustomEvents = !isPackage(selectedTicketId) && selectedEvents.length > 0; 
              const isCurrentlyReserving = isReserving; 
              
              return (
                <AttendeeTicketItem 
                  key={attendeeId}
                  attendee={attendeeItem} 
                  isExpanded={expandedAttendee === attendeeId}
                  selectedTicketId={selectedTicketId ?? ''} 
                  ticketPrice={ticketPrice}
                  hasCustomEvents={hasCustomEvents}
                  onToggleExpand={() => toggleExpandAttendee(attendeeId)}
                >
                  {expandedAttendee === attendeeId && (
                    <div className="p-4 border-t border-slate-200">
                      <h4 className="font-semibold mb-2">Select Ticket/Package</h4>
                      {availableDefinitions.map(ticketDef => (
                        <div key={ticketDef.id} className="mb-2 flex items-center">
                          <input 
                            type="radio" 
                            id={`ticket-${attendeeId}-${ticketDef.id}`}
                            name={`ticket-${attendeeId}`}
                            value={ticketDef.id}
                            checked={selectedTicketId === ticketDef.id}
                            onChange={() => handleIndividualTicketSelect(attendeeId, ticketDef.id)} 
                            disabled={isCurrentlyReserving}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 mr-2"
                          />
                          <label htmlFor={`ticket-${attendeeId}-${ticketDef.id}`} className="text-sm">
                            <span className="font-medium">{ticketDef.name}</span> 
                            <span className="text-gray-600"> (${ticketDef.price})</span>
                            {ticketDef.description && <span className="block text-xs text-gray-500">{ticketDef.description}</span>}
                          </label>
                        </div>
                      ))}
                      
                      {!isPackage(selectedTicketId) && (
                         <EventSelectionList
                           events={getEligibleEvents(sortedEvents, attendeeItem.type, attendeeItem.data as unknown as EligibilityAttendeeData)} 
                           selectedEvents={selectedEvents} 
                           toggleEvent={(eventId: string) => { 
                              console.log(`Event ${eventId} selected for ${attendeeId}`);
                            }} 
                         />
                      )}
                    </div>
                  )}
                </AttendeeTicketItem>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <button 
          type="button" 
          onClick={prevStep} 
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          disabled={disableForm}
        >
          Previous
        </button>
        <button 
          type="button" 
          onClick={nextStep} 
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          disabled={disableForm || !allAttendeesHaveTickets()}
        >
          Next: Review
        </button>
      </div>

      {localRemainingTime !== null && (
        <div className="text-center text-sm text-red-600 font-medium mt-4">
          Reservation expires in: {Math.floor(localRemainingTime / 60000)}:{String(Math.floor((localRemainingTime % 60000) / 1000)).padStart(2, '0')}
        </div>
      )}
    </div>
  );
};

export default TicketSelection;