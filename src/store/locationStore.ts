import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAllGrandLodges, GrandLodgeRow } from '../lib/api/grandLodges';
import { getLodgesByGrandLodgeId, LodgeRow } from '../lib/api/lodges';

// Constants for localStorage keys
const GRAND_LODGE_CACHE_KEY = 'lodgetix_grand_lodge_cache';
const LODGE_CACHE_KEY = 'lodgetix_lodge_cache';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Define the structure of the IP API response data we care about
interface IpApiData {
  ip: string;
  network: string;
  version: string;
  city: string;
  region: string;
  region_code: string;
  country: string;
  country_name: string;
  country_code: string; // e.g., 'AU'
  country_code_iso3: string; // e.g., 'AUS'
  country_capital: string;
  country_tld: string;
  continent_code: string;
  in_eu: boolean;
  postal: string;
  latitude: number;
  longitude: number;
  timezone: string;
  utc_offset: string;
  country_calling_code: string;
  currency: string;
  currency_name: string;
  languages: string;
  country_area: number;
  country_population: number;
  asn: string;
  org: string;
}

// Define default location data (e.g., Australia)
const defaultIpData: IpApiData = {
  ip: '103.237.136.222',
  network: '', // Assuming this isn't provided, keep default or leave empty
  version: 'IPv4', // Assuming IPv4 based on address format
  city: 'Belrose',
  region: 'New South Wales',
  region_code: 'NSW', // Standard abbreviation for New South Wales
  country: 'Australia',
  country_name: 'Australia',
  country_code: 'AU',
  country_code_iso3: 'AUS',
  country_capital: 'Canberra',
  country_tld: '.au',
  continent_code: 'OC',
  in_eu: false,
  postal: '2085',
  latitude: -33.7266,
  longitude: 151.2161,
  timezone: 'Australia/Sydney',
  utc_offset: '+1000',
  country_calling_code: '61',
  currency: 'AUD',
  currency_name: 'Australian Dollar',
  languages: 'en-AU',
  country_area: 7692024, // Keeping the existing country area/population
  country_population: 25499884,
  asn: 'AS7474',
  org: 'SingTel Optus Pty Ltd',
};

// Cache structure for grand lodges
interface GrandLodgeCache {
  data: GrandLodgeRow[];
  timestamp: number;
  byCountry: Record<string, GrandLodgeRow[]>;
  byRegion: Record<string, GrandLodgeRow[]>;
}

// Cache structure for lodges
interface LodgeCache {
  byGrandLodge: Record<string, {
    data: LodgeRow[];
    timestamp: number;
  }>;
  byRegion: Record<string, {
    data: LodgeRow[];
    timestamp: number;
  }>;
}

// Default empty caches
const defaultGrandLodgeCache: GrandLodgeCache = {
  data: [],
  timestamp: 0,
  byCountry: {},
  byRegion: {},
};

const defaultLodgeCache: LodgeCache = {
  byGrandLodge: {},
  byRegion: {},
};

// Export the state interface
export interface LocationState {
  ipData: IpApiData;
  isLoading: boolean;
  error: string | null;
  fetchIpData: () => Promise<void>;

  // Grand Lodge State
  grandLodges: GrandLodgeRow[];
  grandLodgeCache: GrandLodgeCache;
  isLoadingGrandLodges: boolean;
  grandLodgeError: string | null;
  fetchInitialGrandLodges: () => Promise<void>;
  searchGrandLodges: (searchTerm: string) => Promise<void>;
  preloadGrandLodgesByCountry: (countryCode: string) => Promise<void>;
  preloadGrandLodgesByRegion: (regionCode: string) => Promise<void>;
  
  // Lodge State
  lodgeCache: LodgeCache;
  isLoadingLodges: boolean;
  lodgeError: string | null;
  getLodgesByGrandLodge: (grandLodgeId: string, searchTerm?: string) => Promise<LodgeRow[]>;
  preloadLodgesByRegion: (regionCode: string) => Promise<void>;
  clearCaches: () => void;
}

// Define the state creator type
type LocationStateCreator = StateCreator<LocationState>;

// Helper function to check if cache is expired
const isCacheExpired = (timestamp: number): boolean => {
  return Date.now() - timestamp > CACHE_EXPIRY_MS;
};

