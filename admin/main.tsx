import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AdminApp from './AdminApp';
// Import shared styles
import '../shared/styles/index.css';

// Check if we're running in a subdomain environment or local development
const isSubdomainMode = window.location.hostname.startsWith('admin.');

// The issue was here - in development mode with localhost:5174/admin/ 
// we need to use '/' as the basename since the server is already mounted at /admin/
// The base URL is handled by the server config in vite.config.ts with base: '/admin/'
const basePath = isSubdomainMode ? '/' : '/';

// Debug log to help with routing issues
console.log('Admin Portal initialized with:');
console.log('- Hostname:', window.location.hostname);
console.log('- Port:', window.location.port);
console.log('- Subdomain mode:', isSubdomainMode);
console.log('- Base path:', basePath);
console.log('- Current URL:', window.location.href);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basePath}>
      <AdminApp />
    </BrowserRouter>
  </React.StrictMode>
);