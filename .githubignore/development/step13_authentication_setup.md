# Step 6: Supabase Authentication Integration

## Context for the Agentic AI Software Engineer
Currently, the LodgeTix application is using mock authentication data. Your task is to replace this with real Supabase Authentication to enable user sign-up, sign-in, and account management. This is a foundational step before implementing user-specific features like event registration, as all subsequent functionality will rely on knowing the authenticated user.

## Objective
Replace the mock authentication system with Supabase Authentication while maintaining all existing authentication-related UI components and functionality. This includes implementing sign-up, sign-in, sign-out, and protected routes.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated (Step 2)
- Understanding of the current authentication flow in the application
- Familiarity with Supabase Auth API and how it differs from the current mock implementation

## Analysis Steps

1. Examine the current authentication context implementation:
   - Locate the AuthContext file in the src/context directory
   - Analyze how the current context provides authentication state and methods
   - Identify all functions that need to be replaced (login, register, logout, etc.)
   - Note how user data is currently structured and stored
   - Understand how components access the authentication context

2. Analyze how auth state is currently used in the app:
   - Find all components that import and use the useAuth hook
   - Determine which components depend on authentication state
   - Note how protected routes are currently implemented (if at all)
   - Understand the current login/logout flow
   - Identify any user-specific UI elements (user menu, profile links, etc.)

3. Review the current user interface components for authentication:
   - Examine the LoginPage and SignupPage components
   - Note form fields, validation, and submission handling
   - Identify error handling and success states
   - Understand the navigation flow after authentication
   - Review any password reset or account management features

## Implementation Steps

1. Update the AuthContext to use Supabase Auth:
   - Create a TypeScript interface for AuthContextType that includes Supabase Session and User types
   - Implement the AuthProvider component with state for session, user, loading, and errors
   - Set up an effect hook to:
     - Get the initial session using supabase.auth.getSession()
     - Listen for auth changes with onAuthStateChange
     - Clean up the subscription when the component unmounts
   - Implement authentication methods:
     - signIn using supabase.auth.signInWithPassword
     - signUp using supabase.auth.signUp
     - signOut using supabase.auth.signOut
     - resetPassword using supabase.auth.resetPasswordForEmail
   - Provide proper error handling for all methods
   - Create and export a useAuth hook for consuming the context

2. Update the LoginPage component:
   - Modify the component to use the new Supabase-based auth context
   - Implement form state management for email, password, and submission status
   - Create a form submission handler that:
     - Prevents default form submission
     - Validates required fields
     - Calls the signIn method from the auth context
     - Handles success and error states
   - Update the UI to show loading state during authentication
   - Implement redirect after successful login using useNavigate
   - Preserve the existing UI design while updating the functionality
   - Handle "remember me" functionality if implemented

3. Update the SignupPage component:
   - Modify the component to use the Supabase auth context
   - Implement form state for email, password, and password confirmation
   - Add validation for:
     - Required fields
     - Email format
     - Password strength (minimum length)
     - Password confirmation match
   - Create a form submission handler that calls the signUp method
   - Add UI for showing success and error states
   - Handle email confirmation flow based on Supabase settings
   - Implement redirect after registration if appropriate
   - Preserve the existing UI while updating functionality

4. Create a Protected Route component:
   - Implement a new component that wraps routes requiring authentication
   - Use the useAuth hook to check authentication state
   - Show a loading indicator while auth state is being determined
   - Redirect unauthenticated users to the login page
   - Save the attempted URL for post-login redirect
   - Return the children components when authenticated
   - Add proper TypeScript typing for the component

5. Update App routing:
   - Wrap the application with the AuthProvider
   - Identify routes that should be protected
   - Implement the ProtectedRoute component for:
     - User profile pages
     - Registration pages
     - Checkout and payment pages
     - Any other user-specific features
   - Ensure public routes remain accessible
   - Update any route-related types if necessary

6. Enhance the Header component:
   - Update the component to use real authentication state
   - Implement conditional rendering based on auth state:
     - Show login/signup buttons when not authenticated
     - Display user menu when authenticated
   - Create an account dropdown with:
     - User information display
     - Link to profile page
     - Sign out button
   - Add mobile-responsive versions of these elements
   - Implement sign-out functionality
   - Update any user-specific UI elements

## Testing Steps

1. Test user registration:
   - Navigate to the signup page
   - Enter valid registration information
   - Submit the form and verify the process completes
   - Check Supabase dashboard to confirm user creation
   - Test validation by attempting to submit with invalid data
   - Verify appropriate error messages are displayed

2. Test user login:
   - Navigate to the login page
   - Enter credentials for an existing user
   - Verify successful login and proper redirect
   - Test with incorrect credentials and verify error handling
   - Check that authentication state persists across page reloads
   - Verify the UI updates to show authenticated state

3. Test protected routes:
   - While logged out, attempt to access a protected route
   - Verify redirect to login page
   - Log in and check if you're redirected to the originally requested page
   - Verify all protected routes work as expected
   - Check that public routes remain accessible

4. Test sign-out functionality:
   - Click the sign-out button in the user menu
   - Verify the authentication state is cleared
   - Check that the UI reverts to unauthenticated state
   - Attempt to access protected routes after logout
   - Verify redirect to login page

5. Test auth state persistence:
   - Log in to the application
   - Refresh the page or close and reopen the browser
   - Verify that the authentication state is maintained
   - Check that protected routes remain accessible

## Verification Checklist

Before moving to the next step, verify:

- [ ] Users can successfully register new accounts
- [ ] Users can successfully log in with correct credentials
- [ ] Error messages are displayed for invalid credentials
- [ ] Authentication state persists across page refreshes
- [ ] Protected routes redirect to login when not authenticated
- [ ] After login, users are redirected to their originally requested page
- [ ] The user menu appears correctly for authenticated users
- [ ] Sign out functionality works correctly
- [ ] The UI properly reflects the current authentication state
- [ ] Form validation prevents invalid submissions
- [ ] Error handling provides clear feedback to users
- [ ] No console errors related to authentication occur
- [ ] The authentication flow matches the original user experience

## Common Errors and Solutions

1. If you encounter CORS issues:
   - Check if the Supabase project allows requests from your application domain
   - Verify the Site URL configuration in Supabase Auth settings
   - Ensure there are no mixed HTTP/HTTPS issues

2. If email confirmation doesn't work:
   - Review Supabase Auth settings for email confirmation requirements
   - Check that redirect URLs are configured correctly
   - Consider disabling email confirmation for testing

3. If protected routes don't work correctly:
   - Verify the loading state is properly handled in the ProtectedRoute component
   - Check that the auth state is being correctly determined
   - Ensure the redirect logic is working as expected

4. If authentication state doesn't persist:
   - Check that the Supabase auth listener is properly set up
   - Verify that localStorage is accessible and working
   - Ensure the auth provider is at the top level of your component tree

5. If TypeScript errors occur:
   - Make sure all Supabase types are correctly imported
   - Handle potential null values properly
   - Use optional chaining and nullish coalescing where appropriate

Remember to implement proper error boundaries to prevent the entire application from crashing due to authentication errors, and consider adding telemetry to help diagnose authentication issues in production.
