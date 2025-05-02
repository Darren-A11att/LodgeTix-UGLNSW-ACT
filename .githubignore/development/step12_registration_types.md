# Step 12: Registration Types Implementation

## Context for the Agentic AI Software Engineer
Now that we've implemented all attendee types (customers, Masons, Mason's partners, guests, and guest partners), we need to implement the registration types functionality. Registration types define the different ticket options available for events, including pricing, eligibility, and features. This is essential for the event registration process and ticket sales.

## Objective
Implement functionality to fetch, display, and select registration types (ticket definitions) for events. This includes creating API functions to interact with the ticket_definitions table in Supabase, creating UI components to display available tickets, and integrating this into the event registration flow.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated (Step 2)
- Event functionality is implemented (Steps 3-5)
- Authentication is fully implemented (Step 6)
- All attendee types are implemented (Steps 7-11)
- The database has a 'ticket_definitions' table with appropriate schema

## Analysis Steps

1. Examine the ticket_definitions table structure:
   - Query the database to understand the schema of the ticket_definitions table
   - Identify all columns, data types, and nullability constraints
   - Note the relationship to events table (via event_id)
   - Understand how pricing, eligibility, and other constraints are stored
   - Identify any related tables that might affect ticket selection

2. Analyze ticket eligibility and restrictions:
   - Determine how eligibility is defined (by attendee type, Mason rank, etc.)
   - Understand any capacity or availability limitations
   - Review how active/inactive tickets are flagged
   - Note how tickets relate to specific event days for multi-day events
   - Consider any special cases like early bird pricing or member discounts

3. Plan the ticket selection user interface:
   - Determine where and how tickets should be presented to users
   - Consider how to display pricing, descriptions, and eligibility
   - Plan the selection mechanism for tickets
   - Consider quantity selection for multiple attendees
   - Plan for showing ticket availability and sold-out status

## Implementation Steps

1. Create TypeScript interfaces for ticket definitions:
   - Create a new file at src/shared/types/ticket.ts
   - Define a TicketDefinition interface that matches the database schema
   - Include all relevant fields:
     - id, name, description, price
     - event_id, package_id (if applicable)
     - eligibility_attendee_types, eligibility_mason_rank
     - is_active, capacity, remaining_capacity
     - valid_from, valid_until (if time-limited)
   - Create additional interfaces as needed for ticket selection and management
   - Ensure proper typing for all fields and relationships

2. Implement Ticket API functions:
   - Create a new file at src/lib/api/tickets.ts
   - Implement a getTicketDefinitionsForEvent() function that:
     - Takes an event ID as input
     - Queries the ticket_definitions table for that event
     - Filters for active tickets only
     - Sorts by price or priority
     - Returns properly typed ticket definition data
   - Add a getTicketDefinitionById() function for fetching specific tickets
   - Implement functions to check eligibility if needed
   - Add functions to check availability and capacity
   - Ensure all functions have proper error handling

3. Create a ticket selection component:
   - Create a new file at src/components/TicketSelector.tsx
   - Design a component that displays available tickets for an event
   - Include price, description, and eligibility information
   - Add selection mechanism (radio buttons or similar)
   - Implement quantity selection if applicable
   - Add visual styling to highlight recommended or featured tickets
   - Include disabled states for unavailable or ineligible tickets
   - Add proper loading and error states

4. Implement eligibility checking logic:
   - Create helper functions to determine if a ticket is eligible for a given attendee
   - Handle different attendee types (Mason, guest, partner)
   - Consider rank-based eligibility for Masons
   - Implement logic for time-limited tickets (early bird, etc.)
   - Ensure clear feedback when a ticket is not eligible

5. Integrate ticket selection into registration flow:
   - Determine where ticket selection occurs in the registration process
   - Update the event registration component to include ticket selection
   - Implement logic to match attendees with eligible tickets
   - Add validation to ensure all attendees have valid tickets
   - Update any price calculations based on ticket selection
   - Ensure the registration summary shows selected tickets

6. Implement availability and capacity tracking:
   - Add logic to check if tickets are still available
   - Handle sold-out tickets appropriately
   - Consider implementing real-time availability updates if possible
   - Add appropriate messaging for limited availability
   - Implement fallback options when preferred tickets are unavailable

## Testing Steps

1. Test ticket retrieval:
   - Set up test tickets in the database with various properties
   - Use the API functions to fetch tickets for a specific event
   - Verify all ticket properties are correctly retrieved
   - Check that sorting and filtering work as expected
   - Test with both single-day and multi-day events

2. Test ticket display:
   - Render the ticket selector component with various ticket configurations
   - Verify that tickets display correctly with all relevant information
   - Check that prices, descriptions, and eligibility are clearly shown
   - Test responsive display on different screen sizes
   - Verify that loading and error states work correctly

3. Test eligibility logic:
   - Create test scenarios with different attendee types
   - Verify that tickets only appear as available for eligible attendees
   - Test Mason rank-based eligibility if implemented
   - Check that time-limited tickets are correctly controlled
   - Test edge cases and combinations of eligibility criteria

4. Test ticket selection:
   - Select different tickets for various attendees
   - Verify that the selection is correctly captured in state
   - Test quantity selection if implemented
   - Verify that the UI updates appropriately when selections change
   - Test validation for required ticket selection

5. Test integration with registration:
   - Walk through the complete registration process
   - Add different types of attendees and select tickets
   - Verify that pricing is correctly calculated
   - Check that registration summary accurately reflects selections
   - Complete test registrations and verify data is correctly saved

## Verification Checklist

Before moving to the next step, verify:

- [ ] Ticket definitions are correctly retrieved from the database
- [ ] The ticket selector component displays all relevant information
- [ ] Prices and descriptions are clearly presented to users
- [ ] Eligibility rules are correctly applied for different attendee types
- [ ] The UI clearly indicates which tickets are available and eligible
- [ ] Ticket selection works smoothly and intuitively
- [ ] Quantity selection functions correctly if implemented
- [ ] The registration summary accurately reflects ticket selections
- [ ] Sold-out or unavailable tickets are properly handled
- [ ] The integration with the registration flow is seamless
- [ ] Error handling provides clear feedback to users
- [ ] The code is clean, well-documented, and follows best practices

## Common Errors and Solutions

1. If tickets don't display correctly:
   - Verify the query to the ticket_definitions table
   - Check that is_active filtering is working correctly
   - Ensure the component correctly processes and displays the data

2. If eligibility rules don't work:
   - Review the implementation of eligibility checking logic
   - Verify that attendee types are correctly identified
   - Check that eligibility fields in the database are properly formatted

3. If ticket selection fails:
   - Debug the state management for ticket selection
   - Verify that event handlers are correctly attached and functioning
   - Check that selected tickets are properly stored and retrieved

4. If pricing calculations are incorrect:
   - Review the logic for calculating total prices
   - Verify that quantity selection is correctly factored in
   - Check that special prices or discounts are properly applied

5. If capacity tracking has issues:
   - Verify that remaining capacity is correctly checked
   - Implement proper error handling for capacity-related errors
   - Consider adding real-time updates for highly contested tickets

Remember to implement features incrementally, testing thoroughly at each step. Use console logging strategically to debug issues, but remove debug code before finalizing the implementation. Consider the user experience throughout, ensuring that ticket selection is intuitive and frustration-free.
