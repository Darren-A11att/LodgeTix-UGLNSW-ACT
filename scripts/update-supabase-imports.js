#!/usr/bin/env node

/**
 * This script updates all imports from '../../shared/types/supabase' or '../shared/types/supabase'
 * to use the new location at '../../supabase/supabase.types' or '../supabase/supabase.types'
 * depending on the file location.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';

// Get current script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Files that need to be updated
const filesToCheck = [
  'src/lib/api/registrations.ts',
  'src/lib/api/events.ts',
  'src/lib/formatters.ts',
  'src/lib/api/customers.ts',
  'src/lib/api/lodges.ts',
  'src/lib/api/grandLodges.ts',
  // Add any other files that might import from supabase types
];

// Find relative path to the new location
function getRelativePath(filePath) {
  const fileDir = path.dirname(filePath);
  const projectRoot = path.resolve(__dirname, '..');
  const absoluteFileDir = path.resolve(projectRoot, fileDir);
  const absoluteSupabaseDir = path.resolve(projectRoot, 'supabase');
  const relativePath = path.relative(absoluteFileDir, absoluteSupabaseDir);
  return path.join(relativePath, 'supabase.types').replace(/\\/g, '/');
}

// Process each file
for (const filePath of filesToCheck) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const relativePath = getRelativePath(filePath);
  
  // Replace import patterns
  const newContent = content
    .replace(
      /from\s+['"](.+?)\/shared\/types\/supabase['"]/g, 
      `from '${relativePath}'`
    );

  if (content !== newContent) {
    fs.writeFileSync(fullPath, newContent);
    console.log(`Updated imports in ${filePath}`);
  } else {
    console.log(`No changes needed in ${filePath}`);
  }
}

console.log('\nImport paths updated. Please verify the changes and run your tests to ensure everything works correctly.');