/**
 * Form Conversion Plan Generator
 * 
 * This script generates a plan for converting form components to a consistent mobile-optimized pattern,
 * based on the analysis results from analyze-form-components.js.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ANALYSIS_FILE = path.resolve(__dirname, './form-analysis-results.json');
const OUTPUT_FILE = path.resolve(__dirname, './form-conversion-plan.md');

// Load analysis results
let analysisResults;
try {
  analysisResults = JSON.parse(fs.readFileSync(ANALYSIS_FILE, 'utf-8'));
} catch (error) {
  console.error('Error loading analysis results:', error);
  console.log('Please run analyze-form-components.js first.');
  process.exit(1);
}

// Helper function to generate code conversions
function generateGridConversion(component, gridPattern) {
  const originalCode = `<div className="${gridPattern}">\n  {/* Content */}\n</div>`;
  
  // Extract grid columns from pattern (if available)
  const columnsMatch = gridPattern.match(/grid-cols-(\d+)/);
  const columns = columnsMatch ? columnsMatch[1] : '12';
  
  const convertedCode = `<div className="grid grid-cols-4 md:grid-cols-${columns} gap-4">\n  {/* Content */}\n</div>`;
  
  return { originalCode, convertedCode };
}

function generateColumnConversion(component, colPattern) {
  const originalCode = `<div className="${colPattern}">\n  {/* Content */}\n</div>`;
  
  // Extract column span from pattern (if available)
  const spanMatch = colPattern.match(/col-span-(\d+)/);
  const span = spanMatch ? spanMatch[1] : '4';
  
  // Determine mobile-friendly column span based on original size
  let mobileSpan = '4'; // Default full width on mobile
  if (parseInt(span) <= 3) {
    mobileSpan = '2'; // Half width on mobile for small columns
  }
  
  const convertedCode = `<div className="col-span-${mobileSpan} md:col-span-${span}">\n  {/* Content */}\n</div>`;
  
  return { originalCode, convertedCode };
}

function generateFormControlConversion(component, controlType) {
  const templates = {
    input: {
      original: `<input 
  type="text"
  id="field-id"
  name="fieldName"
  value={value}
  onChange={handleChange}
  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
/>`,
      converted: `<FormField
  id="field-id"
  label="Field Label"
  required={true}
  help="Optional help text"
  className="col-span-4 md:col-span-4"
>
  <input 
    type="text"
    id="field-id"
    name="fieldName"
    value={value}
    onChange={handleChange}
    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
  />
  <ValidationMessage 
    message="Error message" 
    show={showError} 
  />
</FormField>`
    },
    select: {
      original: `<select
  id="field-id"
  name="fieldName"
  value={value}
  onChange={handleChange}
  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
>
  <option value="">Please Select</option>
  {options.map(option => (
    <option key={option.value} value={option.value}>{option.label}</option>
  ))}
</select>`,
      converted: `<FormField
  id="field-id"
  label="Field Label"
  required={true}
  help="Optional help text"
  className="col-span-4 md:col-span-3"
>
  <select
    id="field-id"
    name="fieldName"
    value={value}
    onChange={handleChange}
    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
  >
    <option value="">Please Select</option>
    {options.map(option => (
      <option key={option.value} value={option.value}>{option.label}</option>
    ))}
  </select>
  <ValidationMessage 
    message="Error message" 
    show={showError} 
  />
</FormField>`
    },
    checkbox: {
      original: `<div className="flex items-center">
  <input
    type="checkbox"
    id="field-id"
    checked={isChecked}
    onChange={handleChange}
    className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
  />
  <label htmlFor="field-id" className="ml-2 text-sm text-slate-700">
    Checkbox Label
  </label>
</div>`,
      converted: `<div className="col-span-4 md:col-span-12">
  <div className="flex items-center py-2">
    <input
      type="checkbox"
      id="field-id"
      checked={isChecked}
      onChange={handleChange}
      className="h-5 w-5 md:h-4 md:w-4 text-primary border-slate-300 rounded focus:ring-primary"
    />
    <label htmlFor="field-id" className="ml-3 text-base md:text-sm text-slate-700">
      Checkbox Label
    </label>
  </div>
