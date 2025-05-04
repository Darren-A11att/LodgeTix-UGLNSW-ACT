import { useState, useEffect, useCallback, useContext } from 'react';
import { FormState } from '../shared/types/register';
import { RegisterFormContext } from '../context/RegisterFormContext';
import { 
  saveRegistrationProgress, 
  getRegistrationProgress, 
  clearRegistrationProgress,
  getAllRegistrationProgress,
  getAttendeeSummary,
  RegistrationProgress
} from '../lib/registrationProgressTracker';
import { AttendeeData } from '../lib/api/registrations';

/**
 * Step type for tracking progress through the registration flow
 */
export type ProgressStep = 'registration-type' | 'attendee-details' | 'ticket-selection' | 'payment';
const STEP_ORDER: ProgressStep[] = ['registration-type', 'attendee-details', 'ticket-selection', 'payment'];

interface StepProgress {
  currentStep: ProgressStep;
  completedSteps: ProgressStep[];
  isStepCompleted: (step: ProgressStep) => boolean;
  isStepAvailable: (step: ProgressStep) => boolean;
  moveToStep: (step: ProgressStep) => void;
  completeStep: (step: ProgressStep) => void;
  getNextAvailableStep: () => ProgressStep | null;
  getProgressPercentage: () => number; // 0-100 percentage
}

interface UseRegistrationProgressProps {
  formState?: FormState;
  draftId?: string;
}

interface UseRegistrationProgressResult extends StepProgress {
  saveProgress: (registrationType: string, draftId: string, data: Partial<RegistrationProgress>) => void;
  getProgress: (registrationType: string) => RegistrationProgress | null;
  clearProgress: (registrationType: string) => void;
  getAllProgress: () => Record<string, RegistrationProgress>;
  hasProgress: (registrationType: string) => boolean;
  getAttendeeSummaryText: (formState: any) => string;
}

/**
 * Hook for tracking registration progress through steps and persisting progress data
 */
