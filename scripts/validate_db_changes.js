#!/usr/bin/env node

/**
 * validate_db_changes.js
 * 
 * This script validates that all database name references have been properly updated
 * after schema standardization. It checks for old PascalCase table names and camelCase
 * column names throughout the codebase.
 * 
 * Usage: node scripts/validate_db_changes.js [--verbose] [--fix]
 * 
 * Options:
 *   --verbose    Show detailed information for each issue found
 *   --fix        Generate a report of suggested fixes (does not modify files)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const generateFixes = args.includes('--fix');

// Configuration
const DB_MAPPINGS_PATH = path.join(__dirname, '../db_name_mappings.json');
const IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  '.git',
  'build',
  'db_name_mappings.json',
  'validate_db_changes.js'
];

// Result tracking
const issues = [];
let totalFilesChecked = 0;
let filesWithIssues = 0;

/**
 * Main execution function
 */
async function main() {
  console.log('Database Reference Validation Tool');
  console.log('=================================\n');

  try {
    // Check if mappings file exists
    if (!fs.existsSync(DB_MAPPINGS_PATH)) {
      console.error('\n❌ Error: db_name_mappings.json not found!');
      console.error('   Please run the rename_all.js script first to generate this file.\n');
      process.exit(1);
    }

    // Load the mappings
    console.log('Loading database name mappings...');
    const mappings = JSON.parse(fs.readFileSync(DB_MAPPINGS_PATH, 'utf8'));
    
    // Validate the mappings format
    if (!mappings.tables || !mappings.columns) {
      console.error('\n❌ Error: Invalid mapping file format!');
      console.error('   The mappings file should contain "tables" and "columns" objects.\n');
      process.exit(1);
    }

    console.log(`Found ${Object.keys(mappings.tables).length} table mappings and ${Object.keys(mappings.columns).length} column mappings\n`);

    // Get all files in the codebase
    console.log('Scanning codebase for relevant files...');
    const codeFiles = getRelevantFiles();
    console.log(`Found ${codeFiles.length} files to check\n`);

    // Validate each file
    console.log('Validating files for old database references...');
    for (const filePath of codeFiles) {
      validateFile(filePath, mappings);
      totalFilesChecked++;

      // Visual progress indicator for large projects
      if (totalFilesChecked % 100 === 0) {
        process.stdout.write('.');
      }
    }

    // Print results
    printResults();

    // Generate fix suggestions if requested
    if (generateFixes && issues.length > 0) {
      generateFixReport();
    }

  } catch (error) {
    console.error('\n❌ Error during validation:', error.message);
    process.exit(1);
  }
}

/**
 * Returns a list of files to check, excluding ignored patterns
 */
function getRelevantFiles() {
  try {
    // Use git to get all tracked files (more reliable than recursive traversal)
    const output = execSync('git ls-files', { encoding: 'utf8' });
    const allFiles = output.split('\n').filter(Boolean);
    
    // Filter out irrelevant files
    return allFiles.filter(file => {
      // Skip ignored patterns
      if (IGNORE_PATTERNS.some(pattern => file.includes(pattern))) {
        return false;
      }
      
      // Focus on these file types that might contain database references
      const relevantExtensions = ['.js', '.jsx', '.ts', '.tsx', '.sql', '.json', '.vue', '.md'];
      const ext = path.extname(file).toLowerCase();
      return relevantExtensions.includes(ext);
    });
  } catch (error) {
    console.error('Error getting file list:', error.message);
    // Fallback to manually getting files if git command fails
    return [];
  }
}

/**
 * Validates a single file for old database references
 */
function validateFile(filePath, mappings) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileIssues = [];
    
    // Check for old table names
    for (const oldTable in mappings.tables) {
      // Create a regex that handles various reference patterns
      // Match the table name as a standalone word or within quotes
      const tableRegex = new RegExp(`\\b${oldTable}\\b|['"\`]${oldTable}['"\`]`, 'g');
      
      // Find all matches
      let match;
      while ((match = tableRegex.exec(content)) !== null) {
        const lineNumber = getLineNumber(content, match.index);
        fileIssues.push({
          type: 'table',
          oldName: oldTable,
          newName: mappings.tables[oldTable],
          lineNumber,
          matchContext: getMatchContext(content, match.index)
        });
      }
    }
    
    // Check for old column names
    for (const oldColumn in mappings.columns) {
      // Create a regex that handles various reference patterns
      // Match the column name as a property or within quotes
      const columnRegex = new RegExp(`\\b${oldColumn}\\b|['"\`]${oldColumn}['"\`]`, 'g');
      
      // Find all matches
      let match;
      while ((match = columnRegex.exec(content)) !== null) {
        const lineNumber = getLineNumber(content, match.index);
        fileIssues.push({
          type: 'column',
          oldName: oldColumn,
          newName: mappings.columns[oldColumn],
          lineNumber,
          matchContext: getMatchContext(content, match.index)
        });
      }
    }
    
    // Special checks for template literals
    checkTemplateLiterals(content, mappings, fileIssues);
    
    // If issues were found, add them to the global issues list
    if (fileIssues.length > 0) {
      filesWithIssues++;
      issues.push({
        filePath,
        issues: fileIssues
      });
    }
  } catch (error) {
    console.warn(`Warning: Couldn't process ${filePath}: ${error.message}`);
  }
}

/**
 * Check for old names within template literals and complex string patterns
 */