</div>`
    },
  };
  
  return templates[controlType] || { original: 'N/A', converted: 'N/A' };
}

// Generate the conversion plan markdown
function generateConversionPlan() {
  let markdownContent = `# Form Component Conversion Plan

## Overview

This document outlines the plan for converting existing form components to a mobile-optimized pattern,
based on the analysis of the current implementation.

## Analysis Results

### Grid Patterns
`;

  // Add grid pattern analysis
  const gridPatterns = analysisResults.gridPatterns;
  for (const [cols, count] of Object.entries(gridPatterns)) {
    markdownContent += `- \`grid-cols-${cols}\`: Used in ${count} components\n`;
  }

  markdownContent += `\n### Column Spans
`;

  // Add column span analysis
  const columnUsage = analysisResults.columnUsage;
  for (const [span, count] of Object.entries(columnUsage)) {
    markdownContent += `- \`col-span-${span}\`: Used ${count} times\n`;
  }

  markdownContent += `\n### Form Controls

- Inputs: ${JSON.stringify(analysisResults.formControls.inputs)}
- Selects: ${analysisResults.formControls.selects.count || 0} instances
- Textareas: ${analysisResults.formControls.textareas.count || 0} instances

## New Component Templates

### FormField Component

\`\`\`jsx
// FormField.tsx
import React from 'react';
import { HelpCircle } from 'lucide-react';

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  className?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required = false,
  help,
  className = "",
  fullWidth = false,
  children
}) => (
  <div className={\`\${fullWidth ? 'col-span-full' : ''} \${className}\`}>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
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
  </div>
);

export default FormField;
\`\`\`

### ValidationMessage Component

\`\`\`jsx
// ValidationMessage.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ValidationMessageProps {
  message: string;
  show: boolean;
}

const ValidationMessage: React.FC<ValidationMessageProps> = ({ message, show }) => {
  if (!show) return null;
  
  return (
    <div className="text-red-500 text-sm mt-1 flex items-start">
      <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
};

export default ValidationMessage;
\`\`\`

### MobileFormSection Component

\`\`\`jsx
// MobileFormSection.tsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface MobileFormSectionProps {
  title: string;
  initiallyExpanded?: boolean;
  children: React.ReactNode;
}

const MobileFormSection: React.FC<MobileFormSectionProps> = ({
  title,
  initiallyExpanded = true,
  children
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  
  return (
    <div className="mb-6 border rounded-lg overflow-hidden">
      <button 
        className="w-full flex justify-between items-center p-4 bg-slate-50 border-b"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <h3 className="text-lg font-medium">{title}</h3>
        <ChevronDown className={\`h-5 w-5 transition-transform \${expanded ? 'rotate-180' : ''}\`} />
      </button>
      <div className={\`transition-all \${expanded ? 'max-h-[2000px]' : 'max-h-0'} overflow-hidden\`}>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MobileFormSection;
\`\`\`

## Component-Specific Conversion Plans

`;

  // Generate conversion plans for each component
  const components = analysisResults.components;
  for (const [componentName, data] of Object.entries(components)) {
    const relativePath = data.path.replace(process.cwd(), '');
    
    markdownContent += `### ${componentName} (${relativePath})

#### Needed Changes:

`;

    // Grid patterns to convert
    if (data.gridUsage && data.gridUsage.length > 0) {
      markdownContent += `1. **Convert Grid Layouts:**\n\n`;
      
      for (const grid of data.gridUsage) {
        const { originalCode, convertedCode } = generateGridConversion(componentName, grid.className);
        
        markdownContent += `   From:\n   \`\`\`jsx\n   ${originalCode}\n   \`\`\`\n\n`;
        markdownContent += `   To:\n   \`\`\`jsx\n   ${convertedCode}\n   \`\`\`\n\n`;
      }
    }

    // Column spans to convert
    if (data.colSpanPatterns && data.colSpanPatterns.length > 0) {
      markdownContent += `2. **Convert Column Spans:**\n\n`;
      
      // Get unique patterns
      const uniquePatterns = Array.from(new Set(data.colSpanPatterns.map(p => p.className)));
      
      for (const pattern of uniquePatterns) {
        const { originalCode, convertedCode } = generateColumnConversion(componentName, pattern);
        
        markdownContent += `   From:\n   \`\`\`jsx\n   ${originalCode}\n   \`\`\`\n\n`;
        markdownContent += `   To:\n   \`\`\`jsx\n   ${convertedCode}\n   \`\`\`\n\n`;
      }
    }

    // Form controls to convert
    if (data.inputControls && data.inputControls.length > 0) {
      const inputTypes = Array.from(new Set(data.inputControls
        .filter(c => c.element === 'input')
        .map(c => c.type)));
        
      const hasSelects = data.inputControls.some(c => c.element === 'select');
      const hasTextareas = data.inputControls.some(c => c.element === 'textarea');
      
      markdownContent += `3. **Convert Form Controls:**\n\n`;
      
      if (inputTypes.length > 0) {
        markdownContent += `   - Inputs (${inputTypes.join(', ')}):\n\n`;
        const { original, converted } = generateFormControlConversion(componentName, 'input');
        markdownContent += `   From:\n   \`\`\`jsx\n   ${original}\n   \`\`\`\n\n`;
        markdownContent += `   To:\n   \`\`\`jsx\n   ${converted}\n   \`\`\`\n\n`;
      }
      
      if (hasSelects) {
        markdownContent += `   - Selects:\n\n`;
        const { original, converted } = generateFormControlConversion(componentName, 'select');
        markdownContent += `   From:\n   \`\`\`jsx\n   ${original}\n   \`\`\`\n\n`;
        markdownContent += `   To:\n   \`\`\`jsx\n   ${converted}\n   \`\`\`\n\n`;
      }
      
      if (data.inputControls.some(c => c.type === 'checkbox')) {
        markdownContent += `   - Checkboxes:\n\n`;
        const { original, converted } = generateFormControlConversion(componentName, 'checkbox');
        markdownContent += `   From:\n   \`\`\`jsx\n   ${original}\n   \`\`\`\n\n`;
        markdownContent += `   To:\n   \`\`\`jsx\n   ${converted}\n   \`\`\`\n\n`;
      }
    }

    markdownContent += `\n`;
  }

  markdownContent += `## Implementation Steps

1. Create shared component library:
   - Create \`FormField.tsx\`
   - Create \`ValidationMessage.tsx\`
   - Create \`MobileFormSection.tsx\`

2. Update tailwind.config.js to ensure proper mobile breakpoints:
   \`\`\`js
   module.exports = {
     // ...
     theme: {
       // ...
       screens: {
         'xs': '360px',
         'sm': '480px',
         'md': '768px',
         'lg': '1024px',
         'xl': '1280px',
         '2xl': '1536px',
       },
     },
   }
   \`\`\`

3. Convert form components in the following order:
   - Base components (e.g., MasonBasicInfo, GuestBasicInfo)
   - Container components (e.g., MasonForm, GuestForm)
   - Page components (e.g., RegisterPage)

4. Add mobile-specific UX enhancements:
   - Add collapsible sections on mobile
   - Implement fixed bottom navigation
   - Add mobile-specific validation messages

## Testing Plan

1. Create a testing checklist for each component:
   - Verify mobile layout at 320px, a5ó0px, 480px, and 768px viewport widths
   - Test touch interactions on actual mobile devices
   - Verify keyboard behavior with mobile keyboards
   - Test form validation on mobile

2. Conduct usability testing on common mobile devices:
   - iPhone (iOS)
   - Samsung Galaxy (Android)
   - iPad (tablet)

3. Verify performance metrics:
   - Load time on 3G/4G connections
   - Interaction responsiveness
   - Form submission time
`;

  return markdownContent;
}

// Main execution
try {
  console.log('Generating form conversion plan...');
  
  // Generate the plan
  const markdownContent = generateConversionPlan();
  
  // Write to file
  fs.writeFileSync(OUTPUT_FILE, markdownContent);
  console.log(`Conversion plan generated at ${OUTPUT_FILE}`);
  
} catch (error) {
  console.error('Error generating conversion plan:', error);
}