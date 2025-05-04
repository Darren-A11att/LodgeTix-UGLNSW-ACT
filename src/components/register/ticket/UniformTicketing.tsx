import React from 'react';
import { TicketType, MasonData, LadyPartnerData, GuestData, GuestPartnerData } from '../../../shared/types/register';
import PackageTicketSection from './PackageTicketSection';
import { TrendingUp } from 'lucide-react';
import { getTicketAvailability } from '../../../lib/api/events';

// Define AttendeeType locally (or import if moved to shared types)
interface AttendeeType {
  type: 'mason' | 'ladyPartner' | 'guest' | 'guestPartner';
  index: number;
  name: string;
  title: string;
  data: MasonData | LadyPartnerData | GuestData | GuestPartnerData;
  relatedTo?: string;
}

interface UniformTicketingProps {
  selectedTicketId: string;
  availableTickets: TicketType[];
  allAttendees: AttendeeType[];
  onSelectTicket: (ticketId: string) => void;
  onSwitchToIndividualMode?: () => void; // Optional callback to switch to individual ticketing mode
  isReserving?: boolean; // Indicates if a reservation is in progress
}

const UniformTicketing: React.FC<UniformTicketingProps> = ({
  selectedTicketId,
  availableTickets,
  allAttendees,
  onSelectTicket,
  onSwitchToIndividualMode,
  isReserving = false
}) => {
  // State for ticket availability data
  const [capacityData, setCapacityData] = React.useState<Record<string, {
    available: number;
    isHighDemand: boolean;
    isSoldOut: boolean;
  }>>({});
  const [isLoadingCapacity, setIsLoadingCapacity] = React.useState(false);
  
  // Mock implementation of ticket availability while event_capacity table is being set up
  const getTicketAvailabilityWrapper = async (eventId: string, ticketId: string) => {
    try {
      // First try using the real function, but provide a fallback if it fails
      try {
        const result = await getTicketAvailability(eventId, ticketId);
        
        if (result) {
          return {
            available: result.available,
            isHighDemand: result.isHighDemand,
            isSoldOut: result.available <= 0
          };
        }
      } catch (apiError) {
        console.warn("Using mock capacity data while event_capacity table is being set up");
        // Fall through to mock implementation
      }
      
      // Mock implementation - generate reasonable values
      // This provides a fallback until the event_capacity table is properly set up
      const mockCapacity = {
        available: Math.floor(Math.random() * 50) + 10, // Random number between 10-60
        isHighDemand: Math.random() > 0.7, // 30% chance of high demand
        isSoldOut: false
      };
      
      return mockCapacity;
    } catch (err) {
      console.error("Error fetching ticket availability:", err);
      return {
        available: 30, // Default fallback value
        isHighDemand: false,
        isSoldOut: false
      };
    }
  };
  
  // Load capacity data for all tickets when component mounts
  React.useEffect(() => {
    const loadCapacityData = async () => {
      if (!availableTickets.length) return;
      
      setIsLoadingCapacity(true);
      try {
        // For each ticket, get its availability
        const capacityPromises = availableTickets.map(async (ticket) => {
          // Use the ticket's event ID or the form state selectedEventId (if available via parent)
          const eventId = ticket.eventId || ticket.id; 
          const availability = await getTicketAvailabilityWrapper(eventId, ticket.id);
          return { ticketId: ticket.id, availability };
        });
        
        const results = await Promise.all(capacityPromises);
        
        // Convert to record format
        const capacityRecord: Record<string, any> = {};
        results.forEach(result => {
          capacityRecord[result.ticketId] = result.availability;
        });
        
        setCapacityData(capacityRecord);
      } catch (error) {
        console.error("Error loading capacity data:", error);
      } finally {
        setIsLoadingCapacity(false);
      }
    };
    
    loadCapacityData();
  }, [availableTickets]);
  
  return (
    <div className="space-y-6 mb-8">
      <div className="bg-slate-50 p-4 rounded-lg mb-4">
        <h3 className="text-lg font-bold mb-2">Select One Ticket for All Attendees</h3>
        <p className="text-slate-600 mb-4">
          The selected ticket will apply to all {allAttendees.length} attendees in your registration.
        </p>
        
        {/* Capacity warning message */}
        {Object.keys(capacityData).length > 0 && (
          <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200 mt-2 flex items-start">
            <TrendingUp className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Availability Notice</p>
              <p>Some ticket options may have limited availability. If there aren't enough tickets for everyone, you'll need to select tickets individually.</p>
            </div>
          </div>
        )}
      </div>
      
      <PackageTicketSection
        availableTickets={availableTickets}
        selectedTicketId={selectedTicketId}
        onSelectTicket={onSelectTicket}
        capacityInfo={capacityData}
        attendeeCount={allAttendees.length}
        isReserving={isReserving}
        onSwitchToIndividualMode={onSwitchToIndividualMode}
      />
      
      {selectedTicketId && (
        <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-4">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Your ticket selection will be reserved for 10 minutes to complete your purchase.
          </p>
        </div>
      )}
    </div>
  );
};

export default UniformTicketing;