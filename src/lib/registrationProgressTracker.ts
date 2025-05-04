import { FormState } from '../shared/types/register';
import { ProgressStep } from '../hooks/useRegistrationProgress';
import { AttendeeData } from '../lib/api/registrations';

// Constants for localStorage
const PROGRESS_DATA_PREFIX = 'lodgetix_progress_';
const PROGRESS_INDEX_KEY = 'lodgetix_progress_index';

// Registration step names for displaying in UI
export enum RegistrationStep {
  SelectType = 1,
  AttendeeDetails = 2,
  TicketSelection = 3,
  OrderSummary = 4,
  Payment = 5,
  Confirmation = 6
}

// Define the structure for saved registration progress
export interface RegistrationProgress {
  registrationType: string;
  draftId: string;
  lastStep: number;
  attendeeCount: number;
  attendeeTypes: {
    masons: number;
    guests: number;
    ladyPartners: number;
    guestPartners: number;
  };
  eventId?: string;
  eventTitle?: string;
  ticketIds?: string[];
  reservationId?: string | null;
  expiresAt?: string | null;
  lastUpdated: number;
  
  currentStep?: ProgressStep;
  completedSteps?: ProgressStep[];

  hasAttemptedPayment?: boolean;
  deviceInfo?: { isMobile: boolean; browser: string; os: string };
  lastInteractionTime?: number;
  
  isAbandoned?: boolean;
  isComplete?: boolean;
}

/**
 * Update the progress index to track all progress entries by type
 */
