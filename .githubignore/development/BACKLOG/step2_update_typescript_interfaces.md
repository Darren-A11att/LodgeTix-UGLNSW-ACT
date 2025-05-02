# Step 2: Update TypeScript Interfaces for Supabase Integration

## Context
Now that we have our Supabase client set up, we need to update our TypeScript interfaces to match the actual database schema. This will ensure type safety and better autocompletion when working with database data.

## Objective
Modify the existing frontend TypeScript interfaces to align with the Supabase database schema, particularly focusing on the `EventType` interface which is crucial for our application.

## Pre-requisites
- Supabase client is set up from Step 1
- Familiarity with the existing frontend interfaces
- Understanding of the Supabase database schema

## Analysis Steps

1. First, examine the current `EventType` interface in the frontend:
   ```bash
   # Find and examine the current EventType interface
   find /Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src -type f -name "*.ts" -exec grep -l "interface EventType" {} \;
   # Then view the file
   cat [FOUND_FILE_PATH]
   ```

2. Query the Supabase database to understand the actual events table schema:
   ```typescript
   // Create a temporary script to fetch the schema
   import { supabase } from './lib/supabase';

   async function getEventTableSchema() {
     const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'events' });
     if (error) {
       console.error('Error fetching schema:', error);
       return;
     }
     console.log('Events table schema:', data);
   }
   
   getEventTableSchema();
   ```

3. If the RPC function doesn't exist, directly query the information schema:
   ```typescript
   const { data, error } = await supabase
     .from('information_schema.columns')
     .select('column_name, data_type, is_nullable')
     .eq('table_name', 'events');
   ```

## Implementation Steps

1. Update the `EventType` interface to match the database schema:
   ```typescript
   // Find the file containing EventType interface (likely in src/shared/types/event.ts)
   
   export interface EventType {
     // Core fields (present in both frontend and backend)
     id: string;               // UUID in database
     title: string;
     description: string;
     location: string;
     type: string;             // Event type (e.g., 'Ceremony', 'Social')
     price?: number;           // Optional price
     maxAttendees?: number;    // Optional capacity
     featured: boolean;        // Whether to feature the event
     
     // Database fields that need to be added
     date: string;             // ISO date string
     start_time?: string;      // Start time (HH:MM:SS)
     end_time?: string;        // End time (HH:MM:SS)
     is_multi_day?: boolean;   // Whether this is a multi-day event
     parent_event_id?: string; // UUID of parent event (if this is a child event)
     end_date?: string;        // End date for multi-day events
     
     // Fields for frontend representation
     day?: string;             // Formatted date string (e.g., "Friday, September 12")
     time?: string;            // Formatted time range (e.g., "18:00 - 21:00")
     imageSrc?: string;        // Image URL (called imageUrl in database)
     
     // Any additional fields from the database
     event_includes?: string[];       // What's included in the event
     important_information?: string[]; // Important details about the event
     latitude?: number;        // For location mapping
     longitude?: number;       // For location mapping
   }
   ```

2. Create utility functions to convert between database and frontend formats:
   ```typescript
   // Create a new file at src/lib/formatters.ts
   
   import { format, parseISO } from 'date-fns';
   
   // Format database event data for frontend display
   export function formatEventForDisplay(dbEvent: any): EventType {
     // Format date as "Friday, September 12"
     const day = dbEvent.date ? 
       format(parseISO(dbEvent.date.toString()), 'EEEE, MMMM d') : '';
     
     // Format time as "18:00 - 21:00"
     const time = dbEvent.start_time && dbEvent.end_time ? 
       `${dbEvent.start_time.substring(0, 5)} - ${dbEvent.end_time.substring(0, 5)}` : 
       dbEvent.start_time ? 
       dbEvent.start_time.substring(0, 5) : '';
     
     // Handle field name differences (imageUrl vs imageSrc)
     const imageSrc = dbEvent.imageUrl || dbEvent.imageSrc;
     
     return {
       ...dbEvent,
       day,
       time,
       imageSrc,
     };
   }
   
   // Parse frontend time format for database storage
   export function parseTimeForDatabase(timeString: string): { start_time?: string, end_time?: string } {
     if (!timeString) return {};
     
     const parts = timeString.split(' - ');
     if (parts.length === 1) {
       return { start_time: parts[0] };
     }
     
     return {
       start_time: parts[0],
       end_time: parts[1]
     };
   }
   ```

