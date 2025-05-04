/**
 * Represents a type of ticket available for purchase, tailored for frontend display.
 */
export interface TicketDefinitionType {
  id: string;                      // UUID, Primary Key from database
  name: string;                    // Name of the ticket type (e.g., "Standard Adult")
  price: number;                   // Price of the ticket (required as per schema update)
  formattedPrice?: string;         // Optional: Price formatted as currency (e.g., "$50.00") - populated by formatter
  description: string | null;      // Optional description of what the ticket includes
  eligibility_attendee_types: string[] | null; // Who can purchase this type
  eligibility_mason_rank: string | null;       // Specific rank required, if any
  is_active: boolean | null;       // Whether it's currently available (useful for filtering)
  event_id: string;                // Associated event ID, always required (non-nullable as per schema update)

  // Note: Add other fields as needed for display, potentially populated by formatters.
  // The raw database type (Database['public']['Tables']['ticket_definitions']['Row'])
  // contains all fields including created_at.
  // 
  // Note: package_id field has been removed from the database schema
} 