#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

// Function to convert PascalCase to snake_case
function pascalToSnakeCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1_$2')
    .toLowerCase();
}

// Function to convert camelCase to snake_case
function camelToSnakeCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

// Function to find all TypeScript and JavaScript files in the project
async function findAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  async function traverse(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && 
          !entry.name.startsWith('.') && 
          entry.name !== 'node_modules' &&
          entry.name !== 'dist' &&
          entry.name !== 'build') {
        await traverse(fullPath);
      } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }
  
  await traverse(dir);
  return files;
}

// Function to extract table names from code
async function extractTableNames(files) {
  const tableRegex = /\.from\(['"]([A-Za-z0-9_]+)['"]\)/g;
  const tableNames = new Set();
  
  for (const file of files) {
    try {
      const content = await readFile(file, 'utf-8');
      let match;
      
      while ((match = tableRegex.exec(content)) !== null) {
        tableNames.add(match[1]);
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }
  
  return Array.from(tableNames);
}

// Function to extract column names from code
async function extractColumnNames(files) {
  // Pattern to match column names in various Supabase methods
  const columnPatterns = [
    /\.(?:eq|neq|gt|lt|gte|lte|like|ilike|is|in|contains|containedBy|rangeLt|rangeGt|rangeGte|rangeLte|rangeAdjacent|overlaps|textSearch|filter|not|or|and)\(['"]([A-Za-z0-9_]+)['"]/g,
    /\.(?:select|order|update|insert|upsert)\(['"]([A-Za-z0-9_,\s]+)['"]/g,
    /\.select\(['"]\*['"]\)\.select\(\{([^}]+)\}\)/g,
  ];
  
  const columnNames = new Set();
  
  for (const file of files) {
    try {
      const content = await readFile(file, 'utf-8');
      
      // Process each pattern
      for (const pattern of columnPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          // Handle comma-separated column names in select statements
          const columns = match[1].split(',').map(col => col.trim());
          for (const col of columns) {
            if (col && !col.includes(':') && !col.includes('{') && !col.includes('(') && /^[A-Za-z0-9_]+$/.test(col)) {
              columnNames.add(col);
            }
          }
        }
      }
      
      // Extract column names from TypeScript interfaces
      const interfaceRegex = /interface\s+\w+\s*\{([^}]+)\}/gs;
      let interfaceMatch;
      while ((interfaceMatch = interfaceRegex.exec(content)) !== null) {
        const interfaceContent = interfaceMatch[1];
        const propertyRegex = /^\s*([A-Za-z0-9_]+)[\?]?\:/gm;
        let propertyMatch;
        while ((propertyMatch = propertyRegex.exec(interfaceContent)) !== null) {
          columnNames.add(propertyMatch[1]);
        }
      }
      
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }
  
  return Array.from(columnNames);
}

// Function to create table mapping
function createTableMapping(tables) {
  const mapping = {};
  
  for (const table of tables) {
    // Skip tables that are already snake_case
    if (table === table.toLowerCase() && !table.match(/[A-Z]/)) {
      mapping[table] = table;
    } else {
      mapping[table] = pascalToSnakeCase(table);
    }
  }
  
  return mapping;
}

// Function to create column mapping
function createColumnMapping(columns) {
  const mapping = {};
  
  for (const column of columns) {
    // Skip columns that are already snake_case
    if (column === column.toLowerCase() && !column.match(/[A-Z]/)) {
      mapping[column] = column;
    } else {
      mapping[column] = camelToSnakeCase(column);
    }
  }
  
  return mapping;
}

// Function to generate SQL migration for table renames
function generateTableMigration(tableMapping) {
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);
  const filename = `${timestamp}_rename_tables_to_snake_case.sql`;
  const migrationPath = path.join(process.cwd(), 'migrations', filename);
  
  let sql = `-- Migration: Rename tables to snake_case\n\n`;
  
  for (const [oldName, newName] of Object.entries(tableMapping)) {
    if (oldName !== newName) {
      sql += `ALTER TABLE IF EXISTS "${oldName}" RENAME TO "${newName}";\n`;
    }
  }
  
  return { path: migrationPath, content: sql };
}

// Function to generate SQL migration for column renames
function generateColumnMigration(tableMapping, columnMapping) {
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);
  const filename = `${timestamp}_rename_columns_to_snake_case.sql`;
  const migrationPath = path.join(process.cwd(), 'migrations', filename);
  
  let sql = `-- Migration: Rename columns to snake_case\n\n`;
  
  // For each table, we need to rename its columns
  for (const [oldTableName, newTableName] of Object.entries(tableMapping)) {
    // Skip tables where name hasn't changed
    for (const [oldColName, newColName] of Object.entries(columnMapping)) {
      if (oldColName !== newColName) {
        sql += `ALTER TABLE IF EXISTS "${newTableName}" RENAME COLUMN IF EXISTS "${oldColName}" TO "${newColName}";\n`;
      }
    }
    sql += '\n';
  }
  
  return { path: migrationPath, content: sql };
}

// Function to update TypeScript files with new names
async function updateTypeScriptFiles(files, tableMapping, columnMapping) {
  const results = {
    updated: 0,
    skipped: 0,
    errors: 0
  };
  
  for (const file of files) {
    try {
      let content = await readFile(file, 'utf-8');
      let hasChanges = false;
      
      // Replace table names in from() calls
      for (const [oldName, newName] of Object.entries(tableMapping)) {
        if (oldName !== newName) {
          const fromPattern = new RegExp(`\\.from\\(['"](${oldName})['"]\\)`, 'g');
          const updatedContent = content.replace(fromPattern, `.from('${newName}')`);
          
          if (updatedContent !== content) {
            hasChanges = true;
            content = updatedContent;
          }
        }
      }
      
      // Replace column names in various Supabase methods
      const methods = ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'containedBy', 
                      'rangeLt', 'rangeGt', 'rangeGte', 'rangeLte', 'rangeAdjacent', 'overlaps', 'textSearch', 
                      'filter', 'not', 'or', 'and', 'select', 'order', 'update', 'insert', 'upsert'];
      
      for (const method of methods) {
        for (const [oldName, newName] of Object.entries(columnMapping)) {
          if (oldName !== newName) {
            const pattern = new RegExp(`\\.${method}\\(['"]${oldName}['"]`, 'g');
            const updatedContent = content.replace(pattern, `.${method}('${newName}'`);
            
            if (updatedContent !== content) {
              hasChanges = true;
              content = updatedContent;
            }
          }
        }
      }
      
      // Update TypeScript interfaces
      for (const [oldName, newName] of Object.entries(columnMapping)) {
        if (oldName !== newName) {
          // Match property definitions in interfaces
          const interfacePattern = new RegExp(`(\\s*)(${oldName})(\\??\\s*:)`, 'g');
          const updatedContent = content.replace(interfacePattern, `$1${newName}$3`);
          
          if (updatedContent !== content) {
            hasChanges = true;
            content = updatedContent;
          }
          
          // Match property access (obj.propertyName)
          const accessPattern = new RegExp(`(\\.)${oldName}\\b(?!\\s*:)`, 'g');
          const updatedAccessContent = content.replace(accessPattern, `$1${newName}`);
          
          if (updatedAccessContent !== content) {
            hasChanges = true;
            content = updatedAccessContent;
          }
          
          // Match destructuring assignments ({ propertyName })
          const destructuringPattern = new RegExp(`({\\s*[^}]*?)(\\b${oldName}\\b)([^}]*?})`, 'g');
          let destructuringUpdated = content;
          let match;
          
          while ((match = destructuringPattern.exec(content)) !== null) {
            const fullMatch = match[0];
            const updatedDestructuring = fullMatch.replace(
              new RegExp(`\\b${oldName}\\b(?!\\s*:)`, 'g'), 
              `${newName}`
            );
            
            if (updatedDestructuring !== fullMatch) {
              destructuringUpdated = destructuringUpdated.replace(fullMatch, updatedDestructuring);
              hasChanges = true;
            }
          }
          
          if (destructuringUpdated !== content) {
            content = destructuringUpdated;
          }
        }
      }
      
      // Write changes back to the file if there were any
      if (hasChanges) {
        await writeFile(file, content, 'utf-8');
        results.updated++;
      } else {
        results.skipped++;
      }
    } catch (error) {
      console.error(`Error updating file ${file}:`, error);
      results.errors++;
    }
  }
  
  return results;
}

// Main function to orchestrate the process
async function main() {
  console.log('Starting database rename process...');
  
  // Create migrations directory if it doesn't exist
  const migrationsDir = path.join(process.cwd(), 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  // Find all TypeScript and JavaScript files
  console.log('Finding TypeScript and JavaScript files...');
  const files = await findAllFiles(process.cwd());
  console.log(`Found ${files.length} TypeScript/JavaScript files.`);
  
  // Extract table and column names
  console.log('Extracting table names...');
  const tables = await extractTableNames(files);
  console.log(`Found ${tables.length} table names: ${tables.join(', ')}`);
  
  console.log('Extracting column names...');
  const columns = await extractColumnNames(files);
  console.log(`Found ${columns.length} column names.`);
  
  // Create mappings
  console.log('Creating mappings...');
  const tableMapping = createTableMapping(tables);
  const columnMapping = createColumnMapping(columns);
  
  // Log the mappings
  console.log('\nTable Mappings:');
  for (const [oldName, newName] of Object.entries(tableMapping)) {
    if (oldName !== newName) {
      console.log(`  ${oldName} -> ${newName}`);
    }
  }
  
  console.log('\nColumn Mappings (sample):');
  const columnEntries = Object.entries(columnMapping);
  for (let i = 0; i < Math.min(20, columnEntries.length); i++) {
    const [oldName, newName] = columnEntries[i];
    if (oldName !== newName) {
      console.log(`  ${oldName} -> ${newName}`);
    }
  }
  if (columnEntries.length > 20) {
    console.log(`  ... and ${columnEntries.length - 20} more`);
  }
  
  // Generate SQL migrations
  console.log('\nGenerating SQL migrations...');
  const tableMigration = generateTableMigration(tableMapping);
  const columnMigration = generateColumnMigration(tableMapping, columnMapping);
  
  // Write migrations to files
  console.log(`Writing table migration to ${tableMigration.path}`);
  await writeFile(tableMigration.path, tableMigration.content, 'utf-8');
  
  console.log(`Writing column migration to ${columnMigration.path}`);
  await writeFile(columnMigration.path, columnMigration.content, 'utf-8');
  
  // Update TypeScript files
  console.log('\nUpdating TypeScript files...');
  const updateResults = await updateTypeScriptFiles(files, tableMapping, columnMapping);
  
  // Write mappings to a JSON file for reference
  const mappingsPath = path.join(process.cwd(), 'db_name_mappings.json');
  await writeFile(
    mappingsPath, 
    JSON.stringify({ tables: tableMapping, columns: columnMapping }, null, 2), 
    'utf-8'
  );
  
  // Output summary
  console.log('\nRename process complete!');
  console.log(`Updated ${updateResults.updated} files, skipped ${updateResults.skipped} files, encountered ${updateResults.errors} errors.`);
  console.log(`Migrations created in the 'migrations' directory.`);
  console.log(`Database name mappings saved to ${mappingsPath}`);
}

// Run the script
main().catch(error => {
  console.error('Error running rename script:', error);
  process.exit(1);
});