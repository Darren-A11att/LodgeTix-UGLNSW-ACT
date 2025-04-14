import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockSuccessfulPayment } from '../lib/stripe';
import { products } from '../stripe-config';
import { CreditCard, CheckCircle, XCircle } from 'lucide-react';

const MockCheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const successUrl = searchParams.get('success_url');
  const cancelUrl = searchParams.get('cancel_url');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Extract product ID from the success URL if present
  const productId = successUrl?.includes('product=') 
    ? new URLSearchParams(successUrl.split('?')[1]).get('product') 
    : 'eventTicket'; // Default to eventTicket if not found

  const product = productId ? products[productId] : products.eventTicket;

  const handleSuccess = async () => {
    setLoading(true);
    
    try {
      // Create a mock successful payment in our system
      if (productId) {
        await mockSuccessfulPayment(productId);
      }
      
      // Navigate to the success URL
      if (successUrl) {
        window.location.href = successUrl;
      } else {
        navigate('/checkout/success');
      }
    } catch (error) {
      console.error('Error processing mock payment:', error);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Navigate to the cancel URL
    if (cancelUrl) {
      window.location.href = cancelUrl;
    } else {
      navigate('/checkout/canceled');
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center mb-6">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Invalid Checkout Session</h2>
            <p className="text-gray-600 mt-2">This checkout session is invalid or has expired.</p>
          </div>
          <button
            onClick={() => navigate('/events')}
            className="w-full btn-primary"
          >
            Return to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <CreditCard className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Mock Checkout</h2>
          <p className="text-gray-600 mt-2">
            This is a simulated checkout page for development purposes.
          </p>
        </div>

        <div className="border-t border-b border-gray-200 py-4 my-6">
          <div className="flex justify-between mb-2">
            <span className="font-medium">{product.name}</span>
            <span>${product.price.toFixed(2)}</span>
          </div>
          <p className="text-sm text-gray-600">{product.description}</p>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${product.price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleSuccess}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center"
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
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Payment
              </>
            )}
          </button>
          
          <button
            onClick={handleCancel}
            disabled={loading}
            className="w-full btn-outline"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockCheckoutPage;