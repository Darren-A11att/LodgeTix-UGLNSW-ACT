# Step 3: Implement Event Fetching from Supabase

## Context
With the Supabase client set up and TypeScript interfaces updated, we're now ready to implement actual data fetching for events. This is a critical piece of functionality that will replace the mock data currently used in the EventsPage.

## Objective
Create robust API functions to fetch events from Supabase and update the EventsPage component to use real data instead of mock data.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated to match the database (Step 2)
- Understanding of the current event loading in EventsPage

## Analysis Steps

1. First, examine how events are currently loaded in the EventsPage:
   ```bash
   # Find the EventsPage component
   find /Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src -type f -name "EventsPage.tsx" -o -name "EventsPage.jsx"
   # View the current implementation
   cat [FOUND_FILE_PATH]
   ```

2. Locate the mock events data:
   ```bash
   # Find the mock events data
   find /Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src -type f -name "*.ts" -exec grep -l "events:" {} \;
   # Or search for event array declarations
   find /Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src -type f -name "*.ts" -exec grep -l "const events =" {} \;
   # View the mock data
   cat [FOUND_FILE_PATH]
   ```

3. Verify the structure of events in the database:
   ```typescript
   // Execute this in a test file or component
   import { supabase } from './lib/supabase';
   
   async function inspectEventsTable() {
     // Get a sample event
     const { data, error } = await supabase
       .from('events')
       .select('*')
       .limit(1);
       
     if (error) {
       console.error('Error fetching sample event:', error);
       return;
     }
     
     console.log('Database event structure:', data[0]);
     
     // Check for parent/child relationships
     const { data: parentEvents, error: parentError } = await supabase
       .from('events')
       .select('id, title')
       .is('parent_event_id', null)
       .limit(3);
       
     if (parentError) {
       console.error('Error fetching parent events:', parentError);
     } else {
       console.log('Parent events:', parentEvents);
     }
   }
   
   inspectEventsTable();
   ```

## Implementation Steps

1. Create a dedicated API file for event operations:
   ```typescript
   // Create a new file at src/lib/api/events.ts
   
   import { supabase } from '../supabase';
   import { EventType } from '../../shared/types/event';
   import { formatEventForDisplay } from '../formatters';
   
   /**
    * Fetches all parent or standalone events (not child events)
    * @returns Promise resolving to array of formatted events
    */
   export async function getEvents(): Promise<EventType[]> {
     try {
       // For the main events listing, fetch parent events or standalone events
       const { data, error } = await supabase
         .from('events')
         .select('*')
         .is('parent_event_id', null) // Only get parent events or standalone events
         .order('date', { ascending: true });
       
       if (error) {
         console.error('Error fetching events:', error);
         return [];
       }
       
       // Format events for frontend display
       return data.map(event => formatEventForDisplay(event));
     } catch (err) {
       console.error('Unexpected error fetching events:', err);
       return [];
     }
   }
   
   /**
    * Fetches featured events for homepage or promotional sections
    * @param limit Maximum number of events to return
    * @returns Promise resolving to array of formatted featured events
    */
   export async function getFeaturedEvents(limit: number = 3): Promise<EventType[]> {
     try {
       const { data, error } = await supabase
         .from('events')
         .select('*')
         .eq('featured', true)
         .order('date', { ascending: true })
         .limit(limit);
       
       if (error) {
         console.error('Error fetching featured events:', error);
         return [];
       }
       
       return data.map(event => formatEventForDisplay(event));
     } catch (err) {
       console.error('Unexpected error fetching featured events:', err);
       return [];
     }
   }
   
   /**
    * Fetches events by type (Social, Ceremony, etc.)
    * @param type The event type to filter by
    * @returns Promise resolving to array of formatted events of the specified type
    */
   export async function getEventsByType(type: string): Promise<EventType[]> {
     try {
       const { data, error } = await supabase
         .from('events')
         .select('*')
         .eq('type', type)
         .order('date', { ascending: true });
       
       if (error) {
         console.error(`Error fetching ${type} events:`, error);
         return [];
       }
       
       return data.map(event => formatEventForDisplay(event));
     } catch (err) {
       console.error(`Unexpected error fetching ${type} events:`, err);
       return [];
     }
   }
   ```

