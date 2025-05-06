import React from 'react';

// Define step type for clarity
interface Step {
  number: number;
  title: string;
}

interface RegisterStepsProps {
  step: number;
  registrationType?: string;
  goToStep?: (step: number) => void;
  completedSteps: number[];
}

// Mobile header component with progress bar - enhanced for better usability
const MobileStepHeader: React.FC<{
  currentStep: number;
  totalSteps: number;
  title: string;
}> = ({ currentStep, totalSteps, title }) => {
  const progressPercentage = (currentStep / totalSteps) * 100;
  
  return (
    <div className="md:hidden sticky top-0 z-30 bg-white shadow-md mb-6 border-b border-slate-100 step-indicator-mobile">
      <div className="px-3 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">
            Step {currentStep} of {totalSteps}
          </p>
          <p className="text-base font-semibold text-primary">{title}</p>
        </div>
        <div className="h-2 w-full bg-slate-100 mt-3 rounded-full overflow-hidden">
          <div 
            className="h-2 bg-primary rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Step ${currentStep} of ${totalSteps}: ${title}`}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Desktop step indicator with connecting lines
const DesktopStepTracker: React.FC<{
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
  onStepClick: (stepNumber: number) => void;
}> = ({ steps, currentStep, completedSteps, onStepClick }) => {
  return (
    <div className="hidden md:block mb-12 overflow-x-auto">
      <div className="flex items-center justify-between min-w-max">
        {steps.map((step, index) => {
          // Calculate step status
          const isActive = currentStep === step.number;
          const isCompleted = completedSteps.includes(step.number);
          const isClickable = isCompleted || isActive;
          
          return (
            <React.Fragment key={step.number}>
              {/* Step indicator with circle and label */}
              <div 
                className={`flex flex-col items-center ${
                  isActive || isCompleted ? 'text-primary' : 'text-slate-400'
                } ${isClickable ? 'cursor-pointer' : ''}`}
                onClick={() => isClickable && onStepClick(step.number)}
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                aria-label={`Go to ${step.title} step`}
                aria-current={isActive ? 'step' : undefined}
              >
                {/* Circle indicator */}
                <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all ${
                  isActive ? 'border-primary bg-primary text-white' :
                  isCompleted ? 'border-primary bg-primary text-white' :
                  'border-slate-300'
                } ${
                  isCompleted && !isActive ? 'hover:bg-primary/90' : ''
                }`}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.number}
                </div>
                <span className="mt-2 text-sm font-medium whitespace-nowrap">{step.title}</span>
              </div>
              
              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${
                  currentStep > step.number || 
                  (completedSteps.includes(step.number) && completedSteps.includes(step.number + 1)) 
                    ? 'bg-primary' 
                    : 'bg-slate-300'
                }`} 
                aria-hidden="true"></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const RegisterSteps: React.FC<RegisterStepsProps> = ({ 
  step, 
  registrationType,
  goToStep,
  completedSteps = []
}) => {
  // Define step flows by registration type
  const individualSteps = [
    { number: 1, title: 'Registration Type' },
    { number: 2, title: 'Attendee Details' },
    { number: 3, title: 'Select Tickets' },
    { number: 4, title: 'Review Order' },
    { number: 5, title: 'Payment' },
    { number: 6, title: 'Confirmation' }
  ];
  
  // Other registration type steps (placeholder)
  const otherSteps = [
    { number: 1, title: 'Registration Type' },
    { number: 2, title: 'Coming Soon' },
    { number: 3, title: 'Placeholder' }
  ];
  
  // Select steps based on registration type
  const steps = registrationType === 'individual' ? individualSteps : 
               (registrationType && registrationType !== '') ? otherSteps : individualSteps;

  // Get current step title for the mobile header
  const currentStepTitle = steps.find(s => s.number === step)?.title || '';
  
  // Handle step navigation
  const handleStepClick = (stepNumber: number) => {
    try {
      // Prevent redirect issues by setting bypass flags
      localStorage.setItem('lodgetix_bypass_no_redirect', 'true');
      localStorage.setItem('lodgetix_disable_expiry', 'true');
      
      // Only navigate to completed steps or current step
      if ((completedSteps.includes(stepNumber) || stepNumber === step) && goToStep) {
        goToStep(stepNumber);
      }
    } catch (e) {
      console.error('Error handling step navigation:', e);
    }
  };

  return (
    <>
      {/* Mobile view with compact header */}
      <MobileStepHeader 
        currentStep={step} 
        totalSteps={steps.length} 
        title={currentStepTitle} 
      />
      
      {/* Desktop view with full step tracker */}
      <DesktopStepTracker 
        steps={steps}
        currentStep={step}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />
    </>
  );
};

export default RegisterSteps;