# Step 8: Mason Attendee Implementation

## Context for the Agentic AI Software Engineer
Now that we've implemented the customer profile functionality, we need to implement the Mason attendee type. In the LodgeTix application, Masons are a special type of attendee with additional attributes such as lodge information, masonic rank, and other order-specific details. The registration process allows for registering multiple Masons, including the primary attendee and additional Mason attendees. Currently, this functionality uses mock data, and we need to integrate it with the Supabase database.

## Objective
Implement the Mason attendee functionality to enable users to register as Masons, select their lodge and rank, provide their masonic information, and store this data in the Supabase database. This includes the primary Mason (the customer themselves) and any additional Masons they wish to register.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated to match the database schema (Step 2)
- Events integration is complete (Steps 3-5)
- Registration type selection is implemented (Step 6)
- Customer profile functionality is implemented (Step 7)
- Understanding of the user_masonic_details, organizations, and masonic_ranks tables

## Analysis Steps

1. Examine the Mason attendee form components:
   - Analyze `/src/components/register/MasonForm.tsx` to understand Mason-specific fields
   - Review `/src/components/register/AttendeeDetails.tsx` to see how Mason forms are managed
   - Identify required fields like title, first name, last name, rank, lodge, etc.
   - Understand how the form component handles various Mason-specific states (e.g., grand rank, past master)

2. Analyze the Supabase database schema for Masonic data:
   - Examine the `user_masonic_details` table structure and relationships
   - Understand how Masons relate to lodges and grand lodges in the `organizations` table
   - Review the `masonic_ranks` and `masonic_orders` tables for rank and order information
   - Note how masonic details connect to the users table via `user_id`

3. Review the form state management for Masons:
   - Look at how Mason attendees are stored in the `RegisterFormContext`
   - Understand the array structure for tracking multiple Masons
   - Identify how the "Primary Mason" is distinguished from additional Masons
   - Note how lodge selection and "same lodge as primary" functionality works

4. Analyze related data needs:
   - Determine how to fetch lodge data for dropdown selection
   - Understand how masonic ranks are structured for selection
   - Review grand officer and past master status handling
   - Identify any dynamic data needs based on masonic order or grand lodge selection

## Implementation Steps

1. Create TypeScript interfaces for Mason data:
   - Create a new file at `/src/shared/types/mason.ts`
   - Define interfaces that match the `user_masonic_details` table structure
   - Create interfaces for lodge selection and masonic ranks
   - Include proper typing for all Mason-specific fields and relationships
   - Ensure the interfaces support the existing form state structure

2. Implement API functions for lodges and ranks:
   - Create a file at `/src/lib/api/lodges.ts` to handle lodge data
   - Implement a `getLodges` function that:
     - Optionally accepts a grand lodge ID parameter
     - Fetches lodges from the organizations table
     - Formats data for dropdown selection
   - Create a file at `/src/lib/api/masonicRanks.ts`
   - Implement functions to fetch available ranks and titles
   - Ensure proper filtering based on masonic order selection
   - Add caching for frequently used data like lodges and ranks

3. Implement Mason profile API functions:
   - Create a file at `/src/lib/api/masons.ts`
   - Implement a `getMasonByUserId` function that fetches masonic details for a user
   - Create a `createMasonProfile` function that:
     - Takes Mason form data and a user ID
     - Inserts a record into the user_masonic_details table
     - Returns the created masonic profile
   - Add an `updateMasonProfile` function for existing profiles
   - Implement proper error handling and typing

4. Update the Mason form components:
   - Modify `MasonForm.tsx` to fetch lodges and ranks from Supabase
   - Add dynamic loading of related data based on selections
   - Implement form field validation using database constraints
   - Add loading states during data fetching operations
   - Ensure proper error handling for API calls

5. Integrate with registration process:
   - Update the registration flow to store Mason IDs
   - Modify the form submission to create/update Mason profiles
   - Handle the case where the primary attendee is a Mason
   - Implement proper validation for Mason-specific fields
   - Ensure relationships between Masons and their lodges are correctly established

6. Implement "Same Lodge as Primary" functionality:
   - Update the lodge selection to handle this special case
   - Ensure the database records correctly reflect the chosen lodge
   - Implement validation that prevents this option for the primary Mason
   - Add UI feedback for this selection

## Testing Steps

1. Test Mason profile creation:
   - Register a primary attendee as a Mason
   - Fill out all Mason-specific fields
   - Submit the form and verify a record is created in the user_masonic_details table
   - Check that relationships to lodges and ranks are correctly established

2. Test lodge selection:
   - Verify that the lodge dropdown populates with data from Supabase
   - Test filtering by grand lodge if implemented
   - Check that selecting a lodge properly updates the form state
   - Test the "Same Lodge as Primary" functionality for additional Masons

3. Test rank selection:
   - Verify that rank options load correctly
   - Test the conditional fields for grand rank holders
   - Check that past master status is properly saved
   - Verify that rank-specific UI elements appear appropriately

4. Test multiple Mason registration:
   - Add multiple Mason attendees to a registration
   - Verify each Mason's data is correctly saved
   - Test removing Masons from the registration
   - Check that the "Primary Mason" is always preserved

5. Test validation:
   - Submit forms with missing required fields
   - Test validation for specific formats (e.g., email, phone)
   - Check that Mason-specific field validation works
   - Verify error messages are displayed appropriately

## Verification Checklist

Before proceeding to the next step, verify that:

- [ ] Mason profiles can be created and stored in the Supabase database
- [ ] Lodge selection correctly fetches and displays lodges from the database
- [ ] Masonic ranks load properly and conditional fields work as expected
- [ ] The "Same Lodge as Primary" functionality works correctly
- [ ] Multiple Masons can be added to a registration
- [ ] Form validation correctly identifies and reports invalid inputs
- [ ] All required fields are properly enforced
- [ ] Loading states appear during data fetching operations
- [ ] Error messages are clear and helpful
- [ ] The UI is responsive and works on different screen sizes
- [ ] Lodge and rank data is correctly associated with Mason profiles

## Common Errors and Solutions

1. If lodge data doesn't load:
   - Check that the organizations table has lodge data
   - Verify that the Supabase query is filtering correctly
   - Ensure proper error handling in the getLodges function
   - Check for appropriate caching to improve performance

2. If Mason profiles aren't being created:
   - Verify that the user_masonic_details table has the correct schema
   - Check that foreign key constraints are properly set up
   - Ensure RLS policies allow creation of masonic details
   - Test with specific known IDs to verify relationships

3. If rank selection doesn't work properly:
   - Check that the masonic_ranks table has the correct data
   - Verify that rank filtering works correctly for different masonic orders
   - Ensure the rank selection component handles null or undefined values
   - Test the conditional logic for grand officers

4. If "Same Lodge as Primary" fails:
   - Review the implementation logic for this feature
   - Check that the form state correctly tracks this selection
   - Verify that database submissions handle this special case
   - Test with different combinations of Masons and lodges

5. If multiple Mason registration fails:
   - Verify that the form state correctly manages the Mason array
   - Check that each Mason has a unique identifier in the array
   - Ensure the database operations handle multiple insertions
   - Test adding, removing, and updating Masons in the same session

Remember to implement features incrementally and test thoroughly at each step. Start with basic profile creation, then add lodge selection, then rank selection, and finally the more complex features like multiple Mason registration and "Same Lodge as Primary" functionality.