// Create the store with persistence
export const useLocationStore = create<LocationState>(
  persist(
    (set, get) => ({
      ipData: defaultIpData,
      isLoading: true,
      error: null,
      
      // Grand Lodge Initial State
      grandLodges: [],
      grandLodgeCache: defaultGrandLodgeCache,
      isLoadingGrandLodges: false,
      grandLodgeError: null,
      
      // Lodge Initial State
      lodgeCache: defaultLodgeCache,
      isLoadingLodges: false,
      lodgeError: null,

      // Action to fetch IP data with caching and rate limit protection
      fetchIpData: async () => {
        // First check localStorage for cached IP data
        try {
          const cachedIpData = localStorage.getItem('lodgetix_ip_data');
          const cachedTimestamp = localStorage.getItem('lodgetix_ip_data_timestamp');
          
          // If we have cached data and it's less than 7 days old, use it
          if (cachedIpData && cachedTimestamp) {
            const timestamp = parseInt(cachedTimestamp, 10);
            const now = Date.now();
            const cacheAge = now - timestamp;
            
            // Cache is valid for 7 days (same as other caches)
            if (cacheAge < CACHE_EXPIRY_MS) {
              try {
                const parsedData = JSON.parse(cachedIpData) as IpApiData;
                console.log('Using cached IP geolocation data');
                set({ ipData: parsedData, isLoading: false });
                
                // Still trigger preloads based on cached data
                if (parsedData.country_code) {
                  setTimeout(() => {
                    get().preloadGrandLodgesByCountry(parsedData.country_code);
                    if (parsedData.region_code) {
                      get().preloadGrandLodgesByRegion(parsedData.region_code);
                      get().preloadLodgesByRegion(parsedData.region_code);
                    }
                  }, 0);
                }
                
                // Return early, no need to fetch again
                return;
              } catch (parseError) {
                console.warn('Error parsing cached IP data:', parseError);
                // Continue to fetch new data if parsing failed
              }
            }
          }
          
          // If we get here, we need to fetch fresh data
          set({ isLoading: true, error: null });
          
          // Set a timeout for the fetch operation
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          // Use a more reliable approach with fallback to default data
          let data: IpApiData;
          try {
            // Try a different IP API that has better CORS support
            const apiUrl = 'https://api.ipgeolocation.io/ipgeo?apiKey=2dd0e8e53da4472fa4b26f9a2df24baf';
            
            const response = await fetch(apiUrl, {
              signal: controller.signal,
              // Add cache control to prevent caching issues
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
              console.warn(`IP API returned status ${response.status}, using default data`);
              data = defaultIpData;
            } else {
              const ipResponse = await response.json();
              
              // Map the response format to our expected IpApiData structure
              data = {
                ip: ipResponse.ip || '',
                network: '',
                version: '',
                city: ipResponse.city || '',
                region: ipResponse.state_prov || '',
                region_code: ipResponse.state_code || '',
                country: ipResponse.country_name || '',
                country_name: ipResponse.country_name || '',
                country_code: ipResponse.country_code2 || '',
                country_code_iso3: ipResponse.country_code3 || '',
                country_capital: ipResponse.country_capital || '',
                country_tld: ipResponse.country_tld || '',
                continent_code: ipResponse.continent_code || '',
                in_eu: false,
                postal: ipResponse.zipcode || '',
                latitude: ipResponse.latitude || 0,
                longitude: ipResponse.longitude || 0,
                timezone: ipResponse.time_zone?.name || '',
                utc_offset: ipResponse.time_zone?.offset || '',
                country_calling_code: ipResponse.calling_code || '',
                currency: ipResponse.currency?.code || '',
                currency_name: ipResponse.currency?.name || '',
                languages: ipResponse.languages || '',
                country_area: 0,
                country_population: 0,
                asn: '',
                org: ipResponse.organization || ''
              };
            }
          } catch (fetchError) {
            console.warn('Error fetching IP data, using default:', fetchError);
            data = defaultIpData;
          }
          
          // Save to cache regardless of source
          try {
            localStorage.setItem('lodgetix_ip_data', JSON.stringify(data));
            localStorage.setItem('lodgetix_ip_data_timestamp', Date.now().toString());
          } catch (storageError) {
            console.warn('Failed to cache IP data:', storageError);
          }
          
          // Update state
          set({ ipData: data, isLoading: false });
          
          // Trigger preloads
          if (data.country_code) {
            setTimeout(() => {
              get().preloadGrandLodgesByCountry(data.country_code);
              if (data.region_code) {
                get().preloadGrandLodgesByRegion(data.region_code);
                get().preloadLodgesByRegion(data.region_code);
              }
            }, 0);
          }
        } catch (error: any) {
          console.error("Failed in IP data handling:", error);
          // Fall back to default data in case of any error
          set({ 
            ipData: defaultIpData, 
            isLoading: false,
            error: error.name === 'AbortError' ? 'IP detection timed out.' : 'Failed to detect country.'
          }); 
        }
      },

      // Action to fetch initial Grand Lodges with smart location-based caching
      fetchInitialGrandLodges: async () => {
        // Get current state
        const { grandLodgeCache, ipData } = get();
        
        // Check if we have country-specific cache first (preferred)
        if (ipData?.country_code && 
            grandLodgeCache.byCountry[ipData.country_code]?.length > 0 && 
            !isCacheExpired(grandLodgeCache.timestamp)) {
          console.log(`Using country-specific Grand Lodges cache for ${ipData.country_name}`);
          
          // Use the country-specific cache instead of the full global cache
          const countryData = grandLodgeCache.byCountry[ipData.country_code];
          
          set({
            grandLodges: countryData,
            isLoadingGrandLodges: false
          });
          return;
        }
        
        // Fall back to general cache if we have it
        if (grandLodgeCache.data.length > 0 && !isCacheExpired(grandLodgeCache.timestamp)) {
          console.log('Using global Grand Lodges cache');
          set({
            grandLodges: grandLodgeCache.data,
            isLoadingGrandLodges: false
          });
          return;
        }

        // Prevent re-fetching if already loading
        if (get().isLoadingGrandLodges) return;

        set({
          isLoadingGrandLodges: true,
          grandLodgeError: null,
        });

        try {
          // If we have country data, fetch lodges filtered to the user's country
          if (ipData?.country_code) {
            console.log(`Fetching Grand Lodges for ${ipData.country_name} (${ipData.country_code})`);
            const data = await getAllGrandLodges({ searchTerm: ipData.country_code });
            
            // Update both state and cache
            set({
              grandLodges: data,
              grandLodgeCache: {
                ...grandLodgeCache,
                data, // Still store in main cache
                byCountry: {
                  ...grandLodgeCache.byCountry,
                  [ipData.country_code]: data
                },
                timestamp: Date.now()
              },
              isLoadingGrandLodges: false,
            });
          } else {
            // Fall back to fetching all grand lodges if no country data available
            console.log(`Fetching all Grand Lodges (no country data available)`);
            const data = await getAllGrandLodges();
            
            // Update both state and cache
            set({
              grandLodges: data,
              grandLodgeCache: {
                ...grandLodgeCache,
                data,
                timestamp: Date.now()
              },
              isLoadingGrandLodges: false,
            });
          }
        } catch (error) {
          console.error(`Error fetching initial grand lodges:`, error);
          set({
            grandLodgeError: "Failed to load Grand Lodges.",
            isLoadingGrandLodges: false,
          });
        }
      },

      // Action to search Grand Lodges with caching consideration
      searchGrandLodges: async (searchTerm: string) => {
        // Prevent searching if currently loading
        if (get().isLoadingGrandLodges) {
          console.log("Skipping search, already loading...");
          return;
        }

        // If search term is empty, use cached data if available
        if (!searchTerm || searchTerm.trim() === '') {
          console.log("Search term empty, using cached or fetching initial GLs...");
          await get().fetchInitialGrandLodges();
          return;
        }
        
        set({
          isLoadingGrandLodges: true,
          grandLodgeError: null,
        });

        try {
          console.log(`Searching Grand Lodges for: '${searchTerm}'`);
          const data = await getAllGrandLodges({ searchTerm });
          
          // Update the displayed grand lodges
          set({
            grandLodges: data,
            isLoadingGrandLodges: false,
          });
          
          // Also update the main cache if we got significant results
          if (data.length > 0) {
            const { grandLodgeCache } = get();
            // Only update the main cache if it's empty or has fewer items than our search results
            if (grandLodgeCache.data.length === 0 || data.length > grandLodgeCache.data.length) {
              set({
                grandLodgeCache: {
                  ...grandLodgeCache,
                  data,
                  timestamp: Date.now()
                }
              });
            }
          }
        } catch (error) {
          console.error("Error searching grand lodges:", error);
          set({
            grandLodgeError: "Failed to search Grand Lodges.",
            isLoadingGrandLodges: false,
          });
        }
      },
      
      // Preload grand lodges by country and cache them
      preloadGrandLodgesByCountry: async (countryCode: string) => {
        const { grandLodgeCache } = get();
        
        // Check if we already have cached data for this country
        if (grandLodgeCache.byCountry[countryCode] && 
            !isCacheExpired(grandLodgeCache.timestamp)) {
          console.log(`Using cached Grand Lodges for country: ${countryCode}`);
          return;
        }
        
        try {
          console.log(`Preloading Grand Lodges for country: ${countryCode}`);
          const data = await getAllGrandLodges({ 
            searchTerm: countryCode 
          });
          
          // Update the country-specific cache
          set({
            grandLodgeCache: {
              ...grandLodgeCache,
              byCountry: {
                ...grandLodgeCache.byCountry,
                [countryCode]: data
              },
              timestamp: Date.now()
            }
          });
          
          // If our main data cache is empty, update it too
          if (grandLodgeCache.data.length === 0) {
            set({
              grandLodges: data,
              grandLodgeCache: {
                ...get().grandLodgeCache,
                data,
              }
            });
          }
        } catch (error) {
          console.error(`Error preloading Grand Lodges for country ${countryCode}:`, error);
        }
      },
      
      // Preload grand lodges by region and cache them
      preloadGrandLodgesByRegion: async (regionCode: string) => {
        const { grandLodgeCache } = get();
        
        // Check if we already have cached data for this region
        if (grandLodgeCache.byRegion[regionCode] && 
            !isCacheExpired(grandLodgeCache.timestamp)) {
          console.log(`Using cached Grand Lodges for region: ${regionCode}`);
          return;
        }
        
        try {
          console.log(`Preloading Grand Lodges for region: ${regionCode}`);
          const data = await getAllGrandLodges({ 
            searchTerm: regionCode 
          });
          
          // Update the region-specific cache
          set({
            grandLodgeCache: {
              ...grandLodgeCache,
              byRegion: {
                ...grandLodgeCache.byRegion,
                [regionCode]: data
              },
              timestamp: Date.now()
            }
          });
        } catch (error) {
          console.error(`Error preloading Grand Lodges for region ${regionCode}:`, error);
        }
      },
      
      // Get lodges by grand lodge ID with caching
      getLodgesByGrandLodge: async (grandLodgeId: string, searchTerm?: string): Promise<LodgeRow[]> => {
        const { lodgeCache } = get();
        
        // If searching specifically, bypass cache
        if (searchTerm) {
          set({ isLoadingLodges: true });
          try {
            const data = await getLodgesByGrandLodgeId(grandLodgeId, searchTerm);
            set({ isLoadingLodges: false });
            return data;
          } catch (error) {
            console.error(`Error fetching lodges for GL ${grandLodgeId} with term ${searchTerm}:`, error);
            set({ 
              isLoadingLodges: false,
              lodgeError: "Failed to search Lodges."
            });
            return [];
          }
        }
        
        // Check if we have cached lodges for this grand lodge
        const cachedLodges = lodgeCache.byGrandLodge[grandLodgeId];
        if (cachedLodges && !isCacheExpired(cachedLodges.timestamp)) {
          console.log(`Using cached Lodges for Grand Lodge: ${grandLodgeId}`);
          return cachedLodges.data;
        }
        
        // Fetch lodges and update cache
        set({ isLoadingLodges: true });
        try {
          console.log(`Fetching Lodges for Grand Lodge: ${grandLodgeId}`);
          const data = await getLodgesByGrandLodgeId(grandLodgeId);
          
          // Update cache
          set({
            lodgeCache: {
              ...lodgeCache,
              byGrandLodge: {
                ...lodgeCache.byGrandLodge,
                [grandLodgeId]: {
                  data,
                  timestamp: Date.now()
                }
              }
            },
            isLoadingLodges: false
          });
          
          return data;
        } catch (error) {
          console.error(`Error fetching lodges for GL ${grandLodgeId}:`, error);
          set({ 
            isLoadingLodges: false,
            lodgeError: "Failed to load Lodges."
          });
          return [];
        }
      },
      
      // Preload lodges by region with improved regional focus
      preloadLodgesByRegion: async (regionCode: string) => {
        const { lodgeCache, grandLodgeCache, ipData } = get();
        
        // Check if we already have cached data for this region
        if (lodgeCache.byRegion[regionCode] && 
            !isCacheExpired(lodgeCache.byRegion[regionCode].timestamp)) {
          console.log(`Using cached Lodges for region: ${regionCode}`);
          return;
        }
        
        // Optimize for NSW (or other specific regions) with direct mapping
        // This maps region codes to known Grand Lodge names/IDs for better matching
        const regionToGrandLodge: Record<string, string> = {
          'NSW': 'United Grand Lodge of NSW & ACT', // Specific case for NSW
          'VIC': 'United Grand Lodge of Victoria',
          'QLD': 'United Grand Lodge of Queensland',
          'SA': 'Grand Lodge of South Australia',
          'WA': 'Grand Lodge of Western Australia',
          'TAS': 'Grand Lodge of Tasmania'
        };
        
        // For Australian regions like NSW, directly search for the specific Grand Lodge
        if (ipData?.country_code === 'AU' && regionToGrandLodge[regionCode]) {
          try {
            console.log(`Looking for specific Grand Lodge for ${regionCode}: ${regionToGrandLodge[regionCode]}`);
            
            // Search for this specific Grand Lodge by name
            const specificGLs = await getAllGrandLodges({ 
              searchTerm: regionToGrandLodge[regionCode] 
            });
            
            // If found, use the first match (should be exact)
            if (specificGLs && specificGLs.length > 0) {
              const targetGL = specificGLs[0];
              console.log(`Found matching Grand Lodge for ${regionCode}: ${targetGL.name}`);
              
              // Fetch lodges for this specific GL
              console.log(`Preloading Lodges for ${regionCode} using Grand Lodge: ${targetGL.name}`);
              const data = await getLodgesByGrandLodgeId(targetGL.id);
              
              // Update both region & GL cache
              set({
                lodgeCache: {
                  ...lodgeCache,
                  byRegion: {
                    ...lodgeCache.byRegion,
                    [regionCode]: {
                      data,
                      timestamp: Date.now()
                    }
                  },
                  byGrandLodge: {
                    ...lodgeCache.byGrandLodge,
                    [targetGL.id]: {
                      data,
                      timestamp: Date.now()
                    }
                  }
                }
              });
              
              // Also update Grand Lodge cache for this region
              set({
                grandLodgeCache: {
                  ...grandLodgeCache,
                  byRegion: {
                    ...grandLodgeCache.byRegion,
                    [regionCode]: [targetGL] // Only cache the relevant GL for this region
                  }
                }
              });
              
              return;
            }
          } catch (error) {
            console.error(`Error with direct Grand Lodge lookup for ${regionCode}:`, error);
            // Continue with generic region search if direct lookup fails
          }
        }
        
        // Fall back to the general approach if direct mapping fails
        // Find Grand Lodges for this region
        let regionalGrandLodges = grandLodgeCache.byRegion[regionCode];
        
        // If we don't have them cached, try to fetch them
        if (!regionalGrandLodges || regionalGrandLodges.length === 0) {
          try {
            regionalGrandLodges = await getAllGrandLodges({ searchTerm: regionCode });
            
            // Update the cache
            set({
              grandLodgeCache: {
                ...grandLodgeCache,
                byRegion: {
                  ...grandLodgeCache.byRegion,
                  [regionCode]: regionalGrandLodges
                }
              }
            });
          } catch (error) {
            console.error(`Error fetching regional Grand Lodges for ${regionCode}:`, error);
            return;
          }
        }
        
        // If we still don't have any Grand Lodges, we can't preload Lodges
        if (!regionalGrandLodges || regionalGrandLodges.length === 0) {
          console.log(`No Grand Lodges found for region ${regionCode}, cannot preload Lodges`);
          return;
        }
        
        // Pick the first Grand Lodge and preload its Lodges
        const firstRegionalGL = regionalGrandLodges[0];
        
        try {
          console.log(`Preloading Lodges for region ${regionCode} using Grand Lodge: ${firstRegionalGL.name}`);
          const data = await getLodgesByGrandLodgeId(firstRegionalGL.id);
          
          // Update the region-specific cache
          set({
            lodgeCache: {
              ...lodgeCache,
              byRegion: {
                ...lodgeCache.byRegion,
                [regionCode]: {
                  data,
                  timestamp: Date.now()
                }
              },
              byGrandLodge: {
                ...lodgeCache.byGrandLodge,
                [firstRegionalGL.id]: {
                  data,
                  timestamp: Date.now()
                }
              }
            }
          });
        } catch (error) {
          console.error(`Error preloading Lodges for region ${regionCode}:`, error);
        }
      },
      
      // Clear all caches (useful for debugging or forced refresh)
      clearCaches: () => {
        set({
          grandLodgeCache: defaultGrandLodgeCache,
          lodgeCache: defaultLodgeCache
        });
        console.log('All location caches cleared');
      }
    }),
    {
      name: 'lodgetix-location-storage',
      partialize: (state) => ({
        // Only persist the cache data, not the current search results or loading states
        grandLodgeCache: state.grandLodgeCache,
        lodgeCache: state.lodgeCache,
        ipData: state.ipData
      }),
    }
  ) as LocationStateCreator
);