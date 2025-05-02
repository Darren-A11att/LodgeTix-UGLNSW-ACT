# Step 5: Implement Multi-Day Events Integration

## Context
We've successfully integrated basic event display with Supabase. Now we need to enhance the functionality to properly handle multi-day events and their daily schedules. The database has a specific structure for multi-day events with parent-child relationships and an event_days table.

## Objective
Implement the functionality to fetch and display multi-day events with their day-by-day schedules, and ensure proper navigation between parent events and their child events.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated to match the database (Step 2)
- Events listing is connected to Supabase (Step 3)
- Single event details page is working (Step 4)
- Understanding of the multi-day event schema in the database

## Analysis Steps

1. First, examine the structure of multi-day events in the database:
   - Analyze how multi-day events are represented in the database schema
   - Look for parent-child relationships between events
   - Find multi-day parent events where `is_multi_day` is true
   - Examine child events that reference the parent via `parent_event_id`
   - Check the `event_days` table structure which contains day-by-day information
   - Understand how dates, times, and day numbers are stored and related

2. Create appropriate TypeScript interfaces for multi-day events:
   - Define an `EventDay` interface that matches the database structure
   - Include fields like id, event_id, date, day_number, and name
   - Create an extended `EventWithDays` interface that includes day and child event collections
   - Ensure proper typing for optional fields with nullable properties

## Implementation Steps

1. Create functions to fetch multi-day event data:
   - Add a `getEventDays` function to fetch the days for a multi-day event
   - Implement ordering by day_number to ensure correct sequence
   - Create a `getMultiDayEvent` function that fetches the complete event structure
   - Include proper error handling for all database operations
   - Implement a function to fetch events for a specific day using day_number
   - Write logic to group child events by their respective days
   - Ensure all dates are properly formatted for comparison
   - Include comprehensive JSDoc comments for all functions

2. Create a dedicated component for multi-day event display:
   - Create a new React component called MultiDayEventView
   - Implement a tabbed interface for navigating between days
   - Use useState to track the active day selection
   - Build proper TypeScript interfaces for component props
   - Create a sub-component for rendering individual day events
   - Handle edge cases like events with no schedule
   - Implement responsive design with proper Tailwind CSS classes
   - Include proper accessibility attributes for interactive elements
   - Use Lucide React icons for visual elements (Calendar, Clock, MapPin)
   - Implement proper link navigation to individual event details

3. Modify the EventDetailsPage to support multi-day events:
   - Update the event state type to support both regular events and multi-day events
   - Create a conditional data fetching flow in useEffect
   - First fetch basic event details to determine if it's a multi-day event
   - For multi-day events, call the specialized getMultiDayEvent function
   - For regular events, maintain the existing data fetching logic
   - Implement proper error handling for all fetch operations
   - Add conditional rendering for the multi-day event schedule
   - Use type checking ('days' in event) to safely render the MultiDayEventView
   - Apply correct TypeScript type assertions where needed

4. Enhance the Events listing to properly indicate multi-day events:
   - Add visual indicators for multi-day events with distinctive styling
   - Use a badge or tag to clearly mark multi-day events
   - Modify the date/time display to show date ranges for multi-day events
   - Format the date range to show start and end dates
   - Maintain the existing design for single-day events
   - Ensure proper conditional rendering based on event type
   - Use Tailwind CSS classes for consistent styling
   - Test with various event types to ensure correct display

## Testing Steps

1. Create a comprehensive test plan for multi-day event functionality:
   - Write a test script to verify all multi-day event API functions
   - Find an existing multi-day event in the database for testing
   - Test the getMultiDayEvent function with a real event ID
   - Verify the structure and completeness of the returned data
   - Test the getEventsForDay function with different day numbers
   - Add detailed console logging for verification
   - Implement proper error handling in the test script
   - Document all test cases and expected results

2. Test the multi-day event display in the UI:
   - Navigate to a multi-day event page
   - Verify that day tabs are displayed correctly
   - Click between days and verify the events change
   - Test navigation to individual event details pages
   - Verify that all event information is correctly displayed

3. Test edge cases:
   - Multi-day events with only one day
   - Days with no events
   - Very long day names
   - Many days in a single event (horizontal scrolling)

## Verification Checklist

Before moving to the next step, verify:

- [ ] Multi-day event data is fetched correctly with all days and child events
- [ ] The tabs for different days are displayed correctly
- [ ] Switching between days shows the correct events
- [ ] Event details within each day are properly formatted
- [ ] Navigation to child event details pages works
- [ ] Event dates and times are formatted correctly
- [ ] Event prices and other details display correctly
- [ ] UI is responsive and works on mobile devices
- [ ] Any empty days or edge cases are handled gracefully

## Common Errors and Solutions

1. **Date comparison issues**
   - Ensure dates are normalized to string format (YYYY-MM-DD) before comparison
   - Account for potential timezone differences in date objects

2. **Missing child events**
   - Verify the parent_event_id values in the database
   - Check the date values match between child events and event_days

3. **UI rendering issues**
   - Ensure conditional rendering covers all possible states
   - Handle null or undefined values gracefully

4. **Performance issues with many events**
   - Consider pagination or lazy loading for large event sets
   - Optimize queries to fetch only needed fields

5. **Horizontal scrolling issues**
   - Add proper CSS for horizontal scrolling on small screens
   - Consider collapsing day names to shorter format on mobile

After all verifications are complete, clean up any temporary test code and commit your changes.
