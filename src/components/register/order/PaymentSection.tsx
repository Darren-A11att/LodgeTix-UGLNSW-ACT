import React, { useState, useCallback } from 'react';
import { CreditCard, ShieldCheck, User } from 'lucide-react';
import type { FormState } from '../../../shared/types/register';
import PhoneInputWrapper from '../functions/PhoneInputWrapper';
import AutocompleteInput from '../functions/AutocompleteInput';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useRegistrationStore, UnifiedAttendeeData as StoreUnifiedAttendeeData, BillingDetailsType } from '../../../store/registrationStore';

interface PaymentSectionProps {
  formState: FormState;
  totalPrice: number;
  handleSubmit: (e: React.FormEvent) => void;
  prevStep: () => void;
}

// Load Stripe outside of component render to avoid recreation
const stripePromise = (() => {
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  try {
    const stripeOptions = {
      locale: 'en' as const,
      betas: import.meta.env.DEV ? ['stripe_universal_js_without_https'] : undefined
    };
    return loadStripe(stripeKey || '', stripeOptions);
  } catch (err) {
    console.error('Error initializing Stripe:', err);
    return Promise.resolve(null);
  }
})();

// Define default structure for primaryMason fallback
const defaultPrimaryMason: Partial<StoreUnifiedAttendeeData> = {
  firstName: '',
  lastName: '',
  primaryEmail: '',
  primaryPhone: '',
};

// The inner payment component that uses the Stripe hooks
const PaymentForm: React.FC<PaymentSectionProps> = ({
  formState,
  totalPrice,
  handleSubmit,
  prevStep
}) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const { attendees, billingDetails: storeBillingDetails, updateBillingDetails } = useRegistrationStore();
  
  const currentAttendees = formState.attendees || attendees || [];
  
  // Use default structure for primaryMason fallback
  const primaryMason = currentAttendees.find(attendee => 
    attendee.attendeeType === 'mason' && (attendee.isPrimary === true || attendee.isPrimary === undefined)
  ) || defaultPrimaryMason;

  // Align localBillingDetails state with BillingDetailsType from store
  const [localBillingDetails, setLocalBillingDetails] = useState<BillingDetailsType>(() => {
    return storeBillingDetails || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      stateProvince: '',
      postalCode: '',
      country: 'Australia',
    };
  });
  const [usePrimaryMasonDetailsFlag, setUsePrimaryMasonDetailsFlag] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Update local state handlers to align with BillingDetailsType
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Map form field names (like suburb, address) to store field names (city, addressLine1)
    const fieldToUpdate = name === 'address' ? 'addressLine1' : 
                          name === 'suburb' ? 'city' : 
                          name === 'state' ? 'stateProvince' : 
                          name === 'postCode' ? 'postalCode' : name;

    // Skip businessName as it's not in BillingDetailsType
    if (fieldToUpdate === 'businessName') return;

    if (fieldToUpdate in localBillingDetails) {
        const updatedDetails = { 
            ...localBillingDetails, 
            [fieldToUpdate as keyof BillingDetailsType]: value 
        };
        setLocalBillingDetails(updatedDetails);
        updateBillingDetails(updatedDetails);
    } else {
        console.warn(`Field ${name} not found in BillingDetailsType`);
    }
  };

  const handlePhoneChange = (value: string) => {
    const updatedDetails = { ...localBillingDetails, phone: value };
    setLocalBillingDetails(updatedDetails);
    updateBillingDetails(updatedDetails);
  };

  const handleCountrySelect = (country: string) => {
    const updatedDetails = { ...localBillingDetails, country };
    setLocalBillingDetails(updatedDetails);
    updateBillingDetails(updatedDetails);
  };

  // Toggle using primary mason's details - Use separate flag, update relevant fields
  const handleTogglePrimaryDetails = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setUsePrimaryMasonDetailsFlag(checked); // Update the separate flag
    
    const updatedDetails = {
      ...localBillingDetails,
      firstName: checked ? primaryMason.firstName || '' : '',
      lastName: checked ? primaryMason.lastName || '' : '',
      email: checked ? primaryMason.primaryEmail || '' : '', // Use primaryEmail
      phone: checked ? primaryMason.primaryPhone || '' : '' // Use primaryPhone
    };
    setLocalBillingDetails(updatedDetails);
    updateBillingDetails(updatedDetails);
  };
  
  // Prepare submission data placeholder
  const getSubmissionData = useCallback((): any => {
    return {
      attendees: currentAttendees, 
      billingDetails: localBillingDetails
    };
  }, [currentAttendees, localBillingDetails]);

  // Handle payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    // Validate localBillingDetails based on BillingDetailsType fields
    if (!localBillingDetails.firstName || !localBillingDetails.lastName || !localBillingDetails.email || 
        !localBillingDetails.phone || !localBillingDetails.addressLine1 || !localBillingDetails.city || 
        !localBillingDetails.postalCode) {
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
      // Get the optimized submission data
      const submissionData = getSubmissionData();
      
      // Log the submission data (in a real app, you'd send this to your server)
      console.log('Submitting registration data:', submissionData);
      
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
        
        {/* Only show this option if there's a primary Mason with a name */}
        {(primaryMason.firstName || primaryMason.lastName) && (
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={usePrimaryMasonDetailsFlag}
                onChange={handleTogglePrimaryDetails}
                className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
              />
              <span className="ml-2 text-sm text-slate-700">
                Bill to {primaryMason.firstName || ''} {primaryMason.lastName || ''} (Mason Attendee - Primary)
              </span>
            </label>
          </div>
        )}
        
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
              value={localBillingDetails.firstName}
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
              value={localBillingDetails.lastName}
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
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="phone">
                Mobile Number *
              </label>
              <div className="phone-input-container">
                <PhoneInputWrapper
                  value={localBillingDetails.phone}
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
                value={localBillingDetails.email}
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
                value={localBillingDetails.addressLine1}
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
                  value={localBillingDetails.city}
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
                  value={localBillingDetails.postalCode}
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
                  value={localBillingDetails.stateProvince}
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
                  value={localBillingDetails.country}
                  onChange={(value) => handleCountrySelect(value ?? 'Australia')}
                  onSelect={(country) => handleCountrySelect(country?.name ?? 'Australia')}
                  options={countries}
                  getOptionLabel={(option) => option.name}
                  getOptionValue={(option) => option.id}
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