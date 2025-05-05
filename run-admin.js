#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('📊 Starting LodgeTix Admin Portal Development Server');
console.log('---------------------------------------------------');

// Kill any existing processes on port 5174
try {
  const command = process.platform === 'win32' ? 'netstat -ano' : 'lsof -i :5174';
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log('No processes found on port 5174');
      startServers();
      return;
    }
    
    let regex;
    if (process.platform === 'win32') {
      regex = /TCP.+?:5174.+?LISTENING\s+(\d+)/;
    } else {
      regex = /node\s+(\d+)/;
    }
    
    const match = stdout.match(regex);
    if (match && match[1]) {
      const pid = match[1];
      console.log(`Found existing process on port 5174 (PID: ${pid}). Terminating...`);
      
      const killCommand = process.platform === 'win32' 
        ? `taskkill /F /PID ${pid}`
        : `kill -9 ${pid}`;
        
      exec(killCommand, (error) => {
        if (error) {
          console.log(`Failed to terminate process: ${error.message}`);
        } else {
          console.log('Process terminated successfully');
        }
        
        // Wait a moment to ensure port is free
        console.log('Waiting for port to be released...');
        setTimeout(startServers, 1000);
      });
    } else {
      console.log('No matching processes found on port 5174');
      startServers();
    }
  });
} catch (error) {
  // Ignore errors, just proceed
  console.log('Error checking for existing processes:', error.message);
  startServers();
}

// Function to start the servers
function startServers() {
  console.log('Starting Vite development server...');

  // Create simple redirect server on port 5173
  const redirectServer = http.createServer((req, res) => {
    console.log(`Received request for ${req.url} on port 5173`);
    
    // Redirect all requests to the admin portal
    res.writeHead(302, {
      'Location': 'http://localhost:5174/admin/'
    });
    res.end();
  });

  redirectServer.listen(5173, () => {
    console.log('Redirect server running on port 5173');
    console.log('All requests to http://localhost:5173 will redirect to http://localhost:5174/admin/');
  });

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
    redirectServer.close();
    process.exit(code);
  });

  // Handle process termination
  const cleanup = () => {
    viteProcess.kill();
    redirectServer.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
  // Print access instructions
  console.log('\n✨ Admin Portal will be available at:');
  console.log('   http://localhost:5174/admin/');
}