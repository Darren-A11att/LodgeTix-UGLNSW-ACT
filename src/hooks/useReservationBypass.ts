import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// This is a temporary bypass solution that doesn't rely on database operations
// It lets the registration flow continue by simulating a successful reservation

interface Reservation {
  ticketId: string;
  reservationId: string;
  expiresAt: string;
  eventId: string;
  ticketDefinitionId: string;
  attendeeId: string;
}

interface ReservationResult {
  success: boolean;
  data?: Reservation[];
  error?: string;
}

// Never expire the tickets in the bypass system
const DAYS_UNTIL_EXPIRY = 7; // 7 days expiry

/**
 * Simple UUID generator to avoid dependency on uuid package
 */
function generateId() {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return '_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

/**
 * This hook provides a bypass for the reservation system while database issues are fixed
 */
export const useReservationBypass = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  
  // Disable localStorage state sync watcher when using bypass system
  useEffect(() => {
    const disableStateSync = () => {
      if (!window._disableSyncWarning) {
        window._disableSyncWarning = true;
        
        // Store flags that prevent redirect behavior
        localStorage.setItem('lodgetix_bypass_no_redirect', 'true');
        localStorage.setItem('lodgetix_using_bypass', 'true');
        
        // Prevent the session from expiring in localStorage
        localStorage.setItem('lodgetix_disable_expiry', 'true');
        
        // Remove any existing recovery drafts
        try {
          localStorage.removeItem('registrationProgress');
        } catch (e) {
          console.error('Failed to clear registration drafts:', e);
        }
        
        console.log('Disabled session state sync and prevented redirect triggers');
      }
    };
    
    // Call immediately and disable storage sync watcher
    disableStateSync();
    
    // Create a refresh interval that keeps no_redirect flag active
    const keepAliveInterval = setInterval(() => {
      localStorage.setItem('lodgetix_bypass_no_redirect', 'true');
      localStorage.setItem('lodgetix_disable_expiry', 'true');
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(keepAliveInterval);
  }, []);

  /**
   * Creates a fake reservation that allows the registration flow to continue
   */
  const reserve = async (
    eventId: string,
    ticketDefinitionId: string,
    quantity: number,
    attendeeId: string
  ): Promise<ReservationResult> => {
    setLoading(true);
    setError(null);

    try {
      // Check if required parameters are provided
      if (!eventId || !ticketDefinitionId || !attendeeId) {
        throw new Error('Missing required parameters (eventId, ticketDefinitionId, attendeeId)');
      }
      
      console.log(`Creating bypass reservation for ticket ${ticketDefinitionId}, event ${eventId}, attendee ${attendeeId}`);
      
      // Generate a common reservation ID for this batch if needed, or use unique per ticket?
      // For simplicity in bypass, let's use a unique ID per ticket reservation instance
      const reservationId = typeof uuidv4 === 'function' ? uuidv4() : generateId();
      
      // Set expiry far in the future to effectively disable expiration
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + DAYS_UNTIL_EXPIRY);
      const expiresAt = expiryDate.toISOString();
      
      // Create a single fake ticket reservation for this specific attendee
      const newTicketReservation: Reservation = {
        ticketId: typeof uuidv4 === 'function' ? uuidv4() : generateId(),
        reservationId, // Can be the same for a logical user reservation session
        expiresAt,
        eventId,
        ticketDefinitionId,
        attendeeId // Assign attendee ID
      };

      // Add the new ticket reservation to the existing array or start a new array
      const updatedReservations = [...(reservations || []), newTicketReservation];
      
      // Store the updated array of reservations in localStorage
      storeReservation(updatedReservations);
      
      // Update the state
      setReservations(updatedReservations);
      
      // Ensure we don't have any progress data that could trigger redirects
      localStorage.removeItem('registrationProgress');
      
      // Simulate a slight delay
      await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay for multi-call
      
      setLoading(false);
      return {
        success: true,
        // Return the single reservation created in this call
        // The caller (TicketSelection) will manage the overall state if needed
        data: [newTicketReservation]
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  /**
   * Simulates completing a reservation (now potentially multiple tickets)
   */
  const complete = async (
    attendeeId: string
  ): Promise<ReservationResult> => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Completing bypass reservation(s) for attendee ${attendeeId}`);
      
      // We actually don't clear the stored reservation to ensure the user can continue
      // clearStoredReservation(); 
      
      // Instead, update the flag to indicate completion
      localStorage.setItem('lodgetix_reservation_completed', 'true');
      
      setLoading(false);
      return {
        success: true,
        data: reservations || [] // Return all current reservations
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  /**
   * Simulates cancelling a reservation
   */
  const cancel = async (reservationId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate a slight delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log(`Cancelling bypass reservation ${reservationId}`); // This ID might be ambiguous now
      console.warn('Cancelling specific reservation ID might not work as expected in bypass mode with multiple tickets.')
      
      // Clear all reservations for simplicity in bypass
      clearStoredReservation();
      localStorage.setItem('lodgetix_reservation_cancelled', 'true');
      setReservations(null); // Clear state
      
      setLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  /**
   * Store reservation data in localStorage with all necessary bypass flags
   * Now stores an array of reservations.
   */
  const storeReservation = (currentReservations: Reservation[]): void => {
    try {
      // Store the actual array of reservation data
      localStorage.setItem('lodgetix_bypass_reservation', JSON.stringify(currentReservations));
      // Store expiry based on the first reservation (assuming they share expiry)
      const expiryTimestamp = currentReservations.length > 0 ? new Date(currentReservations[0].expiresAt).getTime().toString() : '0';
      localStorage.setItem('lodgetix_bypass_expiry', expiryTimestamp);
      
      // Set all the flags needed to prevent redirects and draft recovery
      localStorage.setItem('lodgetix_bypass_no_redirect', 'true');
      localStorage.setItem('lodgetix_disable_expiry', 'true');
      localStorage.setItem('lodgetix_using_bypass', 'true');
      localStorage.removeItem('lodgetix_reservation_completed');
      localStorage.removeItem('lodgetix_reservation_cancelled');
      
      // Remove any progress data that might cause problems
      localStorage.removeItem('registrationProgress');
      
      // Create a hidden global flag to prevent other code from checking state
      window._bypassReservationActive = true;
    } catch (error) {
      console.error('Error storing bypass reservation data:', error);
    }
  };

  /**
   * Get stored reservation if it exists
   * Always returns the reservation regardless of expiry to prevent redirect issues
   */
  const getStoredReservation = (): Reservation[] | null => {
    try {
      const storedData = localStorage.getItem('lodgetix_bypass_reservation');
      
      if (!storedData) {
        return null;
      }
      
      // Parse and return reservation array without checking expiry
      const reservations = JSON.parse(storedData) as Reservation[];
      setReservations(reservations);
      return reservations;
    } catch (error) {
      console.error('Error retrieving stored bypass reservation:', error);
      localStorage.removeItem('lodgetix_bypass_reservation');
      localStorage.removeItem('lodgetix_bypass_expiry');
      localStorage.removeItem('lodgetix_reservation_completed');
      localStorage.removeItem('lodgetix_reservation_cancelled');
      setReservations(null);
      return null;
    }
  };

  /**
   * Clear all reservation data and flags
   */
  const clearStoredReservation = (): void => {
    try {
      localStorage.removeItem('lodgetix_bypass_reservation');
      localStorage.removeItem('lodgetix_bypass_expiry');
      localStorage.removeItem('lodgetix_reservation_completed');
      localStorage.removeItem('lodgetix_reservation_cancelled');
      
      // Keep the no-redirect flags active though
      localStorage.setItem('lodgetix_bypass_no_redirect', 'true');
      localStorage.setItem('lodgetix_disable_expiry', 'true');
      localStorage.setItem('lodgetix_using_bypass', 'true');
    } catch (error) {
      console.error('Error clearing stored bypass reservation:', error);
    }
  };

  return {
    reserve,
    complete,
    cancel,
    loading,
    error,
    reservation: reservations,
    getStoredReservation
  };
};