const updateProgressIndex = (registrationType: string): void => {
  try {
    // Get current index
    const indexJson = localStorage.getItem(PROGRESS_INDEX_KEY);
    const index = indexJson ? JSON.parse(indexJson) : {};
    
    // Ensure the registration type exists in the index
    if (!index[registrationType]) {
      index[registrationType] = true;
    }
    
    // Save updated index
    localStorage.setItem(PROGRESS_INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    console.error('Error updating progress index:', error);
  }
};

/**
 * Save progress for a specific registration type
 */
export function saveRegistrationProgress(
  registrationType: string,
  draftId: string,
  data: Partial<RegistrationProgress>
): void {
  try {
    const allProgress = getAllRegistrationProgress();
    const existingProgress = allProgress[registrationType] || {};
    
    // Ensure essential identifiers are present if creating new
    const currentData: RegistrationProgress = {
      ...(existingProgress as RegistrationProgress), // Cast existing if needed
      ...data, // Apply new data
      registrationType: registrationType, // Ensure these are set
      draftId: draftId,                 // Ensure these are set
      lastUpdated: Date.now(),          // Always update timestamp
    };

    // Filter out undefined values before saving, if desired
    Object.keys(currentData).forEach(key => {
        if (currentData[key as keyof RegistrationProgress] === undefined) {
            delete currentData[key as keyof RegistrationProgress];
        }
    });

    allProgress[registrationType] = currentData;
    localStorage.setItem('registrationProgress', JSON.stringify(allProgress));
  } catch (error) {
    console.error("Failed to save registration progress:", error);
  }
}

/**
 * Get progress data for a specific registration type
 */
export function getRegistrationProgress(registrationType: string): RegistrationProgress | null {
  try {
    const allProgress = getAllRegistrationProgress();
    return allProgress[registrationType] || null;
  } catch (error) {
    console.error("Failed to get registration progress:", error);
    return null;
  }
}

/**
 * Get all registration progress data
 */
export function getAllRegistrationProgress(): Record<string, RegistrationProgress> {
  try {
    const storedProgress = localStorage.getItem('registrationProgress');
    return storedProgress ? JSON.parse(storedProgress) : {};
  } catch (error) {
    console.error("Failed to get all registration progress:", error);
    return {};
  }
}

/**
 * Check if progress exists for a specific registration type
 */
export const hasRegistrationProgress = (registrationType: string): boolean => {
  try {
    const indexJson = localStorage.getItem(PROGRESS_INDEX_KEY);
    if (!indexJson) return false;
    
    const index = JSON.parse(indexJson);
    return !!index[registrationType];
  } catch (error) {
    console.error('Error checking for registration progress:', error);
    return false;
  }
};

/**
 * Delete progress data for a specific registration type
 */
export function clearRegistrationProgress(registrationType: string): void {
  try {
    const allProgress = getAllRegistrationProgress();
    delete allProgress[registrationType];
    localStorage.setItem('registrationProgress', JSON.stringify(allProgress));
  } catch (error) {
    console.error("Failed to clear registration progress:", error);
  }
}

/**
 * Generates a summary string of attendees.
 * Uses the updated FormState structure.
 */
export function getAttendeeSummary(formState: FormState): string {
  const attendees = formState.attendees || [];
  if (attendees.length === 0) {
    return 'No attendees added yet';
  }
  
  const counts = attendees.reduce((acc, att) => {
    acc[att.attendeeType] = (acc[att.attendeeType] || 0) + 1;
    return acc;
  }, {} as Record<AttendeeData['attendeeType'], number>);

  const parts: string[] = [];
  if (counts.Mason) parts.push(`${counts.Mason} Mason${counts.Mason !== 1 ? 's' : ''}`);
  if (counts.Guest) parts.push(`${counts.Guest} Guest${counts.Guest !== 1 ? 's' : ''}`);
  if (counts.LadyPartner) parts.push(`${counts.LadyPartner} Lady Partner${counts.LadyPartner !== 1 ? 's' : ''}`);
  if (counts.GuestPartner) parts.push(`${counts.GuestPartner} Guest Partner${counts.GuestPartner !== 1 ? 's' : ''}`);
  
  if (parts.length === 0) {
      return 'Attendee details added';
  } else if (parts.length === 1) {
      return parts[0];
  } else {
      const lastPart = parts.pop();
      return `${parts.join(', ')} and ${lastPart}`;
  }
}

/**
 * Get the name of a step by its number
 */
export const getStepName = (stepNumber: number): string => {
  switch (stepNumber) {
    case RegistrationStep.SelectType:
      return 'Registration Type';
    case RegistrationStep.AttendeeDetails:
      return 'Attendee Details';
    case RegistrationStep.TicketSelection:
      return 'Ticket Selection';
    case RegistrationStep.OrderSummary:
      return 'Order Summary';
    case RegistrationStep.Payment:
      return 'Payment';
    case RegistrationStep.Confirmation:
      return 'Confirmation';
    default:
      return `Step ${stepNumber}`;
  }
};

/**
 * Calculate progress percentage based on step number
 */
export const calculateProgress = (step: number): number => {
  const totalSteps = 6; // Number of steps in the registration process
  return Math.floor((step / totalSteps) * 100);
};

/**
 * Detect device type and browser
 */
export const getDeviceInfo = (): { isMobile: boolean; browser: string; os: string } => {
  const userAgent = navigator.userAgent;
  
  // Check if mobile
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
  
  // Detect browser
  let browser = 'Unknown';
  if (userAgent.indexOf('Chrome') !== -1) browser = 'Chrome';
  else if (userAgent.indexOf('Safari') !== -1) browser = 'Safari';
  else if (userAgent.indexOf('Firefox') !== -1) browser = 'Firefox';
  else if (userAgent.indexOf('MSIE') !== -1 || userAgent.indexOf('Trident/') !== -1) browser = 'IE';
  else if (userAgent.indexOf('Edge') !== -1) browser = 'Edge';
  
  // Detect OS
  let os = 'Unknown';
  if (userAgent.indexOf('Windows') !== -1) os = 'Windows';
  else if (userAgent.indexOf('Mac') !== -1) os = 'MacOS';
  else if (userAgent.indexOf('Linux') !== -1) os = 'Linux';
  else if (userAgent.indexOf('Android') !== -1) os = 'Android';
  else if (userAgent.indexOf('iOS') !== -1 || userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) os = 'iOS';
  
  return { isMobile, browser, os };
};

/**
 * Update progress with attendee counts from form state
 */
export const updateAttendeeProgressData = (formState: FormState): Partial<RegistrationProgress> => {
  const attendees = formState.attendees || [];
  
  // Calculate counts by attendee type
  const attendeeCountsByType = attendees.reduce((counts, attendee) => {
    const type = attendee.attendeeType; // Use the type from AttendeeData
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {} as Record<AttendeeData['attendeeType'], number>);
  
  return {
    attendeeCount: attendees.length,
    attendeeTypes: {
      masons: attendeeCountsByType['Mason'] || 0,
      guests: attendeeCountsByType['Guest'] || 0,
      ladyPartners: attendeeCountsByType['LadyPartner'] || 0,
      guestPartners: attendeeCountsByType['GuestPartner'] || 0
    }
  };
};

/**
 * Mark a registration as abandoned
 */
export const markRegistrationAbandoned = (registrationType: string): void => {
  try {
    const progress = getRegistrationProgress(registrationType);
    if (progress) {
      saveRegistrationProgress(registrationType, progress.draftId, {
        isAbandoned: true
      });
    }
  } catch (error) {
    console.error('Error marking registration as abandoned:', error);
  }
};

/**
 * Mark a registration as completed
 */
export const markRegistrationComplete = (registrationType: string): void => {
  try {
    const progress = getRegistrationProgress(registrationType);
    if (progress) {
      saveRegistrationProgress(registrationType, progress.draftId, {
        isComplete: true,
        lastStep: RegistrationStep.Confirmation
      });
    }
  } catch (error) {
    console.error('Error marking registration as complete:', error);
  }
};

/**
 * Saves minimal progress indicating abandonment
 */
export function saveAbandonedProgress(registrationType: string, draftId: string): void {
  saveRegistrationProgress(registrationType, draftId, { isAbandoned: true });
}