/**
 * Comprehensive test script for the registration flow
 * This script tests the entire flow from ticket selection to payment
 * 
 * To run:
 * node scripts/test_registration_flow.js
 */

const { chromium } = require('playwright');
const assert = require('assert');
require('dotenv').config();

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword';
const HEADLESS = process.env.TEST_HEADLESS !== 'false'; // Default to headless

// Test data
const testData = {
  mason: {
    firstName: 'John',
    lastName: 'Mason',
    email: TEST_EMAIL,
    phone: '0412345678',
    title: 'Bro',
    rank: 'Master Mason',
    grandLodge: 'United Grand Lodge of NSW & ACT',
    lodgeName: 'Test Lodge',
    lodgeNumber: '123',
    dietaryRequirements: 'None',
    specialNeeds: 'None'
  },
  lady: {
    firstName: 'Jane',
    lastName: 'Mason',
    email: 'partner@example.com',
    phone: '0412345679',
    dietaryRequirements: 'Vegetarian',
    specialNeeds: 'None'
  },
  guest: {
    firstName: 'Guest',
    lastName: 'User',
    email: 'guest@example.com',
    phone: '0412345680',
    dietaryRequirements: 'None',
    specialNeeds: 'None'
  }
};

/**
 * Main test function
 */
async function runTests() {
  // Launch browser
  const browser = await chromium.launch({ headless: HEADLESS });
  console.log('Browser launched');
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  // Create a new page
  const page = await context.newPage();
  console.log('Page created');
  
  try {
    // Test basic navigation
    await testNavigation(page);
    
    // Test event listing and details
    await testEventListing(page);
    
    // Test registration as Mason with Lady Partner
    await testMasonRegistration(page);
    
    // Test registration as Guest
    await testGuestRegistration(page);
    
    // Test package registration
    await testPackageRegistration(page);
    
    // Test VAS selection
    await testVasSelection(page);
    
    // All tests passed
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    
    // Take a screenshot of the failure
    await page.screenshot({ path: 'test-failure.png' });
    console.log('Screenshot saved to test-failure.png');
  } finally {
    // Clean up
    await browser.close();
    console.log('Browser closed');
  }
}

/**
 * Test basic site navigation
 */
async function testNavigation(page) {
  console.log('\n🔍 Testing basic navigation...');
  
  // Go to home page
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  console.log('Loaded home page');
  
  // Check title
  const title = await page.title();
  assert(title.includes('LodgeTix'), `Title should include LodgeTix but was: ${title}`);
  
  // Navigate to events page
  await page.click('text=Events');
  await page.waitForURL(`${BASE_URL}/events`);
  console.log('Navigated to events page');
  
  // Check events page title
  const eventsHeading = await page.textContent('h1');
  assert(eventsHeading.includes('Events'), `Events heading should contain "Events" but was: ${eventsHeading}`);
  
  console.log('✅ Basic navigation tests passed');
}

/**
 * Test event listing and details
 */
async function testEventListing(page) {
  console.log('\n🔍 Testing event listing and details...');
  
  // Go to events page
  await page.goto(`${BASE_URL}/events`);
  await page.waitForLoadState('networkidle');
  
  // Wait for events to load
  await page.waitForSelector('[data-testid="event-card"]');
  
  // Count events
  const eventCount = await page.$$eval('[data-testid="event-card"]', cards => cards.length);
  console.log(`Found ${eventCount} events`);
  assert(eventCount > 0, 'Should have at least one event');
  
  // Click on the first event
  await page.click('[data-testid="event-card"]:first-child');
  await page.waitForSelector('[data-testid="event-details"]');
  console.log('Navigated to event details page');
  
  // Check details page elements
  const detailsTitle = await page.textContent('[data-testid="event-title"]');
  assert(detailsTitle, 'Event title should be present');
  console.log(`Event title: ${detailsTitle}`);
  
  // Check if Register button exists
  const hasRegisterButton = await page.isVisible('text=Register');
  assert(hasRegisterButton, 'Register button should be visible');
  
  console.log('✅ Event listing and details tests passed');
}

/**
 * Test registration as Mason with Lady Partner
 */
