import React from 'react';
import { TodayRatesResponse, HistoryRange, PurityKey } from '../types';
import { formatDate, formatDateTime } from '../services/calculations';
import { RateCard } from '../components/RateCard';
import { MovementBadge } from '../components/MovementBadge';
import { BullionCalculator } from '../components/BullionCalculator';
import { ShieldCheck, Calendar, ArrowRight, Sparkles, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface HomeScreenProps {
  rateData: TodayRatesResponse | null;
  isLoading: boolean;
  countdown?: number;
  onRefresh: () => void;
  onNavigateTab: (tab: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  rateData,
  isLoading,
  countdown = 60,
  onRefresh,
  onNavigateTab,
}) => {
  if (isLoading && !rateData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-4" />
        <h3 className="text-lg font-serif-gold text-white">Loading Today's Bullion Rates</h3>
        <p className="text-sm text-gray-400 mt-1">Fetching live certified database rates...</p>
      </div>
    );
  }

  if (!rateData) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="p-4 rounded-full bg-amber-500/10 text-amber-400 mb-3 border border-amber-500/20">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">No Rates Available Yet</h3>
        <p className="text-sm text-gray-400 mt-1 mb-4">
          The administrator has not yet published today's bullion market rates.
        </p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-xl bg-[#D4AF37] text-black font-semibold text-xs hover:bg-[#E6C657] transition-all"
        >
          Check Again
        </button>
      </div>
    );
  }

  const { today, purities, overallMovement, lastUpdated } = rateData;

  return (
    <div className="space-y-6 pb-12">
      {/* HERO / HEADER SECTION */}
      <div className="bullion-card rounded-3xl p-5 sm:p-7 relative overflow-hidden border border-[#232D3F]">
        {/* Subtle decorative gold blur glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-1.5">
              {rateData.isDelayed ? (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold tracking-wide shadow-sm" title={rateData.delayedNote || 'Counter benchmark'}>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  SAIKIRAN BULLION BENCHMARK
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold tracking-wide shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE MARKET RATE
                </span>
              )}
              <div className="flex items-center gap-1 text-gray-300">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{formatDate(today.date)}</span>
              </div>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400 font-normal normal-case">
                {rateData.liveSource || 'Saikiran Live Bullion Feed'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-serif-gold tracking-tight">
              Today's Live Gold & Silver Rates
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
              Live market spot rates and our official counter selling rates (with our ₹200/g margin) for 24K Gold, 22K Gold & Fine Silver.
            </p>

            {rateData.isDelayed && (
              <div className="mt-3 p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Notice: </strong> {rateData.delayedNote || 'Rates showing latest confirmed counter benchmark.'} Auto-syncing live market rates every 60s.
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            {/* Today's Movement Pill */}
            <div className="bg-[#0B0E14]/80 p-2.5 rounded-2xl border border-[#232D3F] flex flex-col sm:items-end">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
                Today's Movement
              </span>
              <MovementBadge movement={overallMovement} size="md" />
            </div>

            <div className="flex flex-col sm:items-end gap-1 text-[11px] text-gray-400">
              <div className="flex items-center gap-2">
                <span>Last Updated: <strong className="text-gray-200 font-semibold">{formatDateTime(lastUpdated)}</strong></span>
                <button
                  onClick={onRefresh}
                  title="Refresh rates now"
                  className="p-1 rounded-md hover:bg-[#1C2333] text-gray-400 hover:text-white transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-[#D4AF37]' : ''}`} />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{isLoading ? 'Refreshing rates...' : `Auto-refreshes in ${countdown}s`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CORE REQUIREMENTS: MAIN CARDS (24K Gold, 22K Gold, Fine Silver) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white font-serif-gold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              Official Bullion Purity Rates
            </h2>
            <p className="text-xs text-gray-400">
              Clear comparison between Market Spot & Our Physical Selling Rate
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('rates')}
            className="text-xs font-semibold text-[#D4AF37] hover:text-[#F3E5AB] flex items-center gap-1 transition-colors"
          >
            <span>Full Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 24K Gold Card (Highlighted Primary) */}
        <RateCard details={purities['24k']} isPrimary={true} />

        {/* 22K Gold Card & Fine Silver Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RateCard details={purities['22k']} isPrimary={false} />
          <RateCard details={purities['silver']} isPrimary={false} />
        </div>
      </div>

      {/* BULLION WEIGHT ESTIMATOR */}
      <div className="mt-8">
        <BullionCalculator purities={purities} />
      </div>

      {/* QUICK RATE HISTORY TEASER */}
      <div className="bullion-card rounded-2xl p-5 border border-[#232D3F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white font-serif-gold">Historical Rate Archives</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            View daily charts, trends, and past 365-day bullion rate records with date filtering.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('history')}
          className="px-4 py-2 rounded-xl bg-[#1C2433] hover:bg-[#253044] text-[#F3E5AB] border border-[#D4AF37]/30 text-xs font-semibold flex items-center gap-2 transition-all shrink-0"
        >
          <span>Explore Rate History</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
        </button>
      </div>

      {/* HALLMARK & COMPLIANCE BADGE */}
      <div className="bg-[#0B0E14] border border-[#1E2638] rounded-2xl p-4 flex items-center gap-3 text-xs text-gray-400">
        <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0" />
        <div>
          <span className="font-semibold text-gray-300">Purity Standard Guarantee: </span>
          All bullion bars and gold coins sold adhere strictly to Bureau of Indian Standards (BIS) Hallmarking. Certified assay laboratory verification with purity seal.
        </div>
      </div>
    </div>
  );
};
