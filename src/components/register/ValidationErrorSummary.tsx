import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ValidationErrorSummaryProps {
  errors: string[];
}

const ValidationErrorSummary: React.FC<ValidationErrorSummaryProps> = ({ errors }) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md relative mb-6" role="alert">
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