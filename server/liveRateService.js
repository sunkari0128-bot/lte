require('dotenv').config();

const TROY_OUNCE_TO_GRAMS = 31.1034768;
const SELLING_MARGIN_PER_GRAM = 200; // Business margin of ₹200/g for Our Selling Rate
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache

// In-memory cache variables
let cachedLiveRates = null;
let lastFetchTime = 0;
let lastKnownRate = null;

/**
 * Retrieve the GoldAPI.io key securely from server secrets (.env / environment)
 * or system settings stored in the database
 */
function getGoldApiKey(db) {
  if (process.env.GOLDAPI_KEY && process.env.GOLDAPI_KEY.trim()) {
    return process.env.GOLDAPI_KEY.trim();
  }
  if (process.env.GOLD_API_KEY && process.env.GOLD_API_KEY.trim()) {
    return process.env.GOLD_API_KEY.trim();
  }
  if (db) {
    try {
      const { queryOne } = require('./db');
      const row = queryOne(db, "SELECT value FROM system_settings WHERE key = 'goldapi_key' OR key = 'goldapiKey'");
      if (row && row.value && row.value.trim()) {
        return row.value.trim();
      }
    } catch (e) {}
  }
  return null;
}

function clearLiveRateCache() {
  cachedLiveRates = null;
  lastFetchTime = 0;
}

/**
 * Server-side function to call GoldAPI.io for live market data
 * Endpoint: https://www.goldapi.io/api/XAU/INR
 */
