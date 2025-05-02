# Step 6: Supabase Authentication Integration

## Context
Currently, our application is using mock authentication data. We need to replace this with real Supabase Authentication to enable user sign-up, sign-in, and account management. This is a foundational step before implementing user-specific features like event registration.

## Objective
Replace the mock authentication system with Supabase Authentication while maintaining all existing authentication-related UI components and functionality.

## Pre-requisites
- Supabase client is properly configured (Step 1)
- Understanding of the current authentication flow in the application
- Familiarity with Supabase Auth API

## Analysis Steps

1. First, examine the current authentication context implementation:
   ```bash
   # Find the AuthContext file
   find /Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src -type f -name "AuthContext.tsx"
   # View the implementation
   cat [FOUND_FILE_PATH]
   ```

2. Analyze how auth state is currently used in the app:
   ```bash
   # Find components using the auth context
   find /Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src -type f -name "*.tsx" -exec grep -l "useAuth" {} \;
   ```

3. Understand the current user interface components for authentication:
   ```bash
   # Find login and signup pages
   find /Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/src -type f -name "LoginPage.tsx" -o -name "SignupPage.tsx"
   # View them
   cat [FOUND_FILE_PATHS]
   ```

## Implementation Steps

1. Update the AuthContext to use Supabase Auth:
   - Examine the current AuthContext implementation to understand its structure
   - Create a TypeScript interface for the AuthContextType that includes:
     - Session and User state from Supabase
     - Loading and error states
     - Functions for signIn, signUp, signOut, and resetPassword
   - Implement the AuthProvider component with:
     - State for session, user, loading, and errors
     - useEffect to get the initial session and set up auth state change listener
     - Functions to handle all auth operations with proper error handling
     - Context provider setup with value object
   - Create a useAuth hook to consume the context

