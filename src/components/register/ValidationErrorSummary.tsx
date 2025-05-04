import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ValidationErrorSummaryProps {
  errors: string[];
  compact?: boolean; // Mobile-optimized compact mode
}

const ValidationErrorSummary: React.FC<ValidationErrorSummaryProps> = ({ 
  errors,
  compact = false
}) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  // Mobile-optimized mode with collapsible errors
  if (compact) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md relative mb-6 shadow-sm" role="alert">
        <div className="p-3 flex items-center justify-between" id="validation-errors">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="font-medium text-sm">
              {errors.length === 1 ? '1 error found' : `${errors.length} errors found`}
            </p>
          </div>
          
          {/* Expandable section with detailed errors */}
          <details className="w-full">
            <summary className="cursor-pointer text-xs text-red-700 hover:text-red-800 focus:outline-none underline ml-auto">
              View details
            </summary>
            <ul className="mt-2 list-disc list-inside text-xs pl-3 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    );
  }
  
  // Standard desktop version
  return (
    <div 
      className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md relative mb-6" 
      role="alert"
      id="validation-errors"
    >
      <div className="flex">
        <div className="py-1">
          <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
        </div>
        <div>
          <p className="font-bold">
            There {errors.length === 1 ? 'was 1 error' : `were ${errors.length} errors`} with your submission:
          </p>
          <ul className="mt-2 list-disc list-inside text-sm">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ValidationErrorSummary;