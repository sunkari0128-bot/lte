import React, { useState, useEffect } from 'react';
import { GoldRateRecord } from '../types';
import { fetchAdminAllRates, deleteRateRecord } from '../services/api';
import { formatDate, formatCurrency } from '../services/calculations';
import { Edit2, Trash2, Calendar, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdminRateListProps {
  onEditRecord: (record: GoldRateRecord) => void;
  refreshTrigger: number;
}

export const AdminRateList: React.FC<AdminRateListProps> = ({ onEditRecord, refreshTrigger }) => {
  const [records, setRecords] = useState<GoldRateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadRates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminAllRates();
      setRecords(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load rate records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, [refreshTrigger]);

  const handleDelete = async (id: number, date: string) => {
    if (!window.confirm(`Are you sure you want to delete rates for ${date}?`)) {
      return;
    }

    try {
      await deleteRateRecord(id);
      setSuccess(`Record for ${date} removed successfully`);
      loadRates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete record');
    }
  };

  const filtered = records.filter((r) => r.date.includes(searchTerm));

  return (
    <div className="bullion-card rounded-2xl overflow-hidden border border-[#232D3F]">
      <div className="p-4 sm:p-5 border-b border-[#232D3F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white font-serif-gold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            Manage Previous Daily Rate Records
          </h2>
          <p className="text-xs text-gray-400">
            Total {records.length} published records stored in SQLite database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter date (YYYY-MM)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#0E121A] border border-[#232D3F] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
          />
          <button
            onClick={loadRates}
            className="p-2 rounded-xl bg-[#151A24] border border-[#232D3F] text-gray-300 hover:text-white transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D4AF37]' : ''}`} />
          </button>
        </div>
      </div>

      {success && (
        <div className="m-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="m-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-gray-400 flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-xs">Loading database records...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-xs">
          No records match your filter.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#0E121A] text-gray-400 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-20 border-b border-[#1E2738]">
              <tr>
                <th className="py-3 px-3 sm:px-4">Date</th>
                <th className="py-3 px-3 sm:px-4 text-[#F3E5AB]">24K (Selling / Mkt)</th>
                <th className="py-3 px-3 sm:px-4">22K (Selling / Mkt)</th>
                <th className="py-3 px-3 sm:px-4 text-slate-300">Silver (Selling / Mkt)</th>
                <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2434] text-gray-200">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[#161D2B]/50 transition-colors">
                  <td className="py-3 px-3 sm:px-4 font-mono font-bold text-white whitespace-nowrap">
                    {r.date}
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-mono whitespace-nowrap bg-[#141A25]/20">
                    <span className="text-[#F5DE88] font-semibold">{formatCurrency(r.gold_24k_selling_per_gram)}</span>
                    <span className="text-gray-400 text-[11px] ml-1">/ {formatCurrency(r.gold_24k_market_per_gram)}</span>
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-mono whitespace-nowrap">
                    <span className="text-gray-200 font-semibold">{formatCurrency(r.gold_22k_selling_per_gram)}</span>
                    <span className="text-gray-400 text-[11px] ml-1">/ {formatCurrency(r.gold_22k_market_per_gram)}</span>
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-mono whitespace-nowrap">
                    <span className="text-gray-200 font-semibold">{formatCurrency(r.silver_selling_per_gram || 240)}</span>
                    <span className="text-gray-400 text-[11px] ml-1">/ {formatCurrency(r.silver_market_per_gram || 235)}</span>
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEditRecord(r)}
                        className="p-1.5 rounded-lg bg-[#1B2332] hover:bg-[#D4AF37] text-gray-300 hover:text-black transition-colors"
                        title="Edit rate record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id, r.date)}
                        className="p-1.5 rounded-lg bg-[#1B2332] hover:bg-rose-600 text-gray-300 hover:text-white transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
