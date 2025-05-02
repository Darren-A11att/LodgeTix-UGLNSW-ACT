# Step 9: Mason's Lady Partner Implementation

## Context for the Agentic AI Software Engineer
After implementing the Mason attendee functionality, we now need to implement the Mason's Lady Partner functionality. In Masonic events, Masons often attend with their partners (traditionally called "Ladies"). These attendees have their own set of profile information and are associated with a specific Mason. The LodgeTix application needs to support registering these partners, collecting their information, and linking them to their respective Masons.

## Objective
Implement the Mason's Lady Partner functionality to allow Masons to add their partners to their registration, collect partner information, and store this data in the Supabase database while maintaining the relationship between partners and Masons.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated to match the database schema (Step 2)
- Events integration is complete (Steps 3-5)
- Registration type selection is implemented (Step 6)
- Customer profile functionality is implemented (Step 7)
- Mason attendee functionality is implemented (Step 8)
- Understanding of the database structure for guests and their relationships

## Analysis Steps

1. Examine the Lady Partner form components:
   - Analyze `/src/components/register/LadyPartnerForm.tsx` to understand partner-specific fields
   - Review how the form handles the relationship to a Mason
   - Identify required fields such as title, first name, last name, relationship, contact details
   - Note how the component manages contact preferences

2. Analyze the Supabase database structure for guests:
   - Identify where lady partner data should be stored (likely in a "guests" table)
   - Understand how guests are related to Masons in the database
   - Note any specific fields or flags that identify a guest as a lady partner
   - Review how contact information is stored and related to primary attendees

3. Review the form state management:
   - Examine how lady partners are stored in the `RegisterFormContext`
   - Understand the array structure for tracking multiple partners
   - Note how partners are associated with specific Masons in the form state
   - Identify any conditional rendering or logic based on partner presence

4. Understand the UI flow for partner management:
   - Analyze how partners are added to a Mason's registration
   - Review the toggle functionality for "Mason has a partner"
   - Understand how partners are displayed in the attendee summary
   - Note any validation specific to partner registration

## Implementation Steps

1. Create TypeScript interfaces for Lady Partner data:
   - Create or update types in a file like `/src/shared/types/guest.ts`
   - Define interfaces that represent lady partners in the system
   - Include fields for relationship to Mason, contact preferences, etc.
   - Ensure proper typing for all fields including optional ones
   - Create specific types for the relationship field if it uses predefined values

2. Implement API functions for lady partner management:
   - Create or update a file at `/src/lib/api/guests.ts`
   - Implement a `getLadyPartnersByMasonId` function that:
     - Takes a Mason ID as input
     - Queries the database for partners associated with that Mason
     - Returns an array of lady partner records
   - Create a `createLadyPartner` function that:
     - Takes partner form data and a Mason ID
     - Creates a record in the appropriate table
     - Sets the relationship to the Mason
     - Returns the created partner record
   - Add an `updateLadyPartner` function for existing partners
   - Add a `removeLadyPartner` function if partners can be removed
   - Implement proper error handling and typing

3. Update the Lady Partner form components:
   - Modify `LadyPartnerForm.tsx` to connect to Supabase
   - Implement form field validation based on database constraints
   - Add loading states during database operations
   - Ensure relationship selection properly saves to the database
   - Add proper error handling for API calls

4. Implement the relationship management:
   - Update the "Mason has a partner" toggle functionality to create/remove partners
   - Ensure the Mason-Partner relationship is properly established in the database
   - Implement validation to ensure partners are properly associated with Masons
   - Add UI feedback when partners are successfully added or modified

5. Integrate with the registration process:
   - Update the registration flow to include lady partner data
   - Modify the form submission logic to handle partner creation
   - Ensure partners are properly linked to their Masons
   - Implement proper validation before proceeding to the next step
   - Add summary information about partners in the review step

## Testing Steps

1. Test lady partner creation:
   - Register a Mason with a partner
   - Fill out all partner-specific fields
   - Submit the form and verify a partner record is created in the database
   - Check that the relationship to the Mason is correctly established

2. Test multiple partner management:
   - Add multiple Masons with partners to a registration
   - Verify each partner's data is correctly saved
   - Test removing partners by toggling the "has partner" option
   - Verify that partners are correctly associated with their respective Masons

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
   - Complete a registration with Masons and their partners
   - Verify partners appear in the attendee summary
   - Check that partners are included in the registration review
   - Verify that ticket selection works correctly for partners

## Verification Checklist

Before proceeding to the next step, verify that:

- [ ] Lady partners can be added to Mason attendees
- [ ] Partner information is correctly saved to the database
- [ ] The relationship between partners and Masons is properly established
- [ ] Contact preference options work correctly
- [ ] Required fields are properly enforced based on selections
- [ ] The "Mason has a partner" toggle works to add/remove partners
- [ ] Multiple Masons can each have their own partners
- [ ] Form validation correctly identifies and reports invalid inputs
- [ ] Loading states appear during database operations
- [ ] Error messages are clear and helpful
- [ ] The UI is responsive and works on different screen sizes
- [ ] Partners appear correctly in the attendee summary

## Common Errors and Solutions

1. If partner records aren't being created:
   - Check that the guests table (or equivalent) has the correct schema
   - Verify that foreign key constraints are properly set up
   - Ensure RLS policies allow creation of guest records
   - Test with specific known IDs to verify relationships

2. If relationships aren't being established:
   - Verify that the relationship field is being saved correctly
   - Check that the Mason ID is correctly passed to the creation function
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
