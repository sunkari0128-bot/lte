import React, { useState, useEffect } from 'react';
import { GoldRateRecord, TodayRatesResponse } from '../types';
import { logoutAdmin, syncLiveRatesToServer, saveGoldRates } from '../services/api';
import { formatDate, formatCurrency, formatDateTime } from '../services/calculations';
import { AdminRateForm } from '../components/AdminRateForm';
import { AdminRateList } from '../components/AdminRateList';
import { AdminSettings } from '../components/AdminSettings';
import {
  ShieldCheck,
  LayoutDashboard,
  PlusCircle,
  History,
  Settings,
  LogOut,
  ArrowLeft,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Scale,
  RefreshCw,
  Save,
  Coins
} from 'lucide-react';

interface AdminDashboardScreenProps {
  adminUsername: string;
  onLogout: () => void;
  onBackToCustomer: () => void;
  rateData: TodayRatesResponse | null;
  onRatesUpdated: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  adminUsername,
  onLogout,
  onBackToCustomer,
  rateData,
  onRatesUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'update_rates' | 'history' | 'settings'>('dashboard');
  const [editingRecord, setEditingRecord] = useState<GoldRateRecord | null>(null);
  const [refreshListTrigger, setRefreshListTrigger] = useState(0);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Quick Edit Selling Rate States
  const [quick24Selling, setQuick24Selling] = useState<string>('15097');
  const [quick22Selling, setQuick22Selling] = useState<string>('13853');
  const [quickSilverSelling, setQuickSilverSelling] = useState<string>('239.9');
  const [isSavingQuick, setIsSavingQuick] = useState(false);
  const [quickSaveMsg, setQuickSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (rateData?.today) {
      setQuick24Selling(String(rateData.today.gold_24k_selling_per_gram || '15097'));
      setQuick22Selling(String(rateData.today.gold_22k_selling_per_gram || '13853'));
      setQuickSilverSelling(String(rateData.today.silver_selling_per_gram || '239.9'));
    }
  }, [rateData]);

  const handleQuickSaveSellingRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingQuick(true);
    setQuickSaveMsg(null);
    try {
      const s24 = parseFloat(quick24Selling);
      const s22 = parseFloat(quick22Selling);
      const sSilv = parseFloat(quickSilverSelling);
      if (isNaN(s24) || isNaN(s22) || isNaN(sSilv)) {
        throw new Error('Please enter valid numeric rates');
      }

      const todayStr = rateData?.today?.date || new Date().toISOString().split('T')[0];
      const res = await saveGoldRates({
        date: todayStr,
        gold_24k_market_per_gram: rateData?.today?.gold_24k_market_per_gram || 14918,
        gold_24k_selling_per_gram: s24,
        gold_22k_market_per_gram: rateData?.today?.gold_22k_market_per_gram || 13675,
        gold_22k_selling_per_gram: s22,
        silver_market_per_gram: rateData?.today?.silver_market_per_gram || 235,
        silver_selling_per_gram: sSilv
      });

      setQuickSaveMsg(res.message || 'Our selling rates successfully updated! Customers will now see these rates.');
      setRefreshListTrigger((prev) => prev + 1);
      onRatesUpdated();
      setTimeout(() => setQuickSaveMsg(null), 5000);
    } catch (err: any) {
      setQuickSaveMsg('Error: ' + (err.message || 'Failed to update selling rates'));
    } finally {
      setIsSavingQuick(false);
    }
  };

  const handleSyncLive = async () => {
    setIsSyncingLive(true);
    setSyncStatusMsg(null);
    try {
      const res = await syncLiveRatesToServer();
      setSyncStatusMsg(res.message);
      onRatesUpdated();
      setRefreshListTrigger((prev) => prev + 1);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } catch (e: any) {
      setSyncStatusMsg('Sync error: ' + (e.message || 'Failed to sync'));
    } finally {
      setIsSyncingLive(false);
    }
  };

  const handleEditFromList = (record: GoldRateRecord) => {
    setEditingRecord(record);
    setActiveTab('update_rates');
  };

  const handleSaved = () => {
    setEditingRecord(null);
    setRefreshListTrigger((prev) => prev + 1);
    onRatesUpdated();
    setActiveTab('dashboard');
  };

  const today = rateData?.today;

  return (
    <div className="space-y-6 pb-12">
      {/* ADMIN SUB-NAVBAR */}
      <div className="bullion-card rounded-2xl p-4 border border-[#232D3F] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden p-0.5 bg-gradient-to-br from-[#F5DE88] via-[#D4AF37] to-[#8C6D1F] shadow-gold-sm shrink-0">
            <img src="/logo.png" alt="Saikiran Bullion Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white font-serif-gold">
                Administrator Control Centre
              </h1>
              <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold px-2 py-0.5 rounded-full">
                Authenticated: {adminUsername}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Manage daily gold rate bulletins, historical logs, and bullion business parameters
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleSyncLive}
            disabled={isSyncingLive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold text-emerald-300 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLive ? 'animate-spin' : ''}`} />
            <span>{isSyncingLive ? 'Syncing...' : '⚡ Sync Live Rates'}</span>
          </button>

          <button
            onClick={onBackToCustomer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131822] hover:bg-[#1C2333] border border-[#232D3F] text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Customer Site</span>
          </button>

          <button
            onClick={() => {
              logoutAdmin();
              onLogout();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-xs font-semibold text-rose-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {syncStatusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* ADMIN NAVIGATION TABS (Mobile responsive 2x2 or 4x1 grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#10141D] p-1.5 rounded-2xl border border-[#232D3F]">
        <button
          onClick={() => {
            setEditingRecord(null);
            setActiveTab('dashboard');
          }}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black shadow-gold-sm'
              : 'bg-[#151B26]/80 text-gray-300 hover:text-white hover:bg-[#1C2433]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('update_rates');
          }}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'update_rates'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black shadow-gold-sm'
              : 'bg-[#151B26]/80 text-gray-300 hover:text-white hover:bg-[#1C2433]'
          }`}
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">{editingRecord ? `Edit: ${editingRecord.date}` : 'Update Rates'}</span>
        </button>

        <button
          onClick={() => {
            setEditingRecord(null);
            setActiveTab('history');
          }}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black shadow-gold-sm'
              : 'bg-[#151B26]/80 text-gray-300 hover:text-white hover:bg-[#1C2433]'
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span>Rate History</span>
        </button>

        <button
          onClick={() => {
            setEditingRecord(null);
            setActiveTab('settings');
          }}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'settings'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black shadow-gold-sm'
              : 'bg-[#151B26]/80 text-gray-300 hover:text-white hover:bg-[#1C2433]'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </button>
      </div>

      {/* TAB CONTENT: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 24K Status */}
            <div className="bullion-card rounded-2xl p-4 sm:p-5 border border-[#232D3F]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="font-bold text-[#F3E5AB]">24K Gold (999)</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">Active</span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                {today ? formatCurrency(today.gold_24k_selling_per_gram) : '—'}
                <span className="text-xs text-gray-400 font-normal">/g</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1 font-mono">
                Market Spot: {today ? formatCurrency(today.gold_24k_market_per_gram) : '—'}/g
              </div>
            </div>

            {/* 22K Status */}
            <div className="bullion-card rounded-2xl p-4 sm:p-5 border border-[#232D3F]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="font-bold text-gray-300">22K Gold (916)</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">Active</span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                {today ? formatCurrency(today.gold_22k_selling_per_gram) : '—'}
                <span className="text-xs text-gray-400 font-normal">/g</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1 font-mono">
                Market Spot: {today ? formatCurrency(today.gold_22k_market_per_gram) : '—'}/g
              </div>
            </div>

            {/* Fine Silver Status */}
            <div className="bullion-card rounded-2xl p-4 sm:p-5 border border-[#232D3F]">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="font-bold text-slate-200">Fine Silver (999)</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">Active</span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                {today ? formatCurrency(today.silver_selling_per_gram || 118) : '—'}
                <span className="text-xs text-gray-400 font-normal">/g</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1 font-mono">
                Market Spot: {today ? formatCurrency(today.silver_market_per_gram || 115) : '—'}/g (1kg: {today ? formatCurrency((today.silver_selling_per_gram || 118) * 1000) : '—'})
              </div>
            </div>
          </div>

          {/* QUICK EDIT OUR SELLING RATES (BUSINESS COUNTER PRICES) */}
          <div className="bullion-card rounded-2xl p-5 sm:p-6 border-2 border-[#D4AF37]/50 shadow-gold-sm bg-gradient-to-b from-[#141C28] to-[#0E131E]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#232D3F]">
              <div>
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-base sm:text-lg font-bold text-white font-serif-gold">
                    Edit Our Selling Rates
                  </h3>
                  <span className="text-[10px] bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/30 px-2 py-0.5 rounded font-semibold">
                    DIRECT SELLING PRICE
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  Change the exact rates your business sells to customers. Changes apply to the app immediately.
                </p>
              </div>
            </div>

            {quickSaveMsg && (
              <div
                className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  quickSaveMsg.startsWith('Error')
                    ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                    : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                }`}
              >
                {quickSaveMsg.startsWith('Error') ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                )}
                <span>{quickSaveMsg}</span>
              </div>
            )}

            <form onSubmit={handleQuickSaveSellingRates} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 24K Selling Rate Input */}
                <div className="bg-[#0A0D14] p-3.5 rounded-xl border border-[#232D3F] focus-within:border-[#D4AF37] transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#F5DE88]">24K Selling Rate</label>
                    <span className="text-[10px] text-gray-400 font-mono">Market: ₹{today?.gold_24k_market_per_gram || 14918}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[#D4AF37] font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={quick24Selling}
                      onChange={(e) => setQuick24Selling(e.target.value)}
                      className="w-full bg-[#111622] border border-[#2B374E] rounded-lg pl-7 pr-3 py-1.5 text-base font-bold text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 font-mono">
                    = ₹{Math.round((parseFloat(quick24Selling) || 0) * 10).toLocaleString('en-IN')} / 10g
                  </div>
                </div>

                {/* 22K Selling Rate Input */}
                <div className="bg-[#0A0D14] p-3.5 rounded-xl border border-[#232D3F] focus-within:border-amber-400 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-amber-300">22K Selling Rate</label>
                    <span className="text-[10px] text-gray-400 font-mono">Market: ₹{today?.gold_22k_market_per_gram || 13675}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-amber-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={quick22Selling}
                      onChange={(e) => setQuick22Selling(e.target.value)}
                      className="w-full bg-[#111622] border border-[#2B374E] rounded-lg pl-7 pr-3 py-1.5 text-base font-bold text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 font-mono">
                    = ₹{Math.round((parseFloat(quick22Selling) || 0) * 10).toLocaleString('en-IN')} / 10g
                  </div>
                </div>

                {/* Fine Silver Selling Rate Input */}
                <div className="bg-[#0A0D14] p-3.5 rounded-xl border border-[#232D3F] focus-within:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-200">Fine Silver Selling</label>
                    <span className="text-[10px] text-gray-400 font-mono">Market: ₹{today?.silver_market_per_gram || 235}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-300 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={quickSilverSelling}
                      onChange={(e) => setQuickSilverSelling(e.target.value)}
                      className="w-full bg-[#111622] border border-[#2B374E] rounded-lg pl-7 pr-3 py-1.5 text-base font-bold text-white font-mono focus:outline-none focus:border-slate-300"
                    />
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 font-mono">
                    = ₹{Math.round((parseFloat(quickSilverSelling) || 0) * 1000).toLocaleString('en-IN')} / 1kg
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-gray-400">
                  Tip: Market spot stays linked to benchmark; you control the exact counter selling price.
                </div>
                <button
                  type="submit"
                  disabled={isSavingQuick}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] hover:from-[#E6C657] hover:to-[#B8901D] text-black font-bold text-xs flex items-center gap-2 shadow-gold-sm transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingQuick ? 'Saving...' : '💾 Save Our Selling Rates'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Action Banner */}
          <div className="bg-gradient-to-r from-[#17202F] to-[#121722] border-2 border-[#D4AF37]/40 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Current Published Benchmark: {today ? formatDate(today.date) : 'Today'}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white font-serif-gold">
                Ready to Publish Today's Rates?
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Last recorded update timestamp was {rateData ? formatDateTime(rateData.lastUpdated) : '—'}.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingRecord(null);
                setActiveTab('update_rates');
              }}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-extrabold text-xs shadow-gold-sm hover:from-[#E6C657] transition-all flex items-center gap-2 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Open Rate Update Form</span>
            </button>
          </div>

          {/* Recent rates mini table */}
          <AdminRateList onEditRecord={handleEditFromList} refreshTrigger={refreshListTrigger} />
        </div>
      )}

      {/* TAB CONTENT: UPDATE RATES */}
      {activeTab === 'update_rates' && (
        <AdminRateForm
          initialRecord={editingRecord}
          onSaved={handleSaved}
          onCancelEdit={() => {
            setEditingRecord(null);
            setActiveTab('dashboard');
          }}
        />
      )}

      {/* TAB CONTENT: RATE HISTORY */}
      {activeTab === 'history' && (
        <AdminRateList onEditRecord={handleEditFromList} refreshTrigger={refreshListTrigger} />
      )}

      {/* TAB CONTENT: SETTINGS */}
      {activeTab === 'settings' && <AdminSettings />}
    </div>
  );
};
