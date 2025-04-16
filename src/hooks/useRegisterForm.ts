import { useContext } from 'react';
import { RegisterFormContext } from '../context/RegisterFormContext';

export const useRegisterForm = () => {
  const context = useContext(RegisterFormContext);
  if (context === undefined) {
    throw new Error('useRegisterForm must be used within a RegisterFormProvider');
  }
  return context;
};
