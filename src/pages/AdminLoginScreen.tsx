import React, { useState } from 'react';
import { loginAdmin } from '../services/api';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';

interface AdminLoginScreenProps {
  onLoginSuccess: (username: string) => void;
  onBackToCustomer: () => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  onLoginSuccess,
  onBackToCustomer,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin@gold2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await loginAdmin(username, password);
      if (res.success && res.username) {
        onLoginSuccess(res.username);
      } else {
        setError(res.message || 'Invalid administrator username or password.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to cloud server. Please check internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={onBackToCustomer}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Customer Rates Dashboard</span>
        </button>

        <div className="bullion-card rounded-3xl p-6 sm:p-8 border border-[#232D3F] shadow-gold-md relative overflow-hidden">
          {/* Subtle gold glow */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden p-0.5 bg-gradient-to-br from-[#F5DE88] via-[#D4AF37] to-[#8C6D1F] mx-auto mb-3 shadow-gold-md">
              <img src="/logo.png" alt="Saikiran Bullion Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-serif-gold">
              Administrator Portal
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Authorized credentials required to modify daily gold rates
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full bg-[#0E121A] border border-[#232D3F] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA820A] hover:from-[#E6C657] hover:to-[#B8901D] text-black font-bold text-sm tracking-wide shadow-gold-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to Cloud Server...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate & Open Admin</span>
                </>
              )}
            </button>
          </form>

          {/* Test credentials convenience hint */}
          <div className="mt-6 pt-4 border-t border-[#1C2433] text-[11px] text-gray-400 bg-[#0E121A]/60 p-3 rounded-xl border border-[#1A2230]">
            <div className="font-semibold text-gray-300 mb-0.5">Pre-configured Admin Access:</div>
            <div>Username: <code className="text-[#F3E5AB]">admin</code></div>
            <div>Password: <code className="text-[#F3E5AB]">admin@gold2026</code></div>
          </div>
        </div>
      </div>
    </div>
  );
};
