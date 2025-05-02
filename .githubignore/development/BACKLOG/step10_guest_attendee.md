# Step 10: Guest Attendee Implementation

## Context for the Agentic AI Software Engineer
Having implemented the Mason and Mason's Partner attendee types, we now need to implement the Guest attendee type. Guests are non-Mason attendees who are invited by the person making the registration. Unlike Masons, guests don't have lodge-specific information but still need to have their personal details collected and stored. The LodgeTix application allows for registering multiple guests as part of an event registration.

## Objective
Implement the Guest attendee functionality to allow users to add non-Masonic guests to their registration, collect guest information, and store this data in the Supabase database. This includes creating the necessary API functions, updating the UI components, and ensuring proper data validation and storage.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated to match the database schema (Step 2)
- Events integration is complete (Steps 3-5)
- Registration type selection is implemented (Step 6)
- Customer profile functionality is implemented (Step 7)
- Mason attendee functionality is implemented (Step 8)
- Mason's Partner functionality is implemented (Step 9)
- Understanding of the database structure for guests

## Analysis Steps

1. Examine the Guest form components:
   - Analyze `/src/components/register/GuestForm.tsx` to understand guest-specific fields
   - Identify required fields like title, first name, last name, and contact information
   - Review how guests are added to and removed from the registration
   - Note any differences between guest handling and Mason handling

2. Analyze the Supabase database structure for guests:
   - Confirm that guests are stored in a dedicated table or in a general attendees table
   - Understand how guests are related to the main registration
   - Note any specific fields or flags that identify an attendee as a guest
   - Identify how contact information is stored for guests

3. Review the form state management:
   - Examine how guests are stored in the `RegisterFormContext`
   - Understand the array structure for tracking multiple guests
   - Note how guests are managed separately from Masons and partners
   - Identify conditional rendering or logic for guest management

4. Understand the UI flow for guest management:
   - Analyze how guests are added to a registration
   - Review the "Add Guest" functionality
   - Understand how guests are displayed in the attendee summary
   - Note any validation specific to guest registration

## Implementation Steps

1. Create or update TypeScript interfaces for Guest data:
   - Create or update types in `/src/shared/types/guest.ts`
   - Define interfaces that represent general guests in the system
   - Include fields for contact preferences and other guest-specific information
   - Ensure proper typing for all fields including optional ones
   - Define any enums needed for predefined field values

2. Implement API functions for guest management:
   - Create or update a file at `/src/lib/api/guests.ts`
   - Implement a `getGuestsByRegistrationId` function that:
     - Takes a registration ID as input
     - Queries the database for guests associated with that registration
     - Returns an array of guest records
   - Create a `createGuest` function that:
     - Takes guest form data and a registration ID
     - Creates a record in the guests table
     - Sets the relationship to the registration
     - Returns the created guest record
   - Add an `updateGuest` function for modifying existing guests
   - Implement a `removeGuest` function for removing guests from a registration
   - Add proper error handling and typing for all functions

3. Update the Guest form components:
   - Modify `GuestForm.tsx` to connect to Supabase
   - Implement form field validation based on database constraints
   - Add loading states during database operations
   - Ensure contact preference options work correctly
   - Add proper error handling for API calls

4. Implement guest management functionality:
   - Update the "Add Guest" button to create new guest records
   - Implement the "Remove Guest" functionality to delete records
   - Ensure guests are properly associated with the registration
   - Add validation to prevent submission with incomplete guest information
   - Implement proper UI feedback for guest management actions

5. Integrate with the registration process:
   - Update the registration flow to include guest data
   - Modify the form submission logic to handle guest creation
   - Ensure guests are properly linked to the registration
   - Add summary information about guests in the review step
   - Implement validation before proceeding to the next registration step

## Testing Steps

1. Test guest creation:
   - Add a guest to a registration
   - Fill out all guest-specific fields
   - Submit the form and verify a guest record is created in the database
   - Check that the relationship to the registration is correctly established

2. Test multiple guest management:
   - Add multiple guests to a registration
   - Verify each guest's data is correctly saved
   - Test removing guests from the registration
   - Check that the guests array in the form state updates correctly

3. Test form validation:
   - Submit the form with missing required fields
   - Test contact preference validation
   - Check specific format validations (email, phone, etc.)
   - Verify error messages are displayed appropriately

4. Test contact preference functionality:
   - Test "Contact Directly" option and verify it requires contact information
   - Test other contact preferences and verify the confirmation checkbox
   - Check that contact information is saved correctly based on preference
   - Verify that the UI updates based on the selected preference

5. Test integration with the full registration:
   - Complete a registration with Masons and guests
   - Verify guests appear in the attendee summary
   - Check that guests are included in the registration review
   - Verify that ticket selection works correctly for guests

## Verification Checklist

Before proceeding to the next step, verify that:

- [ ] Guests can be added to a registration
- [ ] Guest information is correctly saved to the database
- [ ] Multiple guests can be added to a single registration
- [ ] Guests can be removed from a registration
- [ ] Contact preference options work correctly
- [ ] Required fields are properly enforced based on selections
- [ ] Form validation correctly identifies and reports invalid inputs
- [ ] Loading states appear during database operations
- [ ] Error messages are clear and helpful
- [ ] The UI is responsive and works on different screen sizes
- [ ] Guests appear correctly in the attendee summary

## Common Errors and Solutions

1. If guest records aren't being created:
   - Check that the guests table has the correct schema
   - Verify that foreign key constraints are properly set up
   - Ensure RLS policies allow creation of guest records
   - Test with specific known IDs to verify relationships

2. If removing guests doesn't work:
   - Verify that the removal function correctly calls the database
   - Check that the form state is properly updated after removal
   - Ensure that the UI reflects the removal of guests
   - Test removing different guests to ensure consistency

3. If validation fails:
   - Review the validation logic for guest-specific fields
   - Check for conditional validation based on contact preferences
   - Verify error messages are properly displayed
   - Test with different combinations of fields

4. If contact preferences don't work correctly:
   - Check that the contact preference field is being saved
   - Verify that conditional validation works based on the preference
   - Ensure the UI correctly updates when preferences change
   - Test all available contact preference options

5. If multiple guest management fails:
   - Verify that the form state correctly manages the guests array
   - Check that each guest has a unique identifier in the array
   - Ensure the database operations handle multiple insertions
   - Test adding, removing, and updating guests in the same session

Remember to implement features incrementally and test thoroughly at each step. Start with basic guest creation, then add multiple guest management, then contact preferences, and finally integration with the broader registration flow.
