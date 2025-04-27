# Step 14: Ticket Definitions Implementation

## Context for the Agentic AI Software Engineer
After implementing the attendee types and authentication functionality, we now need to integrate the ticket definitions with Supabase. Ticket definitions represent the different types of tickets available for events, including their prices, eligibility criteria, and benefits. In the LodgeTix application, users select tickets for each attendee during the registration process. Currently, the ticket data is hardcoded, but we need to fetch it from the Supabase database and incorporate it into the ticket selection step of the registration flow.

## Objective
Implement the ticket definitions functionality by connecting to Supabase, fetching ticket types for events, displaying them to users, and enabling selection during registration. This involves creating the necessary API functions, updating the UI components, and ensuring proper validation and storage of ticket selections.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated to match the database schema (Step 2)
- Events integration is complete (Steps 3-5)
- Registration type selection is implemented (Step 6)
- All attendee types are implemented (Steps 7-11)
- Authentication functionality is implemented (Steps 12-13)
- Understanding of the tickets table in the Supabase database

## Analysis Steps

1. Examine the current ticket selection implementation:
   - Analyze `/src/components/register/TicketSelection.tsx` to understand the current structure
   - Identify how tickets are currently defined and displayed
   - Review how tickets are selected for different attendee types
   - Note the "uniform ticketing" functionality that applies the same ticket to all attendees

2. Analyze the Supabase database structure for tickets:
   - Review the `tickets` table schema in the database
   - Understand how tickets relate to events (`eventid` field)
   - Note fields like name, description, price, tickettype, and quantity
   - Identify any additional ticket-related tables (sub-events, packages, etc.)

3. Review the form state management for tickets:
   - Examine how selected tickets are stored in the `RegisterFormContext`
   - Understand how tickets are assigned to different attendee types
   - Note any validation rules for ticket selection
   - Identify how ticket pricing affects the overall registration total

4. Analyze ticket eligibility and constraints:
   - Understand how ticket availability is determined
   - Review any time-based constraints (availablefrom/availableuntil)
   - Identify capacity limitations and quantity tracking
   - Note any eligibility rules based on attendee type

## Implementation Steps

1. Create TypeScript interfaces for ticket definitions:
   - Create or update `/src/shared/types/ticket.ts`
   - Define interfaces that match the Supabase tickets table
   - Include fields for id, eventid, name, description, price, etc.
   - Create additional interfaces for ticket selection and assignment
   - Ensure proper typing for all fields including optional ones

2. Implement API functions for ticket management:
   - Create a file at `/src/lib/api/tickets.ts`
   - Implement a `getTicketsForEvent` function that:
     - Takes an event ID as input
     - Fetches tickets associated with that event
     - Filters for active tickets if needed
     - Returns properly formatted ticket data
   - Add a `getTicketById` function for fetching individual tickets
   - Implement functions to check ticket availability
   - Add proper error handling and typing

3. Update the ticket selection component:
   - Modify `TicketSelection.tsx` to fetch tickets from Supabase
   - Replace hardcoded ticket data with dynamic data
   - Implement loading states during data fetching
   - Add error handling for failed API calls
   - Ensure the UI correctly displays ticket information

4. Implement ticket eligibility and filtering:
   - Add logic to filter tickets based on attendee types
   - Implement availability checking based on dates and capacity
   - Add UI indicators for ticket eligibility
   - Ensure users can only select appropriate tickets for each attendee
   - Implement sorting or categorization of tickets

5. Update uniform ticketing functionality:
   - Modify the "apply to all attendees" feature to work with Supabase tickets
   - Ensure it respects eligibility rules
   - Update the UI to reflect when a uniform ticket is selected
   - Implement validation to prevent invalid uniform ticket assignments

6. Integrate with the registration process:
   - Update the registration flow to include Supabase ticket data
   - Ensure selected tickets are properly stored in the form state
   - Add ticket information to the registration review step
   - Implement validation to require ticket selection before proceeding
   - Update pricing calculations based on selected tickets

## Testing Steps

1. Test ticket fetching:
   - Navigate to the ticket selection step for different events
   - Verify that tickets are fetched correctly from Supabase
   - Check that loading states appear during data fetching
   - Test with events that have different ticket types
   - Verify error handling for API failures

2. Test ticket display:
   - Check that all ticket information is displayed correctly
   - Verify that prices are formatted properly
   - Ensure descriptions and benefits are shown
   - Test with different screen sizes to verify responsive design
   - Check accessibility for ticket selection

3. Test ticket selection:
   - Select different tickets for various attendee types
   - Verify the selection is saved in the form state
   - Test changing selections and ensure the state updates
   - Check that pricing calculations update correctly
   - Verify validation for required ticket selection

4. Test uniform ticketing:
   - Use the "apply to all attendees" feature
   - Verify that all eligible attendees receive the selected ticket
   - Test with tickets that have eligibility restrictions
   - Ensure the UI updates to reflect uniform selection
   - Verify that individual selections can be made after uniform assignment

5. Test integration with registration flow:
   - Complete a full registration with different ticket selections
   - Verify tickets appear correctly in the review step
   - Check that ticket data is included in the final registration
   - Test validation that prevents proceeding without tickets
   - Verify total price calculations based on ticket selections

## Verification Checklist

Before proceeding to the next step, verify that:

- [ ] Tickets are correctly fetched from Supabase for different events
- [ ] Ticket information is properly displayed in the UI
- [ ] Users can select tickets for different attendee types
- [ ] The "uniform ticketing" functionality works correctly
- [ ] Ticket eligibility rules are properly enforced
- [ ] Price calculations are accurate based on selected tickets
- [ ] Loading states appear during data fetching
- [ ] Error handling provides clear feedback for API failures
- [ ] Validation prevents proceeding without ticket selection
- [ ] Ticket data is properly included in the registration review
- [ ] The UI is responsive and works on different screen sizes

## Common Errors and Solutions

1. If tickets don't load:
   - Check that the Supabase client is properly initialized
   - Verify that the event ID is correctly passed to the query
   - Ensure the tickets table has data for the selected event
   - Check for RLS policies that might restrict access to ticket data

2. If ticket selection doesn't save:
   - Verify that the form state update function is called correctly
   - Check that the selected ticket ID is properly stored
   - Ensure the UI reflects the selected state
   - Test with explicit ticket IDs to verify functionality

3. If uniform ticketing doesn't work:
   - Review the implementation of the "apply to all" function
   - Check that it correctly identifies eligible attendees
   - Ensure the form state is updated for all attendees
   - Verify the UI reflects the uniform selection

4. If ticket eligibility isn't enforced:
   - Check that the eligibility criteria are correctly implemented
   - Verify that attendee types are properly matched with eligible tickets
   - Ensure availability dates and quantities are checked
   - Test with edge cases to verify all rules are applied

5. If pricing calculations are incorrect:
   - Verify that ticket prices are correctly retrieved from the database
   - Check the logic that calculates the total based on selections
   - Ensure price formatting is consistent throughout the application
   - Test with different combinations of tickets and attendees

Remember to implement features incrementally and test thoroughly at each step. Start with basic ticket fetching, then add selection functionality, then implement eligibility rules, and finally integrate with the broader registration flow.
