#!/usr/bin/env node

/**
 * Database Schema Naming Adapter Helper Script
 * 
 * This script helps developers update references to database tables and columns
 * after the migration from snake_case to PascalCase (tables) and camelCase (columns).
 * 
 * It can:
 * 1. Output the mapping between old and new names
 * 2. Search for occurrences of old names in the codebase
 * 3. Suggest changes to update the codebase to use the new naming convention
 * 
 * Usage:
 *   node scripts/update-db-references.js [command] [options]
 * 
 * Commands:
 *   --list-tables        List all table name mappings
 *   --list-columns       List all column name mappings
 *   --search-tables      Search for references to old table names
 *   --search-columns     Search for references to old column names
 *   --generate-report    Generate a comprehensive report
 *   --help               Show this help message
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const adapter = require('./db-naming-adapter');

// Define command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Help text
function showHelp() {
  console.log(`
Database Schema Naming Adapter Helper Script

Usage:
  node scripts/update-db-references.js [command] [options]

Commands:
  --list-tables        List all table name mappings
  --list-columns       List all column name mappings
  --search-tables      Search for references to old table names
  --search-columns     Search for references to old column names
  --generate-report    Generate a comprehensive report
  --help               Show this help message
  `);
}

// List table mappings
function listTableMappings() {
  console.log('\nTable Name Mappings (snake_case to PascalCase):');
  console.log('------------------------------------------------');
  console.log('| Old Name                    | New Name                    |');
  console.log('|-----------------------------|-----------------------------|');
  
  for (const [oldName, newName] of Object.entries(adapter.tableNameMap)) {
    console.log(`| ${oldName.padEnd(28)} | ${newName.padEnd(28)} |`);
  }
  console.log('------------------------------------------------\n');
}

// List column mappings
function listColumnMappings() {
  console.log('\nColumn Name Mappings (snake_case to camelCase):');
  console.log('------------------------------------------------');
  
  for (const [tableName, columns] of Object.entries(adapter.columnNameMap)) {
    console.log(`\nTable: ${tableName}`);
    console.log('| Old Column                  | New Column                  |');
    console.log('|-----------------------------|-----------------------------|');
    
    for (const [oldColumn, newColumn] of Object.entries(columns)) {
      console.log(`| ${oldColumn.padEnd(28)} | ${newColumn.padEnd(28)} |`);
    }
  }
  console.log('------------------------------------------------\n');
}

// Search for references to old table names
function searchTableReferences() {
  console.log('\nSearching for references to old table names...');
  
  for (const [oldName, newName] of Object.entries(adapter.tableNameMap)) {
    try {
      // Use grep to find occurrences, excluding this script and node_modules
      const result = execSync(`grep -r "${oldName}" --include="*.{js,ts,tsx,jsx}" --exclude-dir={node_modules,dist,build,.git} .`, { encoding: 'utf8' });
      console.log(`\nReferences to '${oldName}' (should be '${newName}'):`);
      console.log(result || 'No references found');
    } catch (error) {
      // grep returns non-zero exit code if no matches found
      console.log(`No references to '${oldName}' found.`);
    }
  }
}

// Search for references to old column names
function searchColumnReferences() {
  console.log('\nSearching for references to old column names...');
  
  for (const [tableName, columns] of Object.entries(adapter.columnNameMap)) {
    for (const [oldColumn, newColumn] of Object.entries(columns)) {
      try {
        // Use grep to find occurrences, excluding this script and node_modules
        const result = execSync(`grep -r "${oldColumn}" --include="*.{js,ts,tsx,jsx}" --exclude-dir={node_modules,dist,build,.git} .`, { encoding: 'utf8' });
        console.log(`\nReferences to '${oldColumn}' (should be '${newColumn}') from table ${tableName}:`);
        console.log(result || 'No references found');
      } catch (error) {
        // grep returns non-zero exit code if no matches found
        // We'll skip this to avoid cluttering the output
      }
    }
  }
}

// Generate a comprehensive report
function generateReport() {
  const reportPath = path.join(__dirname, '..', 'database-naming-migration-report.md');
  
  let report = `# Database Naming Convention Migration Report\n\n`;
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  
  report += `## Table Name Mappings (snake_case to PascalCase)\n\n`;
  report += `| Old Name | New Name |\n`;
  report += `|----------|----------|\n`;
  
  for (const [oldName, newName] of Object.entries(adapter.tableNameMap)) {
    report += `| \`${oldName}\` | \`${newName}\` |\n`;
  }
  
  report += `\n## Column Name Mappings (snake_case to camelCase)\n\n`;
  
  for (const [tableName, columns] of Object.entries(adapter.columnNameMap)) {
    report += `### Table: ${tableName}\n\n`;
    report += `| Old Column | New Column |\n`;
    report += `|------------|------------|\n`;
    
    for (const [oldColumn, newColumn] of Object.entries(columns)) {
      report += `| \`${oldColumn}\` | \`${newColumn}\` |\n`;
    }
    
    report += `\n`;
  }
  
  report += `## Migration Steps\n\n`;
  report += `1. Update all database query references to use the new naming convention\n`;
  report += `2. Update all interface/type definitions to use the new naming convention\n`;
  report += `3. Use the provided adapter functions for data conversion\n`;
  report += `4. Update any hardcoded SQL queries with the new table and column names\n`;
  
  report += `\n## Adapter Function Usage Examples\n\n`;
  report += "```typescript\n";
  report += `import { convertToNewFormat, convertToOldFormat } from './scripts/db-naming-adapter';\n\n`;
  report += `// Convert from old to new format\n`;
  report += `const oldData = { user_id: 1, first_name: 'John', last_name: 'Doe' };\n`;
  report += `const newData = convertToNewFormat('users', oldData);\n`;
  report += `// Result: { userId: 1, firstName: 'John', lastName: 'Doe' }\n\n`;
  report += `// Convert from new to old format\n`;
  report += `const newData = { userId: 1, firstName: 'John', lastName: 'Doe' };\n`;
  report += `const oldData = convertToOldFormat('Users', newData);\n`;
  report += `// Result: { user_id: 1, first_name: 'John', last_name: 'Doe' }\n`;
  report += "```\n";
  
  fs.writeFileSync(reportPath, report);
  console.log(`Report generated at: ${reportPath}`);
}

// Process command
switch (command) {
  case '--list-tables':
    listTableMappings();
    break;
  case '--list-columns':
    listColumnMappings();
    break;
  case '--search-tables':
    searchTableReferences();
    break;
  case '--search-columns':
    searchColumnReferences();
    break;
  case '--generate-report':
    generateReport();
    break;
  case '--help':
  case undefined:
    showHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}