import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { getUserOrders } from '../lib/stripe';
import { products } from '../stripe-config';

const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product');
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const fetchLatestOrder = async () => {
      try {
        const orders = await getUserOrders();
        if (orders && orders.length > 0) {
          // Get the most recent order
          setOrder(orders[0]);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestOrder();
  }, []);

  const product = productId ? products[productId] : null;

  return (
    <div>
      <section className="bg-primary text-white py-16">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-6">Payment Successful</h1>
          <p className="text-xl max-w-3xl">
            Thank you for your purchase. Your payment has been processed successfully.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-custom max-w-2xl">
          <div className="bg-slate-50 p-8 rounded-lg shadow-md text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Payment Confirmed!</h2>
            
            {loading ? (
              <div className="flex justify-center my-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : order ? (
              <div className="mb-8">
                <p className="text-slate-700 mb-6">
                  Your payment of <span className="font-bold">{(order.amount_total / 100).toFixed(2)} {order.currency.toUpperCase()}</span> has been processed successfully.
                </p>
                
                <div className="bg-white p-4 rounded-md border border-slate-200 mb-6">
                  <h3 className="font-bold text-lg mb-2 text-primary">Order Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="text-slate-600">Order ID:</div>
                    <div className="font-medium">{order.order_id}</div>
                    <div className="text-slate-600">Date:</div>
                    <div className="font-medium">{new Date(order.order_date).toLocaleDateString()}</div>
                    <div className="text-slate-600">Amount:</div>
                    <div className="font-medium">{(order.amount_total / 100).toFixed(2)} {order.currency.toUpperCase()}</div>
                    <div className="text-slate-600">Status:</div>
                    <div className="font-medium text-green-600">Paid</div>
                    {product && (
                      <>
                        <div className="text-slate-600">Product:</div>
                        <div className="font-medium">{product.name}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-700 mb-6">
                Your payment has been processed successfully. You will receive a confirmation email shortly.
              </p>
            )}
            
            <p className="text-slate-700 mb-8">
              A confirmation email has been sent to your registered email address with all the details.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/" className="btn-primary">
                Return to Homepage
              </Link>
              <Link to="/events" className="btn-outline">
                Browse More Events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CheckoutSuccessPage;