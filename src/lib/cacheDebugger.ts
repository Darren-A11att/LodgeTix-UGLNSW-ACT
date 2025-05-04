/**
 * Debug utilities for testing Cache functionality
 * This file provides utility functions to check localStorage caching
 * and test real-time reservation features.
 */

import { supabase } from './supabase';

// Function to display caching information in console
export function debugStorageCache() {
  try {
    // Check for the Zustand persistence
    const zustandStore = localStorage.getItem('lodgetix-location-storage');
    const ipData = localStorage.getItem('lodgetix_ip_data');
    const ipTimestamp = localStorage.getItem('lodgetix_ip_data_timestamp');
    const draftId = localStorage.getItem('lodgetix_registration_draft_id');
    
    // Collect draft data
    const draftKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('lodgetix_registration_draft_')) {
        draftKeys.push(key);
      }
    }

    console.group('🔍 LodgeTix Cache Debug');
    
    // IP Geolocation Cache
    if (ipData && ipTimestamp) {
      const timestamp = new Date(parseInt(ipTimestamp, 10));
      const ageInHours = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);
      
      console.group('📍 IP Geolocation Cache');
      console.log(`Age: ${ageInHours.toFixed(2)} hours`);
      try {
        const data = JSON.parse(ipData);
        console.log(`Country: ${data.country_name} (${data.country_code})`);
        console.log(`Region: ${data.region} (${data.region_code})`);
      } catch (e) {
        console.log(`Failed to parse IP data: ${e.message}`);
      }
      console.groupEnd();
    } else {
      console.log('📍 IP Geolocation: Not cached');
    }
    
    // Location Store Cache
    if (zustandStore) {
      console.group('🗺️ Location Store Cache');
      try {
        const store = JSON.parse(zustandStore);
        const grandLodgeCache = store.state?.grandLodgeCache;
        const lodgeCache = store.state?.lodgeCache;
        
        if (grandLodgeCache) {
          const glAge = (Date.now() - grandLodgeCache.timestamp) / (1000 * 60 * 60);
          console.log(`Grand Lodge Cache Age: ${glAge.toFixed(2)} hours`);
          console.log(`Grand Lodges Cached: ${grandLodgeCache.data?.length || 0}`);
          
          // Country breakdown
          const countries = Object.keys(grandLodgeCache.byCountry || {});
          console.log(`Countries with cached GLs: ${countries.join(', ') || 'None'}`);
          
          // Region breakdown
          const regions = Object.keys(grandLodgeCache.byRegion || {});
          console.log(`Regions with cached GLs: ${regions.join(', ') || 'None'}`);
        } else {
          console.log('No Grand Lodge cache found');
        }
        
        if (lodgeCache) {
          const glIds = Object.keys(lodgeCache.byGrandLodge || {});
          console.log(`Grand Lodges with cached Lodges: ${glIds.length}`);
          
          // Check each GL's lodge cache
          glIds.forEach(glId => {
            const cacheInfo = lodgeCache.byGrandLodge[glId];
            if (cacheInfo) {
              const age = (Date.now() - cacheInfo.timestamp) / (1000 * 60 * 60);
              console.log(`GL ${glId}: ${cacheInfo.data?.length || 0} lodges, age: ${age.toFixed(2)} hours`);
            }
          });
          
          // Region breakdown for lodges
          const regions = Object.keys(lodgeCache.byRegion || {});
          console.log(`Regions with cached Lodges: ${regions.join(', ') || 'None'}`);
        } else {
          console.log('No Lodge cache found');
        }
      } catch (e) {
        console.log(`Failed to parse Zustand store: ${e.message}`);
      }
      console.groupEnd();
    } else {
      console.log('🗺️ Location Store: Not cached');
    }
    
    // Form Draft Cache
    if (draftId && draftKeys.length) {
      console.group('📝 Registration Drafts');
      console.log(`Current Draft ID: ${draftId}`);
      console.log(`Total Drafts: ${draftKeys.length}`);
      
      // Show some info about the current draft
      const currentDraftKey = `lodgetix_registration_draft_${draftId}`;
      const currentDraftData = localStorage.getItem(currentDraftKey);
      
      if (currentDraftData) {
        try {
          const data = JSON.parse(currentDraftData);
          console.log(`Registration Type: ${data.registrationType || 'Not set'}`);
          console.log(`Step: ${data.step}`);
          console.log(`Masons: ${data.masons?.length || 0}`);
          console.log(`Guests: ${data.guests?.length || 0}`);
          console.log(`Lady Partners: ${data.ladyPartners?.length || 0}`);
          console.log(`Guest Partners: ${data.guestPartners?.length || 0}`);
        } catch (e) {
          console.log(`Failed to parse draft data: ${e.message}`);
        }
      }
      console.groupEnd();
    } else {
      console.log('📝 Registration Drafts: None found');
    }
    
    console.groupEnd();
  } catch (err) {
    console.error('Error in debugStorageCache:', err);
  }
}

