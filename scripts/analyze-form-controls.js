/**
 * Form Controls Analysis Script
 * 
 * This script analyzes form controls (inputs, selects, etc.) across the register components
 * to identify styling inconsistencies and create standardization recommendations.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// Configuration
const REGISTER_DIR = path.resolve(__dirname, '../src/components/register');
const OUTPUT_FILE = path.resolve(__dirname, './form-controls-analysis.json');

// Results structure
const results = {
  summary: {
    totalControls: 0,
    controlTypes: {},
    classPatterns: {},
    validationPatterns: {},
    labelPatterns: {},
    mobileSpecificStyles: {},
  },
  controlDetails: {
    inputs: {},
    selects: {},
    checkboxes: {},
    textareas: {},
    labels: {},
  },
  inconsistencies: [],
  recommendations: {}
};

// Extract element attributes
function extractAttributes(attributes) {
  const result = {};
  
  attributes.forEach(attr => {
    if (attr.name) {
      const name = attr.name.name;
      let value = null;
      
      if (attr.value?.type === 'StringLiteral') {
        value = attr.value.value;
      } else if (attr.value?.type === 'JSXExpressionContainer') {
        value = 'expression';
      }
      
      result[name] = value;
    }
  });
  
  return result;
}

// Extract control details
function extractControlDetails(fileContent, filePath) {
  const controls = {
    inputs: [],
    selects: [],
    textareas: [],
    labels: [],
    checkboxes: [],
    radios: [],
    validationElements: [],
  };
  
  try {
    const ast = parse(fileContent, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
    
    traverse(ast, {
      JSXOpeningElement(path) {
        const tagName = path.node.name.name;
        const attributes = extractAttributes(path.node.attributes);
        const lineNumber = path.node.loc?.start.line || 0;
        
        // Categorize form controls
        if (tagName === 'input') {
          const type = attributes.type || 'text';
          if (type === 'checkbox') {
            controls.checkboxes.push({ tagName, attributes, lineNumber });
          } else if (type === 'radio') {
            controls.radios.push({ tagName, attributes, lineNumber });
          } else {
            controls.inputs.push({ tagName, attributes, lineNumber });
          }
        } else if (tagName === 'select') {
          controls.selects.push({ tagName, attributes, lineNumber });
        } else if (tagName === 'textarea') {
          controls.textareas.push({ tagName, attributes, lineNumber });
        } else if (tagName === 'label') {
          controls.labels.push({ tagName, attributes, lineNumber });
        }
        
        // Track validation-related elements
        if (attributes.className && 
            (attributes.className.includes('invalid') || 
             attributes.className.includes('error') || 
             attributes.className.includes('validation'))) {
          controls.validationElements.push({ tagName, attributes, lineNumber });
        }
      }
    });
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
  }
  
  return controls;
}

// Analyze class patterns for a specific element
function analyzeClassPatterns(elements) {
  const patterns = {};
  
  elements.forEach(element => {
    if (element.attributes.className) {
      // Split class string and process each class
      const classes = element.attributes.className.split(/\s+/);
      
      classes.forEach(cls => {
        // Skip TailwindCSS dynamic classes (they use square brackets)
        if (cls.includes('[') && cls.includes(']')) return;
        
        // Track class usage
        patterns[cls] = (patterns[cls] || 0) + 1;
        
        // Track if it's mobile-specific
        if (cls.startsWith('md:') || cls.startsWith('sm:') || cls.startsWith('lg:')) {
          results.summary.mobileSpecificStyles[cls] = (results.summary.mobileSpecificStyles[cls] || 0) + 1;
        }
      });
    }
  });
  
  return patterns;
}

// Analyze form controls in a file
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const componentName = fileName.replace(/\.[jt]sx?$/, '');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Skip non-component files
    if (!content.includes('React') || !content.includes('export default')) {
      return;
    }
    
    console.log(`Analyzing form controls in: ${componentName}`);
    
    // Extract control details
    const controls = extractControlDetails(content, filePath);
    
    // Count total controls
    const totalControls = Object.values(controls).reduce((sum, arr) => sum + arr.length, 0);
    results.summary.totalControls += totalControls;
    
    if (totalControls > 0) {
      // Analyze class patterns for each control type
      Object.entries(controls).forEach(([type, elements]) => {
        if (elements.length > 0) {
          results.summary.controlTypes[type] = (results.summary.controlTypes[type] || 0) + elements.length;
          
          // Analyze class patterns
          const classPatterns = analyzeClassPatterns(elements);
          Object.entries(classPatterns).forEach(([cls, count]) => {
            results.summary.classPatterns[cls] = (results.summary.classPatterns[cls] || 0) + count;
          });
          
          // Store control details
          if (results.controlDetails[type]) {
            results.controlDetails[type][componentName] = {
              count: elements.length,
              examples: elements.slice(0, 3), // Store up to 3 examples
              classPatterns
            };
          }
        }
      });
      
      // Identify validation patterns
      if (controls.validationElements.length > 0) {
        const validationPatterns = analyzeClassPatterns(controls.validationElements);
        Object.entries(validationPatterns).forEach(([pattern, count]) => {
          results.summary.validationPatterns[pattern] = (results.summary.validationPatterns[pattern] || 0) + count;
        });
      }
      
      // Identify label patterns
      if (controls.labels.length > 0) {
        const labelPatterns = analyzeClassPatterns(controls.labels);
        Object.entries(labelPatterns).forEach(([pattern, count]) => {
          results.summary.labelPatterns[pattern] = (results.summary.labelPatterns[pattern] || 0) + count;
        });
      }
      
      // Check for inconsistencies
      const inputClassSets = new Set();
      controls.inputs.forEach(input => {
        if (input.attributes.className) {
          inputClassSets.add(input.attributes.className);
        }
      });
      
      if (inputClassSets.size > 1) {
        results.inconsistencies.push({
          component: componentName,
          issue: 'inconsistent-input-styles',
          details: `Component uses ${inputClassSets.size} different input styling patterns`,
          path: relativePath,
        });
      }
    }
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
  }
}

// Recursively get all component files
function getComponentFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      files = files.concat(getComponentFiles(itemPath));
    } else if (stat.isFile() && /\.(jsx?|tsx?)$/.test(item)) {
      files.push(itemPath);
    }
  }
  
  return files;
}

// Generate recommendations
function generateRecommendations() {
  // Find most common input style
  const inputClasses = Object.entries(results.summary.classPatterns)
    .filter(([cls]) => cls.includes('input') || cls.includes('border') || cls.includes('px-') || cls.includes('py-'))
    .sort((a, b) => b[1] - a[1]);
  
  // Find most common validation pattern
  const validationClasses = Object.entries(results.summary.validationPatterns)
    .sort((a, b) => b[1] - a[1]);
  
  // Find most common label pattern
  const labelClasses = Object.entries(results.summary.labelPatterns)
    .sort((a, b) => b[1] - a[1]);
  
  // Generate recommendations
  results.recommendations = {
    standardControls: {
      input: `w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50`,
      select: `w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50`,
      textarea: `w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50`,
      checkbox: `h-5 w-5 md:h-4 md:w-4 text-primary border-slate-300 rounded focus:ring-primary`,
      radio: `h-5 w-5 md:h-4 md:w-4 text-primary border-slate-300 rounded-full focus:ring-primary`,
      label: `block text-sm font-medium text-slate-700 mb-1`
    },
    validationStyles: {
      errorInput: `border-red-500 focus:ring-red-500 focus:border-red-500`,
      errorMessage: `text-red-500 text-sm mt-1 flex items-start`
    },
    touchTargetSizes: {
      input: `h-12 md:h-11`,
      select: `h-12 md:h-11`,
      checkbox: `h-5 w-5 md:h-4 md:w-4`,
      button: `h-12 md:h-10`
    },
    implementationPlan: [
      'Create FormField component encapsulating label, input, and validation message',
      'Standardize all input/select/textarea styles',
      'Implement consistent validation pattern',
      'Ensure touch-friendly sizing on mobile',
      'Create mobile-specific styles for improved UX'
    ]
  };
}

// Main execution
try {
  console.log('Starting form controls analysis...');
  
  // Get all component files
  const files = getComponentFiles(REGISTER_DIR);
  console.log(`Found ${files.length} files to analyze`);
  
  // Analyze each file
  for (const file of files) {
    analyzeFile(file);
  }
  
  // Generate recommendations
  generateRecommendations();
  
  // Write results to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`Analysis complete! Results written to ${OUTPUT_FILE}`);
  
  // Print summary
  console.log('\nSummary:');
  console.log(`- Analyzed ${results.summary.totalControls} form controls`);
  console.log(`- Control types found: ${Object.keys(results.summary.controlTypes).join(', ')}`);
  console.log(`- Inconsistencies found: ${results.inconsistencies.length}`);
  console.log(`- Mobile-specific styles: ${Object.keys(results.summary.mobileSpecificStyles).length}`);
  
} catch (error) {
  console.error('Error running analysis:', error);
}