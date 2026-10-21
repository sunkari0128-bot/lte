import React, { useState, useEffect } from 'react';
import { GoldRateRecord, HistoryRange, PurityKey } from '../types';
import { fetchRateHistory } from '../services/api';
import { formatDate, formatCurrency } from '../services/calculations';
import { RateChart } from '../components/RateChart';
import { Calendar, History, TrendingUp, TrendingDown, Filter, RefreshCw } from 'lucide-react';

export const HistoryScreen: React.FC = () => {
  const [range, setRange] = useState<HistoryRange>('30d');
  const [selectedPurity, setSelectedPurity] = useState<PurityKey>('24k');
  const [records, setRecords] = useState<GoldRateRecord[]>([]);
  const [chartData, setChartData] = useState<GoldRateRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async (selectedRange: HistoryRange) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchRateHistory(selectedRange);
      setRecords(res.data);
      setChartData(res.chartData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch historical rates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(range);
  }, [range]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bullion-card rounded-3xl p-5 sm:p-6 border border-[#232D3F]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-1">
              <History className="w-3.5 h-3.5" />
              <span>Historical Archives</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif-gold">
              Daily Rate History & Trends
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Track daily gold market benchmarks and counter selling rates across all purities over time.
            </p>
          </div>

          <button
            onClick={() => loadHistory(range)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151A24] border border-[#232D3F] text-xs text-gray-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D4AF37]' : ''}`} />
            <span>Refresh History</span>
          </button>
        </div>
      </div>

      {/* LINE CHART SECTION WITH FILTERS */}
      <RateChart
        data={chartData}
        activeRange={range}
        onRangeChange={(newRange) => setRange(newRange)}
        selectedPurity={selectedPurity}
        onPurityChange={(p) => setSelectedPurity(p)}
      />

      {/* HISTORICAL RECORDS TABLE */}
      <div className="bullion-card rounded-2xl overflow-hidden border border-[#232D3F]">
        <div className="p-4 sm:p-5 border-b border-[#232D3F] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white font-serif-gold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              Archived Daily Rates Log
            </h2>
            <p className="text-xs text-gray-400">
              Showing {records.length} recorded entries for the selected {range.toUpperCase()} window
            </p>
          </div>

          <div className="text-[11px] text-gray-400 font-mono">
            All prices quoted per gram (₹/g)
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center text-rose-400 text-sm">
            {error}
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">Loading records...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#0E121A] text-gray-400 font-semibold uppercase text-[10px] sm:text-[11px] tracking-wider border-b border-[#1E2738]">
                <tr>
                  <th className="py-3 px-3 sm:px-4 sticky left-0 bg-[#0E121A] z-10">Date</th>
                  <th className="py-3 px-3 sm:px-4 bg-[#141A25]/50">
                    <span className="text-[#F3E5AB]">24K Selling</span> / Mkt
                  </th>
                  <th className="py-3 px-3 sm:px-4">
                    <span className="text-[#F3E5AB]">22K Selling</span> / Mkt
                  </th>
                  <th className="py-3 px-3 sm:px-4">
                    <span className="text-[#F3E5AB]">Silver (999) Selling</span> / Mkt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2434] text-gray-200">
                {records.map((r, idx) => {
                  const nextR = records[idx + 1];
                  const diff24 = nextR ? r.gold_24k_selling_per_gram - nextR.gold_24k_selling_per_gram : 0;
                  const isUp = diff24 > 0;
                  const isDown = diff24 < 0;

                  return (
                    <tr key={r.id || r.date} className="hover:bg-[#161D2B]/50 transition-colors">
                      {/* Date Column */}
                      <td className="py-3 px-3 sm:px-4 font-mono font-medium text-white whitespace-nowrap sticky left-0 bg-[#131822] z-10 border-r border-[#1C2434] sm:border-r-0">
                        <div>{formatDate(r.date)}</div>
                        {diff24 !== 0 && (
                          <span
                            className={`text-[10px] inline-flex items-center gap-0.5 ${
                              isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-gray-400'
                            }`}
                          >
                            {isUp && <TrendingUp className="w-2.5 h-2.5" />}
                            {isDown && <TrendingDown className="w-2.5 h-2.5" />}
                            {diff24 > 0 ? '+' : ''}{diff24}
                          </span>
                        )}
                      </td>

                      {/* 24K Rates */}
                      <td className="py-3 px-3 sm:px-4 font-mono whitespace-nowrap bg-[#141A25]/30">
                        <div className="font-bold text-[#F5DE88]">
                          {formatCurrency(r.gold_24k_selling_per_gram)}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Mkt: {formatCurrency(r.gold_24k_market_per_gram)}
                        </div>
                      </td>

                      {/* 22K Rates */}
                      <td className="py-3 px-3 sm:px-4 font-mono whitespace-nowrap">
                        <div className="font-bold text-gray-200">
                          {formatCurrency(r.gold_22k_selling_per_gram)}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Mkt: {formatCurrency(r.gold_22k_market_per_gram)}
                        </div>
                      </td>

                      {/* Silver Rates */}
                      <td className="py-3 px-3 sm:px-4 font-mono whitespace-nowrap">
                        <div className="font-bold text-gray-200">
                          {formatCurrency(r.silver_selling_per_gram || 118)}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Mkt: {formatCurrency(r.silver_market_per_gram || 115)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
