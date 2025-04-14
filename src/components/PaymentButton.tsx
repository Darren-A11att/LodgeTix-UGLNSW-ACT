import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, AlertCircle } from 'lucide-react';
import { redirectToCheckout } from '../lib/stripe';
import { useAuth } from '../context/AuthContext';

interface PaymentButtonProps {
  productId: string;
  className?: string;
  children?: React.ReactNode;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ productId, className = '', children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { returnTo: window.location.pathname } });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await redirectToCheckout(productId);
    } catch (err: any) {
      setError(err.message || 'An error occurred during checkout');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center justify-center ${className}`}
      >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            {children || 'Pay Now'}
          </>
        )}
      </button>
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="w-4 h-4 text-red-500 mr-1 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-xs">{error}</p>
        </div>
      )}
    </div>
  );
};

export default PaymentButton;