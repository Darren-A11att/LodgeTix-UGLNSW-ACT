import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAllGrandLodges, GrandLodgeRow } from '../lib/api/grandLodges';
import { getLodgesByGrandLodgeId, LodgeRow, createLodge as createLodgeApi, searchAllLodges as searchAllLodgesApi, getLodgesByStateRegionCode } from '../lib/api/lodges';
import { supabase } from '../lib/supabase';

// --- Define Interfaces First ---
export interface IpApiData {
  ip: string;
  network?: string;
  version?: string;
  city?: string;
  region?: string;
  region_code?: string;
  country?: string;
  country_code?: string;
  country_code_iso3?: string;
  country_name?: string;
  country_capital?: string;
  country_tld?: string;
  continent_code?: string;
  in_eu?: boolean;
  postal?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  utc_offset?: string;
  country_calling_code?: string;
  currency?: string;
  currency_name?: string;
  languages?: string;
  country_area?: number;
  country_population?: number;
  asn?: string;
  org?: string;
}

export interface GrandLodgeCache {
  data: GrandLodgeRow[];
  timestamp: number;
  byCountry: Record<string, GrandLodgeRow[]>;
  byRegion: Record<string, GrandLodgeRow[]>;
}

export interface LodgeCache {
  byGrandLodge: Record<string, {
    data: LodgeRow[];
    timestamp: number;
  }>;
  byRegion: Record<string, {
    data: LodgeRow[];
    timestamp: number;
  }>;
}

// --- Define Defaults Second ---
const defaultIpData: IpApiData = { 
  ip: '0.0.0.0',
  version: 'IPv4', 
  city: 'Unknown', 
  region: 'Unknown', 
  region_code: '', 
  country: 'AU',
  country_name: 'Australia',
  country_code: 'AU',
  country_code_iso3: 'AUS',
  latitude: -33.86,
  longitude: 151.20,
  network: undefined,
  country_capital: undefined,
  country_tld: undefined,
  continent_code: undefined,
  in_eu: false,
  postal: undefined,
  timezone: undefined,
  utc_offset: undefined,
  country_calling_code: undefined,
  currency: undefined,
  currency_name: undefined,
  languages: undefined,
  country_area: undefined,
  country_population: undefined,
  asn: undefined,
  org: undefined,
};

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

const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const isCacheExpired = (timestamp: number): boolean => {
  return Date.now() - timestamp > CACHE_EXPIRY_MS;
};

// --- Define State Interface Third ---
export interface LocationState {
  // --- Persisted State ---
  ipData: IpApiData;
  grandLodgeCache: GrandLodgeCache;
  lodgeCache: LodgeCache;
  
  // --- Non-Persisted / Derived State ---
  isLoadingIpData: boolean; // Renamed from isLoading
  ipDataError: string | null; // Renamed from error
  
  grandLodges: GrandLodgeRow[]; // For display/selection
  isLoadingGrandLodges: boolean;
  grandLodgeError: string | null;
  
  lodges: LodgeRow[]; // For display/selection (e.g., after selecting GL)
  isLoadingLodges: boolean;
  lodgeError: string | null;
  
  allLodgeSearchResults: LodgeRow[]; // For global search results
  isLoadingAllLodges: boolean;
  allLodgesError: string | null;

  // --- Actions ---
  fetchIpData: () => Promise<void>;
  fetchInitialGrandLodges: () => Promise<void>;
  searchGrandLodges: (searchTerm: string) => Promise<void>;
  getLodgesByGrandLodge: (grandLodgeId: string, searchTerm?: string) => Promise<void>; // Changed: updates state, returns void
  searchAllLodgesAction: (term: string) => Promise<void>;
  createLodge: (lodgeData: Omit<LodgeRow, 'id' | 'created_at' | 'display_name'>) => Promise<LodgeRow | null>; // Keep return for immediate use
  preloadGrandLodgesByCountry: (countryCode: string) => Promise<void>; // Keep preload actions
  preloadGrandLodgesByRegion: (regionCode: string) => Promise<void>;
  preloadLodgesByRegion: (regionCode: string) => Promise<void>;
  clearCaches: () => void;
}

// --- Define State Creator Type Fourth ---
type LocationStateCreator = StateCreator<LocationState>;

