const express = require('express');
const router = express.Router();
const { getDatabase, queryAll, queryOne, runQuery } = require('../db');
const { formatTodayRatesPayload } = require('../rateCalculator');
const { fetchLiveBullionRates, syncLiveRatesToDb } = require('../liveRateService');

// GET /api/rates/live - Get real-time spot bullion rates directly from live market feeds
router.get('/live', async (req, res) => {
  try {
    const db = await getDatabase();
    const live = await fetchLiveBullionRates(db);
    return res.json({
      success: true,
      data: live
    });
  } catch (err) {
    console.error('Error fetching live rates:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch live rates' });
  }
});

// POST /api/rates/sync-live - Sync today's database record with live market prices
router.post('/sync-live', async (req, res) => {
  try {
    const db = await getDatabase();
    const live = await fetchLiveBullionRates(db);
    const result = await syncLiveRatesToDb(db, queryOne, runQuery, live);
    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('Error syncing live rates to database:', err);
    return res.status(500).json({ success: false, error: 'Failed to sync live rates' });
  }
});

// GET /api/rates/today - Get latest daily rates and calculation metadata
router.get('/today', async (req, res) => {
  try {
    const db = await getDatabase();

    // Fetch live rates (checks 60-second cache automatically)
    const live = await fetchLiveBullionRates(db);

    try {
      await syncLiveRatesToDb(db, queryOne, runQuery, live);
    } catch (syncErr) {
      console.warn('Auto live sync to DB warning:', syncErr.message);
    }

    // Get the two most recent records
    const recentRecords = queryAll(
      db,
      "SELECT * FROM gold_rates ORDER BY date DESC LIMIT 2"
    );

    if (recentRecords.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No rate records available. Administrator must add today rates.'
      });
    }

    const todayRecord = recentRecords[0];
    const prevRecord = recentRecords.length > 1 ? recentRecords[1] : null;

    const payload = formatTodayRatesPayload(todayRecord, prevRecord);
    payload.isLive = live.isLive;
    payload.isDelayed = live.isDelayed;
    payload.delayedNote = live.delayedNote;
    payload.liveSource = live.source;
    payload.lastUpdated = live.updatedAt || todayRecord.updated_at;

    return res.json({
      success: true,
      data: payload
    });
  } catch (err) {
    console.error('Error fetching today rates:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/rates/history - Get rates over time for history screen and line chart
router.get('/history', async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const db = await getDatabase();

    let limitDays = 30;
    if (range === '7d') limitDays = 7;
    else if (range === '30d') limitDays = 30;
    else if (range === '3m') limitDays = 90;
    else if (range === '6m') limitDays = 180;
    else if (range === '1y') limitDays = 365;

    // Fetch records in descending date order up to limitDays
    const records = queryAll(
      db,
      `SELECT * FROM gold_rates ORDER BY date DESC LIMIT ?`,
      [limitDays]
    );

    // Provide both chronological order (for charting) and reverse order (for list view)
    const chronological = [...records].reverse();

    return res.json({
      success: true,
      range,
      count: records.length,
      data: records, // descending for table
      chartData: chronological // ascending for time series
    });
  } catch (err) {
    console.error('Error fetching rate history:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/settings - Get public business info, contact placeholders, disclaimers
router.get('/settings', async (req, res) => {
  try {
    const db = await getDatabase();
    const rows = queryAll(db, "SELECT key, value FROM system_settings");
    const settings = {};
    for (const r of rows) {
      // Do not leak secret API keys to public customer endpoint
      if (r.key !== 'goldapi_key' && r.key !== 'goldapiKey') {
        settings[r.key] = r.value;
      }
    }
    return res.json({
      success: true,
      data: settings
    });
  } catch (err) {
    console.error('Error fetching settings:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
