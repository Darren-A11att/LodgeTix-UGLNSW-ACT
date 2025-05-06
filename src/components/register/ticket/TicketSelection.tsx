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
  selectAttendeeTicket: (attendeeId: string, ticketDefinitionId: string | null, individualDefinitionIds?: string[]) => void;
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
  // Corrected console log (again)
  console.log("[TicketSelection MOUNT/UPDATE] Props Check:", { 
    availablePackages,
    availableDefinitions,
    selectedEvent,
    formStateAttendeesCount: formState.attendees?.length 
  });

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

  // --- Helper Functions --- 
  const getSelectedTicketId = (attendeeId: string): string | null => {
    const attendee = formState.attendees?.find((a: StoreUnifiedAttendeeData) => a.attendeeId === attendeeId);
    if (attendee && attendee.ticket && attendee.ticket.selectedEvents && attendee.ticket.selectedEvents.length > 0) {
        const isAnySelectedEventAPackage = availablePackages.some(pkg => attendee.ticket!.selectedEvents.includes(pkg.id));
        if(!isAnySelectedEventAPackage) return null;
    }
    return attendee?.ticket?.ticketDefinitionId || null;
  };

  const getSelectedDefinitionIds = (attendeeId: string): string[] => {
    const attendee = formState.attendees?.find((a: StoreUnifiedAttendeeData) => a.attendeeId === attendeeId);
    return attendee?.ticket?.selectedEvents || []; 
  };
  
  const isPackageSelected = (attendeeId: string): boolean => {
    const ticketId = getSelectedTicketId(attendeeId);
    if (!ticketId) return false;
    // Also ensure no individual definitions are selected if a package is considered active
    if (getSelectedDefinitionIds(attendeeId).length > 0) return false;
    return availablePackages.some((pkg: PackageType) => pkg.id === ticketId);
  };

  const getTicketPriceForAttendee = (attendeeId: string): number => {
    const currentSelectedPackageId = getSelectedTicketId(attendeeId);
    const currentSelectedDefIds = getSelectedDefinitionIds(attendeeId);

    if (currentSelectedPackageId && !currentSelectedDefIds.length) { // Package is selected
        const ticketPackage = availablePackages.find(p => p.id === currentSelectedPackageId);
        return ticketPackage?.price ?? 0;
    } else { // Individual definitions are selected or nothing is selected
        return currentSelectedDefIds.reduce((total, defId) => {
            const definition = availableDefinitions.find(d => d.id === defId);
            return total + (definition?.price ?? 0);
        }, 0);
    }
  };
  
  const allAttendeesHaveTickets = (): boolean => {
    return formState.attendees?.every((attendee: StoreUnifiedAttendeeData) => 
      (attendee.ticket && attendee.ticket.ticketDefinitionId != null && attendee.ticket.ticketDefinitionId !== '') || 
      (attendee.ticket && attendee.ticket.selectedEvents && attendee.ticket.selectedEvents.length > 0) 
    ) ?? false;
  };

  const handleToggleIndividualDefinition = (attendeeId: string, definitionId: string) => {
    const currentSelectedIds = getSelectedDefinitionIds(attendeeId);
    let newSelectedIds: string[];
    if (currentSelectedIds.includes(definitionId)) {
      newSelectedIds = currentSelectedIds.filter(id => id !== definitionId);
    } else {
      newSelectedIds = [...currentSelectedIds, definitionId];
    }
    console.log(`DEBUG: Toggle def ${definitionId} for ${attendeeId}. New list:`, newSelectedIds);
    // Call prop with null for package ID and the array of definition IDs
    selectAttendeeTicket(attendeeId, null, newSelectedIds); 
  };

  const handlePackageSelect = (attendeeId: string, packageId: string | null) => {
    // Call prop with the package ID and undefined (or empty array) for definition IDs
    selectAttendeeTicket(attendeeId, packageId, undefined); 
  };

  // Get flat list of all attendees, mapping StoreUnifiedAttendeeData to MappedAttendeeItem
  // LINTER FIX: Add null check and default empty array
  const allAttendees: MappedAttendeeItem[] = (formState.attendees || []).map((attendee: StoreUnifiedAttendeeData, idx: number): MappedAttendeeItem => {
      
      const currentAttendees = formState.attendees || [];
      const isPartnerCheck = attendee.attendeeType === 'lady_partner' || attendee.attendeeType === 'guest_partner';
      let relatedTo: string | undefined = undefined; 
      if (isPartnerCheck && attendee.relatedAttendeeId) { 
          const relatedAttendee = currentAttendees.find((a: StoreUnifiedAttendeeData) => a.attendeeId === attendee.relatedAttendeeId);
          if (relatedAttendee) {
              relatedTo = `${relatedAttendee.attendeeType} ${relatedAttendee.firstName} ${relatedAttendee.lastName}`.trim();
          }
      }

      let mappedLegacyData: AttendeeData;
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
      };
      
      // Type-specific mapping using type assertions for potentially missing fields
      if (attendee.attendeeType === 'mason') {
          const unsafeAttendee = attendee as any; // Use assertion for missing fields
          mappedLegacyData = {
              ...baseLegacyData,
              attendeeType: AttendeeType.Mason, 
              memberNumber: unsafeAttendee.memberNumber || '',
              rank: unsafeAttendee.rank || '',
              lodgeName: unsafeAttendee.lodgeName || '', 
              lodgeNumber: unsafeAttendee.lodgeNumber || '', 
              glJurisdiction: unsafeAttendee.glJurisdiction || '', 
              role: unsafeAttendee.role || '', 
              // Required by MasonData type:
              lodge: `${unsafeAttendee.lodgeName || ''} ${unsafeAttendee.lodgeNumber || ''}`.trim(),
              grandLodge: unsafeAttendee.glJurisdiction || '',
              hasLadyPartner: currentAttendees.some((p: StoreUnifiedAttendeeData) => p.relatedAttendeeId === attendee.attendeeId && p.attendeeType === 'lady_partner'),
              grandRank: unsafeAttendee.grandRank || null,
              grandOfficer: unsafeAttendee.grandOfficer || false,
              grandOffice: unsafeAttendee.grandOffice || null,
          } as MasonData; 
      } else if (attendee.attendeeType === 'lady_partner') {
           const unsafeAttendee = attendee as any; // Use assertion
          mappedLegacyData = {
              ...baseLegacyData,
              attendeeType: AttendeeType.LadyPartner, 
              relatedMasonId: attendee.relatedAttendeeId || '',
              // Required by LadyPartnerData type:
              relationship: unsafeAttendee.relationship || '', 
              masonId: attendee.relatedAttendeeId || '', 
          } as LadyPartnerData;
      } else if (attendee.attendeeType === 'guest') {
          const unsafeAttendee = attendee as any; // Use assertion
         mappedLegacyData = {
              ...baseLegacyData,
              attendeeType: AttendeeType.Guest, 
              relationToMason: unsafeAttendee.relationToMason || '', 
              associatedMasonId: attendee.relatedAttendeeId || '', 
              // Required by GuestData type:
              hasPartner: currentAttendees.some((p: StoreUnifiedAttendeeData) => p.relatedAttendeeId === attendee.attendeeId && p.attendeeType === 'guest_partner'),
              relationship: unsafeAttendee.relationship || '',
          } as GuestData;
      } else if (attendee.attendeeType === 'guest_partner') {
          const unsafeAttendee = attendee as any; // Use assertion
         mappedLegacyData = {
              ...baseLegacyData,
              attendeeType: AttendeeType.GuestPartner, 
              relatedGuestId: attendee.relatedAttendeeId || '', 
              // Required by GuestPartnerData type:
              relationship: unsafeAttendee.relationship || '', 
              guestId: attendee.relatedAttendeeId || '',
          } as GuestPartnerData;
      } else {
          console.warn("Unknown attendee type:", attendee.attendeeType);
           mappedLegacyData = { 
               id: attendee.attendeeId,
               attendeeType: AttendeeType.Guest,
               title: attendee.title || '', 
               firstName: attendee.firstName || 'Unknown',
               lastName: attendee.lastName || 'Attendee',
               email: attendee.primaryEmail || 'N/A', 
               phone: attendee.primaryPhone || 'N/A',
               dietary: attendee.dietaryRequirements || '',
               specialNeeds: attendee.specialNeeds || '',
               contactPreference: attendee.contactPreference || 'Directly',
               contactConfirmed: !!attendee.contactConfirmed,
               hasPartner: false,
               relationship: ''
           } as GuestData;
      }

      return {
        type: attendee.attendeeType as 'mason' | 'ladyPartner' | 'guest' | 'guestPartner',
        index: idx, // REVERTED: Use numerical index from map instead of string ID
        id: attendee.attendeeId,
        name: `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim(),
        title: attendee.title || '',
        data: mappedLegacyData, 
        relatedTo: relatedTo,
      };
  });

  // --- Handlers --- 
  const toggleExpandAttendee = (attendeeId: string) => {
    setExpandedAttendee(prev => (prev === attendeeId ? null : attendeeId));
  };

  const handleUniformTicketSelect = (ticketId: string) => {
    setUniformTicketId(ticketId);
    if (applyTicketToAllAttendees) {
        applyTicketToAllAttendees(ticketId); 
    }
  };

  const handleModeChange = (mode: 'uniform' | 'individual') => {
    setTicketingMode(mode);
    if (mode === 'individual') {
        setUniformTicketId(null);
    }
    // Note: toggleUniformTicketing prop handles its own side effects now
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

  // New useEffect to set default expanded attendee
  useEffect(() => {
    // Only attempt to auto-expand if ticketingMode is 'individual'
    // and the list of attendees is available, and nothing is currently expanded.
    if (ticketingMode === 'individual' && allAttendees && allAttendees.length > 0 && expandedAttendee === null) {
      // Attempt to find the first Mason to expand
      const primaryMason = allAttendees.find(att => att.type === 'mason');
      if (primaryMason) {
        setExpandedAttendee(primaryMason.id);
      } else {
        // If no Mason is found (e.g., only guests), expand the first attendee in the list.
        setExpandedAttendee(allAttendees[0].id);
      }
    }
    // If the mode changes away from 'individual', and something was expanded,
    // you might want to collapse it, though it's not strictly necessary
    // as the individual attendee items won't be rendered anyway.
    // else if (ticketingMode !== 'individual' && expandedAttendee !== null) {
    //   setExpandedAttendee(null);
    // }

  }, [allAttendees, ticketingMode, expandedAttendee]); // Dependencies for the effect

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
              const currentSelectedPackageId = getSelectedTicketId(attendeeId);
              const currentSelectedDefIds = getSelectedDefinitionIds(attendeeId);
              // An attendee has custom/individual events if a package is NOT selected AND they have definition IDs
              const hasCustomEvents = !currentSelectedPackageId && currentSelectedDefIds.length > 0;
              
              return (
                <AttendeeTicketItem 
                  key={attendeeId}
                  attendee={attendeeItem} 
                  isExpanded={expandedAttendee === attendeeId}
                  selectedTicketId={currentSelectedPackageId ?? ''} 
                  ticketPrice={getTicketPriceForAttendee(attendeeId)}
                  hasCustomEvents={hasCustomEvents}
                  onToggleExpand={() => toggleExpandAttendee(attendeeId)}
                >
                  {expandedAttendee === attendeeId && (
                    <div className="p-4 border-t border-slate-200 space-y-6">
                      {/* Section 1: Packages */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3">Select a Package:</h4>
                        <div className="space-y-4">
                          {(availablePackages && availablePackages.length > 0) ? availablePackages.map((pkg) => (
                            <div key={pkg.id} className="border border-gray-200 bg-white rounded-md">
                              <div className="px-4 py-5 sm:px-6">
                                <div className="-mt-2 -ml-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
                                  <div className="mt-2 ml-4">
                                    <h3 className="text-base font-semibold text-gray-900">
                                      {pkg.name} (${pkg.price || 0})
                                    </h3>
                                    {pkg.description && <p className="text-sm text-gray-500 mt-1">{pkg.description}</p>}
                                  </div>
                                  <div className="mt-2 ml-4 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handlePackageSelect(attendeeId, pkg.id)}
                                      disabled={currentSelectedPackageId === pkg.id && !hasCustomEvents} 
                                      className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                                        (currentSelectedPackageId === pkg.id && !hasCustomEvents) 
                                          ? 'bg-indigo-100 text-indigo-700 ring-1 ring-inset ring-indigo-700' 
                                          : 'bg-indigo-600 text-white hover:bg-indigo-500'
                                      }`}
                                    >
                                      {(currentSelectedPackageId === pkg.id && !hasCustomEvents) ? 'Selected' : 'Select Package'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {/* List included definitions (informational) */}
                              {availableDefinitions && availableDefinitions.filter(def => def.package_id === pkg.id).length > 0 && (
                                <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                                  <p className="text-xs font-medium text-gray-500 mb-1">Includes:</p>
                                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                    {availableDefinitions.filter(def => def.package_id === pkg.id).map(def => (
                                      <li key={def.id}>{def.name} (${def.price})</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )) : <p className="text-sm text-gray-500">No packages available.</p>}
                        </div>
                      </div>

                      {/* Section 2: Individual Tickets (Ticket Definitions) - Table Full Width */}
                      <div>
                        <div className="sm:flex sm:items-center">
                            <div className="sm:flex-auto">
                                <h4 className="text-lg font-medium text-gray-900">Or Select Individual Event Tickets:</h4>
                            </div>
                        </div>
                        {/* Ensure this container allows the table to be full width of the accordion panel */}
                        <div className="mt-4 flow-root">
                          <div className="-mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                              <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3">Ticket</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Details</th>
                                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Price</th>
                                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                                      Select
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                  {(availableDefinitions && availableDefinitions.length > 0) ? availableDefinitions.map((def) => (
                                    <tr key={def.id}>
                                      <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3">{def.name}</td>
                                      <td className="px-3 py-4 text-sm text-gray-500">{def.description || '-'}</td>
                                      <td className="px-3 py-4 text-sm text-gray-500 text-right">${def.price || 0}</td>
                                      <td className="py-4 pl-3 pr-4 text-center text-sm font-medium sm:pr-3">
                                        <input
                                          id={`definition-${attendeeId}-${def.id}`}
                                          type="checkbox"
                                          value={def.id} 
                                          checked={currentSelectedDefIds.includes(def.id)}
                                          onChange={() => handleToggleIndividualDefinition(attendeeId, def.id)}
                                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                          disabled={!!currentSelectedPackageId} // Disable if a package is selected
                                          aria-label={`Select ${def.name}`}
                                        />
                                      </td>
                                    </tr>
                                  )) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-4 text-sm text-gray-500">No individual event tickets currently available.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Clear Selection Option */}
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={() => handlePackageSelect(attendeeId, null)} 
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:text-gray-400"
                          disabled={!currentSelectedPackageId && currentSelectedDefIds.length === 0}
                        >
                            Clear Selection
                        </button>
                      </div>

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
          Back to Attendee Details
        </button>
        <button 
          type="button" 
          onClick={nextStep} 
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          disabled={disableForm || !allAttendeesHaveTickets()}
        >
          Continue to Payment
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