export function useRegistrationProgress({
  formState: propFormState,
  draftId
}: UseRegistrationProgressProps = {}): UseRegistrationProgressResult {
  // Get form context if not provided directly
  const formContext = useContext(RegisterFormContext);
  const formState = propFormState || formContext.formState;
  const updateFormState = formContext.updateFormState;
  
  const [progressData, setProgressData] = useState<Record<string, RegistrationProgress>>({});
  
  // Load all progress data on initial mount
  useEffect(() => {
    setProgressData(getAllRegistrationProgress());
  }, []);

  // Save current progress if formState and draftId are provided
  useEffect(() => {
    // Check if we're using the bypass system and should skip saving progress
    const isUsingBypass = localStorage.getItem('lodgetix_using_bypass') === 'true';
    const hasNoRedirectFlag = localStorage.getItem('lodgetix_bypass_no_redirect') === 'true';
    
    // If we're using the bypass system, skip this effect to prevent issues with expiry
    if (isUsingBypass && hasNoRedirectFlag) {
      console.log('Using reservation bypass system - skipping progress tracking');
      return;
    }
    
    if (formState?.registrationType && draftId && formState.attendees) {
      // Get the selected event details if available
      let eventTitle: string | undefined = undefined;
      let eventDate: string | undefined = undefined;
      
      // Assuming events are imported or available in scope
      if (formState.selectedEventId) {
        try {
          // This would typically be a lookup in your events data
          // For now we're just setting a placeholder
          eventTitle = "Selected Event";
        } catch (error) {
          console.error('Error getting event details:', error);
        }
      }
      
      // Calculate total attendee count and counts by type from the unified array
      const attendees: AttendeeData[] = formState.attendees || [];
      const totalAttendeeCount = attendees.length;
      const attendeeCountsByType = attendees.reduce((counts, attendee) => {
        const type = attendee.attendeeType; // Use the type from AttendeeData
        counts[type] = (counts[type] || 0) + 1;
        return counts;
      }, {} as Record<AttendeeData['attendeeType'], number>);

      // Collect ticket IDs from the unified array
      const ticketIds = attendees
        .map(att => att.ticket?.ticketDefinitionId) // Access ticketDefinitionId from the ticket object
        .filter((id): id is string => Boolean(id)); // Type guard for filtering
      
      // Check for reservation ID and expiry from the unified array
      let reservationId: string | undefined | null = undefined;
      let expiresAt: string | undefined | null = undefined; // Should match DB type (timestamptz)
      
      // Find the first attendee with reservation info
      const attendeeWithReservation = attendees.find(att => 
        att.ticket && 
        (att.ticket as any).reservationId // Cast to any temporarily if reservationId not on AttendeeData.ticket
      );

      if (attendeeWithReservation) {
          // TODO: Add reservationId and expiresAt to AttendeeData.ticket if needed
          // For now, using temporary cast to check logic flow
          reservationId = (attendeeWithReservation.ticket as any)?.reservationId;
          expiresAt = (attendeeWithReservation.ticket as any)?.expiresAt; 
      }
      
      // If using the bypass system, set a far future expiry to prevent redirection
      if (isUsingBypass) {
        const farFutureDate = new Date();
        farFutureDate.setDate(farFutureDate.getDate() + 7); // 7 days in the future
        expiresAt = farFutureDate.toISOString();
      }
      
      // Check if we're in payment step, which counts as payment attempt
      const hasAttemptedPayment = formState.step >= 5;
      
      // Get device info for analytics
      let deviceInfo;
      try {
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
        
        deviceInfo = { isMobile, browser, os };
      } catch (e) {
        console.error('Error detecting device info:', e);
      }
      
      // Track interaction time for analytics
      const lastInteractionTime = Date.now();
      
      const progressUpdate: Partial<RegistrationProgress> = {
        lastStep: formState.step,
        attendeeCount: totalAttendeeCount,
        attendeeTypes: {
          masons: attendeeCountsByType['Mason'] || 0,
          guests: attendeeCountsByType['Guest'] || 0,
          ladyPartners: attendeeCountsByType['LadyPartner'] || 0,
          guestPartners: attendeeCountsByType['GuestPartner'] || 0
        },
        eventId: formState.selectedEventId || undefined,
        eventTitle,
        ticketIds: ticketIds.length > 0 ? ticketIds : undefined,
        reservationId: reservationId ?? undefined,
        expiresAt: expiresAt ?? undefined,
        currentStep: formState.progressData?.currentStep,
        completedSteps: formState.progressData?.completedSteps,
        hasAttemptedPayment,
        deviceInfo,
        lastInteractionTime
      };
      
      saveRegistrationProgress(formState.registrationType, draftId, progressUpdate);
      
      // Update local state
      setProgressData(prev => ({
        ...prev,
        [formState.registrationType]: {
          ...(prev[formState.registrationType] || {}),
          ...progressUpdate,
          registrationType: formState.registrationType,
          draftId,
          lastUpdated: Date.now()
        } as RegistrationProgress
      }));
    }
  }, [formState, draftId]);

  // Function to manually save progress 
  const saveProgress = useCallback((
    registrationType: string, 
    draftId: string, 
    data: Partial<RegistrationProgress>
  ): void => {
    saveRegistrationProgress(registrationType, draftId, data);
    
    // Update local state
    setProgressData(prev => ({
      ...prev,
      [registrationType]: {
        ...(prev[registrationType] || {}),
        ...data,
        registrationType,
        draftId,
        lastUpdated: Date.now()
      } as RegistrationProgress
    }));
  }, []);

  // Function to get progress for a specific registration type
  const getProgress = useCallback((registrationType: string): RegistrationProgress | null => {
    if (progressData[registrationType]) {
      return progressData[registrationType];
    }
    return getRegistrationProgress(registrationType);
  }, [progressData]);

  // Function to clear progress for a specific registration type
  const clearProgress = useCallback((registrationType: string): void => {
    clearRegistrationProgress(registrationType);
    
    // Update local state
    setProgressData(prev => {
      const newData = { ...prev };
      delete newData[registrationType];
      return newData;
    });
  }, []);

  // Function to get all progress data
  const getAllProgress = useCallback((): Record<string, RegistrationProgress> => {
    return progressData;
  }, [progressData]);

  // Function to check if progress exists for a specific registration type
  const hasProgress = useCallback((registrationType: string): boolean => {
    return !!progressData[registrationType];
  }, [progressData]);

  // Wrapper for the getAttendeeSummary function
  const getAttendeeSummaryText = useCallback((formState: any): string => {
    return getAttendeeSummary(formState);
  }, []);

  /**
   * Steps Progress Tracking
   */
  const completedSteps = formState?.progressData?.completedSteps || [];
  const currentStep: ProgressStep = formState?.progressData?.currentStep || 'registration-type';
  
  // Check if a step is completed
  const isStepCompleted = useCallback(
    (step: ProgressStep) => (completedSteps || []).includes(step),
    [completedSteps]
  );
  
  // Get index of a step in the step order
  const getStepIndex = useCallback(
    (step: ProgressStep) => STEP_ORDER.indexOf(step),
    []
  );
  
  // Check if a step is available to navigate to
  const isStepAvailable = useCallback(
    (step: ProgressStep): boolean => {
      const stepIndex = getStepIndex(step);
      const currentStepIndex = getStepIndex(currentStep);
      
      // Current step is always available
      if (step === currentStep) return true;
      
      // Completed steps are available
      if (isStepCompleted(step)) return true;
      
      // Next step is available if all previous steps are completed
      if (stepIndex === currentStepIndex + 1) {
        return STEP_ORDER
          .slice(0, currentStepIndex + 1)
          .every(prevStep => isStepCompleted(prevStep));
      }
      
      return false;
    },
    [currentStep, getStepIndex, isStepCompleted]
  );
  
  // Save progress to form state
  const saveStepProgress = useCallback(
    (newCurrentStep: ProgressStep, newCompletedSteps: ProgressStep[]) => {
      if (updateFormState) {
        updateFormState((prev: FormState) => ({
          ...prev,
          progressData: {
            ...prev.progressData,
            currentStep: newCurrentStep,
            completedSteps: newCompletedSteps,
          },
        }));
      }
    },
    [updateFormState]
  );
  
  // Move to a specific step
  const moveToStep = useCallback(
    (step: ProgressStep) => {
      if (isStepAvailable(step)) {
        saveStepProgress(step, completedSteps);
      }
    },
    [completedSteps, isStepAvailable, saveStepProgress]
  );
  
  // Mark a step as complete and optionally move to next step
  const completeStep = useCallback(
    (step: ProgressStep) => {
      if (!isStepCompleted(step)) {
        const newCompletedSteps = [...(completedSteps || []), step];
        
        // Determine the next step
        const currentIndex = getStepIndex(step);
        const nextStep = currentIndex < STEP_ORDER.length - 1 
          ? STEP_ORDER[currentIndex + 1] 
          : step;
        
        saveStepProgress(nextStep, newCompletedSteps);
      }
    },
    [completedSteps, getStepIndex, isStepCompleted, saveStepProgress]
  );
  
  // Get the next available uncompleted step
  const getNextAvailableStep = useCallback(
    (): ProgressStep | null => {
      // Find the first incomplete step
      const nextStep = STEP_ORDER.find(
        step => !isStepCompleted(step)
      );
      
      return nextStep || null;
    },
    [isStepCompleted]
  );
  
  // Calculate the progress percentage (0-100)
  const getProgressPercentage = useCallback(
    (): number => {
      if (!completedSteps || completedSteps.length === 0) return 0;
      if (completedSteps.length === STEP_ORDER.length) return 100;
      
      return Math.floor((completedSteps.length / STEP_ORDER.length) * 100);
    },
    [completedSteps]
  );

  return {
    // Persistence API
    saveProgress,
    getProgress,
    clearProgress,
    getAllProgress,
    hasProgress,
    getAttendeeSummaryText,
    
    // Step tracking API
    currentStep,
    completedSteps: completedSteps || [],
    isStepCompleted,
    isStepAvailable,
    moveToStep,
    completeStep,
    getNextAvailableStep,
    getProgressPercentage
  };
}