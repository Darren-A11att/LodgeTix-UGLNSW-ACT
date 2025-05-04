#!/usr/bin/env node

/**
 * Database Rename Mapping Extractor
 * 
 * This script connects to the Supabase database and extracts the rename mappings
 * from the table_rename_log and column_rename_log tables. It generates:
 * 
 * 1. A comprehensive JSON mapping file
 * 2. A TypeScript adapter module for maintaining compatibility
 * 3. A Markdown documentation file with all the mappings
 * 
 * Usage:
 *   node scripts/extract-rename-mappings.js
 * 
 * Prerequisites:
 *   - Supabase project ID and API key in .env file or as environment variables
 *   - Node.js and npm installed
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Handle paths in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables (if .env file exists)
try {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
        process.env[key] = value;
      }
    });
  }
} catch (err) {
  console.warn('Warning: Could not load .env file. Using existing environment variables.');
}

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL and API key are required. Please set them in your .env file or as environment variables.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchRenameMappings() {
  try {
    console.log('Connecting to Supabase and fetching rename mappings...');
    
    // Fetch table renames
    const { data: tableRenames, error: tableError } = await supabase
      .from('table_rename_log')
      .select('*')
      .eq('success', true)
      .order('timestamp', { ascending: true });
    
    if (tableError) {
      console.error('Error fetching table rename logs:', tableError.message);
      return null;
    }
    
    // Fetch column renames
    const { data: columnRenames, error: columnError } = await supabase
      .from('column_rename_log')
      .select('*')
      .eq('success', true)
      .order('timestamp', { ascending: true });
    
    if (columnError) {
      console.error('Error fetching column rename logs:', columnError.message);
      return null;
    }
    
    console.log(`Found ${tableRenames.length} table renames and ${columnRenames.length} column renames.`);
    
    // Group column renames by table
    const columnsByTable = {};
    columnRenames.forEach(rename => {
      if (!columnsByTable[rename.table_name]) {
        columnsByTable[rename.table_name] = [];
      }
      columnsByTable[rename.table_name].push({
        oldName: rename.old_column,
        newName: rename.new_column,
        timestamp: rename.timestamp,
        success: rename.success
      });
    });
    
    // Create the full mapping
    const mapping = {
      tables: tableRenames.map(rename => ({
        oldName: rename.old_name,
        newName: rename.new_name,
        timestamp: rename.timestamp,
        success: rename.success
      })),
      columns: columnsByTable
    };
    
    return mapping;
  } catch (error) {
    console.error('Unexpected error fetching rename mappings:', error);
    return null;
  }
}

function generateMappingFiles(mapping) {
  if (!mapping) {
    console.error('No mapping data available. Aborting file generation.');
    return false;
  }
  
  // Create output directory if it doesn't exist
  const outputDir = path.join(rootDir, 'scripts', 'db-standardization');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // 1. Generate JSON mapping file
    const jsonPath = path.join(outputDir, 'db-rename-mappings.json');
    fs.writeFileSync(jsonPath, JSON.stringify(mapping, null, 2), 'utf8');
    console.log(`JSON mapping file created at: ${jsonPath}`);
    
    // 2. Generate TypeScript adapter module
    const tsAdapterPath = path.join(outputDir, 'db-naming-adapter.ts');
    
    // Prepare table mapping objects
    const tablesToPascalCase = mapping.tables.reduce((obj, rename) => {
      obj[rename.oldName] = rename.newName;
      return obj;
    }, {});
    
    const tablesToSnakeCase = mapping.tables.reduce((obj, rename) => {
      obj[rename.newName] = rename.oldName;
      return obj;
    }, {});
    
    // Generate column mapping code
    const columnMapCode = Object.entries(mapping.columns).map(([tableName, columns]) => {
      const toPascalTableName = mapping.tables.find(t => t.oldName === tableName)?.newName || tableName;
      
      // Generate the camelCase mapping object
      const toCamelObj = columns.reduce((obj, col) => {
        obj[col.oldName] = col.newName;
        return obj;
      }, {});
      
      // Generate the snake_case mapping object
      const toSnakeObj = columns.reduce((obj, col) => {
        obj[col.newName] = col.oldName;
        return obj;
      }, {});
      
      return `  // Column mappings for ${toPascalTableName} table
  ${toPascalTableName}: {
    toCamelCase: ${JSON.stringify(toCamelObj, null, 4).replace(/"([^"]+)":/g, '$1:')},
    toSnakeCase: ${JSON.stringify(toSnakeObj, null, 4).replace(/"([^"]+)":/g, '$1:')}
  },`;
    }).join('\n\n');
    
    const adapterCode = `/**
 * Database Naming Convention Adapter
 * 
 * This module provides utilities to convert between snake_case and PascalCase/camelCase
 * naming conventions used in the database schema standardization process.
 * 
 * Generated on: ${new Date().toISOString()}
 * Tables mapped: ${mapping.tables.length}
 * Columns mapped: ${Object.values(mapping.columns).flat().length}
 */

