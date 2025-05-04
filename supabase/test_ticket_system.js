/**
 * Test script to validate the ticket system upgrade
 * Run this after applying the migrations
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTicketSystem() {
  console.log('Testing Ticket System Upgrade...');
  
  // Step 1: Check for EventTickets table
  console.log('\n1. Checking EventTickets table...');
  const { data: eventTickets, error: eventTicketsError } = await supabase
    .from('EventTickets')
    .select('*')
    .limit(5);
    
  if (eventTicketsError) {
    console.error('❌ Error accessing EventTickets table:', eventTicketsError.message);
  } else {
    console.log(`✅ EventTickets table exists with ${eventTickets.length} records`);
    console.log(eventTickets);
  }
  
  // Step 2: Check for TicketDefinitions table
  console.log('\n2. Checking TicketDefinitions table...');
  const { data: ticketDefs, error: ticketDefsError } = await supabase
    .from('TicketDefinitions')
    .select('*')
    .limit(5);
    
  if (ticketDefsError) {
    console.error('❌ Error accessing TicketDefinitions table:', ticketDefsError.message);
  } else {
    console.log(`✅ TicketDefinitions table exists with ${ticketDefs.length} records`);
    if (ticketDefs.length > 0) {
      // We'll use this for testing the reservation function
      const testTicketDefId = ticketDefs[0].ticketDefinitionId;
      console.log(`   Using ticket definition ID for testing: ${testTicketDefId}`);
      
      // Step 3: Test the reservation function
      console.log('\n3. Testing reserve_tickets_v3 function...');
      try {
        const { data: reservation, error: reservationError } = await supabase.rpc('reserve_tickets_v3', {
          p_event_id: ticketDefs[0].eventId,
          p_ticket_definition_id: testTicketDefId,
          p_quantity: 1,
          p_reservation_minutes: 15
        });
        
        if (reservationError) {
          console.error('❌ Error calling reserve_tickets_v3:', reservationError.message);
        } else {
          console.log('✅ Successfully reserved a ticket:');
          console.log(reservation);
          
          // Step 4: Test cancellation
          if (reservation && reservation.length > 0) {
            const reservationId = reservation[0].reservation_id;
            console.log('\n4. Testing cancel_reservation function...');
            
            const { data: cancelResult, error: cancelError } = await supabase.rpc('cancel_reservation', {
              p_reservation_id: reservationId
            });
            
            if (cancelError) {
              console.error('❌ Error calling cancel_reservation:', cancelError.message);
            } else {
              console.log(`✅ Successfully cancelled reservation: ${cancelResult}`);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error testing reservation functions:', error.message);
      }
    }
  }
  
  // Step 5: Check for reserve_tickets_v3 function
  console.log('\n5. Checking for new functions...');
  try {
    // We can't directly query for functions, so we'll use a trick to check if they exist
    // by looking at the error message when calling them with invalid parameters
    const { error } = await supabase.rpc('reserve_tickets_v3', {
      p_event_id: 'invalid',
      p_ticket_definition_id: 'invalid',
      p_quantity: 0,
      p_reservation_minutes: 0
    });
    
    // If we get a specific validation error, the function exists
    if (error && error.message.includes('quantity must be greater than 0')) {
      console.log('✅ reserve_tickets_v3 function exists');
    } else if (error && error.message.includes('function')) {
      console.error('❌ reserve_tickets_v3 function does not exist');
    } else {
      console.warn('⚠️ Could not verify reserve_tickets_v3 function');
    }
  } catch (error) {
    console.error('❌ Error checking functions:', error.message);
  }
  
  console.log('\nTest complete!');
}

testTicketSystem().catch(error => {
  console.error('Unhandled error:', error);
});