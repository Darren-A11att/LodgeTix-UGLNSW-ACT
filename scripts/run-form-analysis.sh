#!/bin/bash
# Script to run the form analysis and code generation process

# Set -e to exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting form analysis and standardization process...${NC}"

# Check if dependencies are installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is required but not installed.${NC}"
    exit 1
fi

# Check if @babel/parser and @babel/traverse are installed
if ! node -e "require('@babel/parser')" &> /dev/null || ! node -e "require('@babel/traverse')" &> /dev/null; then
    echo -e "${YELLOW}Installing required dependencies...${NC}"
    npm install --save-dev @babel/parser @babel/traverse
fi

# Step 1: Analyze form components
echo -e "${GREEN}Step 1: Analyzing form components...${NC}"
node ./scripts/analyze-form-components.js

# Step 2: Analyze grid patterns
echo -e "${GREEN}Step 2: Analyzing grid patterns...${NC}"
node ./scripts/analyze-grid-patterns.js

# Step 3: Analyze form controls
echo -e "${GREEN}Step 3: Analyzing form controls...${NC}"
node ./scripts/analyze-form-controls.js

# Step 4: Generate conversion plan
echo -e "${GREEN}Step 4: Generating conversion plan...${NC}"
node ./scripts/generate-form-conversion-plan.js

# Step 5: Generate standardized form components
echo -e "${GREEN}Step 5: Generating standardized form components...${NC}"
node ./scripts/generate-form-components.js

# Create summary report
echo -e "${GREEN}Creating summary report...${NC}"
cat > ./scripts/mobile-optimization-report.md << EOL
# Mobile Optimization Report

## Overview

This report summarizes the findings of the mobile optimization analysis for the LodgeTix registration forms.

## Analysis Results

- **Form Components Analyzed**: $(grep -o "totalFiles" ./scripts/form-analysis-results.json | wc -l)
- **Grid Patterns Found**: $(grep -o "grid-cols" ./scripts/grid-analysis-results.json | wc -l)
- **Form Controls Analyzed**: $(grep -o "totalControls" ./scripts/form-controls-analysis.json | wc -l)
- **Inconsistencies Found**: $(grep -o "inconsistencies" ./scripts/form-analysis-results.json | wc -l)

## Implementation Plan

1. **Standardize Form Components**
   - New components created in src/shared/components/form/
   - Mobile-first approach with consistent grid system
   - Consistent styling for all form controls

2. **Update Existing Forms**
   - Convert all forms to use the new standardized components
   - Ensure mobile-first approach with touch-friendly controls
   - Implement consistent validation patterns

3. **Add Mobile-Specific Features**
   - Collapsible sections for complex forms
   - Fixed bottom navigation
   - Touch-optimized input controls

4. **Testing Plan**
   - Test on multiple mobile devices
   - Verify touch interactions
   - Validate mobile performance

## Generated Files

- **Analysis Results**:
  - form-analysis-results.json
  - grid-analysis-results.json
  - form-controls-analysis.json

- **Conversion Plan**:
  - form-conversion-plan.md

- **Generated Components**:
  - src/shared/components/form/FormField.tsx
  - src/shared/components/form/ValidationMessage.tsx
  - src/shared/components/form/MobileFormSection.tsx
  - src/shared/components/form/FormGrid.tsx
  - src/shared/components/form/MobileFormNavigation.tsx
EOL

# Make script executable
chmod +x ./scripts/generate-form-components.js
chmod +x ./scripts/analyze-form-components.js
chmod +x ./scripts/analyze-grid-patterns.js
chmod +x ./scripts/analyze-form-controls.js
chmod +x ./scripts/generate-form-conversion-plan.js

echo -e "${GREEN}Analysis and code generation complete!${NC}"
echo "See ./scripts/mobile-optimization-report.md for a summary of findings."
echo "See ./scripts/form-conversion-plan.md for a detailed conversion plan."
echo "Generated components are in src/shared/components/form/"