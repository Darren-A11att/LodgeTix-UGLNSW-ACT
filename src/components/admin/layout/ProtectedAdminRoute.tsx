import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { user, isLoading } = useAuth();
  
  // If auth is still loading, show nothing or a loading indicator
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // This is where we would check for admin role in the future
  // For now, we'll allow access without authentication to simplify development
  const hasAdminAccess = true; // In the future: user?.role === 'system-admin'
  
  // In a real app, redirect to login if not authenticated
  if (!hasAdminAccess) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}