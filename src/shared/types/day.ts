/**
 * Represents a specific day within a multi-day event, tailored for frontend display.
 */
export interface EventDayType {
  id: string;                      // UUID, Primary Key from database
  event_id: string | null;         // ID of the parent event
  date: string;                    // ISO Date string (YYYY-MM-DD) for this specific day
  formattedDate?: string;          // Optional: Date formatted for display (e.g., "September 12") - populated by formatter
  day_number: number;              // Sequence number (e.g., Day 1, Day 2)
  name: string;                    // Name or theme for the day (e.g., "Workshops", "Gala Dinner")

  // Note: Add other fields as needed for display.
  // The raw database type (Database['public']['Tables']['event_days']['Row'])
  // contains all fields including created_at.
} 