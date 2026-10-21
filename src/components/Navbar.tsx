import React from 'react';
import { ShieldCheck, Lock, Clock } from 'lucide-react';
import { formatDateTime } from '../services/calculations';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isAdminLoggedIn: boolean;
  onOpenAdmin?: () => void;
  lastUpdated: string;
  isDelayed?: boolean;
  delayedNote?: string;
  showAdminOption?: boolean;
  appTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isAdminLoggedIn,
  onOpenAdmin,
  lastUpdated,
  isDelayed = false,
  delayedNote,
  showAdminOption = true,
  appTitle = 'Saikiran Bullion'
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0B0E14]/90 backdrop-blur-md border-b border-[#232D3F]/80">
      {/* Top micro bar for market status */}
      <div className="bg-[#10141D] border-b border-[#1A2232] px-4 py-1.5 text-[11px] flex justify-between items-center text-gray-400">
        <div className="flex items-center gap-2">
          {isDelayed ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="font-semibold text-amber-300 uppercase tracking-wider">Saikiran Bullion Spot</span>
            </>
          ) : (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-emerald-400 uppercase tracking-wider">Saikiran Live Bullion Feed</span>
            </>
          )}
          <span className="text-gray-600 hidden sm:inline">|</span>
          <span className="hidden sm:inline text-gray-400">24K Gold • 22K Gold • Fine Silver</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Clock className="w-3 h-3 text-[#D4AF37]" />
          <span>Last Updated: <strong className="text-gray-200 font-semibold">{formatDateTime(lastUpdated)}</strong></span>
        </div>
      </div>

      {/* Main navigation container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand identity */}
        <div 
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden p-0.5 bg-gradient-to-br from-[#F5DE88] via-[#D4AF37] to-[#8C6D1F] shadow-gold-sm transition-transform group-hover:scale-105 shrink-0">
            <img 
              src="/logo.png" 
              alt="Saikiran Bullion Logo" 
              className="w-full h-full object-cover rounded-full" 
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white font-serif-gold">
                {appTitle}
              </span>
              <span className="text-[10px] font-semibold bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/30 px-1.5 py-0.5 rounded">
                OFFICIAL
              </span>
            </div>
            <p className="text-[11px] text-gray-400 tracking-wide font-sans">
              Daily Spot & Selling Rates
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#131822] p-1 rounded-xl border border-[#232D3F]">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              currentTab === 'home'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-[#1A2232]'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onSelectTab('rates')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              currentTab === 'rates'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-[#1A2232]'
            }`}
          >
            Purity Rates
          </button>
          <button
            onClick={() => onSelectTab('history')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              currentTab === 'history'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-[#1A2232]'
            }`}
          >
            Rate History
          </button>
          <button
            onClick={() => onSelectTab('about')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              currentTab === 'about'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-[#1A2232]'
            }`}
          >
            About
          </button>
        </nav>

        {/* Action Buttons: Admin Portal (when enabled) */}
        {showAdminOption && onOpenAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAdmin}
              title={isAdminLoggedIn ? 'Admin Portal Dashboard' : 'Administrator Portal'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isAdminLoggedIn
                  ? 'bg-amber-500/10 border-amber-500/40 text-[#F5DE88] hover:bg-amber-500/20'
                  : 'bg-[#151A24] border-[#252E3E] text-gray-300 hover:text-white hover:border-[#D4AF37]/50'
              }`}
            >
              {isAdminLoggedIn ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="hidden sm:inline">Admin Portal</span>
                  <span className="sm:hidden">Admin</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="hidden sm:inline">Admin Login</span>
                  <span className="sm:hidden">Admin</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
