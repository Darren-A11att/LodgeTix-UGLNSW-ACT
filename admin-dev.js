// Simple development server wrapper for the admin portal
// This file helps with the correct routing during development

import { createServer } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

async function startAdminDevServer() {
  try {
    console.log('Starting LodgeTix Admin Portal development server...');
    
    // Create Vite server with the admin config
    const server = await createServer({
      configFile: resolve(__dirname, 'admin/vite.config.ts'),
      root: __dirname,
      base: '/admin/',
      server: {
        port: 5174,
        // Set up a middleware to handle root requests
        middlewareMode: false
      }
    });
    
    // Add middleware to redirect root path to /admin
    server.middlewares.use((req, res, next) => {
      if (req.url === '/' || req.url === '') {
        console.log('Redirecting from root to /admin');
        res.writeHead(302, {
          'Location': '/admin'
        });
        res.end();
        return;
      }
      next();
    });

    // Start the server
    await server.listen();
    
    const resolvedUrls = server.resolvedUrls;
    
    console.log('\n🚀 LodgeTix Admin Portal running at:');
    console.log(`   Local: ${resolvedUrls.local}/admin/`);
    if (resolvedUrls.network) {
      console.log(`   Network: ${resolvedUrls.network}/admin/`);
    }
    console.log('\nTo login without authentication, access:');
    console.log(`   http://localhost:5174/admin/\n`);
  } catch (error) {
    console.error('Error starting admin development server:', error);
    process.exit(1);
  }
}

startAdminDevServer();