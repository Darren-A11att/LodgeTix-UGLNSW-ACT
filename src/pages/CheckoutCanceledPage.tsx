import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const CheckoutCanceledPage: React.FC = () => {
  return (
    <div>
      <section className="bg-primary text-white py-16">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-6">Payment Canceled</h1>
          <p className="text-xl max-w-3xl">
            Your payment process was canceled. No charges have been made.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom max-w-2xl">
          <div className="bg-slate-50 p-8 rounded-lg shadow-md text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Payment Canceled</h2>
            <p className="text-slate-700 mb-6">
              Your payment process was canceled and no charges have been made to your account.
              If you experienced any issues during checkout, please try again or contact our support team.
            </p>
            
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-8">
              <p className="text-amber-800">
                If you believe this cancellation was in error, you can try again by returning to the event page.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/" className="btn-primary">
                Return to Homepage
              </Link>
              <Link to="/events" className="btn-outline">
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CheckoutCanceledPage;