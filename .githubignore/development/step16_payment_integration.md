# Step 16: Payment Integration

## Context for the Agentic AI Software Engineer

The LodgeTix system requires integration with Stripe for processing payments. Currently, the system has a partially implemented payment UI in `PaymentSection.tsx`, but it lacks the server-side integration for creating payment intents and processing actual transactions. 

Analysis of the codebase reveals:

1. The frontend has Stripe Elements UI components already implemented with proper form validation
2. The `stripe-config.ts` file contains mock product definitions that need to be replaced with dynamic data
3. There's a placeholder in the payment submission code where real Stripe integration should be added
4. The project uses environment variables for Stripe API keys
5. The database has tables for tracking payment status and storing payment records

For a complete payment integration, we need to create Supabase Edge Functions to handle the server-side Stripe API calls (to keep API keys secure), update the client to communicate with these endpoints, and store payment records in the database.

The system follows a pattern where the payment flow should:
1. Create a payment intent on the server with the correct amount
2. Return the client secret to the frontend
3. Confirm the payment using Stripe Elements
4. Update the registration record with payment status
5. Redirect to confirmation page upon success

## Objective

Implement a secure and reliable payment integration that:

1. Creates Stripe payment intents with the correct amount based on selected tickets
2. Securely processes credit card payments using Stripe Elements
3. Updates the registration record with payment status and Stripe payment intent ID
4. Handles error scenarios and edge cases
5. Provides appropriate feedback to the user throughout the payment process

## Pre-requisites

- Completed Step 15: Order Summary Implementation
- Stripe account with API keys (test mode)
- Understanding of Stripe API and Supabase Edge Functions
- Knowledge of the existing payment UI components
- Familiarity with the registration data model

## Analysis Steps

1. Review the current payment UI implementation:
   - `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/components/register/PaymentSection.tsx`

2. Examine Stripe configuration:
   - `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/stripe-config.ts`

3. Understand the registration database schema:
   - `SELECT * FROM registrations LIMIT 5` to see payment-related fields

4. Review the project environment variables:
   - Check `.env` file for Stripe configuration

5. Analyze the existing code that handles form submission:
   - Look for where payment processing should integrate with the registration flow

## Implementation Steps

1. Create a Supabase Edge Function for creating payment intents:

   ```typescript
   // /supabase/functions/create-payment-intent/index.ts
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
   import { corsHeaders } from '../_shared/cors.ts'
   import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

   const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
     apiVersion: '2023-10-16',
     httpClient: Stripe.createFetchHttpClient(),
   })

   serve(async (req) => {
     // Handle CORS preflight requests
     if (req.method === 'OPTIONS') {
       return new Response('ok', { headers: corsHeaders })
     }

     try {
       const { amount, currency = 'aud', metadata } = await req.json()

       if (!amount || amount < 1) {
         return new Response(
           JSON.stringify({ error: 'Amount must be at least 1 cent' }),
           {
             status: 400,
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           }
         )
       }

       // Create a PaymentIntent with the specified amount
       const paymentIntent = await stripe.paymentIntents.create({
         amount: Math.round(amount * 100), // Convert to cents
         currency,
         metadata,
         automatic_payment_methods: {
           enabled: true,
         },
       })

       // Return the client secret
       return new Response(
         JSON.stringify({ clientSecret: paymentIntent.client_secret }),
         {
           status: 200,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         }
       )
     } catch (error) {
       return new Response(
         JSON.stringify({ error: error.message }),
         {
           status: 400,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         }
       )
     }
   })
   ```

2. Create a shared CORS headers file for Edge Functions:

   ```typescript
   // /supabase/functions/_shared/cors.ts
   export const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
     'Access-Control-Allow-Methods': 'POST, OPTIONS',
   }
   ```

3. Create a helper function for payment API calls in `/src/lib/api/payment.ts`:

   ```typescript
   import { supabase } from '../supabase';

   /**
    * Creates a payment intent via the Supabase Edge Function
    * @param amount - The payment amount in dollars
    * @param metadata - Additional metadata for the payment
    * @returns The client secret for confirming the payment
    */
   export async function createPaymentIntent(
     amount: number, 
     metadata: Record<string, string>
   ): Promise<{ clientSecret: string } | { error: string }> {
     try {
       const { data, error } = await supabase.functions.invoke('create-payment-intent', {
         body: {
           amount,
           currency: 'aud',
           metadata
         }
       });

       if (error) {
         console.error('Error creating payment intent:', error);
         return { error: error.message };
       }

       return data;
     } catch (err) {
       console.error('Unexpected error creating payment intent:', err);
       return { error: 'Failed to process payment. Please try again.' };
     }
   }

   /**
    * Updates the registration with payment status and details
    * @param registrationId - The UUID of the registration
    * @param paymentIntentId - The Stripe payment intent ID
    * @param status - The payment status (pending, completed, failed)
    * @returns Boolean indicating success
    */
   export async function updatePaymentStatus(
     registrationId: string,
     paymentIntentId: string,
     status: 'pending' | 'completed' | 'failed'
   ): Promise<boolean> {
     try {
       const { error } = await supabase
         .from('registrations')
         .update({
           payment_status: status,
           stripe_payment_intent_id: paymentIntentId
         })
         .eq('id', registrationId);

       if (error) {
         console.error('Error updating payment status:', error);
         return false;
       }

       return true;
     } catch (err) {
       console.error('Unexpected error updating payment status:', err);
       return false;
     }
   }
   ```

