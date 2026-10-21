import React from 'react';
import { TodayRatesResponse, PurityKey } from '../types';
import { formatCurrency, formatDate } from '../services/calculations';
import { BullionCalculator } from '../components/BullionCalculator';
import { Sparkles, ShieldCheck, Scale, CheckCircle2 } from 'lucide-react';

interface RatesScreenProps {
  rateData: TodayRatesResponse | null;
  isLoading: boolean;
}

export const RatesScreen: React.FC<RatesScreenProps> = ({ rateData, isLoading }) => {
  if (!rateData) {
    return (
      <div className="py-12 text-center text-gray-400">
        Rate information loading...
      </div>
    );
  }

  const { today, purities } = rateData;
  const purityKeys: PurityKey[] = ['24k', '22k', 'silver'];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title */}
      <div className="bullion-card rounded-3xl p-5 sm:p-6 border border-[#232D3F]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bullion Rate Specification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif-gold">
          Purity Comparison & Specifications
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Official benchmark breakdown for {formatDate(today.date)} across certified fineness levels.
        </p>
      </div>

      {/* DETAILED PURITY MATRIX TABLE */}
      <div className="bullion-card rounded-2xl overflow-hidden border border-[#232D3F]">
        <div className="p-4 sm:p-5 border-b border-[#232D3F] flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white font-serif-gold flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#D4AF37]" />
            Side-by-Side Purity Comparison
          </h2>
          <span className="text-[11px] text-gray-400 font-mono">Per Gram & 10 Grams</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#0E121A] text-gray-400 font-semibold uppercase text-[11px] tracking-wider border-b border-[#1E2738]">
              <tr>
                <th className="py-3 px-4">Purity & Metal</th>
                <th className="py-3 px-4">Market Spot /g</th>
                <th className="py-3 px-4 text-[#F3E5AB]">Our Selling /g</th>
                <th className="py-3 px-4">Our Selling /10g (1kg)</th>
                <th className="py-3 px-4">Spread Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2434] text-gray-200">
              {purityKeys.map((key) => {
                const item = purities[key];
                return (
                  <tr key={key} className="hover:bg-[#161D2B]/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white font-serif-gold">{item.label}</div>
                      <div className="text-[10px] text-gray-400">{item.purityPercent}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-300">
                      {formatCurrency(item.marketPerGram)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-[#F5DE88] text-sm sm:text-base bg-[#D4AF37]/5">
                      {formatCurrency(item.sellingPerGram)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      <div>{formatCurrency(item.sellingPer10Gram)}/10g</div>
                      {key === 'silver' && (
                        <div className="text-[10px] text-gray-400 font-normal">
                          1 kg: {formatCurrency(item.sellingPerGram * 1000)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-amber-400">
                      +{formatCurrency(item.diffPerGram)}/g
                      <span className="text-[10px] text-gray-400 block font-normal">
                        (+{item.percentDiff}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PURITY GUIDE / EXPLANATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#10141D] border border-[#20293A] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <h3 className="font-bold text-white font-serif-gold text-sm">24K Bullion (999)</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            99.9% pure gold, primarily minted into physical investment bullion bars, coins, and bank biscuits. Does not contain alloy metals.
          </p>
          <div className="mt-3 pt-3 border-t border-[#1C2433] flex items-center gap-1.5 text-[11px] text-[#E6C657]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Assay Certified & Sealed</span>
          </div>
        </div>

        <div className="bg-[#10141D] border border-[#20293A] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h3 className="font-bold text-white font-serif-gold text-sm">22K Standard (916)</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            91.6% pure gold combined with 8.4% alloy for structural hardness. The predominant benchmark standard for traditional Indian jewelry.
          </p>
          <div className="mt-3 pt-3 border-t border-[#1C2433] flex items-center gap-1.5 text-[11px] text-[#E6C657]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>BIS Hallmark Mandatory</span>
          </div>
        </div>

        <div className="bg-[#10141D] border border-[#20293A] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.4)]" />
            <h3 className="font-bold text-white font-serif-gold text-sm">Fine Silver (999)</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            99.9% pure silver bullion ingots, minted coins, and 1 kg physical investment bars. Traded in grams, 10g, and 1 kg standard bar weights.
          </p>
          <div className="mt-3 pt-3 border-t border-[#1C2433] flex items-center gap-1.5 text-[11px] text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Assay Verified & Hallmarked</span>
          </div>
        </div>
      </div>

      {/* CALCULATOR */}
      <BullionCalculator purities={purities} />
    </div>
  );
};
