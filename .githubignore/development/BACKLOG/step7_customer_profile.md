# Step 7: Customer Profile Implementation

## Context for the Agentic AI Software Engineer
After implementing the registration type selection, we now need to implement the customer profile functionality. In the LodgeTix application, a customer profile represents the basic information about the person making the registration. This profile is essential for tracking registrations, managing attendees, and handling billing information. Currently, the application uses mock data for customer profiles, but we need to integrate it with the Supabase database.

## Objective
Implement the customer profile functionality by connecting to Supabase, including the ability to create, retrieve, and update customer profiles. This will serve as the foundation for the attendee registration system and will be linked to the user's authentication data when available.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated to match the database schema (Step 2)
- Events integration is complete (Steps 3-5)
- Registration type selection is implemented (Step 6)
- Understanding of the users and registrations tables in the Supabase database

## Analysis Steps

1. Examine the current customer/user data model:
   - Analyze the `users` table in the Supabase database to understand available fields
   - Identify how customer profiles relate to authentication users (via `id` field)
   - Understand the relationship between users and registrations (via `userid` field in registrations)
   - Note essential fields like firstname, lastname, email, and roles

2. Review attendee management forms:
   - Examine `/src/components/register/AttendeeDetails.tsx` to understand the form structure
   - Look at associated components like `/src/components/register/MasonForm.tsx` for primary attendee fields
   - Understand how the primary attendee's information is collected and managed
   - Identify which fields from the attendee forms map to the customer profile

3. Analyze the form state management:
   - Review the `RegisterFormContext.tsx` and `useRegisterForm.tsx` hook
   - Understand how form data is structured and managed across registration steps
   - Identify how customer profile data is stored in the current form state
   - Note the relationship between customer profiles and other attendee types

4. Understand conditional authentication flow:
   - Analyze how the application handles existing users vs. new users
   - Identify where email detection and authentication should occur
   - Understand how to handle profile creation for both authenticated and unauthenticated users
   - Determine how to link registrations to users when authentication happens later in the flow

## Implementation Steps

1. Create TypeScript interfaces for customer profiles:
   - Create a new file at `/src/shared/types/customer.ts`
   - Define a `CustomerProfile` interface that maps to the Supabase `users` table
   - Include fields for id, firstname, lastname, email, role, ismason, etc.
   - Create a `CustomerFormData` interface for handling form submissions
   - Ensure proper typing for all fields including optional ones

2. Implement API functions for customer profile management:
   - Create a new file at `/src/lib/api/customers.ts`
   - Implement a `getCustomerByEmail` function that:
     - Takes an email address as input
     - Queries the users table for matching records
     - Returns user data if found, null otherwise
   - Implement a `createCustomer` function that:
     - Takes customer form data as input
     - Creates a new record in the users table
     - Returns the created customer profile
   - Implement an `updateCustomer` function for existing users
   - Add proper error handling and TypeScript typing for all functions

3. Update the form components to handle customer profile data:
   - Modify the `AttendeeDetails.tsx` component to connect to Supabase
   - Add email validation and checking for existing users
   - Implement conditional rendering for new vs. existing customers
   - Add proper loading states during database operations
   - Ensure form validation works correctly for all required fields

4. Implement customer detection and linking:
   - Add logic to check if an email belongs to an existing user
   - Create a mechanism to prompt for authentication when an existing email is detected
   - Implement a way to link an anonymous registration to a user account later
   - Ensure proper handling of role-specific fields (e.g., for Masons)

5. Integrate with the registration process:
   - Update the `RegisterFormContext` to store the customer profile ID
   - Modify the form submission logic to create/update customer profiles
   - Ensure the customer profile is properly linked to the registration record
   - Add validation to prevent proceeding without complete customer information

## Testing Steps

1. Test customer profile creation:
   - Fill out the attendee details form with new customer information
   - Submit the form and verify a new record is created in the users table
   - Check that all fields are correctly saved with proper formatting
   - Verify the relationship between the customer profile and the registration

2. Test existing customer detection:
   - Enter an email address that already exists in the system
   - Verify that the system correctly identifies the existing user
   - Test the authentication prompt if implemented
   - Check that existing profile data is loaded into the form when appropriate

3. Test form validation:
   - Try submitting with missing required fields
   - Test email format validation
   - Check validation for phone numbers and other formatted fields
   - Verify that error messages are displayed appropriately

4. Test profile updates:
   - For existing users, modify some profile information
   - Submit the form and verify the changes are saved in the database
   - Check that only changed fields are updated
   - Verify that readonly fields remain unchanged

5. Test integration with registration flow:
   - Complete the customer profile step and proceed to the next registration step
   - Verify that the customer ID is properly stored in the registration context
   - Check that returning to the customer profile step maintains the entered data
   - Test the complete registration flow to ensure profile data persists

## Verification Checklist

Before proceeding to the next step, verify that:

- [ ] Customer profiles can be created and stored in the Supabase database
- [ ] Existing customers can be detected by email address
- [ ] Form validation correctly identifies and reports invalid inputs
- [ ] All required fields are properly enforced
- [ ] The customer profile is correctly linked to the registration
- [ ] Loading states are shown during database operations
- [ ] Error messages are clear and helpful
- [ ] The UI is responsive and works on different screen sizes
- [ ] Customer data persists when navigating between registration steps
- [ ] The form handles both new and existing customers correctly

## Common Errors and Solutions

1. If customer profiles aren't being created:
   - Check that the Supabase client is properly initialized
   - Verify that the users table has the correct schema and permissions
   - Ensure Row Level Security (RLS) policies allow creation of user records
   - Check that the form data is correctly formatted before submission

2. If existing users aren't being detected:
   - Verify that the email query is case-insensitive
   - Check that the query is using the correct column name
   - Ensure the database has indexes on the email field for performance
   - Test with explicit email addresses known to exist in the system

3. If form validation fails:
   - Review the validation logic for each field
   - Check for typos in field names or validation rules
   - Verify that the error messages are being properly displayed
   - Test with various input combinations to identify edge cases

4. If profile data doesn't persist:
   - Check how state is being managed between steps
   - Verify that the form state includes the customer profile data
   - Ensure that the registration context properly stores the customer ID
   - Check for any state reset operations that might be clearing the data

5. If linking to registration fails:
   - Verify that the registration record includes the userid field
   - Check that the customer ID is correctly passed to the registration creation function
   - Ensure foreign key constraints are properly set up in the database
   - Test with specific known IDs to verify the relationship

Remember to implement features incrementally and test thoroughly at each step. Start with basic profile creation, then add validation, then existing user detection, and finally integration with the broader registration flow.