4. Update the `PaymentSection.tsx` component to use the new API functions:

   ```typescript
   // Add imports and state for client secret
   import { createPaymentIntent, updatePaymentStatus } from '../../lib/api/payment';
   
   // Add state for client secret
   const [clientSecret, setClientSecret] = useState<string | null>(null);
   
   // Create a new function to initialize the payment intent
   const initializePayment = async () => {
     setIsProcessing(true);
     setPaymentError(null);
     
     try {
       // Create metadata for the payment
       const metadata = {
         registrationId: formState.registrationId, // This needs to be added to formState
         registrationType: formState.registrationType,
         primaryAttendee: `${primaryMason.firstName} ${primaryMason.lastName}`
       };
       
       // Create the payment intent
       const result = await createPaymentIntent(totalPrice, metadata);
       
       if ('error' in result) {
         setPaymentError(result.error);
         setIsProcessing(false);
         return;
       }
       
       setClientSecret(result.clientSecret);
       setIsProcessing(false);
     } catch (error) {
       setPaymentError('Failed to initialize payment. Please try again.');
       setIsProcessing(false);
       console.error('Payment initialization error:', error);
     }
   };
   
   // Call initializePayment when the component mounts
   useEffect(() => {
     if (totalPrice > 0) {
       initializePayment();
     }
   }, [totalPrice]);
   
   // Update the handlePaymentSubmit function
   const handlePaymentSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!stripe || !elements || !clientSecret) {
       // Stripe.js hasn't loaded yet or client secret is missing
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
       // Confirm the card payment
       const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
         payment_method: {
           card: cardElement,
           billing_details: {
             name: `${billingDetails.firstName} ${billingDetails.lastName}`,
             email: billingDetails.email,
             phone: billingDetails.phone,
             address: {
               line1: billingDetails.address,
               city: billingDetails.suburb,
               state: billingDetails.state,
               postal_code: billingDetails.postCode,
               country: billingDetails.country
             }
           }
         }
       });

       if (error) {
         setPaymentError(error.message || 'Payment failed. Please try again.');
         setIsProcessing(false);
         return;
       }
       
       if (paymentIntent.status === 'succeeded') {
         // Update payment status in database
         await updatePaymentStatus(
           formState.registrationId, 
           paymentIntent.id, 
           'completed'
         );
         
         setPaymentSuccess(true);
         setIsProcessing(false);
         
         // Call the parent's handleSubmit to continue with form submission
         handleSubmit(e);
       } else {
         setPaymentError('Payment processing failed. Please try again.');
         setIsProcessing(false);
       }
     } catch (error) {
       setPaymentError('An unexpected error occurred.');
       setIsProcessing(false);
       console.error('Payment error:', error);
     }
   };
   ```

5. Update the registration flow to create a registration record before payment:

   ```typescript
   // In the RegistrationContext.tsx or similar file where the registration process is managed
   
   // Add function to create the registration record
   const createRegistration = async () => {
     try {
       // Create the basic registration record
       const { data, error } = await supabase
         .from('registrations')
         .insert({
           registration_type: formState.registrationType,
           payment_status: 'pending',
           agree_to_terms: formState.agreeToTerms,
           customer_id: customerId, // This needs to be set earlier in the flow
           parent_event_id: formState.selectedEventId
         })
         .select()
         .single();
       
       if (error) {
         console.error('Error creating registration:', error);
         return null;
       }
       
       // Store the registration ID in the form state
       setFormState(prev => ({
         ...prev,
         registrationId: data.id
       }));
       
       return data.id;
     } catch (err) {
       console.error('Unexpected error creating registration:', err);
       return null;
     }
   };
   
   // Call this function before navigating to the payment step
   const proceedToPayment = async () => {
     const registrationId = await createRegistration();
     if (registrationId) {
       // Navigate to payment step
       setFormState(prev => ({ ...prev, step: PAYMENT_STEP }));
     } else {
       // Show error
       setError('Failed to create registration. Please try again.');
     }
   };
   ```

