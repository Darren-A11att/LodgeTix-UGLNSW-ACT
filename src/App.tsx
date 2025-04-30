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

function App() {
  const fetchIpData = useLocationStore((state) => state.fetchIpData);
  const isLoadingIpData = useLocationStore((state) => state.isLoading);
  const fetchAndStoreGrandLodges = useLocationStore((state) => state.fetchAndStoreGrandLodges);
  const prevIsLoadingIpDataRef = React.useRef<boolean>(isLoadingIpData);

  useEffect(() => {
    fetchIpData();
  }, [fetchIpData]);

  useEffect(() => {
    const prevIsLoading = prevIsLoadingIpDataRef.current;
    if (prevIsLoading && !isLoadingIpData) {
      console.log("IP data fetch complete, fetching initial Grand Lodges...");
      fetchAndStoreGrandLodges();
    }
    prevIsLoadingIpDataRef.current = isLoadingIpData;
  }, [isLoadingIpData, fetchAndStoreGrandLodges]);

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