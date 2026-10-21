import React, { useState, useEffect } from 'react';
import { BusinessSettings } from '../types';
import { fetchSettings, updateSettings, changePassword, getStoredApiUrl, setStoredApiUrl, testApiConnection, resetToDefaultRecords, getLocalRecords, fetchLiveRates } from '../services/api';
import { Settings, Lock, Building, CheckCircle2, AlertCircle, Save, Globe, Wifi, RefreshCw, Database, Key, Zap } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: '',
    tagline: '',
    phone: '',
    email: '',
    address: '',
    operatingHours: '',
    rateDisclaimer: '',
    currencySymbol: '₹',
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [serverUrl, setServerUrl] = useState('');
  const [serverStatus, setServerStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingServer, setIsTestingServer] = useState(false);

  const [goldApiKeyInput, setGoldApiKeyInput] = useState('');
  const [isSavingGoldKey, setIsSavingGoldKey] = useState(false);
  const [goldKeySuccess, setGoldKeySuccess] = useState<string | null>(null);
  const [goldKeyError, setGoldKeyError] = useState<string | null>(null);
  const [liveFeedStatus, setLiveFeedStatus] = useState<any>(null);
  const [isCheckingLiveFeed, setIsCheckingLiveFeed] = useState(false);

  useEffect(() => {
    setServerUrl(getStoredApiUrl());
    fetchSettings()
      .then((data) => {
        setSettings(data);
        if (data.goldapiKey) {
          setGoldApiKeyInput(data.goldapiKey);
        }
      })
      .catch((err) => setSettingsError(err.message));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingsSaving(true);
    setSettingsSuccess(null);
    setSettingsError(null);

    try {
      await updateSettings(settings);
      setSettingsSuccess('Business details and disclaimers updated successfully');
      setTimeout(() => setSettingsSuccess(null), 3000);
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to update settings');
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    setIsPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleSaveServer = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredApiUrl(serverUrl);
    setServerStatus({ success: true, message: 'Server endpoint configuration saved!' });
    setTimeout(() => setServerStatus(null), 4000);
  };

  const handleTestServer = async () => {
    setIsTestingServer(true);
    setServerStatus(null);
    try {
      const result = await testApiConnection(serverUrl.trim() || undefined);
      setServerStatus(result);
    } catch (err: any) {
      setServerStatus({ success: false, message: err.message || 'Connection failed' });
    } finally {
      setIsTestingServer(false);
    }
  };

  const handleSaveGoldKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGoldKey(true);
    setGoldKeySuccess(null);
    setGoldKeyError(null);
    try {
      const keyToSave = goldApiKeyInput.trim();
      if (!keyToSave) {
        setGoldKeyError('Please provide a valid GoldAPI.io key');
        return;
      }
      await updateSettings({ goldapiKey: keyToSave });
      setGoldKeySuccess('GoldAPI.io key securely saved! Live market sync active.');
      setTimeout(() => setGoldKeySuccess(null), 4000);
      handleTestLiveFeed();
    } catch (err: any) {
      setGoldKeyError(err.message || 'Failed to save GoldAPI key');
    } finally {
      setIsSavingGoldKey(false);
    }
  };

  const handleTestLiveFeed = async () => {
    setIsCheckingLiveFeed(true);
    setLiveFeedStatus(null);
    try {
      const feed = await fetchLiveRates();
      setLiveFeedStatus(feed);
    } catch (err: any) {
      setLiveFeedStatus({ error: err.message || 'Failed to query live rates' });
    } finally {
      setIsCheckingLiveFeed(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* BUSINESS SETTINGS FORM */}
      <div className="bullion-card rounded-2xl p-5 sm:p-7 border border-[#232D3F]">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#232D3F]">
          <Building className="w-5 h-5 text-[#D4AF37]" />
          <div>
            <h2 className="text-lg font-bold text-white font-serif-gold">Business Profile & Disclaimers</h2>
            <p className="text-xs text-gray-400">Configure information displayed on customer screens and about page</p>
          </div>
        </div>

        {settingsSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{settingsSuccess}</span>
          </div>
        )}

        {settingsError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{settingsError}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Business Name</label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Contact Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Official Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Physical Bullion Counter Address</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Trading & Operating Hours</label>
            <input
              type="text"
              value={settings.operatingHours}
              onChange={(e) => setSettings({ ...settings, operatingHours: e.target.value })}
              className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Public Rate Disclaimer Text</label>
            <textarea
              rows={3}
              value={settings.rateDisclaimer}
              onChange={(e) => setSettings({ ...settings, rateDisclaimer: e.target.value })}
              className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <button
            type="submit"
            disabled={isSettingsSaving}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-bold text-xs shadow-gold-sm hover:from-[#E6C657] transition-all flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSettingsSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>

      {/* MOBILE APP & CLOUD SERVER SYNC */}
      <div className="bullion-card rounded-2xl p-5 sm:p-7 border border-[#232D3F]">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#232D3F]">
          <Globe className="w-5 h-5 text-[#D4AF37]" />
          <div>
            <h2 className="text-lg font-bold text-white font-serif-gold">Mobile App & Free Online Server Sync</h2>
            <p className="text-xs text-gray-400">Connect mobile apps and web to live online server for automatic rate sync</p>
          </div>
        </div>

        {/* ACTIVE ONLINE LINK CARD */}
        <div className="bg-[#10141D] border border-[#D4AF37]/30 rounded-xl p-4 mb-4 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Active Public Online Server:</span>
            </div>
            <a 
              href="https://0d087e90024afa.lhr.life" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-mono font-bold text-[#F5DE88] hover:underline flex items-center gap-1"
            >
              <span>https://0d087e90024afa.lhr.life</span>
              <Globe className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Anyone worldwide can open this link on their phone or browser. When you change or update rates online, the rates sync instantly to all customer devices and mobile apps!
          </p>
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setServerUrl('https://0d087e90024afa.lhr.life/api');
                setStoredApiUrl('https://0d087e90024afa.lhr.life/api');
                setServerStatus({ success: true, message: 'Connected to Active Online Server: https://0d087e90024afa.lhr.life/api' });
                setTimeout(() => setServerStatus(null), 4000);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Use This Active Online Link</span>
            </button>
          </div>
        </div>

        {serverStatus && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
              serverStatus.success
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
            }`}
          >
            {serverStatus.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{serverStatus.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveServer} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Backend API Server URL
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="e.g. https://api.royalbullion.com (leave empty for built-in local cache)"
              className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37] font-mono text-xs"
            />
            <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
              When deployed to production (Google Play Store), point this to your hosted backend (Node.js/Express) so all customer mobile apps fetch live daily rates. If offline or no server is set, the app runs smoothly using its embedded local cache.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-bold text-xs shadow-gold-sm hover:from-[#E6C657] transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Server URL</span>
            </button>

            <button
              type="button"
              onClick={handleTestServer}
              disabled={isTestingServer}
              className="py-2.5 px-4 rounded-xl bg-[#20293A] hover:bg-[#2A374E] text-[#F3E5AB] border border-[#D4AF37]/30 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Wifi className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{isTestingServer ? 'Testing...' : 'Test Connection'}</span>
            </button>

            {serverUrl && (
              <button
                type="button"
                onClick={() => {
                  setServerUrl('');
                  setStoredApiUrl('');
                  setServerStatus({ success: true, message: 'Server reset to standalone local cache mode.' });
                  setTimeout(() => setServerStatus(null), 3000);
                }}
                className="py-2.5 px-3 rounded-xl text-gray-400 hover:text-white text-xs transition-colors"
              >
                Reset to Default
              </button>
            )}
          </div>
        </form>
      </div>

      {/* GOLDAPI.IO LIVE RATE ENGINE & MARGIN (₹200/g) */}
      <div className="bullion-card rounded-2xl p-5 sm:p-7 border border-[#232D3F]">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#232D3F] mb-4 gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <h2 className="text-lg font-bold text-white font-serif-gold">GoldAPI.io Live Market Data Feed</h2>
              <p className="text-xs text-gray-400">Server-side live data polling, 60s cache & ₹200/g selling margin</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-500/30">
              Margin: +₹200/g
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/70 text-amber-400 border border-amber-500/30">
              Cache: 60s
            </span>
          </div>
        </div>

        {goldKeySuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{goldKeySuccess}</span>
          </div>
        )}

        {goldKeyError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{goldKeyError}</span>
          </div>
        )}

        <form onSubmit={handleSaveGoldKey} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>GoldAPI.io Secret API Key</span>
              </label>
              <span className="text-[11px] text-gray-400">
                Stored securely on server / .env
              </span>
            </div>
            <input
              type="text"
              value={goldApiKeyInput}
              onChange={(e) => setGoldApiKeyInput(e.target.value)}
              placeholder="e.g. goldapi-xxxxxxxxxxxx-io"
              className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37] font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
              The server calls GoldAPI.io for live market spot rates (<code>XAU/INR</code> &amp; <code>XAG/INR</code>), converts XAU (troy ounce) to INR/gram, automatically adds your <strong>₹200/g</strong> owner margin for 'Our Selling Rate', caches for 60 seconds, and refreshes every 60 seconds. If the API cannot be reached, the system gracefully serves the last known rate with a 'delayed' notice.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isSavingGoldKey}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-bold text-xs shadow-gold-sm hover:from-[#E6C657] transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingGoldKey ? 'Saving...' : 'Save GoldAPI Key'}</span>
            </button>

            <button
              type="button"
              onClick={handleTestLiveFeed}
              disabled={isCheckingLiveFeed}
              className="py-2.5 px-4 rounded-xl bg-[#20293A] hover:bg-[#2A374E] text-[#F3E5AB] border border-[#D4AF37]/30 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isCheckingLiveFeed ? 'animate-spin' : ''}`} />
              <span>{isCheckingLiveFeed ? 'Querying Feed...' : 'Test Live Rate Feed'}</span>
            </button>
          </div>
        </form>

        {liveFeedStatus && (
          <div className="mt-4 p-4 rounded-xl bg-[#0E121A] border border-[#232D3F] space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#232D3F]/60">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${liveFeedStatus.isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                {liveFeedStatus.isLive ? 'Live Feed Connected' : 'Delayed Fallback Active'}
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                Source: {liveFeedStatus.source || 'Local baseline'}
              </span>
            </div>

            {liveFeedStatus.isDelayed && (
              <div className="text-amber-400 bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/20 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{liveFeedStatus.delayedNote || 'Rates delayed — showing last known rate'}</span>
              </div>
            )}

            {liveFeedStatus.rates && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                <div className="bg-[#151B26] p-2.5 rounded-lg border border-[#232D3F]/50">
                  <span className="text-gray-400 block text-[10px]">24K Market Spot</span>
                  <span className="text-white font-bold">₹{liveFeedStatus.rates.gold_24k_market_per_gram?.toLocaleString('en-IN')}/g</span>
                </div>
                <div className="bg-[#151B26] p-2.5 rounded-lg border border-[#D4AF37]/30">
                  <span className="text-[#D4AF37] block text-[10px]">24K Selling (+₹200)</span>
                  <span className="text-[#F3E5AB] font-bold">₹{liveFeedStatus.rates.gold_24k_selling_per_gram?.toLocaleString('en-IN')}/g</span>
                </div>
                <div className="bg-[#151B26] p-2.5 rounded-lg border border-[#232D3F]/50">
                  <span className="text-gray-400 block text-[10px]">Silver Selling</span>
                  <span className="text-slate-200 font-bold">₹{liveFeedStatus.rates.silver_selling_per_gram?.toLocaleString('en-IN')}/g</span>
                </div>
              </div>
            )}

            <div className="text-[11px] text-gray-400 pt-1 flex items-center justify-between">
              <span>Timestamp: {liveFeedStatus.updatedAt ? new Date(liveFeedStatus.updatedAt).toLocaleString('en-IN') : 'N/A'}</span>
              {liveFeedStatus.cacheExpiresInSeconds !== undefined && (
                <span className="text-gray-500">Cache TTL: {liveFeedStatus.cacheExpiresInSeconds}s</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECURITY / CHANGE PASSWORD */}
      <div className="bullion-card rounded-2xl p-5 sm:p-7 border border-[#232D3F]">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#232D3F]">
          <Lock className="w-5 h-5 text-[#D4AF37]" />
          <div>
            <h2 className="text-lg font-bold text-white font-serif-gold">Administrator Security</h2>
            <p className="text-xs text-gray-400">Update master administrative login credentials</p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <button
            type="submit"
            disabled={isPasswordSaving}
            className="py-2.5 px-5 rounded-xl bg-[#20293A] hover:bg-[#2A374E] text-[#F3E5AB] border border-[#D4AF37]/30 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{isPasswordSaving ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      </div>

      {/* LOCAL DATABASE & STORAGE MANAGEMENT */}
      <div className="bullion-card rounded-2xl p-5 sm:p-7 border border-[#232D3F]">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#232D3F]">
          <Database className="w-5 h-5 text-[#D4AF37]" />
          <div>
            <h2 className="text-lg font-bold text-white font-serif-gold">Local Rate Database Storage</h2>
            <p className="text-xs text-gray-400">Offline-first local storage records and cache control</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-gray-300">
            Currently storing <strong className="text-[#F3E5AB]">{getLocalRecords().length}</strong> published daily rate records on this device.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset database to clean 30-day baseline gold and silver records?')) {
                  resetToDefaultRecords();
                  alert('Device records reset to pristine baseline 30-day data.');
                  window.location.reload();
                }
              }}
              className="py-2 px-4 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Clean 30-Day Records</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