/**
 * Maps table names from snake_case to PascalCase
 */
export const tablesToPascalCase = ${JSON.stringify(tablesToPascalCase, null, 2).replace(/"([^"]+)":/g, '$1:')};

/**
 * Maps table names from PascalCase to snake_case
 */
export const tablesToSnakeCase = ${JSON.stringify(tablesToSnakeCase, null, 2).replace(/"([^"]+)":/g, '$1:')};

/**
 * Maps column names from snake_case to camelCase, organized by PascalCase table name
 */
export const columnMappings = {
${columnMapCode}
};

/**
 * Converts a snake_case table name to PascalCase
 * @param tableName The snake_case table name
 * @returns The PascalCase table name
 */
export function getTableNameInPascalCase(tableName: string): string {
  return tablesToPascalCase[tableName] || tableName;
}

/**
 * Converts a PascalCase table name to snake_case
 * @param tableName The PascalCase table name
 * @returns The snake_case table name
 */
export function getTableNameInSnakeCase(tableName: string): string {
  return tablesToSnakeCase[tableName] || tableName;
}

/**
 * Converts a snake_case column name to camelCase for a specific table
 * @param tableName The PascalCase table name
 * @param columnName The snake_case column name
 * @returns The camelCase column name
 */
export function getColumnNameInCamelCase(tableName: string, columnName: string): string {
  if (!columnMappings[tableName]) return columnName;
  return columnMappings[tableName].toCamelCase[columnName] || columnName;
}

/**
 * Converts a camelCase column name to snake_case for a specific table
 * @param tableName The PascalCase table name
 * @param columnName The camelCase column name
 * @returns The snake_case column name
 */
export function getColumnNameInSnakeCase(tableName: string, columnName: string): string {
  if (!columnMappings[tableName]) return columnName;
  return columnMappings[tableName].toSnakeCase[columnName] || columnName;
}

/**
 * Converts an entire database record from snake_case column names to camelCase
 * @param tableName The PascalCase table name
 * @param record The record with snake_case column names
 * @returns The record with camelCase column names
 */
export function convertRecordToCamelCase<T>(tableName: string, record: Record<string, any>): T {
  if (!record || !columnMappings[tableName]) return record as T;
  
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(record)) {
    const camelKey = getColumnNameInCamelCase(tableName, key);
    result[camelKey] = value;
  }
  
  return result as T;
}

/**
 * Converts an entire database record from camelCase column names to snake_case
 * @param tableName The PascalCase table name
 * @param record The record with camelCase column names
 * @returns The record with snake_case column names
 */
export function convertRecordToSnakeCase(tableName: string, record: Record<string, any>): Record<string, any> {
  if (!record || !columnMappings[tableName]) return record;
  
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(record)) {
    const snakeKey = getColumnNameInSnakeCase(tableName, key);
    result[snakeKey] = value;
  }
  
  return result;
}

/**
 * Converts an object with table names as keys from snake_case to PascalCase
 * @param obj The object with snake_case table names as keys
 * @returns The object with PascalCase table names as keys
 */
