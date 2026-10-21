import React, { useState } from 'react';
import { PurityDetails, PurityKey } from '../types';
import { formatCurrency } from '../services/calculations';
import { Calculator, Scale, AlertCircle } from 'lucide-react';

interface BullionCalculatorProps {
  purities: Record<PurityKey, PurityDetails>;
}

export const BullionCalculator: React.FC<BullionCalculatorProps> = ({ purities }) => {
  const [weight, setWeight] = useState<string>('10');
  const [unit, setUnit] = useState<'gram' | 'tola' | 'kg'>('gram');
  const [selectedPurity, setSelectedPurity] = useState<PurityKey>('24k');

  const currentDetails = purities[selectedPurity] || purities['24k'];

  const numericWeight = parseFloat(weight) || 0;
  // 1 tola = 11.6638 grams, 1 kg = 1000 grams
  const effectiveGrams =
    unit === 'kg'
      ? numericWeight * 1000
      : unit === 'tola'
      ? numericWeight * 11.6638
      : numericWeight;

  const totalSellingPrice = effectiveGrams * currentDetails.sellingPerGram;
  const totalMarketPrice = effectiveGrams * currentDetails.marketPerGram;
  const totalDiff = totalSellingPrice - totalMarketPrice;

  // Preset quick weight buttons
  const presets = [
    { label: '1g', val: '1', u: 'gram' as const },
    { label: '8g (Sovereign)', val: '8', u: 'gram' as const },
    { label: '10g', val: '10', u: 'gram' as const },
    { label: '1 Tola', val: '1', u: 'tola' as const },
    { label: '100g Bar', val: '100', u: 'gram' as const },
    { label: '500g Bar', val: '500', u: 'gram' as const },
    { label: '1 kg Bar', val: '1', u: 'kg' as const },
  ];

  return (
    <div className="bullion-card rounded-2xl p-4 sm:p-6 border border-[#232D3F]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-serif-gold">Bullion Rate Estimator</h3>
            <p className="text-xs text-gray-400">Compute total counter value based on today's official selling rate</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Purity selector */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Select Bullion Metal & Purity</label>
          <div className="grid grid-cols-3 gap-2">
            {(['24k', '22k', 'silver'] as PurityKey[]).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPurity(p)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border text-center ${
                  selectedPurity === p
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black shadow-gold-sm border-transparent'
                    : 'bg-[#151A24] border-[#242D3E] text-gray-300 hover:border-gray-600'
                }`}
              >
                {p === '24k' ? '24K (999 Gold)' : p === '22k' ? '22K (916 Gold)' : 'Fine Silver (999)'}
              </button>
            ))}
          </div>
        </div>

        {/* Weight & Unit input */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Enter Weight</label>
            <div className="relative">
              <input
                type="number"
                min="0.1"
                step="any"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 10"
                className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl px-4 py-2.5 text-white font-mono text-lg focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
              <span className="absolute right-3.5 top-3 text-xs text-gray-400 font-medium uppercase">
                {unit}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Unit</label>
            <div className="grid grid-cols-3 gap-1 bg-[#0E121A] p-1 rounded-xl border border-[#232D3F]">
              <button
                onClick={() => setUnit('gram')}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  unit === 'gram' ? 'bg-[#252E3E] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Grams
              </button>
              <button
                onClick={() => setUnit('tola')}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  unit === 'tola' ? 'bg-[#252E3E] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Tola
              </button>
              <button
                onClick={() => setUnit('kg')}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  unit === 'kg' ? 'bg-[#252E3E] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Kg
              </button>
            </div>
          </div>
        </div>

        {/* Quick weight buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {presets.map((pr) => (
            <button
              key={pr.label}
              onClick={() => {
                setWeight(pr.val);
                setUnit(pr.u);
              }}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-[#141A25] hover:bg-[#1E2738] text-gray-300 border border-[#222B3D] transition-all font-mono"
            >
              {pr.label}
            </button>
          ))}
        </div>

        {/* Computed Result Box */}
        <div className="bg-gradient-to-br from-[#1C2433] to-[#121722] border-2 border-[#D4AF37]/50 rounded-xl p-4 shadow-gold-sm mt-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="font-semibold text-[#F3E5AB] uppercase tracking-wider text-[11px]">
              Estimated Counter Value ({currentDetails.label})
            </span>
            <span className="font-mono text-gray-400 text-[11px]">
              {effectiveGrams.toFixed(2)} grams net
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-[11px] text-gray-400 block">Total at Our Selling Rate</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                {formatCurrency(totalSellingPrice)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-gray-400 block">Spot Benchmark</span>
              <span className="text-base sm:text-lg font-semibold text-gray-300 font-mono">
                {formatCurrency(totalMarketPrice)}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#263145] flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-[#D4AF37]" />
              Diff from Spot: +{formatCurrency(totalDiff)}
            </span>
            <span className="italic text-gray-500">
              Rates lock upon counter invoice
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-[11px] text-gray-500 bg-[#0E121A]/50 p-2.5 rounded-lg border border-[#1A2230]">
          <AlertCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <span>
            Informational rate estimator only. Counter physical settlement occurs in-store with GST applicable as per legal bullion regulations.
          </span>
        </div>
      </div>
    </div>
  );
};
