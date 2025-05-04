import { useState, useEffect } from 'react';
import { useReservationBypass } from './useReservationBypass';
import { Reservation } from '../shared/types/register';

export const useReservation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  
  // Use our bypass system instead of the real reservation system
  const bypassReservation = useReservationBypass();
  
  // Configure the entire system to support the bypass approach
  useEffect(() => {
    // Define our namespace on window to ensure our flags are accessible
    if (!window._lodgetix) {
      window._lodgetix = {
        bypass: true,
        preventRedirect: true
      };
    }
    
    // Set all flags to prevent redirect behavior
    localStorage.setItem('lodgetix_using_bypass', 'true');
    localStorage.setItem('lodgetix_bypass_no_redirect', 'true');
    localStorage.setItem('lodgetix_disable_expiry', 'true');
    
    // Remove any recovery drafts that might cause redirects
    try {
      localStorage.removeItem('registrationProgress');
    } catch (e) {
      console.log('Failed to clear registration progress:', e);
    }
    
    // Create a periodic checker that refreshes these flags
    const intervalId = setInterval(() => {
      localStorage.setItem('lodgetix_bypass_no_redirect', 'true');
      localStorage.setItem('lodgetix_disable_expiry', 'true');
    }, 10000);
    
    // Get any stored reservation without checking expiry
    const storedReservation = bypassReservation.getStoredReservation();
    if (storedReservation) {
      setReservations([storedReservation]);
    }
    
    return () => clearInterval(intervalId);
  }, []);
  
  /**
   * Reserve tickets for an event
   */
  const reserve = async (
    eventId: string,
    ticketDefinitionId: string,
    quantity: number
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the bypass reservation system
      const result = await bypassReservation.reserve(
        eventId,
        ticketDefinitionId,
        quantity
      );
      
      if (result.success && result.data) {
        setReservations(result.data);
        setLoading(false);
        return result;
      } else {
        throw new Error(result.error || 'Unknown reservation error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error in useReservation.reserve:', errorMessage);
      setError(errorMessage);
      setLoading(false);
      return {
        success: false,
        error: errorMessage
      };
    }
  };
  
  /**
   * Complete a reservation after payment
   */
  const complete = async (
    reservationId: string,
    attendeeId: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the bypass completion system
      const result = await bypassReservation.complete(
        reservationId,
        attendeeId
      );
      
      if (result.success) {
        setReservations(null);
        setLoading(false);
        return result;
      } else {
        throw new Error(result.error || 'Unknown completion error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error in useReservation.complete:', errorMessage);
      setError(errorMessage);
      setLoading(false);
      return {
        success: false,
        error: errorMessage
      };
    }
  };
  
  /**
   * Cancel a reservation
   */
  const cancelReservation = async (
    reservationId: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the bypass cancellation system
      const success = await bypassReservation.cancel(reservationId);
      
      if (success) {
        setReservations(null);
        setLoading(false);
        return true;
      } else {
        throw new Error('Failed to cancel reservation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error in useReservation.cancelReservation:', errorMessage);
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };
  
  return {
    loading,
    error,
    reservations,
    reserve,
    complete,
    cancelReservation
  };
};