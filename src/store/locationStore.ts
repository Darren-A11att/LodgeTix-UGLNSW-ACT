import { create, StateCreator } from 'zustand';
import { getAllGrandLodges, GrandLodgeRow } from '../lib/api/grandLodges'; // Import API and type

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

// Export the state interface
export interface LocationState {
  ipData: IpApiData; // Initialize with default, no longer null
  isLoading: boolean;
  error: string | null;
  fetchIpData: () => Promise<void>;

  // Grand Lodge State
  grandLodges: GrandLodgeRow[];
  isLoadingGrandLodges: boolean;
  grandLodgeError: string | null;
  fetchInitialGrandLodges: () => Promise<void>; // Renamed for clarity
  searchGrandLodges: (searchTerm: string) => Promise<void>; // New action for searching
}

// Define the state creator type
type LocationStateCreator = StateCreator<LocationState>;

export const useLocationStore = create<LocationState>(((set, get) => ({
  ipData: defaultIpData, // Initialize with default data
  isLoading: true, // Start in loading state as we attempt fetch immediately
  error: null,
  
  // Grand Lodge Initial State
  grandLodges: [],
  isLoadingGrandLodges: false,
  grandLodgeError: null,

  // Action to fetch IP data
  fetchIpData: async () => {
    set({ isLoading: true, error: null }); // Set loading true here specifically for IP fetch
    try {
      // Set a timeout for the fetch operation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

      // Use the proxy if available (Vite dev server), otherwise direct URL
      // In a production Next.js environment, you'd likely use an API route
      const apiUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? '/api/ipinfo/json/' // Use Vite proxy
        : 'https://ipapi.co/json/'; // Direct call (fallback or production)

      const response = await fetch(apiUrl, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: IpApiData = await response.json();
      // Update state only on successful fetch
      set({ ipData: data, isLoading: false });
    } catch (error: any) {
      console.error("Failed to fetch IP data:", error);
      const errorMessage = error.name === 'AbortError' 
        ? 'IP detection timed out.' 
        : 'Failed to detect country.';
      // Set error, stop loading, but KEEP default ipData
      set({ error: errorMessage, isLoading: false }); 
    }
  },

  // Action to fetch initial Grand Lodges based on current IP data (fetched or default)
  fetchInitialGrandLodges: async () => { // Renamed from fetchAndStoreGrandLodges
    // Prevent re-fetching if already loading
    if (get().isLoadingGrandLodges) return;

    const { ipData } = get(); // Get current state
    const countryCode = ipData.country_code_iso3; // Use ISO3 from current ipData

    set({
      isLoadingGrandLodges: true,
      grandLodgeError: null,
      grandLodges: [], // Clear previous list while loading
    });

    try {
      console.log(`Fetching initial GLs (no specific filter yet)`); // Updated log message
      // Fetch initial batch without specific filters for now, or potentially common ones?
      // For now, let's fetch all initially, maybe limit later if needed.
      const data = await getAllGrandLodges(); // Fetch all initially
      set({
        grandLodges: data,
        isLoadingGrandLodges: false,
      });
    } catch (error) {
      console.error(`Error fetching initial grand lodges:`, error);
      set({
        grandLodgeError: "Failed to load Grand Lodges.",
        isLoadingGrandLodges: false,
        grandLodges: [], // Ensure empty on error
      });
    }
  },

  // Action to search Grand Lodges based on searchTerm
  searchGrandLodges: async (searchTerm: string) => {
    // Prevent searching if currently loading
    if (get().isLoadingGrandLodges) {
        console.log("Skipping search, already loading...");
        return;
    }

    // If search term is empty, potentially fetch initial set or clear?
    // Let's fetch the initial set again if search term is cleared.
    if (!searchTerm || searchTerm.trim() === '') {
        console.log("Search term empty, fetching initial GLs...");
        await get().fetchInitialGrandLodges();
        return;
    }
    
    set({
      isLoadingGrandLodges: true,
      grandLodgeError: null, // Clear previous error
    });

    try {
      console.log(`Searching Grand Lodges for: '${searchTerm}'`);
      const data = await getAllGrandLodges({ searchTerm }); // Pass the searchTerm
      set({
        grandLodges: data, // Update the list with search results
        isLoadingGrandLodges: false,
      });
    } catch (error) {
      console.error("Error searching grand lodges:", error);
      set({
        grandLodgeError: "Failed to search Grand Lodges.",
        isLoadingGrandLodges: false,
        grandLodges: [], // Clear results on error
      });
    }
  },
})) as LocationStateCreator); 