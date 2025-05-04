import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use environment variables for configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Map of original DB table names to their actual PascalCase names
// This helps ensure we use the correct table names after the standardization
export const DB_TABLE_NAMES = {
  events: 'Events',
  display_scopes: 'DisplayScopes',
  displayScopes: 'DisplayScopes',
  eventDays: 'EventDays',
  event_days: 'EventDays',
  customers: 'Customers',
  masons: 'Masons',
  guests: 'Guests',
  contacts: 'Contacts',
  registrations: 'Registrations',
  tickets: 'Tickets',
  masonic_profiles: 'MasonicProfiles',
  masonicProfiles: 'MasonicProfiles',
  ticketDefinitions: 'TicketDefinitions',
  ticket_definitions: 'TicketDefinitions'
};

// Verify that environment variables are correctly loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
  // Consider throwing an error or handling this case more robustly
  // depending on your application's needs.
}

// Create and export the Supabase client
// Add a type assertion or check to satisfy TypeScript if needed, 
// especially if strict null checks are enabled.
export const supabase: SupabaseClient = createClient(
  supabaseUrl!, 
  supabaseAnonKey!,
  {
    schema: 'public',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Important: Supabase API uses the actual table names as defined in the database
    // Our tables are now in PascalCase, but some API calls might still use lowercase
    // This configuration ensures consistent casing
  }
);

/**
 * Helper function to get a Supabase query with the correct table name casing
 * This provides a consistent interface after the DB standardization to PascalCase tables
 * 
 * @param tableName - The table name (can be in any case, will be normalized)
 * @returns A Supabase query builder for the table with the correct case
 */
export function table(tableName: string) {
  // Normalize the table name to its properly cased version
  const normalizedName = DB_TABLE_NAMES[tableName as keyof typeof DB_TABLE_NAMES] || tableName;
  return supabase.from(normalizedName);
}

export const supabaseTables = {
  events: 'Events',
  packages: 'packages',
  packageEvents: 'package_events',
  ticketDefinitions: 'ticket_definitions',
  attendeeTicketAssignments: 'attendee_ticket_assignments',
  valueAddedServices: 'value_added_services',
  packageVasOptions: 'package_vas_options',
  eventVasOptions: 'event_vas_options',
  registrationVas: 'registration_vas',
  grandLodges: 'grand_lodges',
  lodges: 'lodges',
  masonicProfiles: 'MasonicProfiles',
  organisationMemberships: 'OrganisationMemberships',
  organisations: 'organisations',
  locations: 'locations',
  attendees: 'Attendees',
  tickets: 'Tickets',
  priceTiers: 'price_tiers',
  ticketTypePriceTiers: 'ticket_type_price_tiers',
  feeTypes: 'fee_types',
  eventFees: 'event_fees',
  userRoles: 'user_roles',
  registrations: 'Registrations',
  customers: 'Customers',
  people: 'people',

  // Stripe Tables (now in 'stripe' schema, but listing names here might still be useful)
  stripeCustomers: 'stripe_customers',
  stripeTaxCodes: 'stripe_tax_codes',
  stripeTaxRates: 'stripe_tax_rates',
  stripeCoupons: 'stripe_coupons',
  stripePromotionCodes: 'stripe_promotion_codes',
  stripeProducts: 'stripe_products',
  stripeDiscounts: 'stripe_discounts',
  stripeQuotes: 'stripe_quotes',
  stripePrices: 'stripe_prices',
  stripeQuoteLineItems: 'stripe_quote_line_items',
  stripeInvoices: 'stripe_invoices',
  stripeInvoiceLineItems: 'stripe_invoice_line_items',

  // Log Tables (now in 'log' schema)
  tableRenameLog: 'table_rename_log',
  columnRenameLog: 'column_rename_log',
  // Add other log tables if needed for constants
};

// You might want to define schema constants too
export const supabaseSchemas = {
  public: 'public',
  stripe: 'stripe',
  log: 'log',
};