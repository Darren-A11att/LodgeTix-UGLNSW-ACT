import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import AboutPage from './pages/AboutPage';
import RegisterPage from './pages/RegisterPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCanceledPage from './pages/CheckoutCanceledPage';
import MockCheckoutPage from './pages/MockCheckoutPage';
import { AuthProvider } from './context/AuthContext';
import { useLocationStore } from './store/locationStore';
import { initMobileFeatures, isMobileDevice } from './lib/mobileUtils';
import { debugStorageCache } from './lib/cacheDebugger';

function App() {
  // Use individual selectors instead of object destructuring to avoid selector issues
  const fetchIpData = useLocationStore(state => state.fetchIpData);
  const isLoadingIpData = useLocationStore(state => state.isLoading);
  const ipData = useLocationStore(state => state.ipData);
  const fetchInitialGrandLodges = useLocationStore(state => state.fetchInitialGrandLodges);
  const preloadGrandLodgesByCountry = useLocationStore(state => state.preloadGrandLodgesByCountry);
  const preloadGrandLodgesByRegion = useLocationStore(state => state.preloadGrandLodgesByRegion);
  const preloadLodgesByRegion = useLocationStore(state => state.preloadLodgesByRegion);
  
  // Track initialization status with refs to avoid re-rendering loops
  const prevIsLoadingIpDataRef = React.useRef<boolean>(isLoadingIpData);
  const hasPerformedInitialFetch = React.useRef<boolean>(false);
  const hasPerformedGeoPrefetch = React.useRef<boolean>(false);

  // Initial fetch on app startup - using refs to avoid infinite loops
  useEffect(() => {
    // Only trigger fetch if not already done and not currently loading
    if (!hasPerformedInitialFetch.current && !isLoadingIpData) {
      hasPerformedInitialFetch.current = true;
      fetchIpData();
    }
  // Depend only on the function references, not on state values
  }, [fetchIpData]); 

  // Separate effect for handling prefetching after IP data loads
  useEffect(() => {
    // Skip if we've already prefetched or don't have country data
    if (hasPerformedGeoPrefetch.current || !ipData?.country_code) {
      return;
    }
    
    // Only proceed if we were previously loading and now we're not
    const wasLoading = prevIsLoadingIpDataRef.current;
    if (wasLoading && !isLoadingIpData) {
      console.log("IP data fetch complete, prefetching location data...");
      
      // Mark as done to avoid repeated execution
      hasPerformedGeoPrefetch.current = true;
      
      // Perform fetches in sequence with delays
      fetchInitialGrandLodges();
      
      // Use setTimeout to delay subsequent fetches
      if (ipData.country_code) {
        setTimeout(() => {
          preloadGrandLodgesByCountry(ipData.country_code);
        
          if (ipData.region_code) {
            setTimeout(() => {
              preloadGrandLodgesByRegion(ipData.region_code);
              preloadLodgesByRegion(ipData.region_code);
            }, 500);
          }
        }, 1000);
      }
    }
    
    // Always update the ref to current loading state
    prevIsLoadingIpDataRef.current = isLoadingIpData;
  // Include all dependencies but use refs to control execution
  }, [isLoadingIpData, ipData]);
  
  // Initialize mobile features
  useEffect(() => {
    // Only initialize on mobile devices
    if (isMobileDevice()) {
      // Add mobile-specific class to body
      document.body.classList.add('is-mobile-device');
      
      // Initialize mobile optimizations
      initMobileFeatures();
      
      // Add viewport meta tag with content scaling prevention
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
      } else {
        const newViewportMeta = document.createElement('meta');
        newViewportMeta.name = 'viewport';
        newViewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
        document.head.appendChild(newViewportMeta);
      }
    }
  }, []);
  
  // Add cache debugging
  useEffect(() => {
    // Wait for the app to fully initialize
    const timeoutId = setTimeout(() => {
      // Display cache debug info
      debugStorageCache();
      
      // Log instructions for testing caching
      console.info(
        "🧪 Test caching by using these console commands:\n" +
        "- window.lodgetixDebug.showCache() - Show cached data\n" +
        "- window.lodgetixDebug.clearCache() - Clear all caches"
      );
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:slug" element={<EventDetailsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/checkout/canceled" element={<CheckoutCanceledPage />} />
            <Route path="/mock-checkout" element={<MockCheckoutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;