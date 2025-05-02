# Step 9: Mason's Lady Partner Implementation

## Context for the Agentic AI Software Engineer
Now that we have implemented the Mason attendee functionality, we need to add support for Mason's partners (traditionally called "Ladies"). These are special guest types that are associated with a Mason and have their own set of attributes. The database has a 'guests' table that stores this information, with relationships to the 'masons' table.

## Objective
Implement the functionality to allow Masons to add their partners/ladies to their profiles, store this information in the database, and ensure these guests can be included in event registrations.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated (Step 2)
- Authentication is fully implemented (Step 6)
- Customer profile system is working (Step 7)
- Mason attendee functionality is implemented (Step 8)
- The database has a 'guests' table with appropriate schema

## Analysis Steps

1. Examine the guests table structure:
   - Query the database to understand the schema of the guests table
   - Identify all columns, data types, and nullability constraints
   - Note the relationship to masons table (via related_mason_id)
   - Identify the guest_type field and how it's used to differentiate partner types
   - Understand how guest records are associated with event registrations

2. Understand the guest type system:
   - Identify the available guest types in the system
   - Determine how 'partner' type differs from other guest types
   - Understand any specific fields or relationships unique to partners
   - Analyze how the guest_type affects the user interface and registration process

3. Plan the user interface flow:
   - Determine where partner information should be collected (Mason profile form?)
   - Decide if partners should be handled inline or in a separate section
   - Consider how to handle multiple partners if supported
   - Plan for editing, removing, or updating partner information

## Implementation Steps

1. Create TypeScript interfaces for Guest/Partner data:
   - Create a new file at src/shared/types/guest.ts
   - Define a Guest interface that matches the database schema
   - Include all required fields (id, first_name, last_name, etc.)
   - Add specific fields for partner relationship (related_mason_id)
   - Include guest_type field with appropriate type definition
   - Create a GuestFormData interface for form submissions
   - Ensure proper typing for all relationships

2. Implement Guest/Partner API functions:
   - Create a new file at src/lib/api/guests.ts
   - Implement a getGuestsByRelatedMasonId() function that:
     - Takes a mason ID as input
     - Queries the guests table for records with that related_mason_id
     - Filters by guest_type if needed
     - Returns properly typed guest data array
   - Implement a createGuest() function that:
     - Takes guest form data as input
     - Sets the appropriate guest_type (e.g., 'partner')
     - Saves the guest record to the database
     - Returns the created guest data
   - Implement an updateGuest() function that:
     - Takes a guest ID and updated data
     - Updates the existing record in the database
     - Returns the updated guest data
   - Implement a deleteGuest() function if needed
   - Include proper error handling for all API functions

3. Create a Partner form component:
   - Create a new file at src/components/PartnerForm.tsx
   - Design a form with fields for partner information
   - Include fields like first_name, last_name, email, phone, etc.
   - Implement form state management using React hooks
   - Add handlers for form submission
   - Include loading states for async operations
   - Add proper validation for all required fields
   - Style the form to match the application's design system

4. Integrate the Partner form into the Mason profile:
   - Update the Mason profile component to include partner section
   - Add a section titled "Partner Information" or similar
   - Implement conditional rendering to show/hide this section
   - Add a toggle or checkbox to indicate if the Mason has a partner
   - Display the partner form when appropriate
   - Handle loading of existing partner data if available
   - Style the integration to look cohesive with the rest of the profile

5. Implement saving logic:
   - Update the Mason profile submission logic to handle partner data
   - When saving, determine if partner data should be created or updated
   - If the Mason previously had a partner but now doesn't, handle removal
   - Ensure transaction-like behavior (either all data saves or none)
   - Provide appropriate success/error feedback to the user
   - Handle edge cases like partially filled partner information

## Testing Steps

1. Test partner creation:
   - Log in as a Mason who doesn't have a partner yet
   - Navigate to the Mason profile section
   - Enable the partner section
   - Fill out all required partner fields
   - Submit the form and verify success feedback
   - Check the database to confirm the partner record was created
   - Verify the partner is correctly associated with the Mason

2. Test partner updates:
   - Log in as a Mason who already has a partner
   - Navigate to the Mason profile section
   - Verify partner fields are pre-filled with existing data
   - Modify several partner fields
   - Submit the form and verify success feedback
   - Check the database to confirm the changes were saved

3. Test partner removal (if implemented):
   - Log in as a Mason who has a partner
   - Navigate to the Mason profile section
   - Disable the partner section or use remove partner functionality
   - Submit the form and verify success feedback
   - Check the database to confirm the partner relationship was removed

4. Test validation and error handling:
   - Try submitting with missing required partner fields
   - Verify appropriate error messages are displayed
   - Test with invalid data formats (e.g., incorrect email)
   - Simulate network errors and check error handling
   - Check that partial submission doesn't result in incomplete data

## Verification Checklist

Before moving to the next step, verify:

- [ ] Partner data is correctly saved to and retrieved from the database
- [ ] The relationship between Mason and partner records is maintained
- [ ] Forms display and function correctly on different screen sizes
- [ ] Required field validation works as expected
- [ ] Error messages are clear and helpful
- [ ] Success confirmation is provided after operations complete
- [ ] Loading states are shown during asynchronous operations
- [ ] The UI for partner information is intuitive and easy to use
- [ ] The partner section integrates well with the Mason profile
- [ ] No console errors occur during normal operation
- [ ] The code is clean, well-documented, and follows best practices

## Common Errors and Solutions

1. If partner relationship issues occur:
   - Verify that related_mason_id is correctly set when creating partners
   - Check that foreign key constraints are properly set up
   - Ensure the Mason record exists before creating a partner record

2. If form pre-filling doesn't work:
   - Verify the logic for fetching existing partner data
   - Check that the data is properly passed to the form component
   - Ensure form state initialization uses the provided data

3. If saving partner data fails:
   - Check for missing required fields
   - Verify that guest_type is correctly set to 'partner'
   - Look for potential database constraint violations
   - Ensure the current user has permission to create/update the record

4. If partner data doesn't appear in registrations:
   - Check the logic for including partners in event registrations
   - Verify the relationships between guests, masons, and registrations
   - Ensure the UI correctly displays partner options during registration

Remember to implement features incrementally, testing thoroughly at each step. Use console logging strategically to debug issues, but remove debug code before finalizing your implementation.