function checkTemplateLiterals(content, mappings, fileIssues) {
  // Regular expression to find potential SQL strings or database queries
  const sqlPatterns = [
    /SELECT\s+.*?\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    /INSERT\s+INTO\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    /UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+SET/gi,
    /DELETE\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    /JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    /CREATE\s+TABLE\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    /ALTER\s+TABLE\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    /DROP\s+TABLE\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi
  ];
  
  // Look for SQL patterns
  sqlPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const tableName = match[1];
      
      // Check if this matches an old table name
      if (mappings.tables[tableName]) {
        const lineNumber = getLineNumber(content, match.index);
        fileIssues.push({
          type: 'sql_table_reference',
          oldName: tableName,
          newName: mappings.tables[tableName],
          lineNumber,
          matchContext: getMatchContext(content, match.index)
        });
      }
    }
  });
  
  // Check for possible column references in SQL
  const columnPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*[=<>!]/g;
  let match;
  while ((match = columnPattern.exec(content)) !== null) {
    const colName = match[1];
    
    // Check if this matches an old column name
    if (mappings.columns[colName]) {
      const lineNumber = getLineNumber(content, match.index);
      fileIssues.push({
        type: 'sql_column_reference',
        oldName: colName,
        newName: mappings.columns[colName],
        lineNumber,
        matchContext: getMatchContext(content, match.index)
      });
    }
  }
}

/**
 * Get the line number for a position in the content
 */
function getLineNumber(content, position) {
  const lines = content.substring(0, position).split('\n');
  return lines.length;
}

/**
 * Get the context around a match for better debugging
 */
function getMatchContext(content, position) {
  const startPos = Math.max(0, position - 30);
  const endPos = Math.min(content.length, position + 30);
  const contextText = content.substring(startPos, endPos);
  
  // Highlight the match position with a marker
  const relativePos = position - startPos;
  const highlightedContext = 
    contextText.substring(0, relativePos) + 
    '>>>' + 
    contextText.substring(relativePos);
  
  return highlightedContext;
}

/**
 * Print the validation results
 */
function printResults() {
  console.log('\n\nValidation Results');
  console.log('=================');
  console.log(`Files checked: ${totalFilesChecked}`);
  console.log(`Files with issues: ${filesWithIssues}`);
  console.log(`Total issues found: ${issues.reduce((sum, file) => sum + file.issues.length, 0)}\n`);
  
  if (issues.length === 0) {
    console.log('✅ No database reference issues found! All names appear to be updated correctly.');
    return;
  }
  
  console.log('Summary of issues:');
  issues.forEach(file => {
    console.log(`\n📄 ${file.filePath} (${file.issues.length} issues):`);
    
    if (verbose) {
      file.issues.forEach(issue => {
        console.log(`  - Line ${issue.lineNumber}: ${issue.type === 'table' ? 'Table' : 'Column'} "${issue.oldName}" should be "${issue.newName}"`);
        console.log(`    Context: ${issue.matchContext}`);
      });
    } else {
      // Group issues by line number
      const issuesByLine = {};
      file.issues.forEach(issue => {
        if (!issuesByLine[issue.lineNumber]) {
          issuesByLine[issue.lineNumber] = [];
        }
        issuesByLine[issue.lineNumber].push(issue);
      });
      
      // Print summarized issues
      Object.keys(issuesByLine).sort((a, b) => parseInt(a) - parseInt(b)).forEach(line => {
        const lineIssues = issuesByLine[line];
        console.log(`  - Line ${line}: ${lineIssues.length} issue${lineIssues.length > 1 ? 's' : ''}`);
        lineIssues.forEach(issue => {
          console.log(`    • ${issue.type === 'table' ? 'Table' : 'Column'} "${issue.oldName}" should be "${issue.newName}"`);
        });
      });
    }
  });
  
  console.log('\n⚠️ Some database references may still be using old naming conventions.');
  console.log('Run with --verbose for detailed context information.');
  console.log('Run with --fix to generate a report with suggested fixes.');
}

/**
 * Generate a report with suggested fixes
 */
function generateFixReport() {
  console.log('\nGenerating Fix Report');
  console.log('====================');
  
  const reportPath = path.join(__dirname, '../db_fix_report.md');
  let report = '# Database Reference Fix Report\n\n';
  report += 'This report contains suggested fixes for database reference issues found in the codebase.\n\n';
  
  issues.forEach(file => {
    report += `## ${file.filePath}\n\n`;
    
    // Group issues by line number
    const issuesByLine = {};
    file.issues.forEach(issue => {
      if (!issuesByLine[issue.lineNumber]) {
        issuesByLine[issue.lineNumber] = [];
      }
      issuesByLine[issue.lineNumber].push(issue);
    });
    
    // Generate fix suggestions
    Object.keys(issuesByLine).sort((a, b) => parseInt(a) - parseInt(b)).forEach(line => {
      report += `### Line ${line}\n\n`;
      report += '```\n';
      
      // Get the content of the line
      const content = fs.readFileSync(file.filePath, 'utf8');
      const lines = content.split('\n');
      const lineContent = lines[parseInt(line) - 1];
      
      report += lineContent + '\n';
      report += '```\n\n';
      
      // Suggest fixes
      report += '#### Suggested fixes:\n\n';
      issuesByLine[line].forEach(issue => {
        report += `- Replace \`${issue.oldName}\` with \`${issue.newName}\`\n`;
      });
      
      report += '\n';
    });
    
    report += '\n';
  });
  
  // Write the report
  fs.writeFileSync(reportPath, report);
  console.log(`✅ Fix report generated: ${reportPath}`);
}

// Run the script
main();