async function testMasonRegistration(page) {
  console.log('\n🔍 Testing Mason registration with Lady Partner...');
  
  // Go to events page and select first event
  await page.goto(`${BASE_URL}/events`);
  await page.waitForLoadState('networkidle');
  await page.click('[data-testid="event-card"]:first-child');
  await page.waitForSelector('[data-testid="event-details"]');
  
  // Click Register button
  await page.click('text=Register');
  await page.waitForURL(/.*\/register/);
  console.log('Navigated to registration page');
  
  // Select Mason registration type
  await page.click('text=Register as Mason');
  await page.waitForSelector('[data-testid="mason-form"]');
  console.log('Selected Mason registration type');
  
  // Fill Mason form
  await page.fill('[data-testid="mason-firstName"]', testData.mason.firstName);
  await page.fill('[data-testid="mason-lastName"]', testData.mason.lastName);
  await page.fill('[data-testid="mason-email"]', testData.mason.email);
  await page.fill('[data-testid="mason-phone"]', testData.mason.phone);
  
  // Fill Lodge information
  await page.selectOption('[data-testid="mason-grand-lodge"]', { label: testData.mason.grandLodge });
  await page.fill('[data-testid="mason-lodge-name"]', testData.mason.lodgeName);
  await page.fill('[data-testid="mason-lodge-number"]', testData.mason.lodgeNumber);
  
  // Add Lady Partner
  await page.check('[data-testid="lady-partner-toggle"]');
  await page.waitForSelector('[data-testid="lady-partner-form"]');
  console.log('Added Lady Partner');
  
  // Fill Lady Partner form
  await page.fill('[data-testid="lady-firstName"]', testData.lady.firstName);
  await page.fill('[data-testid="lady-lastName"]', testData.lady.lastName);
  await page.fill('[data-testid="lady-email"]', testData.lady.email);
  await page.fill('[data-testid="lady-phone"]', testData.lady.phone);
  
  // Select tickets
  await page.click('[data-testid="ticket-selection"]');
  await page.waitForSelector('[data-testid="ticket-list"]');
  console.log('Navigated to ticket selection');
  
  // Select first available ticket for Mason
  await page.click('[data-testid="ticket-item-mason"]:first-child');
  
  // Select first available ticket for Lady Partner
  await page.click('[data-testid="ticket-item-lady"]:first-child');
  
  // Click Continue
  await page.click('text=Continue to Payment');
  await page.waitForSelector('[data-testid="payment-section"]');
  console.log('Proceeded to payment section');
  
  // Verify order summary
  const totalAmount = await page.textContent('[data-testid="total-amount"]');
  assert(totalAmount.includes('$'), 'Total amount should include $ symbol');
  console.log(`Order total: ${totalAmount}`);
  
  // For testing, we'll stop before actual payment
  console.log('✅ Mason registration tests passed');
}

/**
 * Test registration as Guest
 */
async function testGuestRegistration(page) {
  console.log('\n🔍 Testing Guest registration...');
  
  // Go to events page and select first event
  await page.goto(`${BASE_URL}/events`);
  await page.waitForLoadState('networkidle');
  await page.click('[data-testid="event-card"]:first-child');
  await page.waitForSelector('[data-testid="event-details"]');
  
  // Click Register button
  await page.click('text=Register');
  await page.waitForURL(/.*\/register/);
  console.log('Navigated to registration page');
  
  // Select Guest registration type
  await page.click('text=Register as Guest');
  await page.waitForSelector('[data-testid="guest-form"]');
  console.log('Selected Guest registration type');
  
  // Fill Guest form
  await page.fill('[data-testid="guest-firstName"]', testData.guest.firstName);
  await page.fill('[data-testid="guest-lastName"]', testData.guest.lastName);
  await page.fill('[data-testid="guest-email"]', testData.guest.email);
  await page.fill('[data-testid="guest-phone"]', testData.guest.phone);
  
  // Select tickets
  await page.click('[data-testid="ticket-selection"]');
  await page.waitForSelector('[data-testid="ticket-list"]');
  console.log('Navigated to ticket selection');
  
  // Select first available ticket for Guest
  await page.click('[data-testid="ticket-item-guest"]:first-child');
  
  // Click Continue
  await page.click('text=Continue to Payment');
  await page.waitForSelector('[data-testid="payment-section"]');
  console.log('Proceeded to payment section');
  
  // Verify order summary
  const totalAmount = await page.textContent('[data-testid="total-amount"]');
  assert(totalAmount.includes('$'), 'Total amount should include $ symbol');
  console.log(`Order total: ${totalAmount}`);
  
  // For testing, we'll stop before actual payment
  console.log('✅ Guest registration tests passed');
}

/**
 * Test package registration
 */