6. Add a Stripe webhook handler Edge Function for processing asynchronous payment events:

   ```typescript
   // /supabase/functions/stripe-webhook/index.ts
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
   import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

   const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
     apiVersion: '2023-10-16',
     httpClient: Stripe.createFetchHttpClient(),
   })

   // Create a Supabase client
   const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
   const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
   const supabase = createClient(supabaseUrl, supabaseServiceKey)

   serve(async (req) => {
     const signature = req.headers.get('stripe-signature')
     const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
     
     if (!signature || !webhookSecret) {
       return new Response(
         JSON.stringify({ error: 'Missing signature or webhook secret' }),
         { status: 400 }
       )
     }

     try {
       const body = await req.text()
       const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
       
       // Handle specific event types
       switch (event.type) {
         case 'payment_intent.succeeded':
           await handlePaymentSuccess(event.data.object)
           break
         case 'payment_intent.payment_failed':
           await handlePaymentFailure(event.data.object)
           break
         // Add other event types as needed
       }
       
       return new Response(JSON.stringify({ received: true }), { status: 200 })
     } catch (err) {
       return new Response(
         JSON.stringify({ error: `Webhook Error: ${err.message}` }),
         { status: 400 }
       )
     }
   })

   // Handle successful payments
   async function handlePaymentSuccess(paymentIntent) {
     // Extract registration ID from metadata
     const registrationId = paymentIntent.metadata.registrationId
     
     if (!registrationId) {
       console.error('Missing registration ID in payment intent metadata')
       return
     }
     
     // Update the registration status
     const { error } = await supabase
       .from('registrations')
       .update({
         payment_status: 'completed',
         stripe_payment_intent_id: paymentIntent.id,
         total_price_paid: paymentIntent.amount / 100 // Convert from cents to dollars
       })
       .eq('id', registrationId)
     
     if (error) {
       console.error('Error updating registration payment status:', error)
     }
   }

   // Handle failed payments
   async function handlePaymentFailure(paymentIntent) {
     // Extract registration ID from metadata
     const registrationId = paymentIntent.metadata.registrationId
     
     if (!registrationId) {
       console.error('Missing registration ID in payment intent metadata')
       return
     }
     
     // Update the registration status
     const { error } = await supabase
       .from('registrations')
       .update({
         payment_status: 'failed',
         stripe_payment_intent_id: paymentIntent.id
       })
       .eq('id', registrationId)
     
     if (error) {
       console.error('Error updating registration payment status:', error)
     }
   }
   ```

## Testing Steps

1. Test the payment intent creation:
   - Check that the correct amount is being sent to Stripe
   - Verify that metadata is properly included
   - Confirm the client secret is returned

2. Test the Stripe Elements integration:
   - Test with various Stripe test card numbers
   - Verify that validation errors are displayed correctly
   - Check that loading states work as expected

3. Test payment confirmation:
   - Verify successful payments update the registration record
   - Check that failed payments show appropriate error messages
   - Test the payment success flow to confirmation page

4. Test webhook handling:
   - Use Stripe CLI to simulate webhook events
   - Verify that payment_intent.succeeded updates the registration status
   - Check that payment_intent.payment_failed is handled correctly

5. Test error scenarios:
   - Network failures during payment processing
   - Invalid card details
   - Insufficient funds
   - Backend service unavailability

## Verification Checklist

- [ ] Payment intent creation API works correctly
- [ ] Stripe Elements form renders and validates properly
- [ ] Card information is processed securely
- [ ] Successful payments update the registration status
- [ ] Failed payments show appropriate error messages
- [ ] Registration record includes payment intent ID and final price
- [ ] Webhook handler processes Stripe events correctly
- [ ] Loading and error states display properly
- [ ] Payment flow navigates to confirmation page on success
- [ ] No sensitive payment information is logged or exposed

## Common Errors and Solutions

1. "Payment intent creation failed" error
   - Check that Stripe API keys are correctly set in environment variables
   - Verify that the amount is a valid number and properly formatted
   - Check network connectivity to Stripe API

2. Stripe Elements not loading
   - Ensure the Stripe publishable key is correctly set
   - Check that the Elements component is properly initialized
   - Verify that Stripe JS is loading correctly

3. Payment confirmation fails
   - Check the client secret is correctly passed to confirmCardPayment
   - Verify the card element is properly referenced
   - Check browser console for detailed error messages from Stripe

4. Webhook events not being processed
   - Verify webhook signature secret is correctly set
   - Check that the webhook URL is correctly registered in Stripe dashboard
   - Test with Stripe CLI to simulate events

5. Registration record not being updated
   - Check that the registration ID is correctly included in metadata
   - Verify database permissions for the update operation
   - Ensure the correct fields are being updated in the database
