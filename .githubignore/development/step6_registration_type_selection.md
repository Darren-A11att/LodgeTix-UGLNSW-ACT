# Step 6: Registration Type Selection Integration

## Context for the Agentic AI Software Engineer
The LodgeTix application currently has event display functionality implemented with Supabase. Now it's time to implement the first step of the registration process: Registration Type Selection. This component allows users to choose between different registration types (individual, lodge, or delegation) which determines the subsequent registration flow. Currently, the registration system uses mock data, but we need to connect it to the Supabase database.

## Objective
Implement the registration type selection functionality by connecting the `RegistrationTypeSelection` component to Supabase, ensuring proper state management, and preparing the groundwork for subsequent registration steps. This is the entry point of the registration process where users choose how they will register (as an individual Mason with guests, as a lodge, or as an official delegation).

## Pre-requisites
- Supabase client is properly configured (Step 1)
- TypeScript interfaces are updated to match the database (Step 2)
- Events integration is complete (Steps 3-5)
- Understanding of the registration flow in the application
- Familiarity with the `registrations` table structure in Supabase

## Analysis Steps

1. Examine the current RegistrationTypeSelection component:
   - Analyze the component structure in `/src/components/register/RegistrationTypeSelection.tsx`
   - Identify how registration types are defined and handled
   - Understand the props and callbacks the component expects
   - Note the registration type options (individual, lodge, delegation) and their descriptions

2. Review the RegisterPage and registration flow:
   - Examine `/src/pages/RegisterPage.tsx` to understand the overall registration flow
   - Identify how the registration type selection fits into the broader process
   - Note how the form state is managed across steps
   - Understand the `RegisterFormContext` and `useRegisterForm` hook

3. Analyze the Supabase database schema for registration:
   - Examine the `registrations` table structure, focusing on:
     - The `registrationtype` field that stores the selected type
     - The relationship between registrations and events
     - The relationship between registrations and users
   - Understand how registrations relate to other entities (delegations, organizations)

4. Review any existing API functions:
   - Check if there are any existing API functions in the codebase related to registrations
   - Identify what new functions will need to be created
   - Plan how to structure the registration API module

## Implementation Steps

1. Create TypeScript interfaces for registration types:
   - Define interfaces that match the Supabase `registrations` table schema
   - Create enums or string literal types for registration types
   - Define props interfaces for the updated RegistrationTypeSelection component
   - Ensure types properly represent the state transitions in the registration flow

2. Create API functions for registration initialization:
   - Create a new file at `/src/lib/api/registrations.ts`
   - Implement a `createPendingRegistration` function that:
     - Takes a registration type and event ID as input
     - Creates a new record in the Supabase `registrations` table with status 'pending'
     - Returns the created registration data
   - Add proper error handling and type safety
   - Include comprehensive JSDoc comments

3. Update the RegistrationTypeSelection component:
   - Modify the component to fetch registration type options from Supabase if available
   - Update the selection handler to call the new API function
   - Implement loading states for API interactions
   - Add error handling for failed API calls
   - Ensure the UI remains responsive during async operations

4. Update the RegisterFormContext:
   - Modify the context to store the Supabase registration ID
   - Update the registration type selection logic to interact with the API
   - Add state for tracking the API operation status
   - Ensure the registration ID is maintained throughout the registration process
   - Update the context provider to handle potential errors

5. Implement proper routing and state persistence:
   - Ensure the registration step and selection are preserved if the user navigates away
   - Add URL parameters or state management to maintain the registration context
   - Implement checks to prevent accessing later registration steps without a valid selection
   - Consider adding a timeout for abandoned registrations

## Testing Steps

1. Test registration type selection:
   - Navigate to the registration page
   - Select each available registration type
   - Verify that the selection is properly stored in state
   - Check that the UI updates to reflect the selection
   - Verify that the correct next step is shown based on the selection

2. Test API integration:
   - Select a registration type and verify a record is created in the database
   - Check that the registration status is set to 'pending'
   - Verify that the registration type is correctly saved
   - Test with different event IDs to ensure the relationship is established

3. Test edge cases:
   - Test what happens when a user refreshes the page during registration
   - Check behavior when the API calls fail
   - Verify handling of invalid registration types
   - Test performance with slow network connections

4. Test user experience:
   - Verify loading indicators display during API operations
   - Confirm error messages are clear and helpful
   - Check that disabled options are properly indicated
   - Test the responsive design on different screen sizes

## Verification Checklist

Before proceeding to the next step, verify that:

- [ ] Registration types are correctly loaded and displayed
- [ ] Selection of a registration type creates a pending registration in Supabase
- [ ] The registration ID is stored and accessible throughout the registration flow
- [ ] The UI clearly indicates which options are available and which are coming soon
- [ ] Loading states are shown during API operations
- [ ] Error handling provides clear feedback to users
- [ ] The registration type selection is preserved if the user navigates away
- [ ] The component works correctly on different screen sizes
- [ ] No console errors occur during normal operation
- [ ] Coming soon options are properly disabled but visually indicated

## Common Errors and Solutions

1. If registration records aren't being created:
   - Verify the Supabase client is properly initialized
   - Check that the `registrations` table has the correct schema
   - Ensure Row Level Security (RLS) policies allow creation of registrations
   - Verify the user has the necessary permissions

2. If the UI doesn't update after selection:
   - Check that the state update function is being called correctly
   - Verify that the component re-renders when state changes
   - Ensure the context provider is properly wrapping the component

3. If registration types don't display properly:
   - Verify the data structure matches what the component expects
   - Check for styling issues that might affect visibility
   - Ensure conditional rendering logic is correct

4. If coming soon options aren't properly handled:
   - Review the disabled state implementation
   - Check that click handlers prevent selection of disabled options
   - Verify the visual indication is clear to users

5. If registration state isn't persisted:
   - Check how state is being stored (context, localStorage, URL)
   - Verify that the persistence mechanism works across page reloads
   - Ensure cleanup functions run properly for abandoned registrations

Remember to implement features incrementally, testing each change before moving on. Start with the basic UI integration, then add the API functionality, and finally implement the state management and persistence features.
