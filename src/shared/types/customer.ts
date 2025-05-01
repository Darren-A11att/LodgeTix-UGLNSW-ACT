/**
 * Defines the structure for a Customer profile,
 * mirroring the `customers` table in the database.
 */
export interface CustomerProfile {
  id: string;                      // UUID, Primary Key
  user_id: string | null;          // UUID, Foreign key to auth.users.id (nullable? Check DB)
  first_name: string;
  last_name: string;
  business_name: string | null;
  email: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  created_at: string;              // Timestamptz as string
  updated_at: string;              // Timestamptz as string
} 