2. Update the LoginPage component:
   - Analyze the current LoginPage implementation
   - Modify the component to use the new Supabase-based auth context
   - Implement form state management for email, password, error messages, and submission status
   - Create a form submission handler that properly validates inputs
   - Add error handling for authentication failures
   - Implement redirect logic using React Router's useNavigate and useLocation
   - Restore the original form UI design while integrating new functionality
   - Add loading state indicators during authenticationfull space-y-8 bg-white p-8 rounded-lg shadow-lg">
           <div>
             <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
               Sign in to your account
             </h2>
             <p className="mt-2 text-center text-sm text-gray-600">
               Or{' '}
               <Link to="/signup" className="font-medium text-primary hover:text-primary-600">
                 create a new account
               </Link>
             </p>
           </div>
           
           {errorMessage && (
             <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
               <div className="flex">
                 <div className="ml-3">
                   <p className="text-sm text-red-700">{errorMessage}</p>
                 </div>
               </div>
             </div>
           )}
           
           <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
             <div className="rounded-md shadow-sm -space-y-px">
               <div>
                 <label htmlFor="email-address" className="sr-only">Email address</label>
                 <input
                   id="email-address"
                   name="email"
                   type="email"
                   autoComplete="email"
                   required
                   className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                   placeholder="Email address"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                 />
               </div>
               <div>
                 <label htmlFor="password" className="sr-only">Password</label>
                 <input
                   id="password"
                   name="password"
                   type="password"
                   autoComplete="current-password"
                   required
                   className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                   placeholder="Password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                 />
               </div>
             </div>
   
             <div className="flex items-center justify-between">
               <div className="flex items-center">
                 <input
                   id="remember-me"
                   name="remember-me"
                   type="checkbox"
                   className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                 />
                 <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                   Remember me
                 </label>
               </div>
   
               <div className="text-sm">
                 <Link to="/forgot-password" className="font-medium text-primary hover:text-primary-600">
                   Forgot your password?
                 </Link>
               </div>
             </div>
   
             <div>
               <button
                 type="submit"
                 disabled={isSubmitting}
                 className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
               >
                 {isSubmitting ? 'Signing in...' : 'Sign in'}
               </button>
             </div>
           </form>
         </div>
       </div>
     );
   };
   
   export default LoginPage;
   ```

3. Update the SignupPage component:
   - Analyze the current SignupPage implementation
   - Update the component to use the Supabase-based auth context
   - Implement state for email, password, confirm password, and form status
   - Add validation logic for:
     - Required fields
     - Password matching
     - Minimum password length (6+ characters)
   - Create a form submission handler that properly validates inputs
   - Add success message display for successful registration
   - Implement conditional redirect based on email confirmation settings
   - Handle error messages from the registration process
   - Maintain the original UI design while integrating new functionality

4. Create a Protected Route component for authenticated routes:
   - Create a new ProtectedRoute component to secure routes requiring authentication
   - Set up the component to accept children props
   - Use the auth context to check if the user is authenticated
   - Display a loading indicator while authentication state is being verified
   - Implement redirect to login page if user is not authenticated
   - Pass the current location to the login page for post-login redirect
   - Return the children components when authentication is confirmed
   - Apply proper TypeScript typing for the component props

5. Update the app routes to use the ProtectedRoute component:
   - Modify the App.tsx file to integrate the authentication system
   - Wrap the entire application with the AuthProvider component
   - Identify all routes that should be protected (require authentication)
   - Update the Routes configuration to wrap protected pages with the ProtectedRoute component
   - Protect pages such as:
     - RegisterPage (event registration)
     - ProfilePage (user profile)
     - CheckoutSuccessPage and CheckoutCanceledPage (payment flows)
   - Keep public routes directly accessible (HomePage, EventsPage, etc.)
   - Ensure the 404 page remains accessible to all users

6. Update the Header component to use real authentication state:
   - Modify the Header component to integrate with the new auth context
   - Create state variables to manage mobile menu and account dropdown visibility
   - Add a sign-out handler function connected to the auth context
   - Update the UI to conditionally render different elements based on auth state:
     - Show user account menu when authenticated
     - Display login/signup buttons when not authenticated
   - Implement a dropdown account menu with:
     - User email display
     - Profile link
     - Sign out button
   - Ensure both desktop and mobile layouts properly reflect authentication state
   - Add proper event handlers for toggling menus
   - Use appropriate Lucide icons for UI elements

## Testing Steps

1. Create test cases to verify authentication functionality:
   - Test Sign Up functionality with:
     - Valid email and password combinations
     - Invalid email formats
     - Passwords that are too short
     - Mismatched password and confirmation
   
   - Test Sign In functionality with:
     - Valid credentials for existing accounts
     - Invalid credentials (wrong password)
     - Non-existent accounts
   
   - Test Sign Out functionality:
     - Sign out from the header menu
     - Verify redirects occur when accessing protected routes after signing out
   
   - Test Protected Routes behavior:
     - Access protected routes while authenticated
     - Try accessing protected routes while not authenticated
     - Confirm redirect to original destination after authentication
   
   - Verify Auth State Persistence:
     - Check if authentication state is maintained after page reload

2. Test sign-up functionality:
   - Navigate to the sign-up page
   - Enter a valid email and password
   - Submit the form
   - Verify success message or redirect
   - Check Supabase dashboard for new user

3. Test login functionality:
   - Navigate to the login page
   - Enter credentials for the user created in the previous step
   - Submit the form
   - Verify successful login and redirect
   - Check that the user menu appears in the header

4. Test protected routes:
   - Log out
   - Try to access a protected route (e.g., /profile)
   - Verify redirect to login page
   - Log in
   - Verify redirect back to the originally requested page

5. Test sign-out functionality:
   - While logged in, click the sign-out button
   - Verify successful logout
   - Verify UI updates (auth buttons change)
   - Verify redirect from protected routes

## Verification Checklist

Before moving to the next step, verify:

- [ ] User can successfully sign up with email and password
- [ ] User can successfully sign in with correct credentials
- [ ] Error messages are displayed for invalid credentials
- [ ] Authentication state persists across page reloads
- [ ] Protected routes redirect to login when not authenticated
- [ ] After login, user is redirected back to the originally requested protected route
- [ ] User menu shows correctly when authenticated
- [ ] Sign out functionality works correctly
- [ ] UI properly reflects authentication state (login/signup buttons vs user menu)
- [ ] All form validations work correctly
- [ ] No console errors related to authentication

## Common Errors and Solutions

1. **CORS issues**
   - Ensure Supabase project allows requests from your domain
   - Check Site URL configuration in Supabase Auth settings

2. **Email confirmation issues**
   - Check if email confirmation is enabled in Supabase Auth settings
   - Test with email confirmation disabled during development
   - Verify redirect URLs are configured correctly

3. **Protected route flashing**
   - Ensure loading state is displayed while checking auth
   - Consider using a global loading state in the auth provider

4. **Auth state not persisting**
   - Check if the right storage mechanism is used (localStorage)
   - Verify the auth listener is properly set up

5. **TypeScript errors**
   - Ensure proper typing for all auth functions and state
   - Handle nullable types correctly (user may be null)

After completing all verifications, clean up any temporary test code and commit your changes.