3. Add additional interfaces as needed for other database tables:
   ```typescript
   // In the same file or in separate files based on your project structure
   
   export interface EventDay {
     id: string;
     event_id: string;
     date: string;
     day_number: number;
     name: string;
     created_at?: string;
   }
   
   export interface TicketDefinition {
     id: string;
     name: string;
     price: number;
     description?: string;
     eligibility_attendee_types?: string[];
     eligibility_mason_rank?: string;
     is_active?: boolean;
     event_id?: string;
     package_id?: string;
     created_at?: string;
   }
   
   // Add other interfaces as needed
   ```

## Testing Steps

1. Create a test function to verify the formatter works correctly:
   ```typescript
   // Add this to a test file or temporarily to a component
   
   import { formatEventForDisplay, parseTimeForDatabase } from '../lib/formatters';
   
   function testFormatters() {
     // Test database to frontend formatting
     const dbEvent = {
       id: 'e842bdb2-aff8-46d8-a347-bf50840fff13',
       title: 'Welcome Reception',
       date: '2025-09-12',
       start_time: '18:00:00',
       end_time: '21:00:00',
       location: 'Grand Ballroom, Sydney Masonic Centre',
       description: 'Start your Grand Proclamation weekend with a casual welcome reception.',
       type: 'Social',
       price: 75,
       imageUrl: 'https://example.com/image.jpg'
     };
     
     const formattedEvent = formatEventForDisplay(dbEvent);
     console.log('Formatted event:', formattedEvent);
     
     // Test frontend to database parsing
     const timeString = '18:00 - 21:00';
     const parsedTime = parseTimeForDatabase(timeString);
     console.log('Parsed time:', parsedTime);
   }
   
   testFormatters();
   ```

2. Verify the interfaces work with actual Supabase data:
   ```typescript
   import { supabase } from './lib/supabase';
   import { formatEventForDisplay } from './lib/formatters';
   import { EventType } from './shared/types/event';
   
   async function testWithRealData() {
     try {
       const { data, error } = await supabase
         .from('events')
         .select('*')
         .limit(1);
       
       if (error) {
         console.error('Error fetching test data:', error);
         return;
       }
       
       if (data && data.length > 0) {
         const formattedEvent: EventType = formatEventForDisplay(data[0]);
         console.log('Database event:', data[0]);
         console.log('Formatted event:', formattedEvent);
       }
     } catch (error) {
       console.error('Test error:', error);
     }
   }
   
   testWithRealData();
   ```

## Verification Checklist

Before moving to the next step, verify:

- [x] The `EventType` interface includes all fields from the database (and aligns with generated types)
- [x] Field types match between TypeScript and database (verified via generated types)
- [x] Formatter functions correctly convert between database and frontend formats (tested with mock and real data)
- [x] The interface accounts for naming differences (imageUrl vs imageSrc) (Handled in formatter)
- [x] Additional interfaces are created for related tables as needed (Created `TicketDefinitionType` and `EventDayType` in separate files)
- [x] Test with real database data shows no type errors (Verified with `events` data)

## Common Errors and Solutions

1. **Missing fields in interface**
   - Compare interface with database schema again
   - Add any missing fields with appropriate types
   - Consider using optional modifiers (?) for nullable fields

2. **Type mismatches**
   - Ensure numbers are typed as number, not string
   - UUID fields should be typed as string in TypeScript
   - Boolean fields should be typed as boolean

3. **Formatting errors**
   - Check date-fns is correctly handling date formats
   - Verify time formatting correctly extracts HH:MM
   - Test with edge cases (null dates, missing times)

After verification, you can remove any test code that was added temporarily for testing purposes.
