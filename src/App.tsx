import React, { useState, useEffect } from 'react';
import { TodayRatesResponse } from './types';
import { fetchTodayRates, checkAdminAuth } from './services/api';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './pages/HomeScreen';
import { RatesScreen } from './pages/RatesScreen';
import { HistoryScreen } from './pages/HistoryScreen';
import { AboutScreen } from './pages/AboutScreen';
import { AdminLoginScreen } from './pages/AdminLoginScreen';
import { AdminDashboardScreen } from './pages/AdminDashboardScreen';
import { ShieldCheck, Lock, ArrowUpRight } from 'lucide-react';

// Determine application build variant: 'customer' (public without admin), 'admin' (dedicated admin suite), or 'web'
const APP_VARIANT = (import.meta.env.VITE_APP_VARIANT as string) || 'web';
const isCustomerOnly = APP_VARIANT === 'customer';
const isAdminOnly = APP_VARIANT === 'admin';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>(isAdminOnly ? 'admin' : 'home');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(isAdminOnly);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>('admin');

  const [rateData, setRateData] = useState<TodayRatesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(60);

  const loadRates = async (forceLive = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTodayRates(forceLive);
      setRateData(data);
    } catch (err: any) {
      console.error('Error fetching today rates:', err);
      setError(err.message || 'Failed to load rates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch with live market rate
    loadRates(true);

    // Dynamic 1-second ticker that decrements countdown and refreshes every 60s
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadRates(true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    // Check if admin is already logged in
    checkAdminAuth().then((res) => {
      if (res.authenticated) {
        setIsAdminLoggedIn(true);
        if (res.username) setAdminUsername(res.username);
      }
    });

    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    setCountdown(60);
    loadRates(true);
  };

  const handleOpenAdmin = () => {
    setIsAdminMode(true);
  };

  const handleAdminLoginSuccess = (user: string) => {
    setIsAdminLoggedIn(true);
    setAdminUsername(user);
    setIsAdminMode(true);
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setIsAdminMode(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#E0E6ED] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Top Navbar */}
      <Navbar
        currentTab={isAdminMode ? 'admin' : currentTab}
        onSelectTab={(tab) => {
          if (!isAdminOnly) setIsAdminMode(false);
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdmin={isCustomerOnly ? undefined : handleOpenAdmin}
        lastUpdated={rateData ? rateData.lastUpdated : ''}
        isDelayed={Boolean(rateData?.isDelayed)}
        delayedNote={rateData?.delayedNote}
        showAdminOption={!isCustomerOnly}
        appTitle={isAdminOnly ? 'Saikiran Bullion Admin' : 'Saikiran Bullion'}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 pb-20 md:pb-12">
        {isAdminMode ? (
          isAdminLoggedIn ? (
            <AdminDashboardScreen
              adminUsername={adminUsername}
              onLogout={handleAdminLogout}
              onBackToCustomer={() => setIsAdminMode(false)}
              rateData={rateData}
              onRatesUpdated={loadRates}
            />
          ) : (
            <AdminLoginScreen
              onLoginSuccess={handleAdminLoginSuccess}
              onBackToCustomer={() => setIsAdminMode(false)}
            />
          )
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeScreen
                rateData={rateData}
                isLoading={isLoading}
                countdown={countdown}
                onRefresh={handleManualRefresh}
                onNavigateTab={(tab) => {
                  setCurrentTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentTab === 'rates' && (
              <RatesScreen rateData={rateData} isLoading={isLoading} />
            )}

            {currentTab === 'history' && <HistoryScreen />}

            {currentTab === 'about' && (
              <AboutScreen lastUpdated={rateData ? rateData.lastUpdated : ''} />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation (only in customer view) */}
      {!isAdminMode && (
        <BottomNav
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Minimal Footer */}
      <footer className="border-t border-[#1C2333] bg-[#0A0D12] py-8 text-center text-xs text-gray-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full overflow-hidden p-[1px] bg-gradient-to-br from-[#F5DE88] to-[#8C6D1F]">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <span className="font-serif-gold font-bold text-gray-300">Saikiran Bullion</span>
            <span className="text-gray-600">|</span>
            <span className="text-[11px] text-gray-400">Pure Bullion & Benchmark Rates Display</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => {
                setIsAdminMode(false);
                setCurrentTab('about');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Rate Disclaimer
            </button>
            {!isCustomerOnly && (
              <>
                <span className="text-gray-700">•</span>
                <button
                  onClick={handleOpenAdmin}
                  className="text-gray-400 hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
                >
                  <Lock className="w-3 h-3" />
                  <span>Admin Portal</span>
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
