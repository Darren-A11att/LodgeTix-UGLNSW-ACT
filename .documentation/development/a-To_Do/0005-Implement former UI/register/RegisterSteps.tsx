import React from 'react';

interface RegisterStepsProps {
  step: number;
  registrationType?: string;
  goToStep?: (step: number) => void;
  completedSteps: number[];
}

const RegisterSteps: React.FC<RegisterStepsProps> = ({ 
  step, 
  registrationType,
  goToStep,
  completedSteps = []
}) => {
  // For the "individual" (Myself & Others) registration type
  // The workflow is: Registration Type -> Attendee Details -> Select Tickets -> Review Order -> Payment -> Confirmation
  const individualSteps = [
    { number: 1, title: 'Registration Type' },
    { number: 2, title: 'Attendee Details' },
    { number: 3, title: 'Select Tickets' },
    { number: 4, title: 'Review Order' },
    { number: 5, title: 'Payment' },
    { number: 6, title: 'Confirmation' }
  ];
  
  // For other registration types (placeholder for now)
  // The workflow for lodge/delegation registrations might differ
  const otherSteps = [
    { number: 1, title: 'Registration Type' },
    { number: 2, title: 'Coming Soon' },
    { number: 3, title: 'Placeholder' }
  ];
  
  // Choose steps based on registration type
  const steps = (registrationType === 'individual') ? individualSteps : 
                (registrationType && registrationType !== '') ? otherSteps : individualSteps;

  // Handle step click
  const handleStepClick = (stepNumber: number) => {
    // Only allow clicking on completed steps or the current step
    if (completedSteps.includes(stepNumber) || stepNumber === step) {
      if (goToStep) {
        goToStep(stepNumber);
      }
    }
  };

  return (
    <div className="mb-12 overflow-x-auto">
      <div className="flex items-center justify-between min-w-max">
        {steps.map((s, index) => (
          <React.Fragment key={s.number}>
            <div 
              className={`flex flex-col items-center ${
                step >= s.number ? 'text-primary' : 'text-slate-400'
              } ${
                (completedSteps.includes(s.number) || step === s.number) ? 'cursor-pointer' : ''
              }`}
              onClick={() => handleStepClick(s.number)}
              role={completedSteps.includes(s.number) || step === s.number ? "button" : undefined}
              tabIndex={completedSteps.includes(s.number) || step === s.number ? 0 : undefined}
              aria-label={`Go to ${s.title} step`}
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all ${
                step > s.number 
                  ? 'border-primary bg-primary text-white' 
                  : step === s.number
                    ? 'border-primary bg-primary text-white'
                    : completedSteps.includes(s.number)
                      ? 'border-primary text-primary'
                      : 'border-slate-300'
              } ${
                (completedSteps.includes(s.number) && step !== s.number) 
                  ? 'hover:bg-primary/10' 
                  : ''
              }`}>
                {step > s.number && completedSteps.includes(s.number) ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : s.number}
              </div>
              <span className="mt-2 text-sm font-medium whitespace-nowrap">{s.title}</span>
            </div>
            
            {/* Divider line between steps (except after the last step) */}
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 ${
                step > s.number ? 'bg-primary' : 
                completedSteps.includes(s.number) && completedSteps.includes(s.number + 1) ? 'bg-primary' :
                'bg-slate-300'
              }`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default RegisterSteps;