// --- Create Store Last ---
export const useLocationStore = create<LocationState>(
  persist(
    (set, get) => ({
      // Use the well-defined constant for initial state
      ipData: defaultIpData,
      grandLodgeCache: defaultGrandLodgeCache,
      lodgeCache: defaultLodgeCache,
      isLoadingIpData: true,
      ipDataError: null,
      grandLodges: [],
      isLoadingGrandLodges: false,
      grandLodgeError: null,
      lodges: [],
      isLoadingLodges: false,
      lodgeError: null,
      allLodgeSearchResults: [],
      isLoadingAllLodges: false,
      allLodgesError: null,

      // --- Actions Implementation ---
      fetchIpData: async () => {
        set({ isLoadingIpData: true, ipDataError: null });
        let dataToStore: IpApiData = { ...defaultIpData }; // Start with defaults
        try {
          const apiUrl = 'https://ipapi.co/json/';
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          console.log('[LocationStore] Fetching IP data from ipapi.co...');
            
            const response = await fetch(apiUrl, {
              signal: controller.signal,
              headers: { 'User-Agent': 'LodgeTix-Registration/1.0' } 
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
            const errorText = await response.text();
            console.warn(`IP API (ipapi.co) failed (${response.status}): ${errorText}, using default`);
            set({ ipDataError: `IP detection failed (${response.status})` });
            // Keep dataToStore as defaults
            } else {
              const ipResponse = await response.json();
            console.log('[LocationStore] Received IP data:', ipResponse);
            
            // Directly use the response, applying defaults only if necessary
            // Ensure ipResponse fields match IpApiData structure
            dataToStore = { 
              ...defaultIpData, // Start with defaults
              ...ipResponse,   // Spread the API response, overwriting defaults
              // Explicitly handle potential type mismatches or missing required fields if any
              ip: ipResponse.ip || defaultIpData.ip, // Ensure required ip is present
              // Add other required fields if ipResponse might lack them
            };
            console.log('[LocationStore] Mapped IP data:', dataToStore); // DEBUG mapped data
            set({ ipDataError: null });
            }
        } catch (fetchError: any) {
          console.warn('[LocationStore] Error fetching IP data from ipapi.co, using default:', fetchError);
          dataToStore = { ...defaultIpData }; // Reset to defaults on error
          set({ ipDataError: fetchError.name === 'AbortError' ? 'IP detection timed out.' : 'Failed to detect country.' });
        } finally {
          console.log('[LocationStore] Setting final IP data state:', dataToStore);
          set({ ipData: dataToStore, isLoadingIpData: false });
          
          // Trigger preloads using the correct fields from the stored data
          const finalIpData = get().ipData; // Get the data that was just set
          if (finalIpData.country_code) { // Use country_code for the cache key still?
            setTimeout(() => {
              console.log(`[LocationStore] Triggering preloads for country: ${finalIpData.country_name} (Code: ${finalIpData.country_code}), region: ${finalIpData.region_code}`);
              // Pass country_name for filtering GLs
              if (finalIpData.country_name) {
                  get().preloadGrandLodgesByCountry(finalIpData.country_name);
              }
              // Pass region_code for filtering Lodges
              if (finalIpData.region_code) {
                get().preloadGrandLodgesByRegion(finalIpData.region_code); // Keep using code for region GL cache key?
                get().preloadLodgesByRegion(finalIpData.region_code);
              }
            }, 0);
          }
        }
      },

      fetchInitialGrandLodges: async () => {
        const { grandLodgeCache, ipData } = get();
        const now = Date.now();
        const globalCacheExpired = isCacheExpired(grandLodgeCache.timestamp);

        console.log(`[LocationStore] Fetching initial GLs. Country: ${ipData.country_code}, Region: ${ipData.region_code}, Global Cache Expired: ${globalCacheExpired}`);

        // --- Prioritize Country-Specific Fetch --- 
        if (ipData.country_code) {
          const countryCacheKey = ipData.country_code;
          const countryCacheEntry = grandLodgeCache.byCountry[countryCacheKey];
          
          // Use country cache if it exists and is fresh (using global timestamp as proxy for now)
          if (countryCacheEntry && !globalCacheExpired) {
            console.log(`[LocationStore] Using FRESH country cache for ${countryCacheKey}`);
            set({ grandLodges: countryCacheEntry, isLoadingGrandLodges: false });
            return; 
          }
          
          // Fetch specifically for the country if cache missed or expired
          if (get().isLoadingGrandLodges) return; // Avoid concurrent fetches
          console.log(`[LocationStore] Cache miss/stale for country ${countryCacheKey}. Fetching country-specific GLs...`);
          set({ isLoadingGrandLodges: true, grandLodgeError: null });
          try {
            // Use countryName filter with ipData.country_name
            const countryData = await getAllGrandLodges({ countryName: ipData.country_name });
            set({ grandLodges: countryData, isLoadingGrandLodges: false }); // Update display state
            
            // Update country-specific cache and global cache if necessary
            set(state => {
              const updatedCache = { 
                ...state.grandLodgeCache, 
                timestamp: now, // Update global timestamp
                byCountry: { ...state.grandLodgeCache.byCountry, [countryCacheKey]: countryData }
              };
              // Prime global cache if empty
              if (updatedCache.data.length === 0) {
                updatedCache.data = countryData;
              }
              return { grandLodgeCache: updatedCache };
            });
            return; // Exit after successful country-specific fetch
          } catch (error) {
            console.error(`[LocationStore] Error fetching GLs for country ${countryCacheKey}:`, error);
            set({ grandLodgeError: "Failed to load Grand Lodges.", isLoadingGrandLodges: false });
            // Fall through to potentially use global cache or fetch all as last resort
          }
        }
        
        // --- Fallback to Global Cache or Fetch All --- 
        // Use global cache if it's not empty and not expired
        if (grandLodgeCache.data.length > 0 && !globalCacheExpired) {
          console.log('[LocationStore] Using FRESH global GL cache.');
          set({ grandLodges: grandLodgeCache.data, isLoadingGrandLodges: false });
          return;
        }

        // Fetch all if no country, or country fetch failed, or global cache stale/empty
        if (get().isLoadingGrandLodges) return; // Avoid concurrent fetches
        console.log('[LocationStore] Fetching ALL Grand Lodges (fallback or cache expired).');
        set({ isLoadingGrandLodges: true, grandLodgeError: null });
        try {
          const allData = await getAllGrandLodges({});
          set({ grandLodges: allData, isLoadingGrandLodges: false }); // Update display state
          // Update global cache
          set({ grandLodgeCache: { ...get().grandLodgeCache, data: allData, timestamp: now }});
        } catch (error) {
          console.error(`[LocationStore] Error fetching all grand lodges:`, error);
          set({ grandLodgeError: "Failed to load Grand Lodges.", isLoadingGrandLodges: false });
        }
      },

      searchGrandLodges: async (searchTerm: string) => {
         if (get().isLoadingGrandLodges) return;
         if (!searchTerm || searchTerm.trim() === '') {
             await get().fetchInitialGrandLodges(); // Fetch initial list if search is cleared
             return;
         }
         set({ isLoadingGrandLodges: true, grandLodgeError: null });
         try {
             const data = await getAllGrandLodges({ searchTerm });
             set({ grandLodges: data, isLoadingGrandLodges: false }); // Update display list
         } catch (error) {
             console.error("Error searching grand lodges:", error);
             set({ grandLodgeError: "Failed to search Grand Lodges.", isLoadingGrandLodges: false });
         }
      },
      
      getLodgesByGrandLodge: async (grandLodgeId: string, searchTerm?: string): Promise<void> => {
          const { lodgeCache } = get();
          const now = Date.now();
          const cacheEntry = lodgeCache.byGrandLodge?.[grandLodgeId];
      
          // If searching, fetch directly and update display state, don't bother caching search results complexly
          if (searchTerm) {
              set({ isLoadingLodges: true, lodgeError: null });
              try {
                  const data = await getLodgesByGrandLodgeId(grandLodgeId, searchTerm);
                  set({ lodges: data, isLoadingLodges: false }); // Update display list
              } catch (error) {
                  console.error(`Error searching lodges for GL ${grandLodgeId} with term ${searchTerm}:`, error);
                  set({ isLoadingLodges: false, lodgeError: "Failed to search Lodges.", lodges: [] });
              }
          return;
        }

          // Check cache validity for non-search requests
          if (cacheEntry && !isCacheExpired(cacheEntry.timestamp)) {
              set({ lodges: cacheEntry.data, isLoadingLodges: false }); // Update display list from cache
          return;
        }
        
          // Fetch from API if not cached or expired (non-search)
          set({ isLoadingLodges: true, lodgeError: null });
          try {
              const data = await getLodgesByGrandLodgeId(grandLodgeId);
              set({ lodges: data, isLoadingLodges: false }); // Update display list
              // Update cache
              set(state => ({
                  lodgeCache: {
                      ...state.lodgeCache,
                      byGrandLodge: {
                          ...state.lodgeCache.byGrandLodge,
                          [grandLodgeId]: { data: data, timestamp: Date.now() }
                      }
                  }
              }));
          } catch (error) {
              console.error(`Error fetching lodges for GL ${grandLodgeId}:`, error);
              set({ isLoadingLodges: false, lodgeError: "Failed to load Lodges.", lodges: [] });
          }
      },

      searchAllLodgesAction: async (term: string): Promise<void> => {
        set({ isLoadingAllLodges: true, allLodgesError: null });
        try {
          const data = await searchAllLodgesApi(term);
          set({ allLodgeSearchResults: data, isLoadingAllLodges: false });
        } catch (error) {
          console.error('Error searching all lodges:', error);
          set({ allLodgesError: (error as Error).message, isLoadingAllLodges: false, allLodgeSearchResults: [] });
        }
      },

      createLodge: async (lodgeData): Promise<LodgeRow | null> => {
        try {
          const newLodge = await createLodgeApi(lodgeData);
          if (newLodge && newLodge.grand_lodge_id) {
            const glId = newLodge.grand_lodge_id;
            set(state => {
              const currentCache = JSON.parse(JSON.stringify(state.lodgeCache)); 
              const byGrandLodgeCache = currentCache.byGrandLodge || {};
              const glCacheEntry = byGrandLodgeCache[glId];
              if (glCacheEntry && glCacheEntry.data) {
                const updatedLodges = [...glCacheEntry.data, newLodge].sort((a, b) => (a.display_name || a.name).localeCompare(b.display_name || b.name));
                byGrandLodgeCache[glId] = { ...glCacheEntry, data: updatedLodges }; 
              } else {
                byGrandLodgeCache[glId] = { data: [newLodge], timestamp: Date.now() };
                }
              return { lodgeCache: { ...currentCache, byGrandLodge: byGrandLodgeCache } };
            });
          }
          return newLodge; // Return the created lodge or null
        } catch (error) {
          console.error('Error creating lodge in store:', error);
          return null;
        }
      },
      
      preloadGrandLodgesByCountry: async (countryCode: string) => {
        // This function is keyed by countryCode (e.g., 'AU'), but we need countryName for the API call
        // We should get the countryName from the ipData state
        const { ipData } = get();
        const countryName = ipData.country_name;

        if (!countryCode || !countryName) return;
        const cacheKey = countryCode; // Still use code for cache key
        const { grandLodgeCache } = get();
        // Check if already cached and not expired
        if (grandLodgeCache.byCountry[cacheKey] && !isCacheExpired(grandLodgeCache.timestamp)) {
          console.log(`[LocationStore] GLs for country ${cacheKey} already cached and fresh.`);
          return;
        }
        console.log(`[LocationStore] Preloading GLs for country: ${countryName} (Code: ${cacheKey})`);
        try {
          // Fetch using countryName filter
          const data = await getAllGrandLodges({ countryName: countryName });
          set(state => {
            const updatedCache = {
              ...state.grandLodgeCache,
              timestamp: Date.now(), // Update timestamp on new fetch
              byCountry: {
                ...state.grandLodgeCache.byCountry,
                [cacheKey]: data
              }
            };
            // Also update main data if it's empty or older?
            if (updatedCache.data.length === 0 || isCacheExpired(state.grandLodgeCache.timestamp)) {
                updatedCache.data = data;
            }
            return { grandLodgeCache: updatedCache };
          });
        } catch (error) {
          console.error(`[LocationStore] Error preloading GLs for country ${countryName}:`, error);
        }
      },
      
      preloadGrandLodgesByRegion: async (regionCode: string) => {
        if (!regionCode) return;
        const cacheKey = regionCode;
        const { grandLodgeCache } = get();
        // Check if already cached and not expired
        if (grandLodgeCache.byRegion[cacheKey] && !isCacheExpired(grandLodgeCache.timestamp)) {
          console.log(`[LocationStore] GLs for region ${cacheKey} already cached and fresh.`);
          return;
        }
        console.log(`[LocationStore] Preloading GLs for region: ${cacheKey} (using searchTerm)`);
        try {
          // Using searchTerm for region might work if names are unique or API handles it
          const data = await getAllGrandLodges({ searchTerm: regionCode });
          set(state => {
            const updatedCache = {
              ...state.grandLodgeCache,
              timestamp: Date.now(),
              byRegion: {
                ...state.grandLodgeCache.byRegion,
                [cacheKey]: data
              }
            };
             // Also update main data if it's empty or older?
             if (updatedCache.data.length === 0 || isCacheExpired(state.grandLodgeCache.timestamp)) {
                updatedCache.data = data;
            }
            return { grandLodgeCache: updatedCache };
          });
        } catch (error) {
          console.error(`[LocationStore] Error preloading GLs for region ${cacheKey}:`, error);
        }
      },
      
      preloadLodgesByRegion: async (regionCode: string) => { 
        if (!regionCode) return;
        const cacheKey = regionCode;
        const { lodgeCache } = get();
         // Check region cache first
         if (lodgeCache.byRegion[cacheKey] && !isCacheExpired(lodgeCache.byRegion[cacheKey].timestamp)) {
           console.log(`[LocationStore] Lodges for region ${cacheKey} already cached and fresh (byRegion).`);
           return; 
          }
        console.log(`[LocationStore] Preloading lodges for region: ${cacheKey}`);
        try {
          // Fetch lodges using the API function
          const data = await getLodgesByStateRegionCode(regionCode);
          
          // Sort lodges (optional)
          data.sort((a, b) => (a.display_name || a.name).localeCompare(b.display_name || b.name));
          console.log(`[LocationStore] Successfully fetched ${data.length} lodges for region ${regionCode}.`);

          // Group fetched lodges by Grand Lodge ID
          const lodgesByGlId: Record<string, LodgeRow[]> = {};
          data.forEach(lodge => {
            if (lodge.grand_lodge_id) {
              if (!lodgesByGlId[lodge.grand_lodge_id]) {
                lodgesByGlId[lodge.grand_lodge_id] = [];
              }
              lodgesByGlId[lodge.grand_lodge_id].push(lodge);
            }
          });
          console.log(`[LocationStore] Grouped preloaded lodges into ${Object.keys(lodgesByGlId).length} GL groups.`);
            
          // Store in cache (both byRegion and byGrandLodge)
          const now = Date.now();
          set(state => {
            const updatedLodgeCache = { ...state.lodgeCache };
              
            // Update byRegion cache
            updatedLodgeCache.byRegion = {
              ...updatedLodgeCache.byRegion,
              [cacheKey]: { data: data, timestamp: now }
            };
              
            // Update byGrandLodge cache
            const updatedByGrandLodge = { ...updatedLodgeCache.byGrandLodge };
            Object.entries(lodgesByGlId).forEach(([glId, lodges]) => {
              updatedByGrandLodge[glId] = { data: lodges, timestamp: now };
            });
            updatedLodgeCache.byGrandLodge = updatedByGrandLodge;

            return { lodgeCache: updatedLodgeCache };
          });
          console.log(`[LocationStore] Updated lodge cache for region ${regionCode} and associated GLs.`);

        } catch (error) {
          console.error(`[LocationStore] Error preloading lodges for region ${cacheKey}:`, error);
          // Cache empty result on error for the region
           set(state => ({
            lodgeCache: { ...state.lodgeCache, byRegion: { ...state.lodgeCache.byRegion, [cacheKey]: { data: [], timestamp: Date.now() } } }
          }));
        }
      },
      
      clearCaches: () => {
        set({
          grandLodgeCache: defaultGrandLodgeCache,
             lodgeCache: defaultLodgeCache, 
             // Reset display lists too?
             grandLodges: [],
             lodges: [],
             allLodgeSearchResults: [] 
        });
         console.log('Location caches cleared');
      },
    }),
    {
      name: 'lodgetix-location-storage',
      // Persist only caches and IP data
      partialize: (state) => ({
        ipData: state.ipData, 
        grandLodgeCache: state.grandLodgeCache,
        lodgeCache: state.lodgeCache 
      }),
    }
  ) as LocationStateCreator
);