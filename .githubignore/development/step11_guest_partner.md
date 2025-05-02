# Step 11: Guest Partner Implementation

## Context for the Agentic AI Software Engineer
After implementing the Guest attendee functionality, we need to implement the Guest Partner feature. Similar to how Masons can bring their partners to events, regular guests may also want to bring their partners. The LodgeTix application allows for registering partners for non-Masonic guests, collecting their information, and maintaining the relationship between guests and their partners. Currently, this functionality uses mock data, and we need to integrate it with the Supabase database.

## Objective
Implement the Guest Partner functionality to allow guests to add their partners to the registration, collect partner information, and store this data in the Supabase database while maintaining the relationship between partners and their associated guests.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated to match the database schema (Step 2)
- Events integration is complete (Steps 3-5)
- Registration type selection is implemented (Step 6)
- Customer profile functionality is implemented (Step 7)
- Mason attendee functionality is implemented (Step 8)
- Mason's Partner functionality is implemented (Step 9)
- Guest attendee functionality is implemented (Step 10)
- Understanding of the database structure for guest partners

## Analysis Steps

1. Examine the Guest Partner form components:
   - Analyze `/src/components/register/GuestPartnerForm.tsx` to understand partner-specific fields
   - Review how the form handles the relationship to a guest
   - Identify required fields such as title, first name, last name, relationship, contact details
   - Note how the component manages contact preferences similarly to Mason partners

2. Analyze the Supabase database structure for guest partners:
   - Identify where guest partner data should be stored (likely in the same "guests" table)
   - Understand how guest partners are related to their primary guests
   - Note any specific fields or flags that identify a guest as a partner
   - Review how contact information is stored and related to primary guests

3. Review the form state management:
   - Examine how guest partners are stored in the `RegisterFormContext`
   - Understand the array structure for tracking multiple guest partners
   - Note how partners are associated with specific guests in the form state
   - Identify any conditional rendering or logic based on partner presence

4. Understand the UI flow for guest partner management:
   - Analyze how partners are added to a guest's registration
   - Review the toggle functionality for "Guest has a partner"
   - Understand how guest partners are displayed in the attendee summary
   - Note any validation specific to guest partner registration

## Implementation Steps

1. Create or update TypeScript interfaces for Guest Partner data:
   - Update types in `/src/shared/types/guest.ts` to include guest partner specifics
   - Define interfaces that represent guest partners in the system
   - Include fields for relationship to the primary guest and contact preferences
   - Ensure proper typing for all fields including optional ones
   - Create specific types for the relationship field if it uses predefined values

2. Implement API functions for guest partner management:
   - Update the file at `/src/lib/api/guests.ts` with partner-specific functions
   - Implement a `getGuestPartnersByGuestId` function that:
     - Takes a guest ID as input
     - Queries the database for partners associated with that guest
     - Returns an array of guest partner records
   - Create a `createGuestPartner` function that:
     - Takes partner form data and a guest ID
     - Creates a record in the appropriate table
     - Sets the relationship to the primary guest
     - Returns the created partner record
   - Add an `updateGuestPartner` function for existing partners
   - Add a `removeGuestPartner` function if partners can be removed
   - Implement proper error handling and typing

3. Update the Guest Partner form components:
   - Modify `GuestPartnerForm.tsx` to connect to Supabase
   - Implement form field validation based on database constraints
   - Add loading states during database operations
   - Ensure relationship selection properly saves to the database
   - Add proper error handling for API calls

4. Implement the relationship management:
   - Update the "Guest has a partner" toggle functionality to create/remove partners
   - Ensure the Guest-Partner relationship is properly established in the database
   - Implement validation to ensure partners are properly associated with their guests
   - Add UI feedback when partners are successfully added or modified

5. Integrate with the registration process:
   - Update the registration flow to include guest partner data
   - Modify the form submission logic to handle partner creation
   - Ensure partners are properly linked to their primary guests
   - Implement proper validation before proceeding to the next step
   - Add summary information about guest partners in the review step

## Testing Steps

1. Test guest partner creation:
   - Register a guest with a partner
   - Fill out all partner-specific fields
   - Submit the form and verify a partner record is created in the database
   - Check that the relationship to the primary guest is correctly established

2. Test multiple partner management:
   - Add multiple guests with partners to a registration
   - Verify each partner's data is correctly saved
   - Test removing partners by toggling the "has partner" option
   - Verify that partners are correctly associated with their respective guests

3. Test form validation:
   - Submit the form with missing required fields
   - Test relationship selection validation
   - Check contact preference validation
   - Verify error messages are displayed appropriately

4. Test contact preference functionality:
   - Test "Contact Directly" option and verify it requires contact information
   - Test other contact preferences and verify the confirmation checkbox
   - Check that contact information is saved correctly based on preference
   - Verify that the UI updates based on the selected preference

5. Test integration with the full registration:
   - Complete a registration with guests and their partners
   - Verify guest partners appear in the attendee summary
   - Check that partners are included in the registration review
   - Verify that ticket selection works correctly for guest partners

## Verification Checklist

Before proceeding to the next step, verify that:

- [ ] Guest partners can be added to guest attendees
- [ ] Partner information is correctly saved to the database
- [ ] The relationship between partners and their primary guests is properly established
- [ ] Contact preference options work correctly
- [ ] Required fields are properly enforced based on selections
- [ ] The "Guest has a partner" toggle works to add/remove partners
- [ ] Multiple guests can each have their own partners
- [ ] Form validation correctly identifies and reports invalid inputs
- [ ] Loading states appear during database operations
- [ ] Error messages are clear and helpful
- [ ] The UI is responsive and works on different screen sizes
- [ ] Guest partners appear correctly in the attendee summary

## Common Errors and Solutions

1. If partner records aren't being created:
   - Check that the guests table has the correct schema to support partners
   - Verify that foreign key constraints are properly set up
   - Ensure RLS policies allow creation of guest partner records
   - Test with specific known IDs to verify relationships

2. If relationships aren't being established:
   - Verify that the relationship field is being saved correctly
   - Check that the guest ID is correctly passed to the creation function
   - Ensure the database has the proper foreign key constraints
   - Test with explicit values to verify the relationship is saved

3. If validation fails:
   - Review the validation logic for partner-specific fields
   - Check for conditional validation based on contact preferences
   - Verify error messages are properly displayed
   - Test with different combinations of fields

4. If contact preferences don't work correctly:
   - Check that the contact preference field is being saved
   - Verify that conditional validation works based on the preference
   - Ensure the UI correctly updates when preferences change
   - Test all available contact preference options

5. If the toggle functionality fails:
   - Review the implementation of the "has partner" toggle
   - Check that adding/removing partners updates the form state
   - Verify that removed partners are properly deleted from the database
   - Test toggling on and off multiple times to ensure consistency

Remember to implement features incrementally and test thoroughly at each step. Start with basic partner creation, then add relationship management, then contact preferences, and finally integration with the broader registration flow.
