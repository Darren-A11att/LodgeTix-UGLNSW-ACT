import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Adjust path as needed

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Optional: Show a loading spinner or skeleton screen
    // For simplicity, returning null prevents rendering until auth state is known
    // Consider a dedicated loading component for better UX
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading authentication status...</div> 
      </div>
    );
  }

  if (!user) {
    // User not authenticated, redirect to login page
    // Save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the requested child component
  return <>{children}</>;
};

export default ProtectedRoute; 