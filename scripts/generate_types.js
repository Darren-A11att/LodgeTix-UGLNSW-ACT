#!/usr/bin/env node

/**
 * Script to generate TypeScript types from Supabase database schema
 * This script uses the Supabase CLI to generate types
 * 
 * Dependencies:
 * - Supabase CLI (npm install -g supabase)
 * - dotenv (npm install dotenv)
 * 
 * Usage:
 * - node generate_types.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'shared', 'types', 'supabase.ts');
const BACKUP_FILE = path.join(__dirname, '..', 'supabase.types.backup.ts');

// Create a backup of the existing types file if it exists
if (fs.existsSync(OUTPUT_FILE)) {
  console.log('Creating backup of existing types file...');
  fs.copyFileSync(OUTPUT_FILE, BACKUP_FILE);
  console.log(`Backup created at ${BACKUP_FILE}`);
}

// Ensure Supabase CLI is installed
try {
  const version = execSync('supabase --version').toString().trim();
  console.log(`Using Supabase CLI ${version}`);
} catch (error) {
  console.error('Error: Supabase CLI is not installed or not in PATH.');
  console.error('Please install it with: npm install -g supabase');
  process.exit(1);
}

// Ensure environment variables for Supabase are set
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in the environment or .env file.');
  process.exit(1);
}

// Generate types using the CLI
console.log('Generating TypeScript types from Supabase schema...');
try {
  // Create a temporary directory for the config
  const tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'supabase-'));
  const configPath = path.join(tempDir, 'config.json');
  
  // Create a config file for supabase-js gen types
  const config = {
    project_id: 'lodgetix',
    db_url: process.env.SUPABASE_URL,
    supabase_url: process.env.SUPABASE_URL,
    supabase_key: process.env.SUPABASE_ANON_KEY
  };
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  // Run the command
  execSync(`supabase gen types typescript --local --config ${configPath} > ${OUTPUT_FILE}`, { 
    stdio: ['inherit', 'inherit', 'inherit'] 
  });
  
  // Clean up the temp directory
  fs.unlinkSync(configPath);
  fs.rmdirSync(tempDir);
  
  console.log(`Types successfully generated at ${OUTPUT_FILE}`);
} catch (error) {
  console.error('Error generating types:', error.message);
  
  // Restore backup if generation failed
  if (fs.existsSync(BACKUP_FILE)) {
    console.log('Restoring backup...');
    fs.copyFileSync(BACKUP_FILE, OUTPUT_FILE);
    console.log('Backup restored.');
  }
  
  process.exit(1);
}

// Update imports in the generated file
console.log('Processing the generated file...');
let content = fs.readFileSync(OUTPUT_FILE, 'utf8');

// Add export markers if they don't exist
if (!content.includes('export type')) {
  content = content.replace(/type Json/g, 'export type Json');
  content = content.replace(/type Database/g, 'export type Database');
  content = content.replace(/type Tables</g, 'export type Tables<');
  content = content.replace(/type Enums</g, 'export type Enums<');
  content = content.replace(/type TablesInsert</g, 'export type TablesInsert<');
  content = content.replace(/type TablesUpdate</g, 'export type TablesUpdate<');
  
  // Write the updated content back to the file
  fs.writeFileSync(OUTPUT_FILE, content);
  console.log('Added export markers to the generated file.');
}

// Add a notification message to inform developers not to edit the file directly
const headerComment = `// THIS FILE IS GENERATED AUTOMATICALLY. DO NOT EDIT DIRECTLY.
// Generated on ${new Date().toISOString()} using generate_types.js
// To update, run: node scripts/generate_types.js

`;

content = headerComment + content;
fs.writeFileSync(OUTPUT_FILE, content);

console.log('Types file processing completed.');
console.log('TypeScript types generation completed successfully.');