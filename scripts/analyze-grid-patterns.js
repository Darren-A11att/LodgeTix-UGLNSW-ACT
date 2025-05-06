/**
 * Grid Pattern Analysis Script
 * 
 * This script focuses specifically on analyzing grid patterns and column spans
 * in the register components to identify inconsistencies and create a standardization plan.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// Configuration
const REGISTER_DIR = path.resolve(__dirname, '../src/components/register');
const OUTPUT_FILE = path.resolve(__dirname, './grid-analysis-results.json');

// Results structure
const results = {
  summary: {
    totalFiles: 0,
    filesWithGrids: 0,
    gridConfigurations: {},
    columnSpanUsage: {},
    mobileResponsivePatterns: {},
  },
  componentDetails: {},
  inconsistencies: [],
  recommendations: {}
};

// Helper to extract classnames from JSX
function extractClassNamesFromJSX(fileContent) {
  const classNames = [];
  
  try {
    const ast = parse(fileContent, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
    
    traverse(ast, {
      JSXAttribute(path) {
        const attrName = path.node.name.name;
        if (attrName === 'className' && path.node.value.type === 'StringLiteral') {
          const className = path.node.value.value;
          classNames.push({
            className,
            parentElement: path.findParent(p => p.isJSXOpeningElement())?.node.name.name || 'unknown',
            lineNumber: path.node.loc?.start.line || 0,
          });
        }
      }
    });
  } catch (error) {
    console.error('Error parsing file:', error);
  }
  
  return classNames;
}

// Analyze grid and column patterns in a file
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
    
    console.log(`Analyzing grid patterns in: ${componentName}`);
    results.summary.totalFiles++;
    
    // Extract all classNames
    const classNames = extractClassNamesFromJSX(content);
    
    // Analyze grid patterns
    const gridPatterns = classNames.filter(c => 
      c.className.includes('grid-cols') || 
      c.className.includes('grid ') || 
      c.className.includes('col-span')
    );
    
    if (gridPatterns.length > 0) {
      results.summary.filesWithGrids++;
      
      results.componentDetails[componentName] = {
        path: relativePath,
        gridDeclarations: classNames.filter(c => 
          c.className.includes('grid-cols') || c.className.includes('grid ')
        ),
        columnSpans: classNames.filter(c => c.className.includes('col-span')),
        mobilePatterns: classNames.filter(c => 
          c.className.includes('md:') || 
          c.className.includes('sm:') || 
          c.className.includes('lg:')
        ),
      };
      
      // Extract grid configurations
      gridPatterns.forEach(pattern => {
        const gridColsMatch = pattern.className.match(/grid-cols-(\d+)/);
        if (gridColsMatch) {
          const colCount = gridColsMatch[1];
          results.summary.gridConfigurations[colCount] = (results.summary.gridConfigurations[colCount] || 0) + 1;
        }
        
        const colSpanMatch = pattern.className.match(/col-span-(\d+)/);
        if (colSpanMatch) {
          const spanCount = colSpanMatch[1];
          results.summary.columnSpanUsage[spanCount] = (results.summary.columnSpanUsage[spanCount] || 0) + 1;
        }
        
        // Detect responsive patterns
        const responsiveMatches = pattern.className.match(/(sm|md|lg|xl):grid-cols-(\d+)/g) || [];
        responsiveMatches.forEach(match => {
          results.summary.mobileResponsivePatterns[match] = (results.summary.mobileResponsivePatterns[match] || 0) + 1;
        });
        
        const responsiveColSpanMatches = pattern.className.match(/(sm|md|lg|xl):col-span-(\d+)/g) || [];
        responsiveColSpanMatches.forEach(match => {
          results.summary.mobileResponsivePatterns[match] = (results.summary.mobileResponsivePatterns[match] || 0) + 1;
        });
      });
      
      // Identify inconsistencies
      const gridCols = new Set();
      classNames.forEach(cn => {
        const match = cn.className.match(/grid-cols-(\d+)/);
        if (match) {
          gridCols.add(match[1]);
        }
      });
      
      if (gridCols.size > 1) {
        results.inconsistencies.push({
          component: componentName,
          issue: 'multiple-grid-systems',
          details: `Component uses ${Array.from(gridCols).join(', ')} column grids in the same file`,
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

// Generate recommendations based on analysis
function generateRecommendations() {
  // Determine most common grid system
  const gridCounts = Object.entries(results.summary.gridConfigurations);
  gridCounts.sort((a, b) => b[1] - a[1]);
  const mostCommonGrid = gridCounts.length > 0 ? gridCounts[0][0] : '12';
  
  // Determine most common mobile approach
  const mobilePatterns = Object.entries(results.summary.mobileResponsivePatterns);
  mobilePatterns.sort((a, b) => b[1] - a[1]);
  const hasMobilePatterns = mobilePatterns.length > 0;
  
  // Generate recommendations
  results.recommendations = {
    standardGridSystem: `grid-cols-${mostCommonGrid}`,
    mobileFirstApproach: hasMobilePatterns ? 
      'Continue using responsive prefixes (md:, lg:)' : 
      'Implement consistent mobile-first approach with responsive prefixes',
    columnStandardization: 'Use consistent column spans based on field size:',
    columnGuidelines: {
      'small-fields': 'col-span-4 md:col-span-2 (titles, short inputs)',
      'medium-fields': 'col-span-4 md:col-span-4 (names, standard inputs)',
      'large-fields': 'col-span-4 md:col-span-6 (addresses, longer inputs)',
      'full-width': 'col-span-4 md:col-span-12 (textareas, complex controls)',
    },
    implementationPlan: [
      'Create FormField component with standardized mobile column handling',
      'Update existing form layouts to use consistent grid-cols-4 md:grid-cols-12',
      'Standardize column spans across similar field types',
      'Ensure all form layouts stack vertically on mobile (< 768px)',
    ]
  };
}

// Main execution
try {
  console.log('Starting grid pattern analysis...');
  
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
  console.log(`- Analyzed ${results.summary.totalFiles} components`);
  console.log(`- Found ${results.summary.filesWithGrids} components using grid layouts`);
  console.log(`- Most common grid system: ${results.recommendations.standardGridSystem}`);
  console.log(`- Mobile responsive patterns: ${Object.keys(results.summary.mobileResponsivePatterns).length > 0 ? 'Yes' : 'No'}`);
  console.log(`- Inconsistencies found: ${results.inconsistencies.length}`);
  
} catch (error) {
  console.error('Error running analysis:', error);
}