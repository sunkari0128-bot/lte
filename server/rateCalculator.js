/**
 * Server-side rate calculations and payload formatting
 */

function roundTwo(num) {
  return Math.round((Number(num) || 0) * 100) / 100;
}

function calculateDiff(selling, market) {
  return roundTwo(selling - market);
}

function calculatePercentDiff(selling, market) {
  if (!market || market === 0) return 0;
  return roundTwo(((selling - market) / market) * 100);
}

function formatDayMovement(diff, prevDate) {
  const abs = Math.abs(diff);
  const formattedAbs = abs.toLocaleString('en-IN');
  if (diff > 0) {
    return {
      difference: diff,
      direction: 'up',
      formatted: `↑ ₹${formattedAbs}/g from yesterday`,
      referenceDate: prevDate
    };
  } else if (diff < 0) {
    return {
      difference: diff,
      direction: 'down',
      formatted: `↓ ₹${formattedAbs}/g from yesterday`,
      referenceDate: prevDate
    };
  } else {
    return {
      difference: 0,
      direction: 'same',
      formatted: `No change (₹0) from yesterday`,
      referenceDate: prevDate
    };
  }
}

function buildPurityDetails(key, label, purityPercent, marketPerGram, sellingPerGram, prevMarketPerGram, prevSellingPerGram) {
  const marketPer10Gram = roundTwo(marketPerGram * 10);
  const sellingPer10Gram = roundTwo(sellingPerGram * 10);
  const diffPerGram = calculateDiff(sellingPerGram, marketPerGram);
  const diffPer10Gram = calculateDiff(sellingPer10Gram, marketPer10Gram);
  const percentDiff = calculatePercentDiff(sellingPerGram, marketPerGram);

  const prevSell = prevSellingPerGram ?? sellingPerGram;
  const prevMarket = prevMarketPerGram ?? marketPerGram;

  const dayChangePerGram = roundTwo(sellingPerGram - prevSell);
  const dayChangePer10Gram = roundTwo(sellingPer10Gram - (prevSell * 10));
  const dayChangeMarketPerGram = roundTwo(marketPerGram - prevMarket);

  const direction = dayChangePerGram > 0 ? 'up' : dayChangePerGram < 0 ? 'down' : 'same';

  const marketPerKg = roundTwo(marketPerGram * 1000);
  const sellingPerKg = roundTwo(sellingPerGram * 1000);

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
    direction
  };
}

function formatTodayRatesPayload(todayRecord, prevRecord) {
  const p24 = buildPurityDetails(
    '24k',
    '24K Gold (999)',
    '99.9% Pure Bullion',
    todayRecord.gold_24k_market_per_gram,
    todayRecord.gold_24k_selling_per_gram,
    prevRecord ? prevRecord.gold_24k_market_per_gram : null,
    prevRecord ? prevRecord.gold_24k_selling_per_gram : null
  );

  const p22 = buildPurityDetails(
    '22k',
    '22K Gold (916)',
    '91.6% Standard Hallmarked',
    todayRecord.gold_22k_market_per_gram,
    todayRecord.gold_22k_selling_per_gram,
    prevRecord ? prevRecord.gold_22k_market_per_gram : null,
    prevRecord ? prevRecord.gold_22k_selling_per_gram : null
  );

  const silver = buildPurityDetails(
    'silver',
    'Fine Silver (999)',
    '99.9% Pure Silver Bullion',
    todayRecord.silver_market_per_gram || 115.0,
    todayRecord.silver_selling_per_gram || 118.0,
    prevRecord ? (prevRecord.silver_market_per_gram || 113.0) : null,
    prevRecord ? (prevRecord.silver_selling_per_gram || 116.0) : null
  );

  const overallDiff = prevRecord
    ? roundTwo(todayRecord.gold_24k_selling_per_gram - prevRecord.gold_24k_selling_per_gram)
    : 0;

  const overallMovement = formatDayMovement(
    overallDiff,
    prevRecord ? prevRecord.date : todayRecord.date
  );

  return {
    today: todayRecord,
    previous: prevRecord || null,
    lastUpdated: todayRecord.updated_at,
    purities: {
      '24k': p24,
      '22k': p22,
      'silver': silver
    },
    overallMovement
  };
}

module.exports = {
  roundTwo,
  calculateDiff,
  calculatePercentDiff,
  buildPurityDetails,
  formatTodayRatesPayload
};