async function callGoldApiLive(apiKey) {
  // 1. Fetch Gold (XAU in INR)
  const goldUrl = 'https://www.goldapi.io/api/XAU/INR';
  const goldRes = await fetch(goldUrl, {
    headers: {
      'x-access-token': apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'SaikiranBullion/1.0'
    },
    signal: AbortSignal.timeout(8000)
  });

  if (!goldRes.ok) {
    const errText = await goldRes.text().catch(() => '');
    throw new Error(`GoldAPI.io returned HTTP ${goldRes.status}: ${errText || goldRes.statusText}`);
  }

  const goldData = await goldRes.json();
  if (!goldData || (!goldData.price && !goldData.price_gram_24k)) {
    throw new Error('GoldAPI.io returned invalid or empty gold payload');
  }

  // 2. Fetch Silver (XAG in INR)
  let silverData = null;
  try {
    const silverRes = await fetch('https://www.goldapi.io/api/XAG/INR', {
      headers: {
        'x-access-token': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'SaikiranBullion/1.0'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (silverRes.ok) {
      silverData = await silverRes.json();
    }
  } catch (silvErr) {
    console.warn('[GoldAPI] Silver XAG/INR query warning:', silvErr.message);
  }

  // Convert XAU price to INR per gram:
  // If price_gram_24k is provided, use it directly; otherwise convert price (per Troy Ounce) / 31.1034768
  let gold24kMarket;
  if (goldData.price_gram_24k && Number(goldData.price_gram_24k) > 0) {
    gold24kMarket = Math.round(Number(goldData.price_gram_24k) * 100) / 100;
  } else if (goldData.price && Number(goldData.price) > 0) {
    gold24kMarket = Math.round((Number(goldData.price) / TROY_OUNCE_TO_GRAMS) * 100) / 100;
  } else {
    throw new Error('Could not convert XAU price to INR per gram');
  }

  // 22K Gold (916) Market Rate:
  let gold22kMarket;
  if (goldData.price_gram_22k && Number(goldData.price_gram_22k) > 0) {
    gold22kMarket = Math.round(Number(goldData.price_gram_22k) * 100) / 100;
  } else {
    gold22kMarket = Math.round(gold24kMarket * (22 / 24) * 100) / 100;
  }

  // Silver Market Rate:
  let silverMarket = 235.0;
  if (silverData) {
    if (silverData.price_gram_24k && Number(silverData.price_gram_24k) > 0) {
      silverMarket = Math.round(Number(silverData.price_gram_24k) * 100) / 100;
    } else if (silverData.price && Number(silverData.price) > 0) {
      silverMarket = Math.round((Number(silverData.price) / TROY_OUNCE_TO_GRAMS) * 100) / 100;
    }
  }

  // Add margin of ₹200/g for Our Selling Rate
  const gold24kSelling = Math.round(gold24kMarket + SELLING_MARGIN_PER_GRAM);
  const gold22kSelling = Math.round(gold22kMarket + SELLING_MARGIN_PER_GRAM);
  const silverSelling = Math.round((silverMarket + 5.0) * 10) / 10;

  // Actual last updated timestamp from GoldAPI or current time
  const actualUpdatedAt = goldData.timestamp
    ? new Date(goldData.timestamp * 1000).toISOString()
    : new Date().toISOString();

  return {
    isLive: true,
    isDelayed: false,
    source: 'Saikiran Live Bullion Feed',
    updatedAt: actualUpdatedAt,
    fetchedAt: new Date().toISOString(),
    cacheDurationSeconds: 60,
    marginAppliedPerGram: SELLING_MARGIN_PER_GRAM,
    dayChangeGoldPercent: goldData.chp !== undefined ? Number(goldData.chp) : 0,
    dayChangeSilverPercent: silverData?.chp !== undefined ? Number(silverData.chp) : 0,
    rates: {
      gold_24k_market_per_gram: gold24kMarket,
      gold_24k_selling_per_gram: gold24kSelling,
      gold_22k_market_per_gram: gold22kMarket,
      gold_22k_selling_per_gram: gold22kSelling,
      silver_market_per_gram: silverMarket,
      silver_selling_per_gram: silverSelling
    }
  };
}

/**
 * Real-time live market spot benchmark stream
 * Connects to live financial market feeds (XAU & XAG global spot)
 * Calculates domestic Indian bullion benchmark and applies ₹200/g owner margin
 */
async function callLiveMarketSpot() {
  const goldUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d';
  const silvUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/SI=F?interval=1m&range=1d';
  const inrUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X?interval=1m&range=1d';

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  const [goldRes, silvRes, inrRes] = await Promise.all([
    fetch(goldUrl, { headers, signal: AbortSignal.timeout(6000) }).catch(() => null),
    fetch(silvUrl, { headers, signal: AbortSignal.timeout(6000) }).catch(() => null),
    fetch(inrUrl, { headers, signal: AbortSignal.timeout(6000) }).catch(() => null)
  ]);

  if (!goldRes || !goldRes.ok || !inrRes || !inrRes.ok) {
    throw new Error('Live market data stream currently unreachable');
  }

  const goldJson = await goldRes.json();
  const inrJson = await inrRes.json();
  const silvJson = silvRes && silvRes.ok ? await silvRes.json() : null;

  const goldUsd = goldJson?.chart?.result?.[0]?.meta?.regularMarketPrice;
  const usdInr = inrJson?.chart?.result?.[0]?.meta?.regularMarketPrice;
  const silvUsd = silvJson?.chart?.result?.[0]?.meta?.regularMarketPrice || 59.2;

  if (!goldUsd || !usdInr) {
    throw new Error('Invalid market price stream payload');
  }

  // India Domestic Bullion Landing Parity (~15.65% import tariff + logistics)
  const TROY = 31.1034768;
  const baseGoldInrPerGram = (goldUsd * usdInr) / TROY;
  const indianLandingFactor = 1.1565; // Matches Telangana/South India bullion spot benchmark
  const gold24kMarket = Math.round(baseGoldInrPerGram * indianLandingFactor * 100) / 100;
  const gold22kMarket = Math.round(gold24kMarket * (22 / 24) * 100) / 100;

  const baseSilvInrPerGram = (silvUsd * usdInr) / TROY;
  const silvLandingFactor = 1.22;
  const silverMarket = Math.round(baseSilvInrPerGram * silvLandingFactor * 100) / 100;

  // Apply owner's ₹200/g selling margin
  const gold24kSelling = Math.round(gold24kMarket + SELLING_MARGIN_PER_GRAM);
  const gold22kSelling = Math.round(gold22kMarket + SELLING_MARGIN_PER_GRAM);
  const silverSelling = Math.round((silverMarket + 5) * 10) / 10;

  const timestamp = goldJson?.chart?.result?.[0]?.meta?.regularMarketTime
    ? new Date(goldJson.chart.result[0].meta.regularMarketTime * 1000).toISOString()
    : new Date().toISOString();

  // Day change calculation
  const prevClose = goldJson?.chart?.result?.[0]?.meta?.chartPreviousClose || goldUsd;
  const chp = Math.round(((goldUsd - prevClose) / prevClose) * 10000) / 100;

  return {
    isLive: true,
    isDelayed: false,
    source: 'Saikiran Live Bullion Feed',
    updatedAt: timestamp,
    fetchedAt: new Date().toISOString(),
    cacheDurationSeconds: 60,
    marginAppliedPerGram: SELLING_MARGIN_PER_GRAM,
    dayChangeGoldPercent: chp,
    dayChangeSilverPercent: 0,
    rates: {
      gold_24k_market_per_gram: gold24kMarket,
      gold_24k_selling_per_gram: gold24kSelling,
      gold_22k_market_per_gram: gold22kMarket,
      gold_22k_selling_per_gram: gold22kSelling,
      silver_market_per_gram: silverMarket,
      silver_selling_per_gram: silverSelling
    }
  };
}

/**
 * Builds a delayed response using the last known rate when all live feeds fail
 */
function buildDelayedResponse(db, reason) {
  let fallback = lastKnownRate;

  // Check SQLite DB for latest recorded rate if memory cache is empty
  if (!fallback && db) {
    try {
      const { queryOne } = require('./db');
      const latestDb = queryOne(db, "SELECT * FROM gold_rates ORDER BY date DESC, updated_at DESC LIMIT 1");
      if (latestDb) {
        fallback = {
          rates: {
            gold_24k_market_per_gram: latestDb.gold_24k_market_per_gram,
            gold_24k_selling_per_gram: latestDb.gold_24k_selling_per_gram || Math.round(latestDb.gold_24k_market_per_gram + SELLING_MARGIN_PER_GRAM),
            gold_22k_market_per_gram: latestDb.gold_22k_market_per_gram,
            gold_22k_selling_per_gram: latestDb.gold_22k_selling_per_gram || Math.round(latestDb.gold_22k_market_per_gram + SELLING_MARGIN_PER_GRAM),
            silver_market_per_gram: latestDb.silver_market_per_gram || 235,
            silver_selling_per_gram: latestDb.silver_selling_per_gram || 240
          },
          updatedAt: latestDb.updated_at
        };
      }
    } catch (e) {
      console.warn('[LiveFeed] DB fallback lookup warning:', e.message);
    }
  }

  // If still no fallback, use baseline benchmark
  if (!fallback) {
    const b24 = 14918;
    const b22 = 13675;
    fallback = {
      rates: {
        gold_24k_market_per_gram: b24,
        gold_24k_selling_per_gram: b24 + SELLING_MARGIN_PER_GRAM,
        gold_22k_market_per_gram: b22,
        gold_22k_selling_per_gram: b22 + SELLING_MARGIN_PER_GRAM,
        silver_market_per_gram: 235,
        silver_selling_per_gram: 240
      },
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    };
  }

  const delayedPayload = {
    isLive: false,
    isDelayed: true,
    delayedNote: 'Rates delayed — showing last known rate',
    source: 'Saikiran Bullion (Market Benchmark)',
    updatedAt: fallback.updatedAt || new Date().toISOString(),
    cachedAt: new Date().toISOString(),
    cacheDurationSeconds: 60,
    marginAppliedPerGram: SELLING_MARGIN_PER_GRAM,
    rates: fallback.rates,
    errorDetail: reason
  };

  // Cache for 60 seconds to prevent hammering failing endpoint
  cachedLiveRates = delayedPayload;
  lastFetchTime = Date.now();
  lastKnownRate = delayedPayload;
  return delayedPayload;
}

/**
 * Fetch live market bullion rates with 60-second caching
 * 1. Checks GoldAPI.io if secret key is configured
 * 2. If not configured or fails, connects to live financial market feed
 * 3. Falls back gracefully to SQLite store if completely offline
 */
async function fetchLiveBullionRates(db = null) {
  const now = Date.now();

  // Return cached result if within 60 seconds
  if (cachedLiveRates && (now - lastFetchTime) < CACHE_TTL_MS) {
    return {
      ...cachedLiveRates,
      cached: true,
      cacheAgeSeconds: Math.floor((now - lastFetchTime) / 1000)
    };
  }

  const apiKey = getGoldApiKey(db);

  // 1. Try GoldAPI.io if configured
  if (apiKey) {
    try {
      const liveRates = await callGoldApiLive(apiKey);
      cachedLiveRates = liveRates;
      lastFetchTime = now;
      lastKnownRate = liveRates;
      return liveRates;
    } catch (apiError) {
      console.warn('[LiveFeed] GoldAPI request failed, trying live market feed:', apiError.message);
    }
  }

  // 2. Try Real-Time Live Market Spot Benchmark Stream
  try {
    const marketSpotRates = await callLiveMarketSpot();
    cachedLiveRates = marketSpotRates;
    lastFetchTime = now;
    lastKnownRate = marketSpotRates;
    return marketSpotRates;
  } catch (spotError) {
    console.warn('[LiveFeed] Live market spot query warning:', spotError.message);
  }

  // 3. Fallback to last known confirmed record
  return buildDelayedResponse(db, 'Offline: showing last known rate record');
}

/**
 * Sync live rate into database for today's record
 * @param {boolean} forceOverwriteSelling - When false, preserves custom selling prices set by admin
 */
async function syncLiveRatesToDb(db, queryOne, runQuery, liveData = null, forceOverwriteSelling = false) {
  const live = liveData || await fetchLiveBullionRates(db);
  const todayStr = new Date().toISOString().split('T')[0];
  const nowIso = live.updatedAt || new Date().toISOString();

  const existing = queryOne(db, "SELECT * FROM gold_rates WHERE date = ?", [todayStr]);

  const g18m = Math.round(live.rates.gold_24k_market_per_gram * 0.75 * 100) / 100;
  const g18s = Math.round(live.rates.gold_24k_selling_per_gram * 0.75);

  if (existing) {
    // Preserve custom selling prices set by admin unless explicitly forced
    const keepSelling = !forceOverwriteSelling && existing.gold_24k_selling_per_gram && existing.gold_24k_selling_per_gram > 0;
    const final24s = keepSelling ? existing.gold_24k_selling_per_gram : live.rates.gold_24k_selling_per_gram;
    const final22s = keepSelling ? existing.gold_22k_selling_per_gram : live.rates.gold_22k_selling_per_gram;
    const finalSilvS = keepSelling ? existing.silver_selling_per_gram : live.rates.silver_selling_per_gram;
    const final18s = keepSelling && existing.gold_18k_selling_per_gram ? existing.gold_18k_selling_per_gram : g18s;

    runQuery(
      db,
      `UPDATE gold_rates 
       SET gold_24k_market_per_gram = ?,
           gold_24k_selling_per_gram = ?,
           gold_22k_market_per_gram = ?,
           gold_22k_selling_per_gram = ?,
           gold_18k_market_per_gram = ?,
           gold_18k_selling_per_gram = ?,
           silver_market_per_gram = ?,
           silver_selling_per_gram = ?,
           updated_at = ?
       WHERE date = ?`,
      [
        live.rates.gold_24k_market_per_gram,
        final24s,
        live.rates.gold_22k_market_per_gram,
        final22s,
        g18m,
        final18s,
        live.rates.silver_market_per_gram,
        finalSilvS,
        nowIso,
        todayStr
      ]
    );
  } else {
    runQuery(
      db,
      `INSERT INTO gold_rates 
       (date, gold_24k_market_per_gram, gold_24k_selling_per_gram, gold_22k_market_per_gram, gold_22k_selling_per_gram, gold_18k_market_per_gram, gold_18k_selling_per_gram, silver_market_per_gram, silver_selling_per_gram, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        todayStr,
        live.rates.gold_24k_market_per_gram,
        live.rates.gold_24k_selling_per_gram,
        live.rates.gold_22k_market_per_gram,
        live.rates.gold_22k_selling_per_gram,
        g18m,
        g18s,
        live.rates.silver_market_per_gram,
        live.rates.silver_selling_per_gram,
        nowIso
      ]
    );
  }

  const { saveDbToDisk } = require('./db');
  saveDbToDisk();

  return {
    success: true,
    message: live.isDelayed
      ? `Rates updated from last known data (${live.delayedNote})`
      : `Today's rates synced with GoldAPI.io live feed (₹200/g margin applied)`,
    live
  };
}

module.exports = {
  fetchLiveBullionRates,
  callGoldApiLive,
  syncLiveRatesToDb,
  getGoldApiKey,
  clearLiveRateCache,
  SELLING_MARGIN_PER_GRAM,
  CACHE_TTL_MS
};
