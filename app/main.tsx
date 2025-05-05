import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '../src/index.css';
import AttendeeApp from './AttendeeApp';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AttendeeApp />
    </BrowserRouter>
  </React.StrictMode>
); 