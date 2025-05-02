# Step 14: Ticket Selection and Management

## Context for the Agentic AI Software Engineer

The LodgeTix system requires functionality to fetch and display ticket types from Supabase during the event registration process. Currently, the system has hard-coded ticket data in the front-end (in `src/components/register/TicketSelection.tsx`), and we need to replace this with dynamic ticket data from the database.

Based on analysis of the codebase and database schema, the system architecture follows a pattern where:

1. API functions are stored in `/src/lib/api` directory
2. Tickets are defined in the `ticket_definitions` table with links to either `events` or `packages`
3. The `attendee_ticket_assignments` table tracks which attendees have been assigned which tickets
4. The existing `TicketSelection.tsx` component already has a structure to render ticket options, but needs integration with real data

The `ticket_definitions` table includes the following important fields:
- `id`: UUID primary key
- `name`: The ticket name
- `price`: The ticket price
- `description`: Description of what's included
- `eligibility_attendee_types`: Array of attendee types this ticket is valid for
- `eligibility_mason_rank`: Specific mason ranks this ticket is valid for
- `is_active`: Boolean indicating if the ticket is currently available
- `event_id`: Foreign key to the specific event this ticket is for (if any)
- `package_id`: Foreign key to the package this ticket is for (if any)

## Objective

Implement a comprehensive ticket selection and management system that:

1. Creates API functions to fetch ticket types from Supabase with proper filtering
2. Updates the UI to render dynamic ticket data with proper pricing
3. Implements attendee-specific ticket eligibility
4. Provides ticket selection and quantity management functionality
5. Integrates with the existing form state management

## Pre-requisites

- Completed Step 13: Attendee Details Management
- Understanding of the Supabase data structure, especially the `ticket_definitions` and related tables
- Familiarity with the current ticket selection UI implementation
- Knowledge of React state management patterns used in the project

## Analysis Steps

1. Review the `ticket_definitions` table structure in Supabase:
   - `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/shared/types/supabase.ts` for type definitions
   - `SELECT * FROM ticket_definitions LIMIT 5` to understand actual data

2. Examine current ticket selection UI implementation:
   - `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/components/register/TicketSelection.tsx`
   - `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/components/register/ticket/` for subcomponents

3. Understand ticket data types as defined in:
   - `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/shared/types/register.ts`

4. Analyze existing API pattern in:
   - `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/lib/api/events.ts`

5. Review state management in:
   - `/Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src/context/RegistrationContext.tsx`

## Implementation Steps

1. Create a new file `/src/lib/api/tickets.ts` for ticket API functions:

   ```typescript
   // Define the fetchTicketsForEvent function to get all active tickets for an event
   export async function fetchTicketsForEvent(eventId: string) {
     // Query the ticket_definitions table for active tickets matching the event_id
     // Include sorting by price and active status filtering
   }

   // Define the fetchPackageTickets function to get all package tickets
   export async function fetchPackageTickets(eventId: string) {
     // Query the ticket_definitions table for packages associated with the parent event
   }

   // Define a function to fetch tickets based on attendee eligibility
   export async function fetchEligibleTicketsForAttendee(
     eventId: string, 
     attendeeType: string,
     masonRank?: string
   ) {
     // Query with filters for both attendee type and mason rank if applicable
   }
   ```

2. Update `/src/components/register/TicketSelection.tsx` to use the new API functions:

   - Replace hardcoded `availableTickets` with state that loads data from the API
   - Add loading state handling for API requests
   - Implement error handling for failed API requests
   - Connect the API call to the currently selected event

3. Enhance ticket filtering based on attendee type:

   - Update the logic in `getEligibleEventsForAttendee` function to use the database-driven eligibility
   - Modify the UI to only show tickets that match the eligibility criteria for each attendee

4. Implement price calculations from actual ticket data:

   - Update the `getTicketPriceForAttendee` function to use the price from the database
   - Ensure proper formatting of prices with proper currency handling

5. Add caching of ticket data to improve performance:

   - Store fetched tickets in context or local state to avoid repeated API calls
   - Implement refresh mechanism when event selection changes

## Testing Steps

1. Test the API functions in isolation:
   - Verify `fetchTicketsForEvent` returns correct data for different events
   - Check that eligibility filtering works correctly
   - Confirm sorting by price works as expected

2. Test the UI integration:
   - Ensure ticket options render correctly with proper prices
   - Verify loading states display appropriately
   - Check error handling works when API fails

3. Test eligibility filtering:
   - Create different attendee types and verify only eligible tickets appear
   - Test with different mason ranks to ensure rank-specific tickets are filtered correctly

4. Test end-to-end flow:
   - Complete attendee details step
   - Navigate to ticket selection
   - Verify correct tickets load for the event
   - Select tickets for different attendees
   - Confirm state updates correctly
   - Navigate to next step successfully

## Verification Checklist

- [ ] API functions correctly fetch tickets from Supabase
- [ ] Tickets are filtered by active status
- [ ] Tickets are sorted by price
- [ ] UI displays accurate ticket information with proper formatting
- [ ] Loading states and error handling are implemented
- [ ] Attendee-specific eligibility filtering works correctly
- [ ] Uniform ticketing mode applies the same ticket to all attendees
- [ ] Individual ticketing mode allows different tickets per attendee
- [ ] Form validation prevents proceeding without selecting tickets
- [ ] Next/previous navigation works correctly with selected tickets
- [ ] Performance is acceptable with no unnecessary API calls

## Common Errors and Solutions

1. Missing or undefined ticket data in UI
   - Check API response structure matches component expectations
   - Verify state updates correctly after API call resolves
   - Add default empty array initialization for ticket state

2. Eligibility filtering not working correctly
   - Ensure `eligibility_attendee_types` array includes expected values
   - Check case sensitivity in string comparisons
   - Log filter criteria and results to pinpoint the issue

3. Pricing calculation issues
   - Verify ticket price data type (should be numeric)
   - Ensure proper rounding and formatting of currency values
   - Check for null or undefined prices and provide fallbacks

4. Performance issues with multiple attendees
   - Implement memoization for expensive calculations
   - Use context for sharing ticket data across components
   - Batch state updates to reduce re-renders

5. Navigation issues after ticket selection
   - Ensure form state correctly captures all selected tickets
   - Check validation logic for completeness
   - Verify state persistence between steps
