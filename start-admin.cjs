#!/usr/bin/env node
const { spawn, exec } = require('child_process');
const path = require('path');
const http = require('http');

console.log('📊 Starting LodgeTix Admin Portal Development Server');
console.log('---------------------------------------------------');

// Simple function to start the Vite server
function startViteServer() {
  console.log('Starting Vite development server...');
  
  // Start vite with the admin config
  const viteProcess = spawn('npx', [
    'vite',
    '--config', 'admin/vite.config.ts',
    '--clearScreen=false',
    '--port', '5174'
  ], {
    stdio: 'inherit',
    shell: true
  });

  viteProcess.on('close', (code) => {
    console.log(`Vite process exited with code ${code}`);
    process.exit(code);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    viteProcess.kill();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    viteProcess.kill();
    process.exit(0);
  });
  
  // Print access instructions
  console.log('\n✨ Admin Portal will be available at:');
  console.log('   http://localhost:5174/admin/');
}

// Start the server
startViteServer();