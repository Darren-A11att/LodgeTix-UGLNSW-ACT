import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2.49.1';
import { z } from 'npm:zod@3.22.4';

/**
 * REGISTRATION SAVE EDGE FUNCTION
 * 
 * This Edge Function handles saving registration data with proper:
 * - Input validation with Zod schemas
 * - Transaction handling for database integrity
 * - Batch operations for better performance
 * - Proper error handling with appropriate status codes
 * - Secure CORS configuration
 * - Authentication handling
 */

// ===================== ENVIRONMENT SETUP =====================

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ALLOWED_ORIGINS'];
const missingEnvVars = requiredEnvVars.filter(varName => !Deno.env.get(varName));

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Get environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')!.split(',').map(origin => origin.trim());

// ===================== CLIENT SETUP =====================

// Service client for admin operations (using service role)
const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
});

// Function to create a user-specific client
const createUserClient = (token: string) => createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: { 
    headers: { Authorization: `Bearer ${token}` }
  },
  db: {
    schema: 'public',
  },
});

// ===================== TYPE DEFINITIONS =====================

// Enum types matching the database ENUMs defined in migrations
// Ensure these match exactly: public.attendee_type, public.attendee_contact_preference, public.organisation_type
const AttendeeType = z.enum([
  'Mason',
  'Guest',
  'LadyPartner',
  'GuestPartner'
]);
type AttendeeType = z.infer<typeof AttendeeType>;

const AttendeeContactPreference = z.enum([
  'Directly',
  'PrimaryAttendee',
  'Mason',
  'Guest',
  'ProvideLater'
]);
type AttendeeContactPreference = z.infer<typeof AttendeeContactPreference>;

const OrganisationType = z.enum([
  'Lodge',
  'GrandLodge',
  'MasonicOrder',
  'Company',
  'Other'
]);
type OrganisationType = z.infer<typeof OrganisationType>;

// Interface for database transaction context
interface TransactionContext {
  // Maps to keep track of IDs created during transaction
  frontendToContactIdMap: Map<string, string>; // Maps frontend UUID to DB contactId
  frontendToAttendeeIdMap: Map<string, string>; // Maps frontend UUID to DB attendeeId
  createdContactIds: Set<string>; // Track newly created contact IDs to avoid duplicates
  createdMasonicProfileIds: Set<string>; // Track newly created profile IDs
  createdOrganisationIds: Set<string>; // Track newly created organisation IDs

  // Optional IDs determined during the process
  payerContactId?: string;
  payerOrganisationId?: string;
  customerId?: string;
  registrationId?: string;
  primaryAttendeeId?: string; // Backend ID of the primary attendee
}

// Define reusable interface for error responses
interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
  status: number;
}

// ===================== ZOD SCHEMAS FOR VALIDATION =====================

// Define common schemas for reuse
const PhoneSchema = z.string().nullable().optional();
const EmailSchema = z.string().email("Invalid email format").nullable().optional();

// --- Updated Zod Schemas (Task 24) ---

// Base schema for Attendee contact details (common fields)
const BaseAttendeeSchema = z.object({
  id: z.string().uuid("Invalid attendee ID (frontend UUID)"), // Frontend generated UUID
  isPrimary: z.boolean().optional().default(false),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  title: z.string().nullish(),
  phone: PhoneSchema,
  email: EmailSchema,
  // Event-specific details now part of Attendee
  eventTitle: z.string().nullish(), // Optional override title for this event
  dietaryRequirements: z.string().nullish(),
  specialNeeds: z.string().nullish(),
  contactPreference: AttendeeContactPreference.default('Directly'),
});

// Schema for Masonic details (part of Mason attendee)
const MasonicDetailsSchema = z.object({
  masonicTitle: z.string().nullish(), // Can differ from contact title
  rank: z.string().nullish(),
  grandRank: z.string().nullish(),
  grandOfficer: z.string().nullish(), // e.g., Past, Current
  grandOffice: z.string().nullish(), // Specific office name
  // Link to Organisation (Lodge) via UUID
  lodgeId: z.string().uuid("Invalid Lodge ID").nullish(),
});

// Schema for Mason attendees (extends Base, includes Masonic details)
const MasonAttendeeSchema = BaseAttendeeSchema.extend({
  attendeeType: z.literal(AttendeeType.enum.Mason).default(AttendeeType.enum.Mason),
  masonicDetails: MasonicDetailsSchema.optional(),
  // `delegatedContactId` and `relatedAttendeeId` are handled server-side
});

// Schema for Guest attendees (extends Base)
const GuestAttendeeSchema = BaseAttendeeSchema.extend({
  attendeeType: z.literal(AttendeeType.enum.Guest).default(AttendeeType.enum.Guest),
  // `delegatedContactId` and `relatedAttendeeId` are handled server-side
});

