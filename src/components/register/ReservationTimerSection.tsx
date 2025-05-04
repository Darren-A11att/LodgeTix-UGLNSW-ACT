import React, { useEffect, useState } from 'react';
import { useReservation } from '../../context/ReservationContext';
import ReservationTimer from './ReservationTimer';

const ReservationTimerSection: React.FC = () => {
  const { reservation } = useReservation();
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  
  // Extract expiry time from the reservation
  useEffect(() => {
    if (reservation) {
      setExpiryTime(reservation.expiresAt);
    } else {
      // If no reservation from context, try to load from localStorage directly (fallback)
      try {
        const storedReservationJson = localStorage.getItem('lodgetix_bypass_reservation');
        const storedExpiry = localStorage.getItem('lodgetix_bypass_expiry');
        
        if (storedReservationJson && storedExpiry) {
          const expiryTimestamp = parseInt(storedExpiry);
          if (!isNaN(expiryTimestamp)) {
            setExpiryTime(new Date(expiryTimestamp));
          }
        }
      } catch (error) {
        console.error('Failed to load reservation data from localStorage:', error);
      }
    }
  }, [reservation]);

  // If no reservation is active, don't render anything
  if (!expiryTime) {
    return null;
  }

  return (
    <div className="sticky top-24">
      <ReservationTimer 
        expiryTime={expiryTime}
      />
    </div>
  );
};

export default ReservationTimerSection;