export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  price: number;
  mode: 'payment' | 'subscription';
}

export const products: Record<string, StripeProduct> = {
  eventTicket: {
    priceId: 'price_mock_event_ticket',
    name: 'Event Ticket Example',
    description: 'Admission to the event',
    price: 75.00,
    mode: 'payment'
  },
  welcomeReception: {
    priceId: 'price_mock_welcome_reception',
    name: 'Welcome Reception',
    description: 'Friday evening welcome reception',
    price: 75.00,
    mode: 'payment'
  },
  grandInstallation: {
    priceId: 'price_mock_grand_installation',
    name: 'Grand Installation Ceremony',
    description: 'Main installation ceremony',
    price: 150.00,
    mode: 'payment'
  },
  galaDinner: {
    priceId: 'price_mock_gala_dinner',
    name: 'Gala Dinner',
    description: 'Formal black-tie dinner',
    price: 200.00,
    mode: 'payment'
  },
  harbourCruise: {
    priceId: 'price_mock_harbour_cruise',
    name: 'Partners\' Harbour Cruise',
    description: 'Sydney Harbour cruise with lunch',
    price: 120.00,
    mode: 'payment'
  }
};