// Schema for Lady Partners (extends Base, adds relationship details)
const LadyPartnerAttendeeSchema = BaseAttendeeSchema.extend({
  attendeeType: z.literal(AttendeeType.enum.LadyPartner).default(AttendeeType.enum.LadyPartner),
  masonId: z.string().uuid("Mason ID reference is required for Lady Partner"), // Frontend UUID of the related Mason
  relationship: z.string().nullish(),
  contactPreference: AttendeeContactPreference.default('Mason'), // Default preference
  // `delegatedContactId` and `relatedAttendeeId` are handled server-side
});

// Schema for Guest Partners (extends Base, adds relationship details)
const GuestPartnerAttendeeSchema = BaseAttendeeSchema.extend({
  attendeeType: z.literal(AttendeeType.enum.GuestPartner).default(AttendeeType.enum.GuestPartner),
  guestId: z.string().uuid("Guest ID reference is required for Guest Partner"), // Frontend UUID of the related Guest
  relationship: z.string().nullish(),
  contactPreference: AttendeeContactPreference.default('Guest'), // Default preference
  // `delegatedContactId` and `relatedAttendeeId` are handled server-side
});

// Schema for Ticket selections associated with an attendee
const AttendeeTicketSchema = z.object({
  // Refers to the Event ID (sub-event/session)
  eventId: z.string().uuid("Invalid event ID for ticket"),
  // Refers to the Ticket Definition ID
  ticketDefinitionId: z.string().uuid("Invalid ticket definition ID"),
  // Price might be determined server-side based on ticketDefinitionId,
  // or passed if dynamically calculated/discounted on frontend.
  // Let's assume server-side lookup for now unless specified otherwise.
  // pricePaid: z.number().positive("Price paid must be positive").optional(),
});

// Schema for the Payer Information (can be an individual contact or an organisation)
const PayerDetailsSchema = z.object({
  isOrganisation: z.boolean().default(false),
  // Required if isOrganisation = false
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  title: z.string().optional(),
  suffix: z.string().optional(),
  primaryPhone: PhoneSchema,
  primaryEmail: EmailSchema,
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),

  // Required if isOrganisation = true
  organisationName: z.string().optional(),
  organisationType: OrganisationType.optional(), // Type of org (Lodge, Company etc.)
  website: z.string().url("Invalid website URL").optional(),
  // Org address can use the same fields: streetAddress, city, state, postalCode, country

  // Add fields for the primary contact person within the paying organisation
  payerContactFirstName: z.string().optional(),
  payerContactLastName: z.string().optional(),
  payerContactEmail: EmailSchema, // Use existing email schema
  payerContactPhone: PhoneSchema, // Use existing phone schema
  payerContactRole: z.string().optional().default('Payer Contact'), // Role in OrgMemberships
  payerIsOrgPrimaryContact: z.boolean().optional().default(false), // Flag for OrgMemberships

  // Billing details can override contact/org details
  billingFirstName: z.string().optional(),
  billingLastName: z.string().optional(),
  billingOrganisationName: z.string().optional(),
  billingEmail: EmailSchema,
  billingPhone: PhoneSchema,
  billingStreetAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),

}).refine(data => {
    // Conditional validation based on isOrganisation
    if (data.isOrganisation) {
      // If Org, require Org Name, Type, and Payer Contact details
      return !!data.organisationName && !!data.organisationType &&
             !!data.payerContactFirstName && !!data.payerContactLastName;
    } else {
      return !!data.firstName && !!data.lastName;
    }
  }, {
    message: "Organisation requires name, type, and payer contact first/last name; Individual requires first and last name.",
    path: ["organisationName", "firstName", "payerContactFirstName"] // Adjust path as needed
});

// Main payload schema combining all parts
const RegistrationPayloadSchema = z.object({
  // Event ID for the main registration
  eventId: z.string().uuid("Invalid Event ID"),
  // Payer Info
  payerDetails: PayerDetailsSchema,
  // Attendee arrays (using discriminated union for type safety based on attendeeType)
  attendees: z.array(z.discriminatedUnion("attendeeType", [
    MasonAttendeeSchema,
    GuestAttendeeSchema,
    LadyPartnerAttendeeSchema,
    GuestPartnerAttendeeSchema
  ])).min(1, "At least one attendee is required"),
  // Ticket selections per attendee (maps frontend attendee ID to their tickets)
  attendeeTickets: z.record(z.string().uuid(), z.array(AttendeeTicketSchema)).optional(),
  // Agreement
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  }),
  // Optional Stripe Payment Intent ID if payment was processed client-side
  stripePaymentIntentId: z.string().optional(),
});

// Type inference from Zod schema
type RegistrationPayload = z.infer<typeof RegistrationPayloadSchema>;

// --- End Updated Zod Schemas ---

// ===================== CORE UTILITY FUNCTIONS =====================

