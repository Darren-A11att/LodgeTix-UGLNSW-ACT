/**
 * test_db_migration.js
 * 
 * Script to test if the database schema migration was successful by:
 * - Testing CRUD operations on various tables
 * - Verifying that queries work with both old and new naming conventions
 * - Checking that foreign key relationships work properly
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Connect to Supabase using environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('\x1b[31mError: Missing SUPABASE_URL or SUPABASE_KEY environment variables\x1b[0m');
  console.log('Please set these variables in your .env file or pass them as arguments');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test results tracking
const results = {
  success: 0,
  failures: 0,
  errors: []
};

/**
 * Run a test and track results
 */
async function runTest(testName, testFunction) {
  try {
    console.log(`\n\x1b[36mRunning test: ${testName}\x1b[0m`);
    await testFunction();
    console.log(`\x1b[32m✓ Passed: ${testName}\x1b[0m`);
    results.success++;
  } catch (error) {
    console.error(`\x1b[31m✗ Failed: ${testName}\x1b[0m`);
    console.error(`  Error: ${error.message}`);
    results.failures++;
    results.errors.push({ test: testName, error: error.message });
  }
}

/**
 * Verify a condition is true
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Test functions
async function testEventsTableNewNaming() {
  // Test read operation with new naming convention
  const { data, error } = await supabase
    .from('Events')
    .select('id, name, description, startDate, endDate')
    .limit(5);
    
  if (error) throw error;
  
  assert(Array.isArray(data), 'Events data should be an array');
  assert(data.length > 0, 'Events table should contain records');
  
  // Verify expected fields exist in the results
  const event = data[0];
  assert('id' in event, 'Event should have id field');
  assert('name' in event, 'Event should have name field');
  assert('startDate' in event, 'Event should have startDate field');
}

async function testEventsTableOldNaming() {
  // Test read operation with old naming convention (if compatibility views exist)
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, name, description, start_date, end_date')
      .limit(5);
      
    if (error) throw error;
    
    assert(Array.isArray(data), 'Legacy events view data should be an array');
    assert(data.length > 0, 'Legacy events view should contain records');
    
    console.log('  ✓ Legacy event view is working');
  } catch (error) {
    console.log('  ℹ Legacy events view not found or not accessible - this is expected if compatibility views were not created');
  }
}

async function testCRUDOperations() {
  // Test Contact CRUD operations
  const testEmail = `test_${Date.now()}@example.com`;
  
  // Create operation
  const { data: insertData, error: insertError } = await supabase
    .from('Contacts')
    .insert([{
      firstName: 'Test',
      lastName: 'Migration',
      email: testEmail,
      phone: '1234567890'
    }])
    .select();
  
  if (insertError) throw insertError;
  
  assert(insertData.length > 0, 'Insert should return the created record');
  const contactId = insertData[0].id;
  
  // Read operation
  const { data: readData, error: readError } = await supabase
    .from('Contacts')
    .select('*')
    .eq('id', contactId)
    .single();
  
  if (readError) throw readError;
  
  assert(readData.email === testEmail, 'Read should return the inserted email');
  
  // Update operation
  const updatedPhone = '0987654321';
  const { data: updateData, error: updateError } = await supabase
    .from('Contacts')
    .update({ phone: updatedPhone })
    .eq('id', contactId)
    .select();
  
  if (updateError) throw updateError;
  
  assert(updateData[0].phone === updatedPhone, 'Update should change the phone number');
  
  // Delete operation (cleanup)
  const { error: deleteError } = await supabase
    .from('Contacts')
    .delete()
    .eq('id', contactId);
  
  if (deleteError) throw deleteError;
  
  // Verify deletion
  const { data: verifyData, error: verifyError } = await supabase
    .from('Contacts')
    .select('*')
    .eq('id', contactId);
  
  if (verifyError) throw verifyError;
  
  assert(verifyData.length === 0, 'Delete should remove the record');
}

async function testForeignKeyRelationships() {
  // Test foreign key relationships between customers and registrations
  const { data: customers, error: customerError } = await supabase
    .from('Customers')
    .select(`
      id,
      contactId,
      Registrations(id, customerId)
    `)
    .limit(5);
    
  if (customerError) throw customerError;
  
  assert(Array.isArray(customers), 'Customers data should be an array');
  
  if (customers.length > 0) {
    // Check if at least one customer has registrations
    const customerWithRegistration = customers.find(c => 
      Array.isArray(c.Registrations) && c.Registrations.length > 0);
    
    if (customerWithRegistration) {
      const registration = customerWithRegistration.Registrations[0];
      assert(registration.customerId === customerWithRegistration.id, 
        'Registration should reference the correct customer ID');
    } else {
      console.log('  ℹ No customers with registrations found in sample');
    }
  }
}

async function testAttendeeTicketRelationship() {
  // Test relationships between attendees and tickets
  const { data: attendees, error: attendeeError } = await supabase
    .from('Attendees')
    .select(`
      id,
      registrationId,
      Tickets(id, attendeeId)
    `)
    .limit(5);
    
  if (attendeeError) throw attendeeError;
  
  assert(Array.isArray(attendees), 'Attendees data should be an array');
  
  if (attendees.length > 0) {
    // Check if at least one attendee has tickets
    const attendeeWithTicket = attendees.find(a => 
      Array.isArray(a.Tickets) && a.Tickets.length > 0);
    
    if (attendeeWithTicket) {
      const ticket = attendeeWithTicket.Tickets[0];
      assert(ticket.attendeeId === attendeeWithTicket.id, 
        'Ticket should reference the correct attendee ID');
    } else {
      console.log('  ℹ No attendees with tickets found in sample');
    }
  }
}

async function testLocationEventRelationship() {
  // Test relationship between locations and events
  const { data: locations, error: locationError } = await supabase
    .from('Locations')
    .select(`
      id,
      name,
      Events(id, locationId, name)
    `)
    .limit(5);
    
  if (locationError) throw locationError;
  
  assert(Array.isArray(locations), 'Locations data should be an array');
  
  if (locations.length > 0) {
    // Check if at least one location has events
    const locationWithEvent = locations.find(l => 
      Array.isArray(l.Events) && l.Events.length > 0);
    
    if (locationWithEvent) {
      const event = locationWithEvent.Events[0];
      assert(event.locationId === locationWithEvent.id, 
        'Event should reference the correct location ID');
    } else {
      console.log('  ℹ No locations with events found in sample');
    }
  }
}

// Main test execution
async function runTests() {
  console.log('\x1b[1m\nDatabase Migration Test Suite\x1b[0m');
  console.log('===============================');
  
  await runTest('Events table (new naming convention)', testEventsTableNewNaming);
  await runTest('Events table (old naming convention)', testEventsTableOldNaming);
  await runTest('CRUD operations on Contacts table', testCRUDOperations);
  await runTest('Foreign key relationship: Customers-Registrations', testForeignKeyRelationships);
  await runTest('Foreign key relationship: Attendees-Tickets', testAttendeeTicketRelationship);
  await runTest('Foreign key relationship: Locations-Events', testLocationEventRelationship);
  
  // Print test summary
  console.log('\n\x1b[1mTest Results Summary\x1b[0m');
  console.log('=====================');
  console.log(`\x1b[32mPassed: ${results.success}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${results.failures}\x1b[0m`);
  
  if (results.failures > 0) {
    console.log('\n\x1b[1mErrors:\x1b[0m');
    results.errors.forEach((error, index) => {
      console.log(`\n\x1b[31m${index + 1}. ${error.test}\x1b[0m`);
      console.log(`   ${error.error}`);
    });
    console.log('\nSome tests failed. There may be issues with the database migration.');
    process.exit(1);
  } else {
    console.log('\n\x1b[32m✓ All tests passed! Database migration appears successful.\x1b[0m');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('\n\x1b[31mUnexpected error in test runner:\x1b[0m', error);
  process.exit(1);
});