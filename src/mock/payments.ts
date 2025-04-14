interface CheckoutSession {
  id: string;
  url: string;
}

interface Order {
  order_id: string;
  checkout_session_id: string;
  payment_intent_id: string;
  amount_subtotal: number;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_date: string;
}

// In-memory store for mock orders
const orders: Order[] = [];

export interface Product {
  priceId: string;
  name: string;
  description: string;
  price: number;
  mode: 'payment' | 'subscription';
}

// Mock payment service
export const mockPayments = {
  async createCheckoutSession(
    priceId: string,
    mode: 'payment' | 'subscription',
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSession> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const sessionId = `cs_mock_${Date.now()}`;
    
    // In a real app, this would redirect to Stripe
    // For mock, we'll just construct a URL that our frontend will handle
    return {
      id: sessionId,
      url: `${window.location.origin}/mock-checkout?session_id=${sessionId}&success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`
    };
  },
  
  // Create a mock order for successful checkout
  async createSuccessfulOrder(productId: string, price: number): Promise<Order> {
    const now = new Date();
    const order: Order = {
      order_id: `order_${Date.now()}`,
      checkout_session_id: `cs_mock_${Date.now()}`,
      payment_intent_id: `pi_mock_${Date.now()}`,
      amount_subtotal: price * 100, // Convert to cents for consistency with Stripe
      amount_total: price * 100,
      currency: 'aud',
      payment_status: 'paid',
      order_status: 'completed',
      order_date: now.toISOString()
    };
    
    orders.unshift(order); // Add to beginning of array (most recent)
    return order;
  },
  
  async getUserOrders(): Promise<Order[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...orders]; // Return a copy of the orders array
  }
};