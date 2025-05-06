// scripts/test-full-ticket-flow.ts
// Purpose: Test the full sequence of API calls used to fetch child event packages and definitions.

// Load environment variables from the root .env file
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url'; // Needed for ESM __dirname equivalent

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// IMPORTANT: Ensure Supabase client initialization in '../src/lib/supabase.ts' 
// correctly loads environment variables (URL, anon key). 
// You might need dotenv: require('dotenv').config({ path: '../.env' });

// Adjust paths if your structure differs
import { supabase } from '../src/lib/supabase.ts'; 
import { 
  getChildEvents, 
  getPackagesForEvent, 
  getTicketDefinitionsForEvent 
} from '../src/lib/api/events.ts'; 
import * as ApiEventTypes from '../src/lib/api/events.ts'; // Namespace import for PackageType
import * as SharedTicketTypes from '../src/shared/types/ticket.ts'; // Namespace import for TicketDefinitionType
import * as SharedEventTypes from '../src/shared/types/event.ts'; // Namespace import for EventType

// --- Configuration ---
const PARENT_EVENT_ID = '307c2d85-72d5-48cf-ac94-082ca2a5d23d'; 
// -------------------

async function runFullTest() {
  // Basic check if Supabase client seems initialized
  if (!supabase || typeof supabase.from !== 'function') {
    console.error("ERROR: Supabase client doesn't seem properly initialized.");
    // Add checks for env vars
    console.error("Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.");
    return;
  }

  console.log(`[FULL TEST SCRIPT] Starting test for parent event ID: ${PARENT_EVENT_ID}`);
  console.log('==================================================');

  let childEvents: SharedEventTypes.EventType[] = [];
  let allPackages: ApiEventTypes.PackageType[] = []; // Type annotation allowed in TS
  let allDefinitions: SharedTicketTypes.TicketDefinitionType[] = []; // Type annotation allowed in TS

  // 1. Fetch Child Events
  console.log(`\n[STEP 1] Fetching child events for parent ${PARENT_EVENT_ID}...`);
  try {
    childEvents = await getChildEvents(PARENT_EVENT_ID);
    if (childEvents.length > 0) {
      console.log(`[STEP 1] Success! Found ${childEvents.length} child event(s):`);
      const childSummary = childEvents.map(e => ({ id: e.id, title: e.title }));
      console.log(JSON.stringify(childSummary, null, 2));
    } else {
      console.log(`[STEP 1] Success! No child events found for parent ${PARENT_EVENT_ID}.`);
      console.log('==================================================');
      console.log('[FULL TEST SCRIPT] Test finished (no children found).');
      return; // Exit if no children
    }
  } catch (error) {
    console.error(`[STEP 1] FAILED to fetch child events for parent ${PARENT_EVENT_ID}:`);
    console.error(error);
    console.log('==================================================');
    console.log('[FULL TEST SCRIPT] Test finished (failed to get children).');
    return; // Exit on failure
  }

  // 2. Fetch Packages and Definitions for EACH Child Event
  console.log(`\n[STEP 2] Fetching packages and definitions for each child event...`);
  console.log('--------------------------------------------------');
  for (const child of childEvents) {
    console.log(`\nProcessing Child Event: ID = ${child.id}, Title = ${child.title}`);
    
    // Fetch Packages for this child
    try {
      const packages = await getPackagesForEvent(child.id);
      if (Array.isArray(packages)) {
        if (packages.length > 0) {
           console.log(`  - Packages: Found ${packages.length} package(s).`);
           allPackages.push(...packages); // Add to aggregated list
           const pkgSummary = packages.map(p => ({ id: p.id, name: p.name, price: p.price }));
           console.log(`    Details: ${JSON.stringify(pkgSummary)}`);
        } else {
           console.log(`  - Packages: Found 0 packages.`);
        }
      } else {
        console.error(`  - Packages: FAILED - Unexpected result:`, packages);
      }
    } catch (error) {
      console.error(`  - Packages: FAILED for child ${child.id}:`, error);
    }

    // Fetch Definitions for this child
    try {
      const definitions = await getTicketDefinitionsForEvent(child.id);
      if (Array.isArray(definitions)) {
         if (definitions.length > 0) {
           console.log(`  - Definitions: Found ${definitions.length} active definition(s).`);
           allDefinitions.push(...definitions); // Add to aggregated list
           const defSummary = definitions.map(d => ({ id: d.id, name: d.name, price: d.price, is_active: d.is_active }));
           console.log(`    Details: ${JSON.stringify(defSummary)}`);
         } else {
           console.log(`  - Definitions: Found 0 active definitions.`);
         }
      } else {
         console.error(`  - Definitions: FAILED - Unexpected result:`, definitions);
      }
    } catch (error) {
      console.error(`  - Definitions: FAILED for child ${child.id}:`, error);
    }
    console.log('--------------------------------------------------');
  }

  // 3. Log Aggregated Results
  console.log(`\n[STEP 3] Aggregated Results:`); 
  
  // Remove duplicates (important if the same package/definition could be linked to multiple children)
  const uniquePackages = Array.from(new Map(allPackages.map(p => [p.id, p])).values());
  const uniqueDefinitions = Array.from(new Map(allDefinitions.map(d => [d.id, d])).values());

  console.log(`  - Total Unique Packages Found: ${uniquePackages.length}`);
  if (uniquePackages.length > 0) {
     const pkgSummary = uniquePackages.map(p => ({ id: p.id, name: p.name, price: p.price }));
     console.log(`    Packages Summary: ${JSON.stringify(pkgSummary, null, 2)}`);
  }

  console.log(`  - Total Unique Active Definitions Found: ${uniqueDefinitions.length}`);
  if (uniqueDefinitions.length > 0) {
      const defSummary = uniqueDefinitions.map(d => ({ id: d.id, name: d.name, price: d.price, is_active: d.is_active }));
      console.log(`    Definitions Summary: ${JSON.stringify(defSummary, null, 2)}`);
  } 
  
  console.log('==================================================');
  console.log('[FULL TEST SCRIPT] Test finished.');
}

// Execute the test function
runFullTest(); 