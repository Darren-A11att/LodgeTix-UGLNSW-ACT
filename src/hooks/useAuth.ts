import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // Adjust import path as needed

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 