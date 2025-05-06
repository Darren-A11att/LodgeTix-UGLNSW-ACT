import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

// This is a placeholder for future authentication logic
// When we implement auth, we'll check for the system-admin role here
const isAuthenticated = true; // Will be replaced with real auth check in the future

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  // For now, always allow access since auth is not implemented yet
  // In the future, will redirect to login if not authenticated or not authorized
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
}