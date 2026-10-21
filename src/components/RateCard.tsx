import React from 'react';
import { PurityDetails } from '../types';
import { formatCurrency } from '../services/calculations';
import { TrendingUp, TrendingDown, Sparkles, Scale, Info } from 'lucide-react';

interface RateCardProps {
  details: PurityDetails;
  isPrimary?: boolean;
}

export const RateCard: React.FC<RateCardProps> = ({ details, isPrimary = false }) => {
  const isUp = details.dayChangePerGram > 0;
  const isDown = details.dayChangePerGram < 0;

  return (
    <div
      className={`rounded-2xl transition-all relative overflow-hidden ${
        isPrimary
          ? 'bullion-card-selling border-[#D4AF37]/50 shadow-gold-md'
          : 'bullion-card hover:border-[#D4AF37]/30'
      }`}
    >
      {/* Subtle gold accent ribbon for 24K */}
      {isPrimary && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-l from-[#D4AF37] to-[#B38C1B] text-black text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3 h-3 fill-black text-black" />
            Pure Bullion Benchmark
          </div>
        </div>
      )}

      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-[#232D3F]/60">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold text-white font-serif-gold tracking-wide">
                {details.label}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-[#8A99AD] mt-0.5 font-medium flex items-center gap-1">
              <span>{details.purityPercent}</span>
            </p>
          </div>

          {/* Daily change indicator badge */}
          <div className="text-right">
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
                isUp
                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                  : isDown
                  ? 'bg-rose-950/70 text-rose-400 border border-rose-500/30'
                  : 'bg-gray-800/80 text-gray-300 border border-gray-600/30'
              }`}
            >
              {isUp && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
              {isDown && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
              <span>
                {isUp ? '+' : ''}{formatCurrency(details.dayChangePerGram)}/g
              </span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">vs yesterday</div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* HIGHLIGHTED SECTION: OUR SELLING RATE */}
        <div className="bg-gradient-to-br from-[#1C2333] via-[#161C28] to-[#121620] border-2 border-[#D4AF37] rounded-xl p-4 shadow-gold-sm relative overflow-hidden">
          {/* Subtle gold glow background */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#F5DE88]">
                OUR SELLING RATE
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">
              Counter Price
            </span>
          </div>

          {/* Large Selling Rate Numbers */}
          <div className="grid grid-cols-2 gap-3 items-end pt-1">
            {/* Per Gram */}
            <div>
              <span className="text-[11px] text-gray-400 font-medium block">Rate per gram</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
                  {formatCurrency(details.sellingPerGram)}
                </span>
                <span className="text-xs text-gray-400 font-normal">/g</span>
              </div>
            </div>

            {/* Per 10 Grams / Per 1kg for silver */}
            <div className="text-right border-l border-[#2B3547] pl-3">
              <span className="text-[11px] text-gray-400 font-medium block">
                {details.key === 'silver' ? 'Rate per 10g & 1kg' : 'Rate per 10 grams'}
              </span>
              <div className="flex items-baseline justify-end gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold text-[#F3E5AB] tracking-tight font-mono">
                  {formatCurrency(details.sellingPer10Gram)}
                </span>
                <span className="text-xs text-gray-400 font-normal">/10g</span>
              </div>
              {details.key === 'silver' && (
                <div className="text-[11px] font-mono text-gray-300 mt-0.5">
                  1 kg Bar: <strong className="text-white">{formatCurrency(details.sellingPerGram * 1000)}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MARKET BENCHMARK RATE SECTION */}
        <div className="bg-[#0F131C] border border-[#232D3F] rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="font-semibold text-gray-300 uppercase tracking-wider text-[11px]">
              Market Spot Benchmark
            </span>
            <span className="text-[11px] text-gray-400">Reference spot</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-gray-400">Market Rate / gram</span>
              <div className="text-lg sm:text-xl font-bold text-gray-200 font-mono mt-0.5">
                {formatCurrency(details.marketPerGram)}<span className="text-xs text-gray-400 font-normal">/g</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-gray-400">
                {details.key === 'silver' ? 'Market Rate / 10g (1 kg)' : 'Market Rate / 10 grams'}
              </span>
              <div className="text-base sm:text-lg font-semibold text-gray-300 font-mono mt-0.5">
                {formatCurrency(details.marketPer10Gram)}<span className="text-xs text-gray-400 font-normal">/10g</span>
              </div>
              {details.key === 'silver' && (
                <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                  Mkt 1kg: {formatCurrency(details.marketPerGram * 1000)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DIFFERENCE / SPREAD SECTION */}
        <div className="bg-[#141A24]/60 rounded-xl p-3 border border-[#1E2636] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-300">
            <Scale className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-gray-400">Difference (Our Rate - Market):</span>
          </div>

          <div className="text-right font-mono">
            <span className="font-bold text-amber-300">
              +{formatCurrency(details.diffPerGram)}/g
            </span>
            <span className="text-[11px] text-gray-400 ml-1.5">
              (+{formatCurrency(details.diffPer10Gram)} / 10g)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
