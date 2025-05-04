import React, { useEffect, useState } from 'react';
import { ReservationService } from '../../lib/reservationService.realtime';
import ReservationTimer from './ReservationTimer';
import { TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react';

interface ReservationStatusProps {
  eventId: string;
  ticketDefinitionId: string;
  reservationId?: string;
  expiresAt?: string;
}

/**
 * Reservation Status Section with Realtime Updates
 * Shows capacity, timer, and other users viewing/reserving with live updates
 */
const ReservationTimerSection: React.FC<ReservationStatusProps> = ({
  eventId,
  ticketDefinitionId,
  reservationId,
  expiresAt,
}) => {
  // Capacity state
  const [capacity, setCapacity] = useState({
    available: 0,
    total: 0,
    reserved: 0,
    sold: 0,
    percentage: 0,
  });

  // State for high demand status
  const [isHighDemand, setIsHighDemand] = useState(false);
  
  // State for presence tracking
  const [presenceData, setPresenceData] = useState({
    viewerCount: 0,
    reservingCount: 0,
  });

  // Effect to initialize and clean up realtime connections
  useEffect(() => {
    if (!eventId) return;
    
    // Initialize realtime connections
    ReservationService.initializeRealtimeConnections(eventId);
    
    // Listen for presence updates
    const handlePresenceUpdate = (event: CustomEvent) => {
      setPresenceData({
        viewerCount: event.detail.totalViewers,
        reservingCount: event.detail.totalReserving,
      });
    };
    
    // Add event listener for presence updates
    window.addEventListener(
      'ticket-presence-update', 
      handlePresenceUpdate as EventListener
    );
    
    // Subscribe to capacity changes
    const unsubscribeCapacity = ReservationService.subscribeToCapacityChanges(
      eventId,
      (data) => {
        setCapacity({
          available: data.available,
          total: data.maxCapacity,
          reserved: data.reservedCount,
          sold: data.soldCount,
          percentage: data.usagePercentage,
        });
      }
    );
    
    // Subscribe to high demand notifications
    const unsubscribeHighDemand = ReservationService.subscribeToHighDemandNotifications(
      eventId,
      () => {
        setIsHighDemand(true);
      }
    );
    
    // Check initial high demand status
    ReservationService.isTicketHighDemand(eventId, ticketDefinitionId).then(setIsHighDemand);
    
    // Cleanup function
    return () => {
      window.removeEventListener(
        'ticket-presence-update', 
        handlePresenceUpdate as EventListener
      );
      unsubscribeCapacity();
      unsubscribeHighDemand();
      ReservationService.cleanupRealtimeConnections();
    };
  }, [eventId, ticketDefinitionId]);

  // Determine capacity status class
  const getCapacityStatusClass = () => {
    if (capacity.percentage >= 90) return 'bg-red-50 border-red-200 text-red-700';
    if (capacity.percentage >= 70) return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-blue-50 border-blue-200 text-blue-700';
  };

  // Determine capacity message
  const getCapacityMessage = () => {
    if (capacity.percentage >= 90) return 'Very limited availability';
    if (capacity.percentage >= 70) return 'Going fast';
    return 'Good availability';
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Reservation timer */}
      {reservationId && expiresAt && (
        <div className="bg-blue-50 p-3 rounded-md border border-blue-200 flex items-start">
          <Clock className="w-5 h-5 mr-2 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-800">Your tickets are reserved</p>
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">Complete your purchase within:</span>
              <ReservationTimer expiryTime={expiresAt} />
            </div>
          </div>
        </div>
      )}
      
      {/* High demand warning */}
      {isHighDemand && (
        <div className="bg-amber-50 p-3 rounded-md border border-amber-200 flex items-start">
          <TrendingUp className="w-5 h-5 mr-2 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">High demand</p>
            <p className="text-amber-600">
              This event is in high demand. Complete your purchase soon to secure your tickets.
            </p>
          </div>
        </div>
      )}
      
      {/* Capacity status */}
      {capacity.total > 0 && (
        <div className={`p-3 rounded-md border flex items-start ${getCapacityStatusClass()}`}>
          <AlertTriangle className={`w-5 h-5 mr-2 mt-0.5 flex-shrink-0 ${isHighDemand ? 'text-amber-600' : 'text-blue-600'}`} />
          <div>
            <p className="font-medium">{getCapacityMessage()}</p>
            <p>
              {capacity.available} of {capacity.total} tickets available
              {capacity.percentage > 0 && ` (${capacity.percentage}% booked)`}
            </p>
          </div>
        </div>
      )}
      
      {/* Other users viewing */}
      {presenceData.viewerCount > 1 && (
        <div className="bg-slate-50 p-3 rounded-md border border-slate-200 flex items-start">
          <Users className="w-5 h-5 mr-2 text-slate-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-slate-800">
              {presenceData.viewerCount - 1} other {presenceData.viewerCount - 1 === 1 ? 'person' : 'people'} viewing
            </p>
            {presenceData.reservingCount > 0 && (
              <p className="text-slate-600">
                {presenceData.reservingCount} {presenceData.reservingCount === 1 ? 'person' : 'people'} currently reserving tickets
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationTimerSection;