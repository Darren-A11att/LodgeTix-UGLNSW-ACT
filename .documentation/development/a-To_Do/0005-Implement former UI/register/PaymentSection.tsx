import React, { useState } from 'react';
import { CreditCard, ShieldCheck, User } from 'lucide-react';
import type { FormState } from '../../shared/types/register';
import PhoneInputWrapper from './PhoneInputWrapper';
import AutocompleteInput from './AutocompleteInput';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

interface PaymentSectionProps {
  formState: FormState;
  totalPrice: number;
  handleSubmit: (e: React.FormEvent) => void;
  prevStep: () => void;
}

// Load Stripe outside of component render to avoid recreation
// Using a fixed test key for now - in production this would come from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

// Comment out Stripe initialization to prevent errors in development mode
// const stripePromise = null;

// The inner payment component that uses the Stripe hooks
const PaymentForm: React.FC<PaymentSectionProps> = ({
  formState,
  totalPrice,
  handleSubmit,
  prevStep
}) => {
  const stripe = useStripe();
  const elements = useElements();
  
  // Primary Mason's details
  const primaryMason = formState.masons[0];

  // Billing details state
  const [billingDetails, setBillingDetails] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phone: '',
    address: '',
    suburb: '',
    country: 'Australia',
    state: 'NSW',
    postCode: '',
    usePrimaryMasonDetails: false
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBillingDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle phone change
  const handlePhoneChange = (value: string) => {
    setBillingDetails(prev => ({
      ...prev,
      phone: value
    }));
  };

  // Handle country selection
  const handleCountrySelect = (country: string) => {
    setBillingDetails(prev => ({
      ...prev,
      country
    }));
  };

  // Toggle using primary mason's details
  const handleTogglePrimaryDetails = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setBillingDetails(prev => ({
      ...prev,
      usePrimaryMasonDetails: checked,
      firstName: checked ? primaryMason.firstName : '',
      lastName: checked ? primaryMason.lastName : '',
      email: checked ? primaryMason.email : '',
      phone: checked ? primaryMason.phone : ''
      // We don't pre-fill address details as they're not part of the Mason data
    }));
  };

  // Handle payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    // Validate billing details
    if (!billingDetails.firstName || !billingDetails.lastName || !billingDetails.email || 
        !billingDetails.phone || !billingDetails.address || !billingDetails.suburb || 
        !billingDetails.postCode) {
      setPaymentError('Please fill in all required billing details.');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setPaymentError('Card element not found.');
      setIsProcessing(false);
      return;
    }

    try {
      // In a real implementation, you would call your backend to create a payment intent
      // and then confirm it here using the clientSecret returned from the backend.

      // For now, we'll simulate a successful payment
      // In a real app, this would be:
      // const {error, paymentIntent} = await stripe.confirmCardPayment(clientSecret, {
      //   payment_method: {
      //     card: cardElement,
      //     billing_details: {
      //       name: `${billingDetails.firstName} ${billingDetails.lastName}`,
      //       email: billingDetails.email,
      //       phone: billingDetails.phone,
      //       address: {
      //         line1: billingDetails.address,
      //         city: billingDetails.suburb,
      //         state: billingDetails.state,
      //         postal_code: billingDetails.postCode,
      //         country: billingDetails.country
      //       }
      //     }
      //   }
      // });

      // Simulate a delay for the payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPaymentSuccess(true);
      setIsProcessing(false);
      
      // Call the parent's handleSubmit to continue with form submission
      handleSubmit(e);
    } catch (error) {
      setPaymentError('An unexpected error occurred.');
      setIsProcessing(false);
      console.error('Payment error:', error);
    }
  };

  // Australian states
  const australianStates = [
    'ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'
  ];

  // Common countries
  const countries = [
    { name: 'Australia', id: 'AU' },
    { name: 'New Zealand', id: 'NZ' },
    { name: 'United Kingdom', id: 'GB' },
    { name: 'United States', id: 'US' },
    { name: 'Canada', id: 'CA' },
    { name: 'Singapore', id: 'SG' },
    { name: 'Malaysia', id: 'MY' },
    { name: 'Japan', id: 'JP' },
    { name: 'China', id: 'CN' },
    { name: 'India', id: 'IN' },
    { name: 'Indonesia', id: 'ID' },
    { name: 'Thailand', id: 'TH' },
    { name: 'Vietnam', id: 'VN' },
    { name: 'Philippines', id: 'PH' },
    { name: 'South Korea', id: 'KR' },
    { name: 'France', id: 'FR' },
    { name: 'Germany', id: 'DE' },
    { name: 'Italy', id: 'IT' },
    { name: 'Spain', id: 'ES' },
    { name: 'Netherlands', id: 'NL' },
    { name: 'Sweden', id: 'SE' },
    { name: 'Norway', id: 'NO' },
    { name: 'Denmark', id: 'DK' },
    { name: 'Switzerland', id: 'CH' },
    { name: 'Brazil', id: 'BR' },
    { name: 'Mexico', id: 'MX' },
    { name: 'Argentina', id: 'AR' },
    { name: 'South Africa', id: 'ZA' },
    { name: 'United Arab Emirates', id: 'AE' },
    { name: 'Saudi Arabia', id: 'SA' },
    { name: 'Israel', id: 'IL' },
    { name: 'Egypt', id: 'EG' },
    { name: 'Hong Kong', id: 'HK' },
    { name: 'Taiwan', id: 'TW' },
    { name: 'Ireland', id: 'IE' },
    { name: 'Portugal', id: 'PT' },
    { name: 'Greece', id: 'GR' },
    { name: 'Turkey', id: 'TR' },
    { name: 'Russia', id: 'RU' },
    { name: 'Poland', id: 'PL' },
    { name: 'Chile', id: 'CL' },
    { name: 'Colombia', id: 'CO' },
    { name: 'Peru', id: 'PE' },
    { name: 'Belgium', id: 'BE' },
    { name: 'Austria', id: 'AT' },
    { name: 'Finland', id: 'FI' },
    { name: 'Czech Republic', id: 'CZ' },
    { name: 'Hungary', id: 'HU' },
    { name: 'Romania', id: 'RO' }
  ];

  // Common class for form inputs to ensure consistent height
  const inputClass = "w-full h-11 px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50";

  // Card element style
  const cardElementStyle = {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      },
      padding: '10px 12px',
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  };

  return (
    <div className="payment-section">
      <h2 className="text-2xl font-bold mb-6">Payment Information</h2>
      
      <div className="bg-slate-50 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-bold mb-4">Payment Summary</h3>
        <div className="border-b border-slate-200 pb-4 mb-4">
          <div className="flex justify-between mb-2">
            <span className="font-medium">Total Registration Fee</span>
            <span>${totalPrice}</span>
          </div>
          <p className="text-sm text-slate-600">Inclusive of GST</p>
        </div>
        
        <div className="flex justify-between font-bold text-lg">
          <span>Amount to Pay</span>
          <span>${totalPrice}</span>
        </div>
      </div>
      
      {/* Billing Details Section */}
      <div className="bg-slate-50 p-6 rounded-lg mb-8">
        <div className="flex items-center mb-4">
          <User className="h-6 w-6 text-primary mr-2" />
          <h3 className="text-lg font-bold">Billing Details</h3>
        </div>
        
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={billingDetails.usePrimaryMasonDetails}
              onChange={handleTogglePrimaryDetails}
              className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
            />
            <span className="ml-2 text-sm text-slate-700">
              Bill to {primaryMason.firstName} {primaryMason.lastName} (Mason Attendee - Primary)
            </span>
          </label>
        </div>
        
        {/* Row 1: First Name | Last Name (2 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="firstName">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={billingDetails.firstName}
              onChange={handleInputChange}
              required
              className={inputClass}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="lastName">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={billingDetails.lastName}
              onChange={handleInputChange}
              required
              className={inputClass}
            />
          </div>
        </div>
        
        {/* Separator line after name fields */}
        <div className="border-b border-slate-200 mb-4"></div>
        
        {/* Two-Column Layout for remaining fields with vertical divider */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 relative">
          {/* Vertical divider between columns (visible on md screens and up) */}
          <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -ml-px w-px bg-slate-200"></div>
          
          {/* Column 1: Business Details, Mobile Number, Email Address */}
          <div className="space-y-4 md:pr-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="businessName">
                Business Name
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={billingDetails.businessName}
                onChange={handleInputChange}
                className={inputClass}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="phone">
                Mobile Number *
              </label>
              <div className="phone-input-container">
                <PhoneInputWrapper
                  value={billingDetails.phone}
                  onChange={handlePhoneChange}
                  name="phone"
                  required={true}
                  inputProps={{
                    id: "phone",
                    name: "phone"
                  }}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={billingDetails.email}
                onChange={handleInputChange}
                required
                className={inputClass}
              />
            </div>
          </div>
          
          {/* Column 2: Address Line 1, Suburb & Postcode (on same row), State/Territory & Country (on same row) */}
          <div className="space-y-4 md:pl-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="address">
                Address Line 1 *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={billingDetails.address}
                onChange={handleInputChange}
                required
                className={inputClass}
              />
            </div>
            
            {/* Suburb & Postcode on same row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="suburb">
                  Suburb *
                </label>
                <input
                  type="text"
                  id="suburb"
                  name="suburb"
                  value={billingDetails.suburb}
                  onChange={handleInputChange}
                  required
                  className={inputClass}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="postCode">
                  Postcode *
                </label>
                <input
                  type="text"
                  id="postCode"
                  name="postCode"
                  value={billingDetails.postCode}
                  onChange={handleInputChange}
                  required
                  pattern="[0-9]*"
                  maxLength={4}
                  className={inputClass}
                />
              </div>
            </div>
            
            {/* State/Territory & Country on same row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="state">
                  State/Territory *
                </label>
                <select
                  id="state"
                  name="state"
                  value={billingDetails.state}
                  onChange={handleInputChange}
                  required
                  className={inputClass}
                >
                  {australianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="country">
                  Country *
                </label>
                <AutocompleteInput
                  id="country"
                  name="country"
                  value={billingDetails.country}
                  onChange={(value) => setBillingDetails(prev => ({ ...prev, country: value }))}
                  onSelect={(country) => handleCountrySelect(country.name)}
                  options={countries}
                  getOptionLabel={(option) => option.name}
                  getOptionValue={(option) => option.id}
                  placeholder="Search countries..."
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-50 p-6 rounded-lg mb-8">
        <div className="flex items-center mb-4">
          <CreditCard className="h-6 w-6 text-primary mr-2" />
          <h3 className="text-lg font-bold">Payment Method</h3>
        </div>
        
        <p className="mb-4 text-slate-700">
          Complete your registration by providing your payment details below.
        </p>
        
        <div className="space-y-4 mb-6">
          {/* Stripe Card Element */}
          <div>
            <label htmlFor="card-element" className="block text-sm font-medium mb-1">
              Credit or debit card
            </label>
            <div className="border border-slate-300 rounded-md p-3 bg-white">
              <CardElement id="card-element" options={{ style: cardElementStyle }} />
            </div>
          </div>
          
          {/* Show any payment errors */}
          {paymentError && (
            <div className="text-red-500 text-sm mt-2">
              {paymentError}
            </div>
          )}
          
          {paymentSuccess && (
            <div className="text-green-500 text-sm mt-2">
              Payment successful!
            </div>
          )}
        </div>
        
        <div className="flex items-center text-xs text-slate-500 mb-6">
          <ShieldCheck className="h-4 w-4 mr-2 text-green-600" />
          <span>Your payment information is securely processed.</span>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button 
          type="button" 
          onClick={prevStep}
          className="btn-outline"
          disabled={isProcessing}
        >
          Back to Review Order
        </button>
        <button 
          type="button"
          onClick={handlePaymentSubmit}
          className="btn-primary"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? 'Processing...' : `Pay $${totalPrice} and Complete Registration`}
        </button>
      </div>
    </div>
  );
};

// Wrapper component to provide Stripe Elements
const PaymentSection: React.FC<PaymentSectionProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default PaymentSection;