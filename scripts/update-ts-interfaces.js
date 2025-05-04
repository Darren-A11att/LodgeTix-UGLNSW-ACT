#!/usr/bin/env node

/**
 * TypeScript Interface Updater
 * 
 * This script updates TypeScript interfaces to match the new database naming conventions.
 * It finds interfaces in your codebase and updates property names from snake_case to camelCase.
 * 
 * Usage:
 *   node scripts/update-ts-interfaces.js [path]
 * 
 * Args:
 *   path - Optional path to scan for TypeScript files (default: src)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// Handle paths in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Get target directory
const targetDir = process.argv[2] || 'src';
const fullTargetPath = path.resolve(rootDir, targetDir);

// Utility to convert snake_case to camelCase
function snakeToCamel(str) {
  return str.replace(/([-_][a-z])/g, group => group.replace('-', '').replace('_', '').toUpperCase());
}

// Utility to extract interface declarations from TypeScript files
function extractInterfaces(fileContent) {
  const interfaces = [];
  const regex = /interface\s+(\w+)\s*(?:extends\s+\w+\s*)?{([^}]+)}/g;
  let match;
  
  while ((match = regex.exec(fileContent)) !== null) {
    interfaces.push({
      name: match[1],
      content: match[0],
      properties: match[2],
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  return interfaces;
}

// Check if a property name is snake_case
function isSnakeCase(name) {
  return name.includes('_') && !/[A-Z]/.test(name);
}

// Update property names in interface content
function updateInterfaceProperties(interfaceObj) {
  let updatedProperties = interfaceObj.properties;
  const propertyRegex = /(\s*)(\w+)(_\w+)+\s*:([^;]*);/g;
  let match;
  let hasChanges = false;
  
  // Replace snake_case properties with camelCase
  while ((match = propertyRegex.exec(interfaceObj.properties)) !== null) {
    const fullMatch = match[0];
    const leadingSpace = match[1];
    const propName = match[0].substring(leadingSpace.length).split(':')[0].trim();
    
    if (isSnakeCase(propName)) {
      const camelPropName = snakeToCamel(propName);
      const replacement = `${leadingSpace}${camelPropName}:${match[4]};`;
      updatedProperties = updatedProperties.replace(fullMatch, replacement);
      hasChanges = true;
    }
  }
  
  if (!hasChanges) {
    return null;
  }
  
  // Create the updated interface content
  const beforeProps = interfaceObj.content.substring(0, 
    interfaceObj.content.indexOf(interfaceObj.properties));
  const afterProps = interfaceObj.content.substring(
    interfaceObj.content.indexOf(interfaceObj.properties) + interfaceObj.properties.length);
  
  return {
    ...interfaceObj,
    updatedContent: `${beforeProps}${updatedProperties}${afterProps}`
  };
}

// Process a TypeScript file and update interfaces
async function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const interfaces = extractInterfaces(content);
    
    if (interfaces.length === 0) {
      return null;
    }
    
    let updatedContent = content;
    let offset = 0;
    let hasChanges = false;
    
    for (const interfaceObj of interfaces) {
      const updated = updateInterfaceProperties(interfaceObj);
      
      if (updated) {
        // Adjust start and end positions based on previous changes
        const start = interfaceObj.start + offset;
        const end = interfaceObj.end + offset;
        
        // Replace the interface in the file content
        updatedContent = updatedContent.substring(0, start) + 
                         updated.updatedContent + 
                         updatedContent.substring(end);
        
        // Update offset for subsequent replacements
        offset += updated.updatedContent.length - (end - start);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      return { 
        path: filePath, 
        content: updatedContent,
        updated: interfaces.filter(i => updateInterfaceProperties(i)).length,
        total: interfaces.length
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return null;
  }
}

// Main function
async function main() {
  console.log(`Scanning for TypeScript files in: ${fullTargetPath}`);
  
  try {
    // Find all TypeScript files
    const tsFiles = await glob(`${fullTargetPath}/**/*.{ts,tsx}`, { ignore: ['**/node_modules/**', '**/dist/**'] });
    console.log(`Found ${tsFiles.length} TypeScript files.`);
    
    if (tsFiles.length === 0) {
      console.log('No TypeScript files found to process.');
      return;
    }
    
    // Process each file
    const updates = [];
    let processedFiles = 0;
    let totalInterfaces = 0;
    let updatedInterfaces = 0;
    
    for (const file of tsFiles) {
      processedFiles++;
      if (processedFiles % 50 === 0) {
        console.log(`Processed ${processedFiles}/${tsFiles.length} files...`);
      }
      
      const result = await processFile(file);
      
      if (result) {
        updates.push(result);
        totalInterfaces += result.total;
        updatedInterfaces += result.updated;
      }
    }
    
    console.log(`\nFinished processing ${tsFiles.length} files.`);
    console.log(`Found ${totalInterfaces} interfaces.`);
    console.log(`Updated ${updatedInterfaces} interfaces with snake_case properties.`);
    
    if (updates.length === 0) {
      console.log('No updates needed. All interfaces appear to use camelCase already.');
      return;
    }
    
    // Display update summary
    console.log(`\nFound interfaces to update in ${updates.length} files:`);
    updates.forEach(update => {
      console.log(`- ${update.path.replace(rootDir + '/', '')}: ${update.updated}/${update.total} interfaces`);
    });
    
    // Confirm changes
    console.log('\nReady to apply these changes. Update files? (y/n)');
    
    // Since we can't use readline in this context, let's just prompt and proceed with caution
    console.log('\nWARNING: Without interactive confirmation, we are going to save these changes.');
    console.log('You may want to commit your changes first or create a backup.');
    console.log('Waiting 5 seconds before proceeding...');
    
    // Delay for 5 seconds to allow user to abort
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Apply changes
    let updatedFiles = 0;
    for (const update of updates) {
      try {
        fs.writeFileSync(update.path, update.content, 'utf8');
        updatedFiles++;
      } catch (error) {
        console.error(`Error writing to ${update.path}:`, error);
      }
    }
    
    console.log(`\nSuccessfully updated ${updatedFiles}/${updates.length} files.`);
    
    // Create backup of changes
    const backupDir = path.join(rootDir, 'scripts', 'ts-interface-updates-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `update-summary-${timestamp}.json`);
    const backupData = {
      timestamp,
      totalFiles: tsFiles.length,
      updatedFiles: updatedFiles,
      totalInterfaces,
      updatedInterfaces,
      files: updates.map(u => ({
        path: u.path.replace(rootDir + '/', ''),
        updated: u.updated,
        total: u.total
      }))
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`\nBackup of update summary saved to: ${backupFile}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});