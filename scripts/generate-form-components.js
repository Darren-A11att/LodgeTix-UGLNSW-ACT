/**
 * Form Components Generator
 * 
 * This script generates standardized form components based on the analysis results.
 * It creates mobile-optimized, reusable components that will be the foundation
 * for the form standardization effort.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_DIR = path.resolve(__dirname, '../src/shared/components/form');
const COMPONENTS = [
  'FormField',
  'ValidationMessage',
  'MobileFormSection',
  'FormGrid',
  'MobileFormNavigation'
];

// Ensure output directory exists
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Generate FormField component
function generateFormField() {
  return `import React from 'react';
import { HelpCircle } from 'lucide-react';
import ValidationMessage from './ValidationMessage';

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  showError?: boolean;
  className?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

/**
 * FormField component - A standardized form field with label, optional help text, and validation
 * 
 * Designed for mobile-first responsive layouts:
 * - On mobile: Full width (col-span-4)
 * - On desktop: Configurable width (md:col-span-X)
 */
const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required = false,
  help,
  error,
  showError = false,
  className = "",
  fullWidth = false,
  children
}) => (
  <div className={\`\${fullWidth ? 'col-span-full' : ''} \${className}\`}>
    <label 
      htmlFor={id} 
      className="block text-sm font-medium text-slate-700 mb-1"
    >
      {label} {required && <span className="text-red-500">*</span>}
      {help && (
        <span className="inline-block ml-1">
          <div className="relative inline-block group">
            <HelpCircle className="h-4 w-4 text-primary cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 invisible group-hover:visible bg-white text-slate-700 text-xs p-2 rounded shadow-lg w-48 z-10">
              {help}
            </div>
          </div>
        </span>
      )}
    </label>
    
    {children}
    
    {error && (
      <ValidationMessage
        message={error}
        show={showError}
      />
    )}
  </div>
);

export default FormField;`;
}

// Generate ValidationMessage component
function generateValidationMessage() {
  return `import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ValidationMessageProps {
  message: string;
  show: boolean;
}

/**
 * ValidationMessage component - A standardized error message for form fields
 */
const ValidationMessage: React.FC<ValidationMessageProps> = ({ 
  message, 
  show 
}) => {
  if (!show) return null;
  
  return (
    <div className="text-red-500 text-sm mt-1 flex items-start">
      <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
};

export default ValidationMessage;`;
}

// Generate MobileFormSection component
function generateMobileFormSection() {
  return `import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface MobileFormSectionProps {
  title: string;
  initiallyExpanded?: boolean;
  children: React.ReactNode;
}

/**
 * MobileFormSection component - A collapsible section optimized for mobile forms
 * 
 * When used on mobile, this component creates collapsible sections that
 * help reduce visual complexity and allow users to focus on one section at a time.
 */
const MobileFormSection: React.FC<MobileFormSectionProps> = ({
  title,
  initiallyExpanded = true,
  children
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  
  return (
    <div className="mb-6 border rounded-lg overflow-hidden">
      <button 
        type="button"
        className="w-full flex justify-between items-center p-4 bg-slate-50 border-b"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <h3 className="text-lg font-medium">{title}</h3>
        <ChevronDown className={\`h-5 w-5 transition-transform \${expanded ? 'rotate-180' : ''}\`} />
      </button>
      <div 
        className={\`transition-all \${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden\`}
        aria-hidden={!expanded}
      >
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MobileFormSection;`;
}

// Generate FormGrid component
function generateFormGrid() {
  return `import React from 'react';

interface FormGridProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * FormGrid component - A standardized responsive grid for form layouts
 * 
 * Uses a 4-column grid on mobile and a 12-column grid on desktop for consistent
 * responsive behavior across all form components.
 */
const FormGrid: React.FC<FormGridProps> = ({
  className = "",
  children
}) => (
  <div className={\`grid grid-cols-4 md:grid-cols-12 gap-4 \${className}\`}>
    {children}
  </div>
);

export default FormGrid;`;
}

// Generate MobileFormNavigation component
function generateMobileFormNavigation() {
  return `import React from 'react';

interface MobileFormNavigationProps {
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  backLabel?: string;
  className?: string;
}

/**
 * MobileFormNavigation component - A fixed bottom navigation for forms on mobile
 * 
 * Provides a consistent navigation experience with properly sized touch targets
 * that are fixed to the bottom of the viewport on mobile devices.
 */
const MobileFormNavigation: React.FC<MobileFormNavigationProps> = ({
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = "Continue",
  backLabel = "Back",
  className = ""
}) => (
  <div className={\`fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-between z-30 shadow-lg md:static md:shadow-none md:border-t-0 md:p-0 md:mt-6 \${className}\`}>
    {onBack ? (
      <button 
        onClick={onBack}
        className="btn-outline w-full md:w-auto mr-2 min-h-[44px] md:min-h-[40px]"
        type="button"
      >
        {backLabel}
      </button>
    ) : <div></div>}
    
    <button 
      onClick={onNext}
      className="btn-primary w-full md:w-auto ml-2 min-h-[44px] md:min-h-[40px]"
      type="button"
      disabled={nextDisabled}
    >
      {nextLabel}
    </button>
  </div>
);

export default MobileFormNavigation;`;
}

// Generate index.ts file
function generateIndex() {
  return `export { default as FormField } from './FormField';
export { default as ValidationMessage } from './ValidationMessage';
export { default as MobileFormSection } from './MobileFormSection';
export { default as FormGrid } from './FormGrid';
export { default as MobileFormNavigation } from './MobileFormNavigation';

// Type exports
export type { FormFieldProps } from './FormField';
export type { ValidationMessageProps } from './ValidationMessage';
export type { MobileFormSectionProps } from './MobileFormSection';
export type { FormGridProps } from './FormGrid';
export type { MobileFormNavigationProps } from './MobileFormNavigation';
`;
}

// Generate all components
function generateComponents() {
  ensureDirectoryExists(OUTPUT_DIR);
  
  // Generate each component
  const componentGenerators = {
    'FormField': generateFormField,
    'ValidationMessage': generateValidationMessage,
    'MobileFormSection': generateMobileFormSection,
    'FormGrid': generateFormGrid,
    'MobileFormNavigation': generateMobileFormNavigation
  };
  
  for (const component of COMPONENTS) {
    const generator = componentGenerators[component];
    if (generator) {
      const content = generator();
      const filePath = path.join(OUTPUT_DIR, `${component}.tsx`);
      fs.writeFileSync(filePath, content);
      console.log(`Generated ${component} component at ${filePath}`);
    }
  }
  
  // Generate index.ts
  const indexPath = path.join(OUTPUT_DIR, 'index.ts');
  fs.writeFileSync(indexPath, generateIndex());
  console.log(`Generated index.ts at ${indexPath}`);
  
  // Generate README with usage examples
  const readmePath = path.join(OUTPUT_DIR, 'README.md');
  fs.writeFileSync(readmePath, generateReadme());
  console.log(`Generated README at ${readmePath}`);
}

// Generate README with usage examples
function generateReadme() {
  return `# Form Components

This directory contains standardized form components designed for mobile-first responsive layouts.

## Components

### FormField

A standardized form field component that includes a label, optional help text, and validation.

\`\`\`tsx
import { FormField } from '../shared/components/form';

<FormGrid>
  <FormField
    id="firstName"
    label="First Name"
    required
    className="col-span-4 md:col-span-4"
    error="First name is required"
    showError={firstNameInteracted && !firstName}
  >
    <input
      type="text"
      id="firstName"
      name="firstName"
      value={firstName}
      onChange={handleChange}
      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
    />
  </FormField>

  <FormField
    id="title"
    label="Title"
    required
    className="col-span-4 md:col-span-3"
    help="Select your preferred title"
  >
    <select
      id="title"
      name="title"
      value={title}
      onChange={handleChange}
      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      <option value="">Please Select</option>
      {titles.map(t => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  </FormField>
</FormGrid>
\`\`\`

### MobileFormSection

A collapsible section optimized for mobile forms.

\`\`\`tsx
import { MobileFormSection } from '../shared/components/form';

<MobileFormSection
  title="Contact Information"
  initiallyExpanded={true}
>
  <FormGrid>
    {/* Form fields here */}
  </FormGrid>
</MobileFormSection>
\`\`\`

### MobileFormNavigation

A fixed bottom navigation for forms on mobile.

\`\`\`tsx
import { MobileFormNavigation } from '../shared/components/form';

<div className="has-mobile-nav pb-20 md:pb-0">
  {/* Form content */}
  
  <MobileFormNavigation
    onBack={handleBack}
    onNext={handleNext}
    nextDisabled={!isValid}
    nextLabel="Continue"
    backLabel="Previous"
  />
</div>
\`\`\`

## Mobile-First Grid System

All form components use a 4-column grid on mobile and a 12-column grid on desktop:

\`\`\`tsx
<FormGrid>
  {/* Small fields: 100% width on mobile, 25% on desktop */}
  <FormField className="col-span-4 md:col-span-3">...</FormField>
  
  {/* Medium fields: 100% width on mobile, 33% on desktop */}
  <FormField className="col-span-4 md:col-span-4">...</FormField>
  
  {/* Large fields: 100% width on mobile, 50% on desktop */}
  <FormField className="col-span-4 md:col-span-6">...</FormField>
  
  {/* Full-width fields on both mobile and desktop */}
  <FormField className="col-span-4 md:col-span-12">...</FormField>
</FormGrid>
\`\`\`

## Usage Guidelines

1. **Mobile-First Approach**: All components are designed mobile-first, with desktop styles added via media queries.
2. **Consistent Sizing**: Use consistent column spans for similar field types.
3. **Touch-Friendly**: All interactive elements are sized appropriately for touch (44px minimum).
4. **Validation**: Use ValidationMessage for consistent error display.
5. **Collapsible Sections**: Use MobileFormSection for complex forms on mobile.
`;
}

// Main execution
try {
  console.log('Generating standardized form components...');
  generateComponents();
  console.log('Components generated successfully!');
} catch (error) {
  console.error('Error generating components:', error);
}