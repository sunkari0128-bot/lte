import React, { useState, useEffect } from 'react';
import { GoldRateRecord } from '../types';
import { saveGoldRates, updateGoldRateRecord, fetchLiveRates, getLocalRecords } from '../services/api';
import { formatCurrency, calculate10g, calculateDiff, calculatePercentDiff } from '../services/calculations';
import { Save, Calendar, CheckCircle2, AlertCircle, Sparkles, Scale, RefreshCw } from 'lucide-react';

interface AdminRateFormProps {
  initialRecord?: GoldRateRecord | null;
  onSaved: () => void;
  onCancelEdit?: () => void;
}

export const AdminRateForm: React.FC<AdminRateFormProps> = ({
  initialRecord,
  onSaved,
  onCancelEdit,
}) => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(initialRecord ? initialRecord.date : getTodayStr());
  
  // Rate values stored per gram
  const [g24Market, setG24Market] = useState<string>(
    initialRecord ? String(initialRecord.gold_24k_market_per_gram) : '14918'
  );
  const [g24Selling, setG24Selling] = useState<string>(
    initialRecord ? String(initialRecord.gold_24k_selling_per_gram) : '15100'
  );

  const [g22Market, setG22Market] = useState<string>(
    initialRecord ? String(initialRecord.gold_22k_market_per_gram) : '13675'
  );
  const [g22Selling, setG22Selling] = useState<string>(
    initialRecord ? String(initialRecord.gold_22k_selling_per_gram) : '13850'
  );

  const [silverMarket, setSilverMarket] = useState<string>(
    initialRecord ? String(initialRecord.silver_market_per_gram || 235) : '235'
  );
  const [silverSelling, setSilverSelling] = useState<string>(
    initialRecord ? String(initialRecord.silver_selling_per_gram || 240) : '240'
  );

  // Unit input helper: 'per_gram' or 'per_10g'
  const [inputUnit, setInputUnit] = useState<'per_gram' | 'per_10g'>('per_gram');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFetchLiveRates = async () => {
    setIsFetchingLive(true);
    setErrorMsg(null);
    try {
      const live = await fetchLiveRates();
      setG24Market(String(live.rates.gold_24k_market_per_gram));
      setG24Selling(String(live.rates.gold_24k_selling_per_gram));
      setG22Market(String(live.rates.gold_22k_market_per_gram));
      setG22Selling(String(live.rates.gold_22k_selling_per_gram));
      setSilverMarket(String(live.rates.silver_market_per_gram));
      setSilverSelling(String(live.rates.silver_selling_per_gram));
      setSuccessMsg(`Auto-filled with current live market prices from ${live.source}!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg('Failed to fetch live rates: ' + (err.message || 'Network error'));
    } finally {
      setIsFetchingLive(false);
    }
  };

  useEffect(() => {
    if (initialRecord) {
      setDate(initialRecord.date);
      setG24Market(String(initialRecord.gold_24k_market_per_gram));
      setG24Selling(String(initialRecord.gold_24k_selling_per_gram));
      setG22Market(String(initialRecord.gold_22k_market_per_gram));
      setG22Selling(String(initialRecord.gold_22k_selling_per_gram));
      setSilverMarket(String(initialRecord.silver_market_per_gram || 235));
      setSilverSelling(String(initialRecord.silver_selling_per_gram || 240));
    } else if (date) {
      // Auto-populate existing rates if date has already been stored
      const records = getLocalRecords();
      const existing = records.find((r) => r.date === date);
      if (existing) {
        setG24Market(String(existing.gold_24k_market_per_gram));
        setG24Selling(String(existing.gold_24k_selling_per_gram));
        setG22Market(String(existing.gold_22k_market_per_gram));
        setG22Selling(String(existing.gold_22k_selling_per_gram));
        setSilverMarket(String(existing.silver_market_per_gram || 235));
        setSilverSelling(String(existing.silver_selling_per_gram || 240));
      }
    }
  }, [initialRecord, date]);

  // Quick auto-derive 22K from 24K based on standard 91.6% ratio
  const handleAutoDerive = () => {
    const m24 = parseFloat(g24Market) || 0;
    const s24 = parseFloat(g24Selling) || 0;
    if (m24 > 0) {
      setG22Market(String(Math.round(m24 * 0.916)));
    }
    if (s24 > 0) {
      setG22Selling(String(Math.round(s24 * 0.916)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const m24 = parseFloat(g24Market);
    const s24 = parseFloat(g24Selling);
    const m22 = parseFloat(g22Market);
    const s22 = parseFloat(g22Selling);
    const silvM = parseFloat(silverMarket);
    const silvS = parseFloat(silverSelling);

    if ([m24, s24, m22, s22, silvM, silvS].some(isNaN)) {
      setErrorMsg('Please enter valid numeric rates for gold and silver');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        date,
        gold_24k_market_per_gram: m24,
        gold_24k_selling_per_gram: s24,
        gold_22k_market_per_gram: m22,
        gold_22k_selling_per_gram: s22,
        silver_market_per_gram: silvM,
        silver_selling_per_gram: silvS,
      };

      if (initialRecord && initialRecord.id) {
        await updateGoldRateRecord(initialRecord.id, payload);
        setSuccessMsg(`Rates for ${date} successfully updated in database.`);
      } else {
        await saveGoldRates(payload);
        setSuccessMsg(`Rates for ${date} successfully published to database.`);
      }

      setTimeout(() => {
        onSaved();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save rate record');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live calculations for summary
  const n24m = parseFloat(g24Market) || 0;
  const n24s = parseFloat(g24Selling) || 0;
  const diff24 = calculateDiff(n24s, n24m);

  const n22m = parseFloat(g22Market) || 0;
  const n22s = parseFloat(g22Selling) || 0;
  const diff22 = calculateDiff(n22s, n22m);

  const nSilvM = parseFloat(silverMarket) || 0;
  const nSilvS = parseFloat(silverSelling) || 0;
  const diffSilv = calculateDiff(nSilvS, nSilvM);

  return (
    <div className="bullion-card rounded-2xl p-5 sm:p-7 border border-[#232D3F]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#232D3F]">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white font-serif-gold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            {initialRecord ? `Edit Rates: ${initialRecord.date}` : "Add / Update Today's Rates"}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Set market benchmark spot and official bullion counter selling rates.
          </p>
        </div>

        {/* Action Controls: Live fetch & entry mode */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleFetchLiveRates}
            disabled={isFetchingLive}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingLive ? 'animate-spin' : ''}`} />
            <span>{isFetchingLive ? 'Fetching Live...' : '⚡ Auto-Fill Live Rates'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Entry Mode:</span>
            <div className="grid grid-cols-2 bg-[#0E121A] p-1 rounded-xl border border-[#232D3F] text-xs">
              <button
                type="button"
                onClick={() => setInputUnit('per_gram')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  inputUnit === 'per_gram' ? 'bg-[#252E3E] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Per Gram (/g)
              </button>
              <button
                type="button"
                onClick={() => setInputUnit('per_10g')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  inputUnit === 'per_10g' ? 'bg-[#252E3E] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Per 10 Grams (/10g)
              </button>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATE SELECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex items-center gap-2 pb-0.5">
            <button
              type="button"
              onClick={handleAutoDerive}
              className="px-3 py-2 rounded-xl bg-[#171E2B] hover:bg-[#20293B] border border-[#2B374E] text-xs text-[#F3E5AB] transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Auto-Derive 22K & 18K from 24K</span>
            </button>
            <span className="text-[11px] text-gray-500">(Calculates 91.6% & 75% ratios)</span>
          </div>
        </div>

        {/* 24K GOLD INPUTS */}
        <div className="bg-[#10141D] rounded-2xl p-4 sm:p-5 border border-[#232D3F]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
              <h3 className="text-sm font-bold text-white font-serif-gold">24K Gold (999 Pure Bullion)</h3>
            </div>
            <div className="text-xs font-mono text-amber-300">
              Diff: +{formatCurrency(diff24)}/g (+{formatCurrency(diff24 * 10)}/10g)
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                24K Market Rate {inputUnit === 'per_10g' ? '(per 10g)' : '(per gram)'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-400 font-mono text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={inputUnit === 'per_10g' ? String(n24m * 10) : g24Market}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setG24Market(inputUnit === 'per_10g' ? String(val / 10) : e.target.value);
                  }}
                  className="w-full bg-[#0B0E14] border border-[#232D3F] rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="text-[11px] text-gray-500 mt-1 font-mono">
                = {formatCurrency(n24m)}/g | {formatCurrency(n24m * 10)}/10g
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#F5DE88] font-semibold mb-1">
                24K Our Selling Rate {inputUnit === 'per_10g' ? '(per 10g)' : '(per gram)'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#D4AF37] font-mono text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={inputUnit === 'per_10g' ? String(n24s * 10) : g24Selling}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setG24Selling(inputUnit === 'per_10g' ? String(val / 10) : e.target.value);
                  }}
                  className="w-full bg-[#0B0E14] border-2 border-[#D4AF37] rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
              <div className="text-[11px] text-[#F3E5AB] mt-1 font-mono">
                = {formatCurrency(n24s)}/g | {formatCurrency(n24s * 10)}/10g
              </div>
            </div>
          </div>
        </div>

        {/* 22K GOLD INPUTS */}
        <div className="bg-[#10141D] rounded-2xl p-4 sm:p-5 border border-[#232D3F]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <h3 className="text-sm font-bold text-white font-serif-gold">22K Gold (916 Standard)</h3>
            </div>
            <div className="text-xs font-mono text-amber-300">
              Diff: +{formatCurrency(diff22)}/g (+{formatCurrency(diff22 * 10)}/10g)
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                22K Market Rate {inputUnit === 'per_10g' ? '(per 10g)' : '(per gram)'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-400 font-mono text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={inputUnit === 'per_10g' ? String(n22m * 10) : g22Market}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setG22Market(inputUnit === 'per_10g' ? String(val / 10) : e.target.value);
                  }}
                  className="w-full bg-[#0B0E14] border border-[#232D3F] rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="text-[11px] text-gray-500 mt-1 font-mono">
                = {formatCurrency(n22m)}/g | {formatCurrency(n22m * 10)}/10g
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#F5DE88] font-semibold mb-1">
                22K Our Selling Rate {inputUnit === 'per_10g' ? '(per 10g)' : '(per gram)'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#D4AF37] font-mono text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={inputUnit === 'per_10g' ? String(n22s * 10) : g22Selling}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setG22Selling(inputUnit === 'per_10g' ? String(val / 10) : e.target.value);
                  }}
                  className="w-full bg-[#0B0E14] border-2 border-[#D4AF37] rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
              <div className="text-[11px] text-[#F3E5AB] mt-1 font-mono">
                = {formatCurrency(n22s)}/g | {formatCurrency(n22s * 10)}/10g
              </div>
            </div>
          </div>
        </div>

        {/* FINE SILVER INPUTS */}
        <div className="bg-[#10141D] rounded-2xl p-4 sm:p-5 border border-[#232D3F]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.4)]" />
              <h3 className="text-sm font-bold text-white font-serif-gold">Fine Silver (999 Pure Bullion)</h3>
            </div>
            <div className="text-xs font-mono text-slate-300">
              Diff: +{formatCurrency(diffSilv)}/g (+{formatCurrency(diffSilv * 10)}/10g | +{formatCurrency(diffSilv * 1000)}/kg)
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Silver Market Rate {inputUnit === 'per_10g' ? '(per 10g)' : '(per gram)'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-400 font-mono text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={inputUnit === 'per_10g' ? String(nSilvM * 10) : silverMarket}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setSilverMarket(inputUnit === 'per_10g' ? String(val / 10) : e.target.value);
                  }}
                  className="w-full bg-[#0B0E14] border border-[#232D3F] rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="text-[11px] text-gray-400 mt-1 font-mono">
                = {formatCurrency(nSilvM)}/g | {formatCurrency(nSilvM * 10)}/10g | 1kg: {formatCurrency(nSilvM * 1000)}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#F5DE88] font-semibold mb-1">
                Silver Our Selling Rate {inputUnit === 'per_10g' ? '(per 10g)' : '(per gram)'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#D4AF37] font-mono text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={inputUnit === 'per_10g' ? String(nSilvS * 10) : silverSelling}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setSilverSelling(inputUnit === 'per_10g' ? String(val / 10) : e.target.value);
                  }}
                  className="w-full bg-[#0B0E14] border-2 border-[#D4AF37] rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
              <div className="text-[11px] text-[#F3E5AB] mt-1 font-mono">
                = {formatCurrency(nSilvS)}/g | {formatCurrency(nSilvS * 10)}/10g | 1kg: {formatCurrency(nSilvS * 1000)}
              </div>
            </div>
          </div>
        </div>

        {/* BUTTON BAR */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] hover:from-[#E6C657] hover:to-[#B8901D] text-black font-extrabold text-sm tracking-wide shadow-gold-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Rates</span>
              </>
            )}
          </button>

          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="py-3 px-5 rounded-xl bg-[#141A25] hover:bg-[#1E2638] text-gray-300 text-xs font-semibold border border-[#232D3F] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