// Function to clear all caches for testing
export function clearAllCaches() {
  try {
    // IP data
    localStorage.removeItem('lodgetix_ip_data');
    localStorage.removeItem('lodgetix_ip_data_timestamp');
    
    // Zustand store
    localStorage.removeItem('lodgetix-location-storage');
    
    // Registration drafts
    const draftId = localStorage.getItem('lodgetix_registration_draft_id');
    if (draftId) {
      localStorage.removeItem(`lodgetix_registration_draft_${draftId}`);
      localStorage.removeItem('lodgetix_registration_draft_id');
    }
    
    // Remove all other draft keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('lodgetix_registration_draft_')) {
        localStorage.removeItem(key);
      }
    }
    
    console.log('🧹 All caches cleared');
  } catch (err) {
    console.error('Error clearing caches:', err);
  }
}

// Helper function to check if a component is using refs properly
export function checkRefImplementation(component: string, refNames: string[]) {
  console.group(`🔍 Ref Implementation Check for ${component}`);
  
  console.log('Expected refs:');
  refNames.forEach(refName => {
    console.log(`- ${refName}`);
  });
  
  console.log('\nRecommended implementation pattern:');
  console.log(`
// 1. Import useRef
import React, { useRef } from 'react';

// 2. Create a ref for store functions
const storeActionsRef = useRef({
  searchGrandLodges: useLocationStore.getState().searchGrandLodges,
  // more store functions...
});

// 3. Use subscribe to keep refs updated
useEffect(() => {
  return useLocationStore.subscribe(
    state => [state.searchGrandLodges], 
    ([newSearchGrandLodges]) => {
      storeActionsRef.current.searchGrandLodges = newSearchGrandLodges;
    }
  );
}, []);

// 4. Use the function via ref
const handleSearch = () => {
  storeActionsRef.current.searchGrandLodges('search term');
};`);
  
  console.groupEnd();
}

/**
 * Clear all local storage items related to reservations and registration
 */
export const clearAllReservationData = (): void => {
  try {
    // Clear reservation-specific storage
    localStorage.removeItem('lodgetix_reservation_data');
    localStorage.removeItem('lodgetix_reservation_expiry');
    localStorage.removeItem('lodgetix_registration_type');
    
    // Clear all progress-related storage items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('lodgetix_progress_') || 
        key.startsWith('lodgetix_draft_')
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Remove collected keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('✅ All reservation and progress data cleared from localStorage');
  } catch (error) {
    console.error('Error clearing reservation data:', error);
  }
};

/**
 * Simulate high demand by creating multiple reservation channels
 * @param eventId The event ID to create simulated demand for
 * @param count Number of "fake" users to simulate
 */
