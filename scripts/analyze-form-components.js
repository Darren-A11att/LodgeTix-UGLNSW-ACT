/**
 * Form Component Analysis Script
 * 
 * This script analyzes React components in the register directory
 * to identify inconsistencies in form layouts, column usage, and mobile patterns.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// Configuration
const REGISTER_DIR = path.resolve(__dirname, '../src/components/register');
const OUTPUT_FILE = path.resolve(__dirname, './form-analysis-results.json');

// Analysis results
const results = {
  components: {},
  gridPatterns: {},
  formControls: {
    inputs: {},
    selects: {},
    checkboxes: {},
    radioButtons: {},
    textareas: {},
  },
  mobilePatterns: {},
  columnUsage: {},
};

// Helper functions
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const componentName = fileName.replace(/\.[jt]sx?$/, '');
    
    // Skip non-component files
    if (!content.includes('React') || !content.includes('export default')) {
      return;
    }
    
    console.log(`Analyzing: ${componentName}`);
    
    // Parse the file
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
    
    const componentData = {
      name: componentName,
      path: filePath,
      gridUsage: [],
      colSpanPatterns: [],
      inputControls: [],
      mobileSpecificCode: [],
      props: [],
    };
    
    // Traverse the AST
    traverse(ast, {
      // Find component props
      FunctionDeclaration(path) {
        if (path.node.params && path.node.params.length > 0) {
          const props = path.node.params[0];
          if (props.type === 'ObjectPattern') {
            componentData.props = props.properties.map(prop => prop.key.name);
          }
        }
      },
      
      // Find JSX patterns
      JSXAttribute(path) {
        const attrName = path.node.name.name;
        const parentTag = path.findParent(p => p.isJSXOpeningElement())?.node.name.name;
        
        // Detect grid usage
        if (attrName === 'className' && path.node.value.type === 'StringLiteral') {
          const className = path.node.value.value;
          
          // Grid patterns
          if (className.includes('grid-cols')) {
            componentData.gridUsage.push({
              element: parentTag,
              className,
            });
            
            // Extract grid cols pattern
            const gridColsMatch = className.match(/grid-cols-(\d+)/);
            if (gridColsMatch) {
              const colCount = gridColsMatch[1];
              results.gridPatterns[colCount] = (results.gridPatterns[colCount] || 0) + 1;
            }
          }
          
          // Column span patterns
          if (className.includes('col-span')) {
            componentData.colSpanPatterns.push({
              element: parentTag,
              className,
            });
            
            // Extract col-span pattern
            const colSpanMatch = className.match(/col-span-(\d+)/);
            if (colSpanMatch) {
              const spanSize = colSpanMatch[1];
              results.columnUsage[spanSize] = (results.columnUsage[spanSize] || 0) + 1;
            }
          }
          
          // Detect mobile specific code
          if (className.includes('md:') || className.includes('lg:') || className.includes('sm:')) {
            componentData.mobileSpecificCode.push({
              element: parentTag,
              className,
            });
          }
        }
        
        // Form controls
        if (['type', 'value', 'onChange', 'required'].includes(attrName)) {
          if (parentTag === 'input') {
            const inputType = path.findParent(p => p.isJSXOpeningElement())?.node.attributes
              .find(attr => attr.name?.name === 'type')?.value.value;
              
            if (inputType) {
              componentData.inputControls.push({
                type: inputType,
                element: parentTag,
                attribute: attrName,
              });
              
              results.formControls.inputs[inputType] = (results.formControls.inputs[inputType] || 0) + 1;
            }
          } else if (parentTag === 'select') {
            componentData.inputControls.push({
              type: 'select',
              element: parentTag,
              attribute: attrName,
            });
            
            results.formControls.selects.count = (results.formControls.selects.count || 0) + 1;
          } else if (parentTag === 'textarea') {
            componentData.inputControls.push({
              type: 'textarea',
              element: parentTag,
              attribute: attrName,
            });
            
            results.formControls.textareas.count = (results.formControls.textareas.count || 0) + 1;
          }
        }
      },
      
      // Find responsive media queries
      StringLiteral(path) {
        if (path.node.value.includes('@media')) {
          componentData.mobileSpecificCode.push({
            type: 'mediaQuery',
            value: path.node.value,
          });
        }
      },
    });
    
    // Add to results
    results.components[componentName] = componentData;
    
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
  }
}

// Recursively get all js/ts files in a directory
function getFilesRecursively(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      files = files.concat(getFilesRecursively(itemPath));
    } else if (stat.isFile() && /\.(jsx?|tsx?)$/.test(item)) {
      files.push(itemPath);
    }
  }
  
  return files;
}

// Main execution
try {
  console.log('Starting form component analysis...');
  
  // Get all component files
  const files = getFilesRecursively(REGISTER_DIR);
  console.log(`Found ${files.length} files to analyze`);
  
  // Analyze each file
  for (const file of files) {
    analyzeFile(file);
  }
  
  // Write results to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`Analysis complete! Results written to ${OUTPUT_FILE}`);
  
} catch (error) {
  console.error('Error running analysis:', error);
}