async function testPackageRegistration(page) {
  console.log('\n🔍 Testing Package registration...');
  
  // Go to events page and find an event with packages
  await page.goto(`${BASE_URL}/events`);
  await page.waitForLoadState('networkidle');
  
  // Look for events with package indicator
  const packageEvents = await page.$$('[data-testid="event-card"][data-has-packages="true"]');
  
  if (packageEvents.length === 0) {
    console.log('No events with packages found, skipping package test');
    return;
  }
  
  // Click on the first event with packages
  await packageEvents[0].click();
  await page.waitForSelector('[data-testid="event-details"]');
  
  // Click Register button
  await page.click('text=Register');
  await page.waitForURL(/.*\/register/);
  console.log('Navigated to registration page');
  
  // Select Mason registration type
  await page.click('text=Register as Mason');
  await page.waitForSelector('[data-testid="mason-form"]');
  console.log('Selected Mason registration type');
  
  // Fill Mason form
  await page.fill('[data-testid="mason-firstName"]', testData.mason.firstName);
  await page.fill('[data-testid="mason-lastName"]', testData.mason.lastName);
  await page.fill('[data-testid="mason-email"]', testData.mason.email);
  await page.fill('[data-testid="mason-phone"]', testData.mason.phone);
  
  // Fill Lodge information
  await page.selectOption('[data-testid="mason-grand-lodge"]', { label: testData.mason.grandLodge });
  await page.fill('[data-testid="mason-lodge-name"]', testData.mason.lodgeName);
  await page.fill('[data-testid="mason-lodge-number"]', testData.mason.lodgeNumber);
  
  // Select package
  await page.click('[data-testid="package-selection"]');
  await page.waitForSelector('[data-testid="package-list"]');
  console.log('Navigated to package selection');
  
  // Select first available package
  await page.click('[data-testid="package-item"]:first-child');
  
  // Click Reserve Package
  await page.click('text=Reserve Package');
  await page.waitForSelector('[data-testid="package-reserved"]');
  console.log('Package reserved');
  
  // Click Continue
  await page.click('text=Continue to Payment');
  await page.waitForSelector('[data-testid="payment-section"]');
  console.log('Proceeded to payment section');
  
  // Verify order summary
  const totalAmount = await page.textContent('[data-testid="total-amount"]');
  assert(totalAmount.includes('$'), 'Total amount should include $ symbol');
  console.log(`Order total: ${totalAmount}`);
  
  // For testing, we'll stop before actual payment
  console.log('✅ Package registration tests passed');
}

/**
 * Test VAS selection
 */
async function testVasSelection(page) {
  console.log('\n🔍 Testing Value-Added Services selection...');
  
  // Go to events page and select first event
  await page.goto(`${BASE_URL}/events`);
  await page.waitForLoadState('networkidle');
  await page.click('[data-testid="event-card"]:first-child');
  await page.waitForSelector('[data-testid="event-details"]');
  
  // Click Register button
  await page.click('text=Register');
  await page.waitForURL(/.*\/register/);
  console.log('Navigated to registration page');
  
  // Select Mason registration type
  await page.click('text=Register as Mason');
  await page.waitForSelector('[data-testid="mason-form"]');
  console.log('Selected Mason registration type');
  
  // Fill Mason form
  await page.fill('[data-testid="mason-firstName"]', testData.mason.firstName);
  await page.fill('[data-testid="mason-lastName"]', testData.mason.lastName);
  await page.fill('[data-testid="mason-email"]', testData.mason.email);
  await page.fill('[data-testid="mason-phone"]', testData.mason.phone);
  
  // Fill Lodge information
  await page.selectOption('[data-testid="mason-grand-lodge"]', { label: testData.mason.grandLodge });
  await page.fill('[data-testid="mason-lodge-name"]', testData.mason.lodgeName);
  await page.fill('[data-testid="mason-lodge-number"]', testData.mason.lodgeNumber);
  
  // Select tickets
  await page.click('[data-testid="ticket-selection"]');
  await page.waitForSelector('[data-testid="ticket-list"]');
  console.log('Navigated to ticket selection');
  
  // Select first available ticket for Mason
  await page.click('[data-testid="ticket-item-mason"]:first-child');
  
  // Check for VAS section
  const hasVasSection = await page.isVisible('[data-testid="vas-section"]');
  
  if (!hasVasSection) {
    console.log('No VAS options available for this event, skipping VAS test');
    return;
  }
  
  // Click on VAS section
  await page.click('[data-testid="vas-section"]');
  await page.waitForSelector('[data-testid="vas-list"]');
  console.log('Opened VAS selection');
  
  // Select first VAS item
  await page.click('[data-testid="vas-item"]:first-child');
  
  // Click Continue
  await page.click('text=Continue to Payment');
  await page.waitForSelector('[data-testid="payment-section"]');
  console.log('Proceeded to payment section');
  
  // Verify VAS in order summary
  const orderSummary = await page.textContent('[data-testid="order-summary"]');
  assert(orderSummary.includes('Added Services') || orderSummary.includes('VAS'), 
    'Order summary should include VAS items');
  
  console.log('✅ VAS selection tests passed');
}

// Run the tests
runTests().catch(console.error);