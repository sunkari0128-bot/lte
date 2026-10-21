export interface GoldRateRecord {
  id: number;
  date: string; // YYYY-MM-DD
  gold_24k_market_per_gram: number;
  gold_24k_selling_per_gram: number;
  gold_22k_market_per_gram: number;
  gold_22k_selling_per_gram: number;
  gold_18k_market_per_gram?: number;
  gold_18k_selling_per_gram?: number;
  silver_market_per_gram: number;
  silver_selling_per_gram: number;
  updated_at: string;
}

export type PurityKey = '24k' | '22k' | 'silver';

export interface PurityDetails {
  key: PurityKey;
  label: string; // e.g. "24K Gold (999)", "22K Gold (916)", "Fine Silver (999)"
  purityPercent: string;
  marketPerGram: number;
  sellingPerGram: number;
  marketPer10Gram: number;
  sellingPer10Gram: number;
  marketPerKg?: number;
  sellingPerKg?: number;
  diffPerGram: number; // selling - market
  diffPer10Gram: number;
  percentDiff: number;
  dayChangePerGram: number;
  dayChangePer10Gram: number;
  dayChangeMarketPerGram: number;
  direction: 'up' | 'down' | 'same';
}

export interface DayMovement {
  difference: number;
  direction: 'up' | 'down' | 'same';
  formatted: string;
  referenceDate: string;
}

export interface TodayRatesResponse {
  today: GoldRateRecord;
  previous: GoldRateRecord | null;
  lastUpdated: string;
  purities: Record<PurityKey, PurityDetails>;
  overallMovement: DayMovement;
  isLive?: boolean;
  liveSource?: string;
  isDelayed?: boolean;
  delayedNote?: string;
}

export type HistoryRange = '7d' | '30d' | '3m' | '6m' | '1y';

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  operatingHours: string;
  rateDisclaimer: string;
  currencySymbol: string;
  lastUpdatedBy?: string;
  goldapiKey?: string;
}

export interface AdminAuthResponse {
  success: boolean;
  token?: string;
  username?: string;
  message?: string;
}

export interface LiveRateFeed {
  isLive: boolean;
  source: string;
  updatedAt: string;
  dayChangeGoldPercent: number;
  dayChangeSilverPercent: number;
  isDelayed?: boolean;
  delayedNote?: string;
  cacheExpiresInSeconds?: number;
  rates: {
    gold_24k_market_per_gram: number;
    gold_24k_selling_per_gram: number;
    gold_22k_market_per_gram: number;
    gold_22k_selling_per_gram: number;
    silver_market_per_gram: number;
    silver_selling_per_gram: number;
  };
}
