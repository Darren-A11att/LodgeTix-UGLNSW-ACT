# Step 4: Implement Single Event Details Page with Supabase

## Context for the Agentic AI Software Engineer
The LodgeTix application currently displays event listings that have been successfully integrated with Supabase. Now you must update the EventDetailsPage component to fetch and display details for individual events from the Supabase database instead of using mock data. This component is critical as it provides comprehensive information about specific events and enables registration.

## Objective
Implement functionality to fetch a single event by its ID from Supabase and update the EventDetailsPage component to display this real data, including related events, multi-day event schedules, and event-specific information.

## Pre-requisites
- The Supabase client is properly configured (from Step 1)
- TypeScript interfaces have been updated to match the database schema (from Step 2)
- The events listing page is already connected to Supabase (from Step 3)
- The existing EventDetailsPage component uses mock data that needs to be replaced

## Analysis Steps

1. Examine the current EventDetailsPage implementation:
   - Locate the EventDetailsPage component in the src/pages directory
   - Analyze how the component is currently structured
   - Identify where and how the event ID is extracted from URL parameters
   - Understand how mock data is currently being used
   - Note any event-specific UI components that will need real data

2. Determine the data requirements for the event details page:
   - Identify all fields needed from the events table
   - Note any related data that might be needed (related events, child events for multi-day events)
   - Check for any derived or formatted data (like Google Calendar links)
   - Map database fields to existing UI components

3. Review the route configuration:
   - Examine how routes are defined in the application
   - Understand the URL pattern for event details (likely /events/:id)
   - Verify that the routing framework properly extracts the event ID parameter

## Implementation Steps

1. Create API functions for fetching single events:
   - Add a getEventById function to src/lib/api/events.ts
   - Implement proper error handling for non-existent events
   - Use the Supabase select method with the eq filter to match event IDs
   - Return formatted event data using the existing formatter utilities
   - Add JSDoc comments to document the function's purpose and parameters

2. Implement functions for fetching related data:
   - Create a getChildEvents function for multi-day events
   - Add a getRelatedEvents function to find events on the same day
   - Ensure all functions use proper error handling and logging
   - Optimize performance by limiting the number of related events returned

3. Update the EventDetailsPage component:
   - Replace the mock data with calls to your new API functions
   - Implement loading, error, and success states
   - Add useEffect hooks to fetch data when the component mounts or the ID changes
   - Include proper type safety for all state variables
   - Ensure null/undefined checks for optional fields

4. Enhance the user experience:
   - Implement a loading state with skeleton UI elements
   - Create a proper error state for non-existent events
   - Add additional features based on database information (e.g., location map using coordinates)
   - Implement "Add to Google Calendar" functionality using event dates and times
   - Update the registration button to pass event information to the registration flow

5. Handle multi-day events:
   - Add conditional rendering for multi-day event schedules
   - Implement navigation between parent and child events
   - Display day-specific information in a clear, organized manner
   - Ensure proper linking between related event days

## Testing Steps

1. Test event details retrieval:
   - Get real event UUIDs from your Supabase database for testing
   - Navigate to event detail pages using these IDs
   - Verify all event information displays correctly
   - Check that dates, times, and prices format properly
   - Test with different types of events (ceremonies, social events, etc.)

2. Test related features:
   - Verify that related events section works correctly
   - Test pagination or limiting of related events if implemented
   - Check that related events exclude the current event
   - Ensure all links to related events function properly

3. Test multi-day event handling:
   - Find a multi-day event in your database
   - Verify the schedule displays correctly
   - Test navigation between parent and child events
   - Check that dates and times are formatted appropriately
   - Verify that the UI clearly shows the event is multi-day

4. Test edge cases:
   - Test with non-existent event IDs to verify error handling
   - Simulate network errors to check error state
   - Test with events missing optional fields
   - Verify responsive design on different screen sizes
   - Test with very long text content to ensure the layout handles it well

5. Verify integration with other features:
   - Test the "Register Now" button functionality
   - Verify that the Google Calendar link works correctly
   - Check that event location information displays properly
   - Test any event-specific content or features

## Verification Checklist

Before proceeding to the next step, verify:

- [ ] Single event details are correctly fetched from Supabase
- [ ] All event information displays properly in the UI
- [ ] Loading states appear during data fetching
- [ ] Error states display for non-existent events
- [ ] Related events appear in the appropriate section
- [ ] Multi-day event schedules render correctly (if applicable)
- [ ] Event type-specific content displays properly
- [ ] The "Register Now" button navigates to the registration page with correct state
- [ ] Google Calendar integration works correctly
- [ ] The UI is responsive and matches the design across all screen sizes
- [ ] Console is free of errors or warnings
- [ ] All links and buttons function as expected
- [ ] The implementation handles null or undefined values gracefully

## Common Errors and Solutions

1. If event details don't display:
   - Check that the event ID is correctly extracted from URL parameters
   - Verify that the Supabase query is using the correct table and field names
   - Confirm that data formatting functions handle the database format correctly

2. If UUID format issues occur:
   - Ensure consistency between URL IDs and database UUIDs
   - Consider adding a slug field to events table for more readable URLs
   - Add validation to ensure ID parameters are in the correct format

3. If related events don't appear:
   - Verify the query excludes the current event ID
   - Check that date filtering is using the correct format
   - Ensure the limit parameter is not set too low

4. If multi-day events don't display correctly:
   - Check the parent-child relationships in the database
   - Verify parent_event_id values are set correctly
   - Ensure the is_multi_day flag is properly set on parent events

5. If dates or times appear incorrectly:
   - Review the date formatting utilities
   - Check for timezone issues when parsing dates
   - Ensure start_time and end_time are properly combined for display

Remember to implement error boundaries to prevent the entire application from crashing if a component fails, and add appropriate loading states to improve the user experience during data fetching operations.
