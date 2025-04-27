# Step 1: Supabase Client Setup for LodgeTix

## Context
We're integrating our LodgeTix React frontend with our Supabase database backend. The first step is to set up the Supabase client correctly. This is a foundational element that all other integration steps will depend on.

## Objective
Create and properly configure the Supabase client that will handle all database operations for the application.

## Pre-requisites
- The Supabase project is already set up at URL `https://pwwpcjbbxotmiqrisjvf.supabase.co`
- The Supabase anon key is in the existing `.env` file

## Analysis Steps

1. First, examine the current environment variables to ensure they exist:
   ```bash
   # View the .env file to confirm Supabase URL and anon key are present
   cat /Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/.env
   ```

2. Check the project dependencies to see if Supabase is already installed:
   ```bash
   # Review package.json to check for @supabase/supabase-js
   cat /Users/darrenallatt/Development/LodgeTix-UGLNSW-ACT/package.json
   ```

3. If the Supabase client library is not installed, you need to add it:
   ```bash
   npm install @supabase/supabase-js
   ```

## Implementation Steps

1. Create the Supabase client file:
   ```typescript
   // Create the file at src/lib/supabase.ts
   import { createClient } from '@supabase/supabase-js';

   // Use environment variables for configuration
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

   // Verify that environment variables are correctly loaded
   if (!supabaseUrl || !supabaseAnonKey) {
     console.error('Missing Supabase environment variables. Check your .env file.');
   }

   // Create and export the Supabase client
   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

2. Verify TypeScript types are working correctly:
   ```typescript
   // Add explicit typing to the client
   import { createClient, SupabaseClient } from '@supabase/supabase-js';

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

   if (!supabaseUrl || !supabaseAnonKey) {
     console.error('Missing Supabase environment variables. Check your .env file.');
   }

   export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
   ```

## Testing Steps

1. Create a simple test file to verify the Supabase connection:
   ```typescript
   // Create a temporary test file at src/lib/testSupabase.ts
   import { supabase } from './supabase';

   async function testSupabaseConnection() {
     try {
       // Simple query to test connection
       const { data, error } = await supabase
         .from('events')
         .select('id, title')
         .limit(1);
       
       if (error) {
         console.error('Supabase connection test failed:', error);
         return false;
       }
       
       console.log('Supabase connection successful. Sample data:', data);
       return true;
     } catch (err) {
       console.error('Unexpected error testing Supabase connection:', err);
       return false;
     }
   }

   // Execute the test
   testSupabaseConnection();
   ```

2. Run the test in a temporary component or in the browser console:
   ```typescript
   // Temporarily add this to App.tsx or another component for testing
   import { useEffect } from 'react';
   import { supabase } from './lib/supabase';

   function App() {
     useEffect(() => {
       async function testConnection() {
         const { data, error } = await supabase
           .from('events')
           .select('id, title')
           .limit(1);
         
         if (error) {
           console.error('Supabase connection error:', error);
         } else {
           console.log('Supabase connection successful:', data);
         }
       }
       
       testConnection();
     }, []);
     
     // Rest of component...
   }
   ```

## Verification Checklist

Before moving to the next step, verify:

- [x] Supabase client package is installed
- [x] Environment variables are correctly loaded
- [x] The client is initialized without errors
- [x] A test query successfully retrieves data
- [x] No sensitive credentials are hardcoded
- [x] Error handling is in place

## Common Errors and Solutions

1. **Environment variables not loading**
   - Check that you're using the correct prefix (`VITE_` for Vite projects)
   - Verify the .env file is in the project root
   - Restart the development server

2. **TypeScript errors**
   - Ensure @supabase/supabase-js is in dependencies
   - Check TypeScript version compatibility
   - Verify tsconfig.json includes the lib directory

3. **Connection failures**
   - Verify Supabase URL and anon key are correct
   - Check if the Supabase project is active
   - Verify your IP is not blocked by Supabase

Remember to remove any testing code from production components after verification is complete.