export function convertObjectKeysToPascalCase<T>(obj: Record<string, any>): T {
  if (!obj) return obj as T;
  
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const pascalKey = getTableNameInPascalCase(key);
    result[pascalKey] = value;
  }
  
  return result as T;
}
`;
    
    fs.writeFileSync(tsAdapterPath, adapterCode, 'utf8');
    console.log(`TypeScript adapter module created at: ${tsAdapterPath}`);
    
    // 3. Generate Markdown documentation
    const markdownPath = path.join(rootDir, 'DB_RENAME_MAPPINGS.md');
    
    const tableRows = mapping.tables.map(table => 
      `| \`${table.oldName}\` | \`${table.newName}\` |`
    ).join('\n');
    
    const columnSections = Object.entries(mapping.columns).map(([tableName, columns]) => {
      const toPascalTableName = mapping.tables.find(t => t.oldName === tableName)?.newName || tableName;
      
      const columnRows = columns.map(col => 
        `| \`${col.oldName}\` | \`${col.newName}\` |`
      ).join('\n');
      
      return `### ${toPascalTableName} Table
      
| Original (snake_case) | New (camelCase) |
|----------------------|-----------------|
${columnRows}
`;
    }).join('\n');
    
    const markdownContent = `# Database Rename Mappings

## Overview

This document provides a comprehensive reference of all database rename operations
performed during the schema standardization process. It includes:

- Table renames from snake_case to PascalCase
- Column renames from snake_case to camelCase

Generated on: ${new Date().toLocaleString()}

## Table Renames

| Original (snake_case) | New (PascalCase) |
|----------------------|------------------|
${tableRows}

## Column Renames

${columnSections}

## Using the Mappings

These mappings can be utilized to:

1. Update code references to match the new naming convention
2. Create adapter functions for compatibility with external systems
3. Generate type definitions for TypeScript code
4. Verify that all database queries have been updated correctly

For programmatic access to these mappings, see the generated:
- \`scripts/db-standardization/db-rename-mappings.json\` (JSON format)
- \`scripts/db-standardization/db-naming-adapter.ts\` (TypeScript adapter)
`;
    
    fs.writeFileSync(markdownPath, markdownContent, 'utf8');
    console.log(`Markdown documentation created at: ${markdownPath}`);
    
    // 4. Generate a JavaScript rename helper
    const jsHelperPath = path.join(outputDir, 'db-rename-helper.js');
    
    const jsHelperCode = `#!/usr/bin/env node

/**
 * Database Rename Helper
 * 
 * This script provides utilities to help with the database renaming process:
 * - List all table and column renames
 * - Search for references to old names in your codebase
 * - Generate reports of files that need updating
 * 
 * Usage:
 *   node scripts/db-standardization/db-rename-helper.js <command> [options]
 * 
 * Commands:
 *   list              List all table and column renames
 *   search <pattern>  Search for references to old names in codebase
 *   report            Generate a report of files that need updating
 * 
 * Options:
 *   --format <json|table|text>  Output format (default: table)
 *   --path <dir>                Path to search in (default: src)
 * 
 * Examples:
 *   node scripts/db-standardization/db-rename-helper.js list
 *   node scripts/db-standardization/db-rename-helper.js search events
 *   node scripts/db-standardization/db-rename-helper.js report --path src/lib
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load the mappings
const mappingsPath = path.join(__dirname, 'db-rename-mappings.json');
let mappings;

try {
  const mappingsContent = fs.readFileSync(mappingsPath, 'utf8');
  mappings = JSON.parse(mappingsContent);
} catch (err) {
  console.error(\`Error loading mappings from \${mappingsPath}:\`, err.message);
  console.error('Please run extract-rename-mappings.js first to generate the mappings.');
  process.exit(1);
}

// Utility functions
function formatAsTable(data, headers) {
  if (!data || data.length === 0) return 'No data available.';
  
  // Calculate column widths
  const colWidths = headers.map((header, idx) => {
    const maxDataWidth = data.reduce((max, row) => 
      Math.max(max, String(row[idx] || '').length), 0);
    return Math.max(header.length, maxDataWidth);
  });
  
  // Create header row
  const headerRow = headers.map((header, idx) => 
    header.padEnd(colWidths[idx])).join(' | ');
  
  // Create separator row
  const sepRow = colWidths.map(w => '-'.repeat(w)).join('-|-');
  
  // Create data rows
  const dataRows = data.map(row => 
    row.map((cell, idx) => String(cell || '').padEnd(colWidths[idx])).join(' | ')
  );
  
  return [headerRow, sepRow, ...dataRows].join('\\n');
}

function searchCodebase(pattern, basePath = 'src') {
  try {
    // Use grep to search for the pattern
    const command = \`grep -r --include="*.{js,ts,tsx,jsx}" "${pattern}" \${basePath}\`;
    try {
      const output = execSync(command, { encoding: 'utf8' });
      return output.trim().split('\\n').filter(Boolean);
    } catch (err) {
      // grep returns non-zero exit code if no matches found
      if (err.status === 1 && !err.stdout) {
        return [];
      }
      throw err;
    }
  } catch (err) {
    console.error('Error searching codebase:', err.message);
    return [];
  }
}

// Command handlers
function handleList(format = 'table') {
  console.log('Database Rename Mappings:');
  console.log('========================');
  
  // Table renames
  console.log('\\nTable Renames:');
  const tableData = mappings.tables.map(table => [table.oldName, table.newName]);
  
  if (format === 'json') {
    console.log(JSON.stringify(mappings.tables, null, 2));
  } else if (format === 'text') {
    mappings.tables.forEach(table => {
      console.log(\`\${table.oldName} -> \${table.newName}\`);
    });
  } else { // table format
    console.log(formatAsTable(tableData, ['Original (snake_case)', 'New (PascalCase)']));
  }
  
  // Column renames by table
  console.log('\\nColumn Renames:');
  Object.entries(mappings.columns).forEach(([tableName, columns]) => {
    const pascalTableName = mappings.tables.find(t => t.oldName === tableName)?.newName || tableName;
    console.log(\`\\n- \${pascalTableName} Table:\`);
    
    const columnData = columns.map(col => [col.oldName, col.newName]);
    
    if (format === 'json') {
      console.log(JSON.stringify(columns, null, 2));
    } else if (format === 'text') {
      columns.forEach(col => {
        console.log(\`  \${col.oldName} -> \${col.newName}\`);
      });
    } else { // table format
      console.log(formatAsTable(columnData, ['Original (snake_case)', 'New (camelCase)']));
    }
  });
}

function handleSearch(pattern, basePath = 'src', format = 'table') {
  if (!pattern) {
    console.error('Error: Search pattern is required.');
    return;
  }
  
  console.log(\`Searching for references to "\${pattern}" in \${basePath}...\`);
  
  // Search for the pattern in the codebase
  const results = searchCodebase(pattern, basePath);
  
  if (results.length === 0) {
    console.log(\`No references to "\${pattern}" found in \${basePath}.\`);
    return;
  }
  
  console.log(\`Found \${results.length} references to "\${pattern}":\`);
  
  if (format === 'json') {
    console.log(JSON.stringify(results, null, 2));
  } else {
    results.forEach(result => {
      console.log(result);
    });
  }
}

function handleReport(basePath = 'src', format = 'table') {
  console.log(\`Generating report for \${basePath}...\`);
  
  const report = {
    tablesToUpdate: [],
    columnsToUpdate: []
  };
  
  // Check for table references
  mappings.tables.forEach(table => {
    const results = searchCodebase(table.oldName, basePath);
    if (results.length > 0) {
      report.tablesToUpdate.push({
        oldName: table.oldName,
        newName: table.newName,
        references: results
      });
    }
  });
  
  // Check for column references
  Object.entries(mappings.columns).forEach(([tableName, columns]) => {
    columns.forEach(column => {
      const results = searchCodebase(column.oldName, basePath);
      if (results.length > 0) {
        report.columnsToUpdate.push({
          table: tableName,
          oldName: column.oldName,
          newName: column.newName,
          references: results
        });
      }
    });
  });
  
  // Output the report
  console.log('\\nReport Summary:');
  console.log(\`- Tables with references to update: \${report.tablesToUpdate.length}\`);
  console.log(\`- Columns with references to update: \${report.columnsToUpdate.length}\`);
  
  if (report.tablesToUpdate.length > 0) {
    console.log('\\nTable References to Update:');
    report.tablesToUpdate.forEach(table => {
      console.log(\`\\n- \${table.oldName} -> \${table.newName} (\${table.references.length} references)\`);
      if (table.references.length <= 10 || format === 'text' || format === 'json') {
        if (format === 'json') {
          console.log(JSON.stringify(table.references, null, 2));
        } else {
          table.references.forEach(ref => {
            console.log(\`  \${ref}\`);
          });
        }
      } else {
        console.log(\`  First 10 of \${table.references.length} references:\`);
        table.references.slice(0, 10).forEach(ref => {
          console.log(\`  \${ref}\`);
        });
      }
    });
  }
  
  if (report.columnsToUpdate.length > 0) {
    console.log('\\nColumn References to Update:');
    report.columnsToUpdate.forEach(column => {
      console.log(\`\\n- \${column.table}.\${column.oldName} -> \${column.newName} (\${column.references.length} references)\`);
      if (column.references.length <= 10 || format === 'text' || format === 'json') {
        if (format === 'json') {
          console.log(JSON.stringify(column.references, null, 2));
        } else {
          column.references.forEach(ref => {
            console.log(\`  \${ref}\`);
          });
        }
      } else {
        console.log(\`  First 10 of \${column.references.length} references:\`);
        column.references.slice(0, 10).forEach(ref => {
          console.log(\`  \${ref}\`);
        });
      }
    });
  }
  
  if (format === 'json') {
    console.log('\\nFull Report (JSON):');
    console.log(JSON.stringify(report, null, 2));
  }
  
  return report;
}

// Main function
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(\`
Database Rename Helper

Usage:
  node scripts/db-standardization/db-rename-helper.js <command> [options]

Commands:
  list              List all table and column renames
  search <pattern>  Search for references to old names in codebase
  report            Generate a report of files that need updating

Options:
  --format <json|table|text>  Output format (default: table)
  --path <dir>                Path to search in (default: src)

Examples:
  node scripts/db-standardization/db-rename-helper.js list
  node scripts/db-standardization/db-rename-helper.js search events
  node scripts/db-standardization/db-rename-helper.js report --path src/lib
\`);
    process.exit(0);
  }
  
  const command = args[0];
  
  // Parse options
  let format = 'table';
  let searchPath = 'src';
  let pattern = '';
  
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--format' && args[i + 1]) {
      format = args[i + 1];
      i++;
    } else if (args[i] === '--path' && args[i + 1]) {
      searchPath = args[i + 1];
      i++;
    } else if (command === 'search' && !pattern) {
      pattern = args[i];
    }
  }
  
  // Execute command
  switch (command) {
    case 'list':
      handleList(format);
      break;
    case 'search':
      handleSearch(pattern, searchPath, format);
      break;
    case 'report':
      handleReport(searchPath, format);
      break;
    default:
      console.error(\`Unknown command: \${command}\`);
      process.exit(1);
  }
}

main();
`;
    
    fs.writeFileSync(jsHelperPath, jsHelperCode, 'utf8');
    fs.chmodSync(jsHelperPath, '755'); // Make it executable
    console.log(`JavaScript rename helper created at: ${jsHelperPath}`);
    
    return true;
  } catch (error) {
    console.error('Error generating mapping files:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('Extracting database rename mappings...');
    const mapping = await fetchRenameMappings();
    
    if (!mapping) {
      console.error('Failed to fetch rename mappings from the database.');
      process.exit(1);
    }
    
    const success = generateMappingFiles(mapping);
    
    if (success) {
      console.log('\nAll mapping files generated successfully!');
      console.log('\nNext steps:');
      console.log('1. Review the DB_RENAME_MAPPINGS.md file for a complete reference');
      console.log('2. Use scripts/db-standardization/db-naming-adapter.ts in your codebase');
      console.log('3. Run scripts/db-standardization/db-rename-helper.js for additional tools');
    } else {
      console.error('\nFailed to generate mapping files. See errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Execute the main function
main();