export const simulateHighDemand = async (
  eventId: string,
  count: number = 5
): Promise<{ cleanup: () => void }> => {
  const channels: any[] = [];
  const clients: string[] = [];
  
  try {
    for (let i = 0; i < count; i++) {
      const clientId = `sim-client-${Date.now()}-${i}`;
      clients.push(clientId);
      
      // Create a presence channel for this fake client
      const channel = supabase.channel(`presence-tickets-${eventId}`, {
        config: {
          presence: {
            key: clientId,
          },
        },
      });
      
      // Set up the channel
      await channel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // Track this simulated client viewing the event
          await channel.track({
            clientId: clientId,
            eventId: eventId,
            viewingSince: Date.now(),
            isReserving: i % 2 === 0, // Make half of them actively reserving
          });
        }
      });
      
      channels.push(channel);
    }
    
    console.log(`✅ Simulated ${count} users (${Math.ceil(count / 2)} actively reserving) for event ${eventId}`);
    
    // Return cleanup function
    return {
      cleanup: () => {
        channels.forEach(channel => {
          supabase.removeChannel(channel);
        });
        console.log(`✅ Removed ${count} simulated users for event ${eventId}`);
      }
    };
  } catch (error) {
    console.error('Error simulating high demand:', error);
    // Clean up any created channels
    channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    throw error;
  }
};

/**
 * Debug function to list all active channels
 */
export const logActiveChannels = (): void => {
  try {
    const channels = (supabase as any).getChannels();
    console.log(`Current active channels (${channels.length}):`);
    channels.forEach((channel: any, index: number) => {
      console.log(`${index + 1}. ${channel.topic} (${channel.state})`);
    });
  } catch (error) {
    console.error('Error logging active channels:', error);
  }
};

/**
 * Creates a mock reservation for testing
 */
export const createMockReservation = (
  eventId: string = 'event-123',
  ticketDefinitionId: string = 'ticket-def-456',
  expiresInMinutes: number = 10
): void => {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInMinutes * 60000);
    
    const mockReservation = {
      ticketId: `ticket-${Date.now()}`,
      reservationId: `reservation-${Date.now()}`,
      expiresAt: expiresAt.toISOString(),
      eventId,
      ticketDefinitionId
    };
    
    // Store in localStorage
    localStorage.setItem('lodgetix_reservation_data', JSON.stringify(mockReservation));
    localStorage.setItem('lodgetix_reservation_expiry', expiresAt.getTime().toString());
    
    console.log(`✅ Created mock reservation that expires in ${expiresInMinutes} minutes:`, mockReservation);
  } catch (error) {
    console.error('Error creating mock reservation:', error);
  }
};

// Add a global debug function
(window as any).lodgetixDebug = {
  showCache: debugStorageCache,
  clearCache: clearAllCaches,
  checkRefs: checkRefImplementation,
  
  // Reservation testing utilities
  clearReservationData: clearAllReservationData,
  simulateHighDemand,
  logActiveChannels,
  createMockReservation,
  
  // Test a full scenario
  testReservationFlow: async (eventId: string = 'event-123') => {
    console.group('🎭 Testing Reservation Flow');
    console.log('1. Simulating high demand with 8 users...');
    const { cleanup } = await simulateHighDemand(eventId, 8);
    
    console.log('2. Creating a mock reservation expiring in 2 minutes...');
    createMockReservation(eventId, 'ticket-def-456', 2);
    
    console.log('3. Displaying active channels...');
    logActiveChannels();
    
    console.log('4. Wait 2 minutes for reservation to expire, then check status again');
    console.log('5. Run lodgetixDebug.clearReservationData() when done');
    console.log('6. Run cleanup() to remove simulated users when done');
    
    console.groupEnd();
    
    return { cleanup };
  }
};

// Export default object for importing
export default {
  debugStorageCache,
  clearAllCaches,
  checkRefImplementation,
  clearAllReservationData,
  simulateHighDemand,
  logActiveChannels,
  createMockReservation
};