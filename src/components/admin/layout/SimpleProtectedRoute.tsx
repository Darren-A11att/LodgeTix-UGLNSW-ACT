import * as React from 'react';
import { Navigate } from 'react-router-dom';

// Temporary authentication logic - this will be replaced with proper authentication later
const isAdmin = () => {
  // For now, always return true for development
  // In production, this will check if the user has admin privileges
  return true;
};

// Component for protecting admin routes
interface SimpleProtectedRouteProps {
  children: React.ReactNode;
  redirectPath?: string;
}

const SimpleProtectedRoute: React.FC<SimpleProtectedRouteProps> = ({ 
  children, 
  redirectPath = '/login'
}) => {
  // Check if user is authenticated as admin
  const isAuthenticated = isAdmin();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // Otherwise, render children
  return <>{children}</>;
};

export default SimpleProtectedRoute;