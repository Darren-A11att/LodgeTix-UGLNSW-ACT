import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use environment variables for configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verify that environment variables are correctly loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
  // Consider throwing an error or handling this case more robustly
  // depending on your application's needs.
}

// Create and export the Supabase client
// Add a type assertion or check to satisfy TypeScript if needed, 
// especially if strict null checks are enabled.
export const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);