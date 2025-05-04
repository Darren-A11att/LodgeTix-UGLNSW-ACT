// Type extensions for the Window object to support our bypass system
interface Window {
  // Flag to disable state synchronization warnings
  _disableSyncWarning?: boolean;
  
  // Flag to indicate bypass reservation is active
  _bypassReservationActive?: boolean;
  
  // Flag for active reservation state
  _reservationActive?: boolean;
  
  // Namespace for our application flags
  _lodgetix?: {
    bypass: boolean;
    preventRedirect: boolean;
    [key: string]: any; // Allow additional properties
  };
}