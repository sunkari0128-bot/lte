import React, { useEffect, useState } from 'react';
import { BusinessSettings } from '../types';
import { fetchSettings } from '../services/api';
import { ShieldCheck, Phone, Mail, MapPin, Clock, AlertTriangle, Building, CheckCircle } from 'lucide-react';

interface AboutScreenProps {
  lastUpdated: string;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ lastUpdated }) => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  useEffect(() => {
    fetchSettings()
      .then((data) => setSettings(data))
      .catch((err) => console.error('Failed to load settings:', err));
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bullion-card rounded-3xl p-5 sm:p-7 border border-[#232D3F]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-1">
          <Building className="w-3.5 h-3.5" />
          <span>Bullion Merchant Information</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif-gold">
          About Saikiran Bullion
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
          Transparent, certified gold bullion spot rates and physical counter selling prices published daily.
        </p>
      </div>

      {/* ABOUT THE BUSINESS */}
      <div className="bullion-card rounded-2xl p-5 sm:p-6 border border-[#232D3F] space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full overflow-hidden p-0.5 bg-gradient-to-br from-[#F5DE88] via-[#D4AF37] to-[#8C6D1F] shadow-gold-md shrink-0">
            <img 
              src="/logo.png" 
              alt="Saikiran Bullion Official Logo" 
              className="w-full h-full object-cover rounded-full" 
            />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white font-serif-gold">
              {settings?.businessName || 'Saikiran Bullion'}
            </h2>
            <p className="text-xs text-[#D4AF37]">
              {settings?.tagline || 'Direct Bullion Rates & Certified Hallmarked Gold'}
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          We are a premier bullion dealer and precious metals merchant dedicated to supplying wholesale and retail clients with certified physical gold bars, bullion biscuits, and fine investment minted coins. 
        </p>

        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
          This portal functions exclusively as an informative live rate dissemination service. We provide direct transparency between national spot benchmarks and our physical counter selling prices per gram and per 10 grams for 24 Karat (999 fineness), 22 Karat (916 standard), and 18 Karat (750 hallmark).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-[#0E121A] p-3 rounded-xl border border-[#1E2638] flex items-center gap-2 text-xs text-gray-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% BIS Hallmarked</span>
          </div>
          <div className="bg-[#0E121A] p-3 rounded-xl border border-[#1E2638] flex items-center gap-2 text-xs text-gray-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Assay Certified Ingot Purity</span>
          </div>
          <div className="bg-[#0E121A] p-3 rounded-xl border border-[#1E2638] flex items-center gap-2 text-xs text-gray-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Zero Concealed Spreads</span>
          </div>
        </div>
      </div>

      {/* RATE INFORMATION DISCLAIMER */}
      <div className="bg-[#17150E] border-2 border-[#D4AF37]/40 rounded-2xl p-5 sm:p-6 shadow-gold-sm">
        <div className="flex items-center gap-2 mb-2 text-[#F5DE88]">
          <AlertTriangle className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="font-bold text-sm sm:text-base font-serif-gold">
            Official Rate Disclaimer & Legal Notices
          </h3>
        </div>

        <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
          <p>
            {settings?.rateDisclaimer ||
              'Notice: Bullion rates displayed are our benchmark spot rates and counter selling rates per gram & 10 grams. Rates are subject to international market fluctuations. All physical gold is BIS 999/916/750 hallmarked. Applicable GST (3%) extra at counter billing.'}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400 text-[11px]">
            <li>
              <strong>Non-E-Commerce Notice:</strong> This website is purely a rate bulletin and calculation portal. We do not provide digital shopping carts, online checkouts, customer card processing, or remote shipment orders.
            </li>
            <li>
              <strong>Rate Locking:</strong> Physical bullion transactions must be executed and confirmed in person at our authorized bullion counter during trade hours.
            </li>
            <li>
              <strong>Taxes:</strong> Rates displayed are exclusive of statutory 3% Goods and Services Tax (GST) payable on bullion in accordance with central government fiscal laws.
            </li>
          </ul>
        </div>
      </div>

      {/* LAST UPDATE INFORMATION */}
      <div className="bullion-card rounded-2xl p-4 sm:p-5 border border-[#232D3F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#1C2536] text-[#D4AF37]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400">Database Record State</div>
            <div className="text-sm font-bold text-white">
              Last Rate Update: <span className="text-[#F3E5AB]">{formatDateTime(lastUpdated)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-[#0E121A] px-3 py-1.5 rounded-xl border border-[#1E2638] text-gray-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verified by {settings?.lastUpdatedBy || 'Administrator'}</span>
        </div>
      </div>

      {/* CONTACT INFORMATION PLACEHOLDERS */}
      <div className="bullion-card rounded-2xl p-5 sm:p-6 border border-[#232D3F]">
        <h3 className="text-base font-bold text-white font-serif-gold mb-4">
          Bullion Counter & Contact Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start gap-3 bg-[#0E121A] p-3.5 rounded-xl border border-[#1E2638]">
            <Phone className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <span className="text-gray-400 block text-[11px]">Telephone Inquiries</span>
              <span className="font-mono text-gray-200 font-semibold">{settings?.phone || '+91 98765 43210'}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-[#0E121A] p-3.5 rounded-xl border border-[#1E2638]">
            <Mail className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <span className="text-gray-400 block text-[11px]">Official Email</span>
              <span className="font-mono text-gray-200 font-semibold">{settings?.email || 'rates@saikiranbullion.com'}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-[#0E121A] p-3.5 rounded-xl border border-[#1E2638]">
            <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <span className="text-gray-400 block text-[11px]">Bullion Desk & Vault Address</span>
              <span className="text-gray-200">{settings?.address || 'Main Road, Khammam, Telangana - 507001'}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-[#0E121A] p-3.5 rounded-xl border border-[#1E2638]">
            <Clock className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <span className="text-gray-400 block text-[11px]">Trading & Counter Hours</span>
              <span className="text-gray-200">{settings?.operatingHours || 'Mon - Sat: 10:00 AM to 7:30 PM IST (Counter settlement closes at 7:00 PM)'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
