// scripts/test-ticket-definitions.js
// Purpose: Test fetching ticket definitions for a specific event ID directly.

// IMPORTANT: This script assumes your Supabase client initialization
// in '../src/lib/supabase.js' correctly loads environment variables (URL, anon key).
// You might need to install dotenv (`npm install dotenv`) and uncomment the line below
// if your Supabase client relies on .env files being explicitly loaded.
// require('dotenv').config({ path: '../.env' }); // Adjust path to your .env file

// Adjust paths if your structure differs
import { supabase } from '../src/lib/supabase.ts'; 
import { getTicketDefinitionsForEvent } from '../src/lib/api/events.ts'; 

// --- Configuration ---
// Use one of the actual child event IDs from your logs
const TEST_EVENT_ID = '6c12952b-7cf3-4d6a-81bd-1ac3b7ff7076'; 
// -------------------

async function runTest() {
  // Basic check if Supabase client seems initialized
  if (!supabase || typeof supabase.from !== 'function') {
    console.error("ERROR: Supabase client doesn't seem properly initialized.");
    console.error("Check the import path '../src/lib/supabase.js' and ensure it exports the client.");
    console.error("Make sure environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are accessible to Node.js.");
    return;
  }

  console.log(`[TEST SCRIPT] Testing getTicketDefinitionsForEvent for event ID: ${TEST_EVENT_ID}`);
  console.log('--------------------------------------------------');

  try {
    const definitions = await getTicketDefinitionsForEvent(TEST_EVENT_ID);

    console.log(`[TEST SCRIPT] API Call Result for ${TEST_EVENT_ID}:`);
    
    // Check if the result is an array (even an empty one)
    if (Array.isArray(definitions)) {
      if (definitions.length > 0) {
        console.log(`[TEST SCRIPT] Success! Found ${definitions.length} active ticket definition(s):`);
        // Log only essential details to avoid overwhelming console
        const summary = definitions.map(d => ({ id: d.id, name: d.name, price: d.price, is_active: d.is_active }));
        console.log(JSON.stringify(summary, null, 2)); 
      } else {
        console.log(`[TEST SCRIPT] Success! Call returned an empty array.`);
        console.warn(`[TEST SCRIPT] -> This means NO ticket definitions exist for event ${TEST_EVENT_ID} OR none of them are marked as 'is_active: true' in the database.`);
      }
    } else {
       console.error(`[TEST SCRIPT] -> API call returned an unexpected result (not an array):`, definitions);
    }

  } catch (error) {
    console.error(`[TEST SCRIPT] API Call FAILED for ${TEST_EVENT_ID}:`);
    console.error(error);
  } finally {
    console.log('--------------------------------------------------');
    console.log('[TEST SCRIPT] Test finished.');
    // Supabase client typically doesn't need explicit closing for short scripts
  }
}

// Execute the test function
runTest(); 