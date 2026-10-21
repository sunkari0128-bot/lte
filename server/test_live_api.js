const TROY_OUNCE_TO_GRAMS = 31.1034768;

async function fetchLiveMarketRates() {
  console.log("Fetching live rates...");
  let goldInrPerOunce = null;
  let silverInrPerOunce = null;
  let source = "gold-api.com";
  let updatedAt = new Date().toISOString();

  // Try Source 1: gold-api.com
  try {
    const [goldRes, silverRes] = await Promise.all([
      fetch("https://api.gold-api.com/price/XAU/INR", { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(6000) }),
      fetch("https://api.gold-api.com/price/XAG/INR", { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(6000) })
    ]);

    if (goldRes.ok && silverRes.ok) {
      const goldData = await goldRes.json();
      const silverData = await silverRes.json();
      goldInrPerOunce = Number(goldData.price);
      silverInrPerOunce = Number(silverData.price);
      updatedAt = goldData.updatedAt || updatedAt;
      console.log("Successfully fetched from gold-api.com!");
    }
  } catch (err) {
    console.warn("Source 1 failed, trying Yahoo Finance:", err.message);
  }

  // Fallback to Yahoo Finance
  if (!goldInrPerOunce || !silverInrPerOunce) {
    try {
      const [gcRes, siRes, inrRes] = await Promise.all([
        fetch("https://query1.finance.yahoo.com/v8/finance/chart/GC=F", { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(6000) }),
        fetch("https://query1.finance.yahoo.com/v8/finance/chart/SI=F", { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(6000) }),
        fetch("https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X", { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(6000) })
      ]);

      if (gcRes.ok && siRes.ok && inrRes.ok) {
        const gcData = await gcRes.json();
        const siData = await siRes.json();
        const inrData = await inrRes.json();

        const goldUsd = gcData.chart.result[0].meta.regularMarketPrice;
        const silverUsd = siData.chart.result[0].meta.regularMarketPrice;
        const usdInr = inrData.chart.result[0].meta.regularMarketPrice;

        goldInrPerOunce = goldUsd * usdInr;
        silverInrPerOunce = silverUsd * usdInr;
        source = "Yahoo Finance Live Feed";
        console.log("Successfully fetched from Yahoo Finance!");
      }
    } catch (err) {
      console.error("Yahoo Finance also failed:", err.message);
    }
  }

  if (goldInrPerOunce && silverInrPerOunce) {
    const gold24kMarketPerGram = Math.round((goldInrPerOunce / TROY_OUNCE_TO_GRAMS) * 100) / 100;
    const gold22kMarketPerGram = Math.round((gold24kMarketPerGram * (22 / 24)) * 100) / 100;
    const silverMarketPerGram = Math.round((silverInrPerOunce / TROY_OUNCE_TO_GRAMS) * 100) / 100;

    // Standard business selling spread (e.g. +1.5% - 2% retail margin or configurable in settings/admin)
    // Selling rate:
    const gold24kSellingPerGram = Math.round(gold24kMarketPerGram * 1.015);
    const gold22kSellingPerGram = Math.round(gold22kMarketPerGram * 1.015);
    const silverSellingPerGram = Math.round(silverMarketPerGram * 1.025 * 10) / 10;

    console.log({
      source,
      updatedAt,
      gold24kMarketPerGram,
      gold24kSellingPerGram,
      gold24kMarketPer10g: gold24kMarketPerGram * 10,
      gold24kSellingPer10g: gold24kSellingPerGram * 10,
      gold22kMarketPerGram,
      gold22kSellingPerGram,
      silverMarketPerGram,
      silverSellingPerGram,
      silverSellingPerKg: Math.round(silverSellingPerGram * 1000)
    });
  }
}

fetchLiveMarketRates();
