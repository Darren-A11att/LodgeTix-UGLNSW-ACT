# Step 8: Mason Attendee Implementation

## Context for the Agentic AI Software Engineer
After implementing the basic customer profile functionality, we now need to extend the system to handle Mason attendees specifically. Masons are a special type of customer with additional attributes such as lodge information and masonic rank. The database has a dedicated 'masons' table that stores this information, with a relationship to the 'customers' table.

## Objective
Implement the Mason attendee functionality to allow users to identify themselves as Masons, select their lodge, provide their masonic information, and store this data in the Supabase database.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated (Step 2)
- Authentication is fully implemented (Step 6)
- Customer profile system is working (Step 7)
- The database has 'masons' and 'lodges' tables with appropriate schema

## Analysis Steps

1. Examine the masons table structure:
   - Query the database to understand the schema of the masons table
   - Identify all columns, data types, and nullability constraints
   - Note the relationship between masons and customers tables (via customer_id)
   - Note the relationship between masons and lodges tables (via lodge_id)
   - Document the complete data model for Mason attendees

2. Analyze the lodges table structure:
   - Query the database to understand the schema of the lodges table
   - Identify how lodges are organized (name, number, grand lodge)
   - Determine how to effectively display lodge information to users
   - Understand how lodges relate to grand lodges if applicable

3. Understand the existing UI flow:
   - Examine where and how Mason information should be collected
   - Identify UI components that need to be created or modified
   - Plan the form structure and field validation requirements
   - Consider the user experience for selecting a lodge

## Implementation Steps

1. Create TypeScript interfaces for Mason data:
   - Create a new file at src/shared/types/mason.ts
   - Define a Mason interface that matches the database schema
   - Include all required fields (id, customer_id, lodge_id, etc.)
   - Add optional fields with proper TypeScript optional notation
   - Create a MasonFormData interface for form submissions
   - Define a Lodge interface to represent lodge data
   - Ensure all relationships between interfaces are properly typed

2. Implement Lodge API functions:
   - Create a new file at src/lib/api/lodges.ts
   - Implement a getLodges() function that:
     - Fetches all available lodges from the database
     - Optionally filters by grand lodge if provided
     - Sorts lodges by name or number for easy selection
     - Returns properly typed lodge data
   - Consider adding a searchLodges() function for easier lodge finding
   - Ensure proper error handling for all API calls

3. Implement Mason API functions:
   - Create a new file at src/lib/api/masons.ts
   - Implement a getMasonByCustomerId() function that:
     - Takes a customer ID as input
     - Queries the masons table for records with that customer ID
     - Includes lodge information in the query using Supabase's join capabilities
     - Returns the mason data or null if not found
   - Implement a createOrUpdateMason() function that:
     - Takes mason form data as input
     - Checks if a mason record already exists for this customer
     - Creates a new record or updates an existing one as appropriate
     - Returns the created/updated mason data
     - Includes proper error handling and validation

4. Create a Mason profile form component:
   - Create a new file at src/components/MasonProfileForm.tsx
   - Design a form with fields for all mason data
   - Add a lodge selector with search/filter capabilities
   - Implement form state management using React hooks
   - Create handlers for form submission
   - Include loading states for async operations
   - Add proper validation for all required fields
   - Ensure the form can be pre-filled with existing data

5. Integrate the Mason profile into the user interface:
   - Determine the best location to include Mason information
   - Options include:
     - Add a section to the existing profile page
     - Create a separate "Masonic Information" page
     - Add it to the registration flow as a step
   - Implement conditional rendering based on whether the user identifies as a Mason
   - Create a clean and intuitive interface for entering Mason data
   - Ensure smooth navigation between regular profile and Mason profile sections

6. Implement lodge selection UI:
   - Create a component for selecting a lodge
   - Consider using a searchable dropdown or autocomplete field
   - Format lodge display to show name, number, and location
   - Sort lodges alphabetically for easy finding
   - Group lodges by grand lodge if applicable
   - Handle the case where a user's lodge is not in the list

## Testing Steps

1. Test Mason profile creation:
   - Log in with a user that has a customer profile but no Mason profile
   - Navigate to the Mason profile section
   - Fill out all required fields
   - Select a lodge from the dropdown
   - Submit the form and verify success feedback
   - Check the database to confirm the record was created correctly

2. Test Mason profile updates:
   - Log in with a user that has an existing Mason profile
   - Navigate to the Mason profile section
   - Verify the form is pre-filled with existing data
   - Modify several fields including changing the lodge
   - Submit the form and verify success feedback
   - Check the database to confirm the changes were saved

3. Test lodge selection:
   - Verify that the lodge dropdown loads all lodges
   - Test search/filter functionality if implemented
   - Ensure the lodges are displayed in a user-friendly format
   - Check that selecting a lodge properly captures the lodge_id
   - Test edge cases like very long lodge names

4. Test validation and error handling:
   - Try submitting with missing required fields
   - Attempt to save without selecting a lodge
   - Verify appropriate error messages are displayed
   - Simulate network errors and check error handling
   - Test with invalid data formats if applicable

## Verification Checklist

Before moving to the next step, verify:

- [ ] Mason profile data is correctly saved to and retrieved from the database
- [ ] The relationship between customer and Mason records is maintained
- [ ] Lodge selection works correctly and saves the proper lodge_id
- [ ] Forms display and function correctly on different screen sizes
- [ ] Required field validation works as expected
- [ ] Error messages are clear and helpful
- [ ] Success confirmation is provided after operations complete
- [ ] Loading states are shown during asynchronous operations
- [ ] The UI follows the application's design system
- [ ] No console errors occur during normal operation
- [ ] The code is clean, well-documented, and follows best practices

## Common Errors and Solutions

1. If you encounter relation issues between tables:
   - Verify that foreign key constraints are properly set up
   - Ensure customer_id values exist in the customers table
   - Check that lodge_id values exist in the lodges table

2. If lodge data doesn't load correctly:
   - Check the query for loading lodges
   - Verify the lodge table has data
   - Ensure the sorting and filtering logic works as expected

3. If form pre-filling doesn't work:
   - Verify the logic for fetching existing Mason data
   - Check that the data is properly passed to the form component
   - Ensure form state initialization uses the provided data

4. If saving Mason data fails:
   - Check for missing required fields
   - Verify that the current user is authenticated
   - Check that the customer record exists before creating a Mason record
   - Look for potential database constraint violations

Remember to use console.log statements strategically to debug issues, but remove them before completing the implementation. Make incremental changes and test thoroughly before proceeding to the next step.