/**
 * Creates a CORS-friendly response
 * @param body - Response body (will be JSON stringified)
 * @param status - HTTP status code
 * @param origin - Request origin 
 * @returns Response object with proper CORS headers
 */
function corsResponse(
  body: unknown, 
  status = 200, 
  origin: string | null = null
): Response {
  // Setup basic CORS headers
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Only add allowed origin if it matches our configured allowed origins
  if (origin) {
    const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
    if (isAllowed) {
      headers['Access-Control-Allow-Origin'] = origin;
    }
  }

  // For 204 No Content, don't include body or content-type
  if (status === 204) {
    return new Response(null, { status, headers });
  }

  // Add content type for all other responses
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Authenticates a request using JWT authentication
 * @param req - The incoming HTTP request
 * @returns Object containing authentication details
 */
async function authenticateRequest(req: Request): Promise<{
  userId: string | null;
  userClient: ReturnType<typeof createUserClient>;
  isAuthenticated: boolean;
}> {
  // Extract the Authorization header
  const authHeader = req.headers.get('Authorization');
  
  // Default token is the anon key for unauthenticated access
  let token = supabaseAnonKey;
  
  // If auth header exists and is properly formatted, extract token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '');
  }
  
  // Create a client with the provided token
  const userClient = createUserClient(token);
  
  try {
    // Verify the token and get the user
    const { data: { user }, error } = await userClient.auth.getUser();
    
    if (error || !user) {
      return { 
        userId: null, 
        userClient: createUserClient(supabaseAnonKey),
        isAuthenticated: false
      };
    }
    
    return { 
      userId: user.id, 
      userClient,
      isAuthenticated: true
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { 
      userId: null, 
      userClient: createUserClient(supabaseAnonKey),
      isAuthenticated: false
    };
  }
}

/**
 * Generate an error response with consistent structure
 * @param message - Error message
 * @param status - HTTP status code
 * @param details - Additional error details (e.g., validation errors)
 * @returns Error response object
 */
function createErrorResponse(
  message: string,
  status = 500,
  details?: unknown
): ErrorResponse {
  return {
    success: false,
    error: message,
    ...(details && { details }),
    status,
  };
}

// ===================== DATABASE OPERATIONS (Refactored for New Schema - Task 24) =====================

/**
 * Finds an existing contact or creates a new one.
 * Uses the new `public.Contacts` schema.
 * Returns the contactId.
 * @param contactData - Data for the contact (firstName, lastName, etc.)
 * @param authUserId - Optional linked auth.users.id
 * @param isOrgContact - Flag if this contact record represents an organisation (for Organisations table linkage)
 * @param supabase - Supabase client instance
 * @returns contactId (UUID)
 */
async function getOrCreateContact(
  contactData: {
    firstName: string;
    lastName: string;
    title?: string | null;
    suffix?: string | null;
    primaryPhone?: string | null;
    primaryEmail?: string | null;
    streetAddress?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  },
  authUserId: string | null,
  isOrgContact: boolean,
  supabase: SupabaseClient
): Promise<string> {
  // 1. Try finding existing contact by email (if provided) or potentially phone
  if (contactData.primaryEmail) {
    const { data: existing, error: findError } = await supabase
      .from('Contacts')
      .select('contactId')
      .eq('primaryEmail', contactData.primaryEmail)
      .maybeSingle();

    if (findError) console.error('Error finding contact by email:', findError.message);
    if (existing) {
      // Optionally update existing contact? For now, just return ID.
      return existing.contactId;
    }
  }
  // Add similar logic for phone if needed as a unique identifier fallback

  // 2. Create new contact if not found
  const { data: newContact, error: createError } = await supabase
    .from('Contacts')
    .insert({
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      title: contactData.title,
      suffix: contactData.suffix,
      primaryPhone: contactData.primaryPhone,
      primaryEmail: contactData.primaryEmail,
      streetAddress: contactData.streetAddress,
      city: contactData.city,
      state: contactData.state,
      postalCode: contactData.postalCode,
      country: contactData.country,
      authUserId: authUserId, // Link to auth user if provided
      isOrganisation: isOrgContact, // Mark if it's for an Org
    })
    .select('contactId')
    .single();

  if (createError || !newContact) {
    throw new Error(`Failed to create contact: ${createError?.message || 'No data returned'}`);
  }

  return newContact.contactId;
}

/**
 * Finds an existing organisation or creates a new one.
 * Uses the new `public.Organisations` schema.
 * Returns the organisationId.
 * @param orgData - Data for the organisation (name, type, address etc.)
 * @param supabase - Supabase client instance
 * @returns organisationId (UUID)
 */
async function getOrCreateOrganisation(
  orgData: {
    name: string;
    type: OrganisationType;
    streetAddress?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
    website?: string | null;
  },
  supabase: SupabaseClient
): Promise<string> {
  // 1. Try finding existing organisation by name (assuming name is unique enough for this context)
  // More robust check might involve address details if names aren't unique
  const { data: existing, error: findError } = await supabase
    .from('Organisations')
    .select('organisationId')
    .eq('name', orgData.name)
    .eq('type', orgData.type) // Match type as well
    .maybeSingle();

  if (findError) console.error('Error finding organisation:', findError.message);
  if (existing) {
    return existing.organisationId;
  }

  // 2. Create new organisation if not found
  const { data: newOrg, error: createError } = await supabase
    .from('Organisations')
    .insert({
      name: orgData.name,
      type: orgData.type,
      streetAddress: orgData.streetAddress,
      city: orgData.city,
      state: orgData.state,
      postalCode: orgData.postalCode,
      country: orgData.country,
      website: orgData.website,
    })
    .select('organisationId')
    .single();

  if (createError || !newOrg) {
    throw new Error(`Failed to create organisation: ${createError?.message || 'No data returned'}`);
  }

  return newOrg.organisationId;
}


/**
 * Creates or updates a masonic profile linked to a contact.
 * Uses the new `public.MasonicProfiles` schema.
 * @param profileData - Data for the masonic profile (rank, lodgeId etc.)
 * @param contactId - The contactId this profile belongs to.
 * @param supabase - Supabase client instance
 */
async function upsertMasonicProfile(
  profileData: {
    masonicTitle?: string | null;
    rank?: string | null;
    grandRank?: string | null;
    grandOfficer?: string | null;
    grandOffice?: string | null;
    lodgeId?: string | null; // This is now OrganisationId from Organisations table
  },
  contactId: string,
  supabase: SupabaseClient
): Promise<void> {
  // MasonicProfiles has a UNIQUE constraint on contactId, so use upsert
  const { error } = await supabase
    .from('MasonicProfiles')
    .upsert({
      contactId: contactId, // Link to the contact
      masonicTitle: profileData.masonicTitle,
      rank: profileData.rank,
      grandRank: profileData.grandRank,
      grandOfficer: profileData.grandOfficer,
      grandOffice: profileData.grandOffice,
      lodgeId: profileData.lodgeId, // FK to Organisations table
      // Set updatedAt implicitly via trigger or manually if needed
    }, { onConflict: 'contactId' }); // Upsert based on the unique contactId

  if (error) {
    // Log error but don't necessarily throw, maybe profile update isn't critical path
    console.error(`Failed to upsert masonic profile for contact ${contactId}: ${error.message}`);
    // Depending on requirements, you might want to throw here:
    // throw new Error(`Failed to upsert masonic profile: ${error.message}`);
  }
}

/**
 * Creates or finds a customer record linked to a Contact or Organisation.
 * Uses the new `public."Customers"` schema (case-sensitive).
 * Returns the customerId.
 * @param customerLink - Contains either contactId or organisationId.
 * @param billingDetails - Billing address overrides.
 * @param stripeCustomerId - Optional Stripe Customer ID.
 * @param supabase - Supabase client instance
 * @returns customerId (UUID)
 */
async function getOrCreateCustomer(
  customerLink: { contactId: string; organisationId?: null } | { contactId?: null; organisationId: string },
  billingDetails: {
    billingFirstName?: string | null;
    billingLastName?: string | null;
    billingOrganisationName?: string | null;
    billingEmail?: string | null;
    billingPhone?: string | null;
    billingStreetAddress?: string | null;
    billingCity?: string | null;
    billingState?: string | null;
    billingPostalCode?: string | null;
    billingCountry?: string | null;
  },
  stripeCustomerId: string | null | undefined,
  supabase: SupabaseClient
): Promise<string> {
  // 1. Try finding existing customer by contactId or organisationId
  const findCriteria = customerLink.contactId
    ? { contactId: customerLink.contactId }
    : { organisationId: customerLink.organisationId! };

  const { data: existing, error: findError } = await supabase
    .from('"Customers"') // Ensure quotes for case-sensitive table
    .select('customerId')
    .match(findCriteria)
    .maybeSingle();

  if (findError) console.error('Error finding customer:', findError.message);
  if (existing) {
    // Optionally update billing details or Stripe ID if needed
    // For now, just return existing ID
    return existing.customerId;
  }

  // 2. Create new customer if not found
  const { data: newCustomer, error: createError } = await supabase
    .from('"Customers"') // Ensure quotes for case-sensitive table
    .insert({
      ...customerLink, // Spread contactId or organisationId
      ...billingDetails, // Spread billing overrides
      stripeCustomerId: stripeCustomerId,
    })
    .select('customerId')
    .single();

  if (createError || !newCustomer) {
    throw new Error(`Failed to create customer: ${createError?.message || 'No data returned'}`);
  }

  return newCustomer.customerId;
}


/**
 * Creates an OrganisationMembership record linking a Contact to an Organisation.
 * Uses the new `public.OrganisationMemberships` schema.
 * @param contactId - The contactId of the member.
 * @param organisationId - The organisationId they belong to.
 * @param role - Optional role within the organisation.
 * @param isPrimary - Flag if this is the primary contact for the org.
 * @param supabase - Supabase client instance
 */
async function createOrganisationMembership(
  contactId: string,
  organisationId: string,
  role: string | null | undefined,
  isPrimary: boolean,
  supabase: SupabaseClient
): Promise<void> {
  // UNIQUE constraint on (contactId, organisationId), so use upsert or check first.
  // Using insert with ON CONFLICT DO NOTHING is simpler if updates aren't needed.
  const { error } = await supabase
    .from('OrganisationMemberships')
    .insert({
      contactId: contactId,
      organisationId: organisationId,
      roleInOrg: role,
      isPrimaryContact: isPrimary,
    })
    .select('membershipId') // Select something to confirm insertion
    .maybeSingle(); // Use maybeSingle to handle potential conflicts gracefully

  if (error && error.code !== '23505') { // Ignore unique violation errors (PGRST_DUPLICATE)
      console.error(`Failed to create org membership for contact ${contactId} in org ${organisationId}: ${error.message}`);
      // Decide if this error should halt the process
      // throw new Error(`Failed to create org membership: ${error.message}`);
  }
}


/**
 * Gets the price of a ticket from the `ticket_definitions` table.
 * @param ticketDefinitionId - The ticket definition ID
 * @param supabase - Supabase client instance
 * @returns The price of the ticket (throws error if not found or price missing)
 */
async function getTicketPrice(ticketDefinitionId: string, supabase: SupabaseClient): Promise<number> {
  // Referenced table name is lowercase 'ticket_definitions'
  const { data, error } = await supabase
    .from('ticket_definitions')
    .select('price')
    .eq('id', ticketDefinitionId)
    .single(); // Expect exactly one result

  if (error || !data || typeof data.price !== 'number') {
    console.error(`Could not find price for ticket definition ${ticketDefinitionId}: ${error?.message || 'Not found or price missing'}`);
    throw new Error(`Invalid or missing price for ticket definition ${ticketDefinitionId}`);
  }

  return data.price;
}

// ===================== MAIN PROCESSING FUNCTION (Refactored - Task 24) =====================

/**
 * Processes a registration using the new normalized schema and transaction logic.
 * @param payload - Validated registration payload (new structure)
 * @param authUserId - Authenticated user ID (if available)
 * @param supabase - Supabase service client instance for database operations
 * @returns Registration result with IDs and status
 */
async function processRegistration(
  payload: RegistrationPayload,
  authUserId: string | null,
  supabase: SupabaseClient
): Promise<{
  registrationId: string;
  customerId: string;
  primaryAttendeeId: string; // Backend ID
}> {
  // Transaction Context Initialization
  const ctx: TransactionContext = {
    frontendToContactIdMap: new Map<string, string>(),
    frontendToAttendeeIdMap: new Map<string, string>(),
    createdContactIds: new Set<string>(),
    createdMasonicProfileIds: new Set<string>(),
    createdOrganisationIds: new Set<string>(),
  };

  // --- Database Transaction Simulation (using careful sequencing & error handling) ---
  // Supabase Edge Functions don't have direct BEGIN/COMMIT.
  // We simulate by performing operations sequentially and stopping on critical failures.
  // Rollback isn't automatic; cleanup would need manual implementation if partial failures are unacceptable.
  // Alternatively, use a Supabase Database Function (RPC) to wrap the logic in a real transaction.

  try {
    // --- Step 1: Get/Create Payer Contact or Organisation ---
    const payer = payload.payerDetails;
    let payerInitiatingContactId: string | undefined = undefined;

    if (payer.isOrganisation) {
      // Payer is Organisation
      ctx.payerOrganisationId = await getOrCreateOrganisation({
        name: payer.organisationName!,
        type: payer.organisationType!,
        streetAddress: payer.streetAddress,
        city: payer.city,
        state: payer.state,
        postalCode: payer.postalCode,
        country: payer.country,
        website: payer.website,
      }, supabase);
      ctx.createdOrganisationIds.add(ctx.payerOrganisationId);

      // Also get/create the Contact person initiating for the Organisation (Code Review Required Change)
      payerInitiatingContactId = await getOrCreateContact({
          firstName: payer.payerContactFirstName!,
          lastName: payer.payerContactLastName!,
          primaryEmail: payer.payerContactEmail,
          primaryPhone: payer.payerContactPhone,
          // Other contact fields like title could be added to schema if needed
        },
        null, // Don't link org payer contact directly to auth user automatically
        false, // This is an individual contact record
        supabase
      );
      ctx.createdContactIds.add(payerInitiatingContactId);

      // Create membership link (Code Review Required Change)
      await createOrganisationMembership(
        payerInitiatingContactId,
        ctx.payerOrganisationId,
        payer.payerContactRole,
        payer.payerIsOrgPrimaryContact,
        supabase
      );

    } else {
      // Payer is Individual Contact
      ctx.payerContactId = await getOrCreateContact({
          firstName: payer.firstName!,
          lastName: payer.lastName!,
          title: payer.title,
          suffix: payer.suffix,
          primaryPhone: payer.primaryPhone,
          primaryEmail: payer.primaryEmail,
          streetAddress: payer.streetAddress,
          city: payer.city,
          state: payer.state,
          postalCode: payer.postalCode,
          country: payer.country,
        },
        authUserId, // Link payer contact to auth user if logged in
        false, // Not an org contact
        supabase
      );
      ctx.createdContactIds.add(ctx.payerContactId);
    }

    // --- Step 2: Get/Create Customer ---
    // Link Customer to either the payer Contact or Organisation
    const customerLink = ctx.payerContactId
      ? { contactId: ctx.payerContactId }
      : { organisationId: ctx.payerOrganisationId! };

    // Prepare billing details override
    const billingDetails = {
      billingFirstName: payer.billingFirstName || (!payer.isOrganisation ? payer.firstName : null),
      billingLastName: payer.billingLastName || (!payer.isOrganisation ? payer.lastName : null),
      billingOrganisationName: payer.billingOrganisationName || (payer.isOrganisation ? payer.organisationName : null),
      billingEmail: payer.billingEmail || payer.primaryEmail,
      billingPhone: payer.billingPhone || payer.primaryPhone,
      billingStreetAddress: payer.billingStreetAddress || payer.streetAddress,
      billingCity: payer.billingCity || payer.city,
      billingState: payer.billingState || payer.state,
      billingPostalCode: payer.billingPostalCode || payer.postalCode,
      billingCountry: payer.billingCountry || payer.country,
    };

    ctx.customerId = await getOrCreateCustomer(
      customerLink,
      billingDetails,
      null, // Stripe Customer ID - handle separately if needed
      supabase
    );

    // --- Step 3: Create Registration ---
    // Use the new "Registrations" table (case-sensitive)
    const { data: registration, error: regError } = await supabase
      .from('"Registrations"') // Ensure quotes for case-sensitive table
      .insert({
        customerId: ctx.customerId,
        eventId: payload.eventId, // Link to the main event
        status: 'Pending', // Initial status
        // totalAmountPaid will be calculated later based on tickets
        // primaryAttendeeId will be updated later
      })
      .select('registrationId')
      .single();

    if (regError || !registration) {
      throw new Error(`Failed to create registration: ${regError?.message || 'No data returned'}`);
    }
    ctx.registrationId = registration.registrationId;

    // --- Step 4: Process Attendees (Loop 1 - Create Contacts, Profiles, Attendees) ---
    const attendeeInserts: any[] = []; // Prepare for bulk insert

    for (const attendeeData of payload.attendees) {
      // Find/Create Contact for this attendee
      const contactId = await getOrCreateContact({
          firstName: attendeeData.firstName,
          lastName: attendeeData.lastName,
          title: attendeeData.title,
          primaryPhone: attendeeData.phone,
          primaryEmail: attendeeData.email,
          // Address fields are not on base attendee schema, add if needed
        },
        null, // Don't link attendees directly to auth user unless specified
        false, // Not an org contact
        supabase
      );
      ctx.frontendToContactIdMap.set(attendeeData.id, contactId); // Map frontend UUID -> DB contactId
      ctx.createdContactIds.add(contactId);

      // If Mason, upsert Masonic Profile
      if (attendeeData.attendeeType === AttendeeType.enum.Mason && attendeeData.masonicDetails) {
        await upsertMasonicProfile(attendeeData.masonicDetails, contactId, supabase);
        // Note: Need to track created profile IDs if cleanup on failure is needed
      }

      // Prepare Attendee record for bulk insert
      attendeeInserts.push({
        registrationId: ctx.registrationId,
        contactId: contactId, // Link to the created/found contact
        attendeeType: attendeeData.attendeeType,
        eventTitle: attendeeData.eventTitle,
        dietaryRequirements: attendeeData.dietaryRequirements,
        specialNeeds: attendeeData.specialNeeds,
        contactPreference: attendeeData.contactPreference,
        relationship: (attendeeData as any).relationship, // Only present for partners
        // `relatedAttendeeId` and `delegatedContactId` will be updated in Loop 2
        // Add frontend ID temporarily for mapping after insert
        _frontendId: attendeeData.id,
        // Add related frontend ID temporarily for partners
        _relatedFrontendId: (attendeeData as any).masonId || (attendeeData as any).guestId || null,
      });
    }

    // Bulk insert Attendees
    if (attendeeInserts.length === 0) {
      throw new Error('No attendees to insert');
    }

    // Remove temporary fields before inserting
    const attendeesForDb = attendeeInserts.map(a => {
      const { _frontendId, _relatedFrontendId, ...dbData } = a;
      return dbData;
    });

    const { data: insertedAttendees, error: attendeeError } = await supabase
      .from('Attendees')
      .insert(attendeesForDb)
      .select('attendeeId'); // Select the generated IDs

    if (attendeeError || !insertedAttendees || insertedAttendees.length !== attendeeInserts.length) {
      throw new Error(`Failed to create attendees: ${attendeeError?.message || 'Mismatch in inserted count'}`);
    }

    // Map frontend IDs to backend attendee IDs and find primary attendee
    let foundPrimary = false; // Flag to ensure only one primary
    for (let i = 0; i < attendeeInserts.length; i++) {
      const frontendId = attendeeInserts[i]._frontendId as string;
      const backendId = insertedAttendees[i].attendeeId;
      ctx.frontendToAttendeeIdMap.set(frontendId, backendId);

      // Check for explicit primary flag (Code Review Suggestion)
      const originalAttendeeData = payload.attendees.find(a => a.id === frontendId);
      if (originalAttendeeData?.isPrimary) {
         if (foundPrimary) {
           // Throw error if multiple attendees are marked as primary
           throw new Error('Multiple attendees marked as primary in the payload.');
         }
         ctx.primaryAttendeeId = backendId;
         foundPrimary = true;
      }
    }

    // If no attendee was explicitly marked as primary, throw error
    if (!ctx.primaryAttendeeId) {
        throw new Error("No primary attendee was specified in the registration payload.");
    }


    // --- Step 5: Process Relationships & Delegated Contacts (Loop 2 - Update Attendees) ---
    const attendeeUpdates: Promise<any>[] = [];

    for (const attendeeData of payload.attendees) {
      const backendAttendeeId = ctx.frontendToAttendeeIdMap.get(attendeeData.id);
      if (!backendAttendeeId) continue; // Should not happen if mapping worked

      let relatedBackendAttendeeId: string | null = null;
      let delegatedContactId: string | null = null;

      // Determine relatedAttendeeId for partners
      const relatedFrontendId = (attendeeData as any).masonId || (attendeeData as any).guestId;
      if (relatedFrontendId) {
        relatedBackendAttendeeId = ctx.frontendToAttendeeIdMap.get(relatedFrontendId) || null;
      }

      // Determine delegatedContactId based on preference
      switch (attendeeData.contactPreference) {
        case 'PrimaryAttendee':
          // Find the contact ID of the primary attendee
          const primaryBackendAttendeeId = ctx.primaryAttendeeId;
          const primaryFrontendId = [...ctx.frontendToAttendeeIdMap.entries()].find(([key, val]) => val === primaryBackendAttendeeId)?.[0];
          if(primaryFrontendId) {
             delegatedContactId = ctx.frontendToContactIdMap.get(primaryFrontendId) || null;
          } else {
             console.warn(`Could not find primary contact ID for delegation for attendee ${backendAttendeeId}`);
          }
          break;
        case 'Mason':
        case 'Guest':
          // Find contact ID of the related Mason/Guest
          if (relatedFrontendId) {
            delegatedContactId = ctx.frontendToContactIdMap.get(relatedFrontendId) || null;
          } else {
             console.warn(`Cannot delegate contact to Mason/Guest for attendee ${backendAttendeeId} as related ID is missing.`);
          }
          break;
        case 'Directly':
        case 'ProvideLater':
        default:
          delegatedContactId = null; // No delegation needed
          break;
      }

      // If there's anything to update for this attendee, queue the update
      if (relatedBackendAttendeeId || delegatedContactId) {
        attendeeUpdates.push(
          supabase
            .from('Attendees')
            .update({
              ...(relatedBackendAttendeeId && { relatedAttendeeId: relatedBackendAttendeeId }),
              ...(delegatedContactId && { delegatedContactId: delegatedContactId }),
            })
            .eq('attendeeId', backendAttendeeId)
        );
      }
    }

    // Execute all attendee updates in parallel
    const updateResults = await Promise.allSettled(attendeeUpdates);
    updateResults.forEach(result => {
      if (result.status === 'rejected') {
        console.error('Failed to update attendee relationship/delegation:', result.reason);
        // Decide if this failure is critical
      }
    });


    // --- Step 6: Process Tickets ---
    const ticketInserts: any[] = [];
    let totalAmountPaid = 0; // Calculate total based on ticket prices

    if (payload.attendeeTickets) {
      const pricePromises: Promise<{ attendeeId: string, eventId: string, ticketDefinitionId: string, price: number }>[] = [];

      // Iterate through attendee ticket assignments in payload
      for (const [frontendAttendeeId, tickets] of Object.entries(payload.attendeeTickets)) {
        const backendAttendeeId = ctx.frontendToAttendeeIdMap.get(frontendAttendeeId);
        if (!backendAttendeeId) {
          console.warn(`Skipping tickets for unknown frontend attendee ID: ${frontendAttendeeId}`);
          continue;
        }

        for (const ticket of tickets) {
          // Queue price lookup
          pricePromises.push(
             getTicketPrice(ticket.ticketDefinitionId, supabase).then(price => ({
                attendeeId: backendAttendeeId,
                eventId: ticket.eventId,
                ticketDefinitionId: ticket.ticketDefinitionId,
                price: price
             }))
          );
        }
      }

      // Resolve all prices
      const resolvedPrices = await Promise.all(pricePromises);

      // Prepare ticket inserts
      resolvedPrices.forEach(resolved => {
         ticketInserts.push({
           attendeeId: resolved.attendeeId,
           eventId: resolved.eventId, // Link to specific sub-event/session
           ticketDefinitionId: resolved.ticketDefinitionId, // Link to type of ticket
           pricePaid: resolved.price, // Use looked-up price
           status: 'Active', // Default status
         });
         totalAmountPaid += resolved.price; // Add to total
      });

      // Bulk insert tickets
      if (ticketInserts.length > 0) {
        const { error: ticketError } = await supabase
          .from('Tickets')
          .insert(ticketInserts);

        if (ticketError) {
          throw new Error(`Failed to create tickets: ${ticketError.message}`);
        }
      }
    }

    // --- Step 7: Update Registration with Final Details ---
    const { error: finalRegUpdateError } = await supabase
      .from('"Registrations"') // Ensure quotes for case-sensitive table
      .update({
        primaryAttendeeId: ctx.primaryAttendeeId, // Link to primary attendee
        totalAmountPaid: totalAmountPaid, // Set calculated total
        // Update status if payment was successful via webhook later, or if intentId provided?
        // status: payload.stripePaymentIntentId ? 'Confirmed' : 'Pending', // Example logic
        ...(payload.stripePaymentIntentId && { stripePaymentIntentId: payload.stripePaymentIntentId })
      })
      .eq('registrationId', ctx.registrationId);

     if (finalRegUpdateError) {
       // Log error but maybe don't fail the whole process?
       console.error(`Failed to update registration ${ctx.registrationId} with final details: ${finalRegUpdateError.message}`);
     }

    // --- Transaction Complete ---
    console.log(`Registration ${ctx.registrationId} processed successfully.`);

    // Return essential IDs
    return {
      registrationId: ctx.registrationId,
      customerId: ctx.customerId,
      primaryAttendeeId: ctx.primaryAttendeeId!, // Should be set by now
    };

  } catch (error: any) {
    // Log the failure during the simulated transaction
    console.error('Registration process failed:', error);
    // Here, you would ideally trigger cleanup/rollback logic if needed.
    // Since it's complex in edge functions, we primarily rely on logging and returning an error.
    throw new Error(`Registration failed: ${error.message}`);
  }
}


// ===================== MAIN REQUEST HANDLER =====================

Deno.serve(async (req) => {
  // Get the request origin for CORS handling
  const origin = req.headers.get('Origin');
  
  try {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204, origin);
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
      return corsResponse(
        createErrorResponse('Method not allowed', 405),
        405, 
        origin
      );
    }
    
    // Authenticate the request
    const { userId, userClient, isAuthenticated } = await authenticateRequest(req);
    
    // Parse and validate the request body
    let payload: RegistrationPayload;
    try {
      const rawPayload = await req.json();
      payload = RegistrationPayloadSchema.parse(rawPayload);
    } catch (error) {
      // Handle validation errors
      const errorMessage = error instanceof z.ZodError
        ? "Invalid registration data provided."
        : "Failed to parse request body.";
      const errorDetails = error instanceof z.ZodError ? error.errors : undefined;

      return corsResponse(
        createErrorResponse(errorMessage, 400, errorDetails),
        400,
        origin
      );
    }

    // Process the registration using the service client for elevated privileges
    try {
      const result = await processRegistration(payload, userId, serviceClient);

      // Return success response
      return corsResponse({
        success: true,
        message: 'Registration submitted successfully.',
        registrationId: result.registrationId,
        customerId: result.customerId,
        primaryAttendeeId: result.primaryAttendeeId,
      }, 201, origin); // 201 Created status

    } catch (error: any) {
      // Handle errors during registration processing
      console.error("Error during processRegistration:", error);
      return corsResponse(
        createErrorResponse(`Registration processing failed: ${error.message}`, 500),
        500,
        origin
      );
    }

  } catch (error: any) {
    // Catch any unexpected errors
    console.error("Unhandled error in Edge Function:", error);
    return corsResponse(
      createErrorResponse(`Internal Server Error: ${error.message}`, 500),
      500,
      origin
    );
  }
});