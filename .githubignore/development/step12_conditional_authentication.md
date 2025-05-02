# Step 12: Conditional Authentication Implementation

## Context for the Agentic AI Software Engineer
Now that we've implemented all attendee types (customer, Mason, Mason partner, guest, and guest partner), we need to implement the conditional authentication system. In the LodgeTix application, authentication is not required to start the registration process, but we want to detect when a user enters an email that matches an existing account and prompt them to authenticate. This ensures that returning users can access their existing profiles and maintain a consistent experience.

## Objective
Implement a conditional authentication system that detects when a registration email matches an existing user account, prompts the user to authenticate, and links the current registration to the authenticated user. This includes creating detection logic, authentication modals/forms, and proper state management to handle both authenticated and unauthenticated registration flows.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated to match the database schema (Step 2)
- Events integration is complete (Steps 3-5)
- Registration type selection is implemented (Step 6)
- All attendee types are implemented (Steps 7-11)
- Understanding of Supabase authentication system and the users table

## Analysis Steps

1. Examine the current authentication components:
   - Review existing auth-related UI components like login forms or modals
   - Understand how authentication state is currently managed
   - Identify points in the registration flow where email is collected
   - Note how the primary attendee's email is stored in the form state

2. Analyze the Supabase authentication system:
   - Understand how Supabase handles authentication
   - Review the auth.users table structure and its relationship to public.users
   - Note how emails are stored and validated in the auth system
   - Examine any existing RLS policies that might affect authenticated vs. anonymous access

3. Review the registration form state:
   - Identify where the primary attendee's email is stored
   - Understand how to access this information during form submission
   - Note how the form state could be affected by authentication during registration
   - Review how the registration is associated with a user ID

4. Understand the current user experience flow:
   - Map out the points where a user enters their email
   - Identify the optimal moment to check for existing accounts
   - Consider the UX implications of interrupting the flow for authentication
   - Determine how to handle the case where a user declines to authenticate

## Implementation Steps

1. Create TypeScript interfaces for authentication integration:
   - Define interfaces for authentication responses and states
   - Create types for authentication modals or dialogs
   - Define interfaces for tracking authentication status in the registration flow
   - Ensure proper typing for all authentication-related state

2. Implement email detection functionality:
   - Create a function that checks if an email exists in the system
   - Implement secure methods to query the auth system without exposing sensitive data
   - Add debouncing to prevent excessive database queries
   - Include proper error handling and security measures

3. Create authentication UI components:
   - Implement a modal dialog for authentication prompts
   - Create UI for login when an existing email is detected
   - Add options to proceed without logging in
   - Style the components to match the application design

4. Implement the conditional authentication logic:
   - Add a hook or effect that runs when primary attendee email changes
   - Implement the email detection and authentication prompt
   - Create logic to handle both "login" and "continue as guest" paths
   - Update the registration state based on authentication results

5. Handle registration linking:
   - Implement logic to link a registration to an authenticated user
   - Create functions to merge in-progress registration data with existing user data
   - Handle the case where a user authenticates after entering some data
   - Ensure no data loss occurs during the authentication process

6. Implement security and validation:
   - Add proper validation for authentication attempts
   - Implement rate limiting for authentication requests
   - Ensure secure handling of credentials during the process
   - Add appropriate error messages for authentication failures

## Testing Steps

1. Test email detection:
   - Enter an email known to exist in the system
   - Verify that the system correctly identifies it as existing
   - Check that the detection happens at the appropriate time
   - Test with various email formats to ensure robust detection

2. Test authentication prompt:
   - Verify that the authentication modal appears when an existing email is detected
   - Check that all UI elements are correctly displayed
   - Test that the modal can be dismissed if the user chooses not to authenticate
   - Verify that authentication options are clear and functional

3. Test authentication flow:
   - Test logging in with correct credentials when prompted
   - Test login with incorrect credentials and verify error messages
   - Test selecting "continue as guest" option
   - Verify that the registration flow continues appropriately in all cases

4. Test registration linking:
   - Complete a registration after authenticating
   - Verify that the registration is correctly linked to the authenticated user
   - Check that existing user data is properly merged with the registration
   - Test that subsequent registrations recognize the authenticated user

5. Test edge cases:
   - Test what happens if authentication fails
   - Test authentication timing at different points in the form
   - Verify behavior when a user enters an email, changes it, then changes back
   - Test authentication with multiple tabs or sessions open

## Verification Checklist

Before proceeding to the next step, verify that:

- [ ] The system correctly detects when an email matches an existing account
- [ ] Authentication prompts appear at the appropriate time
- [ ] Users can successfully authenticate during the registration process
- [ ] Users can choose to continue without authenticating
- [ ] Registration data is properly linked to authenticated users
- [ ] No data loss occurs during the authentication process
- [ ] The UI remains responsive throughout the authentication flow
- [ ] Authentication errors are properly handled and displayed
- [ ] The registration can be completed regardless of authentication choice
- [ ] Security measures are in place to protect user credentials
- [ ] The email detection process is optimized to minimize database queries

## Common Errors and Solutions

1. If email detection doesn't work:
   - Verify that the query is checking both auth.users and public.users tables
   - Ensure case-insensitive comparison for emails
   - Check that the API endpoint has appropriate permissions
   - Test with known existing emails to verify functionality

2. If authentication prompts don't appear:
   - Check that the modal component is properly mounted in the DOM
   - Verify that the trigger condition is correctly implemented
   - Ensure that the component has access to the necessary state
   - Test with browser developer tools to check for errors

3. If authentication fails:
   - Verify that the Supabase client is correctly configured for auth
   - Check that credentials are being properly passed to the auth methods
   - Ensure that error handling displays meaningful messages
   - Test with known good credentials to isolate the issue

4. If registration linking fails:
   - Check that the user ID is correctly retrieved after authentication
   - Verify that the registration update function is working
   - Ensure database permissions allow updating registrations
   - Test with specific known IDs to verify the relationship

5. If data loss occurs:
   - Review how registration data is stored during authentication
   - Check that form state is preserved across the authentication flow
   - Verify that merged data prioritizes correctly
   - Implement additional safeguards against data loss

Remember to implement features incrementally and test thoroughly at each step. Start with basic email detection, then add authentication prompts, then implement the authentication flow, and finally handle registration linking and data merging.