2. Update the EventsPage component to use real data:
   ```tsx
   // Locate the EventsPage component and update it
   
   import React, { useState, useEffect } from 'react';
   import { getEvents } from '../lib/api/events'; // Update import path as needed
   import { EventType } from '../shared/types/event'; // Update import path as needed
   
   const EventsPage: React.FC = () => {
     // State for events and loading status
     const [events, setEvents] = useState<EventType[]>([]);
     const [loading, setLoading] = useState<boolean>(true);
     const [error, setError] = useState<string | null>(null);
     
     // Fetch events on component mount
     useEffect(() => {
       async function fetchEvents() {
         try {
           setLoading(true);
           setError(null);
           
           const eventData = await getEvents();
           
           setEvents(eventData);
         } catch (err) {
           console.error('Error in events fetch:', err);
           setError('Unable to load events. Please try again later.');
         } finally {
           setLoading(false);
         }
       }
       
       fetchEvents();
     }, []);
     
     // Show loading state
     if (loading) {
       return (
         <div className="container-custom py-12">
           <div className="text-center">
             <div className="animate-pulse">
               <div className="h-8 bg-slate-200 rounded w-1/4 mx-auto mb-4"></div>
               <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-12"></div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[1, 2, 3, 4, 5, 6].map(i => (
                   <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                     <div className="h-48 bg-slate-200"></div>
                     <div className="p-6">
                       <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                       <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                       <div className="h-10 bg-slate-200 rounded w-1/3"></div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         </div>
       );
     }
     
     // Show error state
     if (error) {
       return (
         <div className="container-custom py-12">
           <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 text-center">
             <h2 className="text-lg font-bold mb-2">Error Loading Events</h2>
             <p>{error}</p>
             <button 
               className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg"
               onClick={() => window.location.reload()}
             >
               Try Again
             </button>
           </div>
         </div>
       );
     }
     
     // Show events
     return (
       <div className="container-custom py-12">
         <h1 className="text-3xl font-bold text-center mb-2">Upcoming Events</h1>
         <p className="text-center text-slate-600 mb-12">
           Join us for these special Masonic events
         </p>
         
         {events.length === 0 ? (
           <div className="text-center py-8">
             <p className="text-slate-500">No events are currently scheduled.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {events.map(event => (
               // Keep your existing event card rendering logic
               // Be sure property names match your updated EventType interface
               <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                 {/* Event card content */}
               </div>
             ))}
           </div>
         )}
       </div>
     );
   };
   
   export default EventsPage;
   ```

3. Add filtering capability (optional enhancement):
   ```tsx
   // Add these features to the EventsPage if you want to support filtering
   
   // Add import
   import { getEventsByType } from '../lib/api/events';
   
   // Add state for filter
   const [activeFilter, setActiveFilter] = useState<string | null>(null);
   
   // Add filter change handler
   const handleFilterChange = async (type: string | null) => {
     setLoading(true);
     setError(null);
     setActiveFilter(type);
     
     try {
       let eventData;
       if (type) {
         eventData = await getEventsByType(type);
       } else {
         eventData = await getEvents();
       }
       setEvents(eventData);
     } catch (err) {
       console.error('Error filtering events:', err);
       setError('Unable to filter events. Please try again.');
     } finally {
       setLoading(false);
     }
   };
   
   // Add filter UI
   <div className="flex flex-wrap gap-2 justify-center mb-8">
     <button
       className={`px-4 py-2 rounded-full ${!activeFilter ? 
         'bg-primary text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
       onClick={() => handleFilterChange(null)}
     >
       All Events
     </button>
     <button
       className={`px-4 py-2 rounded-full ${activeFilter === 'Ceremony' ? 
         'bg-primary text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
       onClick={() => handleFilterChange('Ceremony')}
     >
       Ceremonies
     </button>
     <button
       className={`px-4 py-2 rounded-full ${activeFilter === 'Social' ? 
         'bg-primary text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
       onClick={() => handleFilterChange('Social')}
     >
       Social Events
     </button>
     {/* Add more filter buttons as needed */}
   </div>
   ```

## Testing Steps

1. Create a test component to verify the API functions:
   ```tsx
   // Create a temporary test component or use the browser console
   
   import React, { useEffect } from 'react';
   import { getEvents, getFeaturedEvents, getEventsByType } from '../lib/api/events';
   
   const TestEventAPI: React.FC = () => {
     useEffect(() => {
       async function testAPI() {
         console.log('Testing event API functions...');
         
         try {
           // Test getEvents
           const allEvents = await getEvents();
           console.log('All events:', allEvents);
           
           // Test getFeaturedEvents
           const featuredEvents = await getFeaturedEvents();
           console.log('Featured events:', featuredEvents);
           
           // Test getEventsByType
           const socialEvents = await getEventsByType('Social');
           console.log('Social events:', socialEvents);
           
           console.log('All API tests completed successfully!');
         } catch (err) {
           console.error('API test error:', err);
         }
       }
       
       testAPI();
     }, []);
     
     return <div>Check console for API test results</div>;
   }
   
   export default TestEventAPI;
   ```

2. Test the updated EventsPage component:
   - Ensure events are properly displayed
   - Check loading state works correctly 
   - Verify error handling for network issues
   - If implemented, test the filtering functionality

3. Verify data formatting:
   - Check that dates are properly formatted (e.g., "Friday, September 12")
   - Ensure times are properly formatted (e.g., "18:00 - 21:00")
   - Verify all event properties are displaying correctly

## Verification Checklist

Before moving to the next step, verify:

- [X] Events are successfully fetched from Supabase
- [X] Data is properly formatted for frontend display
- [X] Loading state shows during data fetching
- [X] Error state shows for fetch failures
- [X] EventsPage displays real events instead of mock data
- [N/A] Optional filtering functionality works correctly (Skipped)
- [X] UI appears consistent with the previous mock-data version
- [X] Console is free of errors or warnings (Related to event fetching/display)

## Common Errors and Solutions

1. **CORS issues**
   - Verify Supabase project settings allow requests from your domain
   - Check that you're not mixing http/https

2. **Empty data array**
   - Check that your events table has data
   - Verify RLS policies allow anonymous access if needed

3. **TypeScript errors**
   - Ensure your formatEventForDisplay function handles all field mappings
   - Check that optional fields are marked with ? in interfaces

4. **UI display issues**
   - Check for null/undefined handling in JSX
   - Ensure date formatting handles all possible date formats

5. **Performance issues**
   - Consider adding pagination for large datasets
   - Add appropriate indexes to your Supabase tables

After completing all verifications, you can remove any temporary test code and proceed to the next integration step.
