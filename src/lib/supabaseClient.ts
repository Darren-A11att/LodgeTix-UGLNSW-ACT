// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Fetch environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if variables are loaded
if (!supabaseUrl) {
  console.error('Error: Supabase URL is missing. Make sure VITE_SUPABASE_URL is set in your .env file.');
  throw new Error('Supabase URL is missing.');
}
if (!supabaseAnonKey) {
  console.error('Error: Supabase Anon Key is missing. Make sure VITE_SUPABASE_ANON_KEY is set in your .env file.');
  throw new Error('Supabase Anon Key is missing.');
}

// Create and export the Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 