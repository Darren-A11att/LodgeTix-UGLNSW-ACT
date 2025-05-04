/**
 * This module provides helper functions to prevent unwanted redirects
 * when using the ticket reservation bypass system.
 */

/**
 * Sets all flags needed to prevent redirect behavior
 */
export function preventRedirect(): void {
  try {
    // Set all localStorage flags needed to prevent redirects
    localStorage.setItem('lodgetix_bypass_no_redirect', 'true');
    localStorage.setItem('lodgetix_using_bypass', 'true');
    localStorage.setItem('lodgetix_disable_expiry', 'true');
    
    // Prevent expiration by setting a far future expiry
    const farFutureDate = new Date();
    farFutureDate.setDate(farFutureDate.getDate() + 7); // 7 days
    localStorage.setItem('lodgetix_override_expiry', farFutureDate.toISOString());
    
    // Remove any recovery drafts
    localStorage.removeItem('registrationProgress');
    
    // Set global flags on window object
    if (!window._lodgetix) {
      window._lodgetix = {
        bypass: true,
        preventRedirect: true
      };
    } else {
      window._lodgetix.preventRedirect = true;
    }
    
    window._disableSyncWarning = true;
    window._bypassReservationActive = true;
    
    console.log('Redirect prevention enabled');
  } catch (error) {
    console.error('Error setting redirect prevention flags:', error);
  }
}

/**
 * Checks if the redirect prevention is active
 */
export function isRedirectPreventionActive(): boolean {
  try {
    // Check localStorage flags
    const hasNoRedirectFlag = localStorage.getItem('lodgetix_bypass_no_redirect') === 'true';
    const isUsingBypass = localStorage.getItem('lodgetix_using_bypass') === 'true';
    const disablesExpiry = localStorage.getItem('lodgetix_disable_expiry') === 'true';
    
    // Check global window flags
    const hasWindowFlags = window._lodgetix?.preventRedirect === true ||
                          window._disableSyncWarning === true ||
                          window._bypassReservationActive === true;
    
    return (hasNoRedirectFlag || isUsingBypass || disablesExpiry || hasWindowFlags);
  } catch (e) {
    return false;
  }
}

/**
 * Starts a keepalive process that maintains the redirect prevention flags
 * Returns a cleanup function to clear the interval
 */
export function startRedirectPreventionKeepAlive(): () => void {
  // Set flags immediately
  preventRedirect();
  
  // Refresh flags periodically
  const intervalId = setInterval(() => {
    localStorage.setItem('lodgetix_bypass_no_redirect', 'true');
    localStorage.setItem('lodgetix_disable_expiry', 'true');
  }, 5000); // Every 5 seconds
  
  // Return function to clear interval
  return () => clearInterval(intervalId);
}

export default {
  preventRedirect,
  isRedirectPreventionActive,
  startRedirectPreventionKeepAlive
};