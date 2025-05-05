import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import clsx from 'clsx';

// Helper component to conditionally render header
const ConditionalHeader: React.FC = () => {
  const location = useLocation();
  const hideHeaderPaths: string[] = []; // No paths hidden by default

  // Check if the current path starts with any of the paths to hide on
  const shouldHideHeader = hideHeaderPaths.some(path => 
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
  );

  return shouldHideHeader ? null : <Header />;
};

// Helper component to conditionally render footer
const ConditionalFooter: React.FC = () => {
  const location = useLocation();
  // Hide global footer only on HomePage (which now has its own)
  const shouldHideFooter = location.pathname === '/'; 
  return shouldHideFooter ? null : <Footer />;
};

function App() {
  const location = useLocation(); // Get location here for main layout
  // Use individual selectors
  const fetchIpData = useLocationStore(state => state.fetchIpData);
  // Use the correct state property name: isLoadingIpData
  const isLoadingIpData = useLocationStore(state => state.isLoadingIpData ?? false); 
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

  // Prefetching effect
  useEffect(() => {
    const currentCountryCode = ipData?.country_code;
    const currentRegionCode = ipData?.region_code;

    if (hasPerformedGeoPrefetch.current || !currentCountryCode) {
      return;
    }
    
    const wasLoading = prevIsLoadingIpDataRef.current;
    if (wasLoading && !isLoadingIpData) {
      console.log("IP data fetch complete, prefetching location data...");
      hasPerformedGeoPrefetch.current = true;
      fetchInitialGrandLodges();
      
      // Use setTimeout with checks for undefined
        setTimeout(() => {
        // Check country code before calling
        if (currentCountryCode) { 
          preloadGrandLodgesByCountry(currentCountryCode);
        }
        
        // Check region code before nested timeout
        if (currentRegionCode) { 
            setTimeout(() => {
            // Check region code again inside timeout
            if (currentRegionCode) { 
              preloadGrandLodgesByRegion(currentRegionCode);
              preloadLodgesByRegion(currentRegionCode);
            }
            }, 500);
          }
        }, 1000);
    }
    
    prevIsLoadingIpDataRef.current = isLoadingIpData;
  }, [isLoadingIpData, ipData, fetchInitialGrandLodges, preloadGrandLodgesByCountry, preloadGrandLodgesByRegion, preloadLodgesByRegion]); // Add functions to dependency array
  
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

  // Determine if the current page is the HomePage
  const isHomePage = location.pathname === '/';

  // Determine main tag classes conditionally
  const mainClasses = "flex-grow"; // Always use flex-grow only

  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <ConditionalHeader />
        <main className={mainClasses}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:slug" element={<EventDetailsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/register" element={<Navigate to="/register/type" replace />} />
            <Route path="/register/:registrationType" element={<RegisterPage />} />
            <Route path="/register/:registrationType/:pageName" element={<RegisterPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/checkout/canceled" element={<CheckoutCanceledPage />} />
            <Route path="/mock-checkout" element={<MockCheckoutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <ConditionalFooter />
      </div>
    </AuthProvider>
  );
}

export default App;