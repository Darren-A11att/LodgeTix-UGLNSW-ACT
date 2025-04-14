import { products } from '../stripe-config';
import { mockPayments } from '../mock/payments';

export async function createCheckoutSession(
  priceId: string,
  mode: 'payment' | 'subscription',
  successUrl: string,
  cancelUrl: string
) {
  try {
    // Use our mock payment service instead of calling Supabase edge function
    return await mockPayments.createCheckoutSession(
      priceId,
      mode,
      successUrl,
      cancelUrl
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function redirectToCheckout(productId: string) {
  try {
    const product = products[productId];
    
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    // Create the checkout session
    const { url } = await createCheckoutSession(
      product.priceId,
      product.mode,
      `${window.location.origin}/checkout/success?product=${productId}`,
      `${window.location.origin}/checkout/canceled`
    );

    // For mock implementation, we'll handle the redirect in the browser
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
}

export async function getUserSubscription() {
  // Mock implementation - return no subscription
  return null;
}

export async function getUserOrders() {
  try {
    // Use our mock payment service
    return await mockPayments.getUserOrders();
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
}

// Helper function to simulate successful payment (for mock checkout)
export async function mockSuccessfulPayment(productId: string) {
  const product = products[productId];
  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }
  
  return await mockPayments.createSuccessfulOrder(productId, product.price);
}