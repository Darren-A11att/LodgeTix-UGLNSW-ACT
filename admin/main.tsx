import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminPortal from './admin'
import AdminProtectedRoute from './components/layout/AdminProtectedRoute'

// Import styles
import '../src/index.css' // Reuse main app styles

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route 
          path="/admin/*" 
          element={
            <AdminProtectedRoute>
              <AdminPortal />
            </AdminProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)