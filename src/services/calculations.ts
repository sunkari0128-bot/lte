import { GoldRateRecord, PurityDetails, PurityKey, DayMovement, HistoryRange } from '../types';

/**
 * Format currency in Indian numbering system (e.g., ₹1,27,000 or ₹12,700)
 */
export function formatCurrency(amount: number, includeDecimals = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(absAmount);

  return `${amount < 0 ? '-' : ''}₹${formatted}`;
}

/**
 * Calculate rate for 10 grams: rate per gram * 10
 */
export function calculate10g(perGram: number): number {
  return Math.round((perGram * 10) * 100) / 100;
}

/**
 * Calculate difference between selling rate and market rate: selling - market
 */
export function calculateDiff(selling: number, market: number): number {
  return Math.round((selling - market) * 100) / 100;
}

/**
 * Calculate percentage difference: ((selling - market) / market) * 100
 */
export function calculatePercentDiff(selling: number, market: number): number {
  if (!market || market === 0) return 0;
  return Math.round(((selling - market) / market) * 10000) / 100;
}

/**
 * Format date nicely (e.g., "Monday, 5 Oct 2026")
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format datetime string into human readable time (e.g. "05 Oct 2026, 11:30 AM")
 */
export function formatDateTime(isoString: string): string {
  if (!isoString) return 'Just now';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Build rich purity details for today vs yesterday
 */
export function computePurityDetails(
  key: PurityKey,
  today: GoldRateRecord,
  previous: GoldRateRecord | null
): PurityDetails {
  let label = '24K Gold (999)';
  let purityPercent = '99.9% Purity Pure Bullion';
  let marketPerGram = today.gold_24k_market_per_gram;
  let sellingPerGram = today.gold_24k_selling_per_gram;
  let prevSellingPerGram = previous?.gold_24k_selling_per_gram ?? sellingPerGram;
  let prevMarketPerGram = previous?.gold_24k_market_per_gram ?? marketPerGram;

  if (key === '22k') {
    label = '22K Gold (916)';
    purityPercent = '91.6% Purity Standard';
    marketPerGram = today.gold_22k_market_per_gram;
    sellingPerGram = today.gold_22k_selling_per_gram;
    prevSellingPerGram = previous?.gold_22k_selling_per_gram ?? sellingPerGram;
    prevMarketPerGram = previous?.gold_22k_market_per_gram ?? marketPerGram;
  } else if (key === 'silver') {
    label = 'Fine Silver (999)';
    purityPercent = '99.9% Pure Silver Bullion';
    marketPerGram = today.silver_market_per_gram || 115.0;
    sellingPerGram = today.silver_selling_per_gram || 118.0;
    prevSellingPerGram = previous?.silver_selling_per_gram ?? sellingPerGram;
    prevMarketPerGram = previous?.silver_market_per_gram ?? marketPerGram;
  }

  const marketPer10Gram = calculate10g(marketPerGram);
  const sellingPer10Gram = calculate10g(sellingPerGram);
  const marketPerKg = Math.round(marketPerGram * 1000 * 100) / 100;
  const sellingPerKg = Math.round(sellingPerGram * 1000 * 100) / 100;

  const diffPerGram = calculateDiff(sellingPerGram, marketPerGram);
  const diffPer10Gram = calculateDiff(sellingPer10Gram, marketPer10Gram);
  const diffPerKg = calculateDiff(sellingPerKg, marketPerKg);
  const percentDiff = calculatePercentDiff(sellingPerGram, marketPerGram);

  const dayChangePerGram = Math.round((sellingPerGram - prevSellingPerGram) * 100) / 100;
  const dayChangePer10Gram = Math.round((sellingPer10Gram - calculate10g(prevSellingPerGram)) * 100) / 100;
  const dayChangeMarketPerGram = Math.round((marketPerGram - prevMarketPerGram) * 100) / 100;

  const direction: 'up' | 'down' | 'same' =
    dayChangePerGram > 0 ? 'up' : dayChangePerGram < 0 ? 'down' : 'same';

  return {
    key,
    label,
    purityPercent,
    marketPerGram,
    sellingPerGram,
    marketPer10Gram,
    sellingPer10Gram,
    marketPerKg,
    sellingPerKg,
    diffPerGram,
    diffPer10Gram,
    percentDiff,
    dayChangePerGram,
    dayChangePer10Gram,
    dayChangeMarketPerGram,
    direction,
  };
}

/**
 * Calculate overall daily movement formatted message
 * Example: "↑ ₹250 from yesterday" or "↓ ₹150 from yesterday"
 */
export function calculateDayMovement(
  today: GoldRateRecord,
  previous: GoldRateRecord | null,
  purity: PurityKey = '24k'
): DayMovement {
  if (!previous) {
    return {
      difference: 0,
      direction: 'same',
      formatted: 'Market rate baseline initialized',
      referenceDate: today.date,
    };
  }

  const todayRate =
    purity === '24k'
      ? today.gold_24k_selling_per_gram
      : purity === '22k'
      ? today.gold_22k_selling_per_gram
      : (today.silver_selling_per_gram || 118.0);

  const prevRate =
    purity === '24k'
      ? previous.gold_24k_selling_per_gram
      : purity === '22k'
      ? previous.gold_22k_selling_per_gram
      : (previous.silver_selling_per_gram || 116.0);

  const diff = todayRate - prevRate;
  const absDiff = Math.abs(diff);

  if (diff > 0) {
    return {
      difference: diff,
      direction: 'up',
      formatted: `↑ ₹${absDiff.toLocaleString('en-IN')}/g from yesterday`,
      referenceDate: previous.date,
    };
  } else if (diff < 0) {
    return {
      difference: diff,
      direction: 'down',
      formatted: `↓ ₹${absDiff.toLocaleString('en-IN')}/g from yesterday`,
      referenceDate: previous.date,
    };
  } else {
    return {
      difference: 0,
      direction: 'same',
      formatted: `No change (₹0) from yesterday`,
      referenceDate: previous.date,
    };
  }
}

/**
 * Filter historical records based on selected time window
 */
export function filterHistoryByRange(
  records: GoldRateRecord[],
  range: HistoryRange
): GoldRateRecord[] {
  if (!records || records.length === 0) return [];

  // Sort chronologically ascending
  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  if (sorted.length === 0) return [];
  const latestDate = new Date(sorted[sorted.length - 1].date);
  
  let daysCutoff = 7;
  switch (range) {
    case '7d':
      daysCutoff = 7;
      break;
    case '30d':
      daysCutoff = 30;
      break;
    case '3m':
      daysCutoff = 90;
      break;
    case '6m':
      daysCutoff = 180;
      break;
    case '1y':
      daysCutoff = 365;
      break;
  }

  const cutoffTimestamp = latestDate.getTime() - daysCutoff * 24 * 60 * 60 * 1000;
  const filtered = sorted.filter(r => new Date(r.date).getTime() >= cutoffTimestamp);

  // If filtered is too small due to sparse mock data, return at least the last minimum slice
  if (filtered.length < 2 && sorted.length >= 2) {
    return sorted.slice(-Math.min(sorted.length, daysCutoff));
  }
  return filtered;
}
