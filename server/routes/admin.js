const express = require('express');
const router = express.Router();
const { getDatabase, saveDbToDisk, queryAll, queryOne, verifyPassword, hashPassword } = require('../db');
const { createToken, requireAdminAuth } = require('../auth');
const { clearLiveRateCache } = require('../liveRateService');

// POST /api/admin/login - Secure login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    const db = await getDatabase();
    const adminUser = queryOne(
      db,
      "SELECT * FROM admin_users WHERE username = ?",
      [username.trim()]
    );

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        error: 'Invalid administrator credentials'
      });
    }

    const isValid = verifyPassword(password, adminUser.password_hash, adminUser.salt);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid administrator credentials'
      });
    }

    const token = createToken({
      id: adminUser.id,
      username: adminUser.username
    });

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      token,
      username: adminUser.username,
      message: 'Authentication successful'
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during login' });
  }
});

// GET /api/admin/me - Verify current admin session
router.get('/me', requireAdminAuth, async (req, res) => {
  return res.json({
    success: true,
    authenticated: true,
    username: req.admin.username
  });
});

// GET /api/admin/rates - Fetch all rates for admin management table
router.get('/rates', requireAdminAuth, async (req, res) => {
  try {
    const db = await getDatabase();
    const rates = queryAll(db, "SELECT * FROM gold_rates ORDER BY date DESC");
    return res.json({
      success: true,
      data: rates
    });
  } catch (err) {
    console.error('Error fetching admin rates:', err);
    return res.status(500).json({ success: false, error: 'Database error' });
  }
});

// POST /api/admin/rates - Add or update rates for a specific date
router.post('/rates', requireAdminAuth, async (req, res) => {
  try {
    const {
      date,
      gold_24k_market_per_gram,
      gold_24k_selling_per_gram,
      gold_22k_market_per_gram,
      gold_22k_selling_per_gram,
      gold_18k_market_per_gram,
      gold_18k_selling_per_gram,
      silver_market_per_gram,
      silver_selling_per_gram
    } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, error: 'Date is required (YYYY-MM-DD)' });
    }

    // Validate numeric values
    const g24m = parseFloat(gold_24k_market_per_gram);
    const g24s = parseFloat(gold_24k_selling_per_gram);
    const g22m = parseFloat(gold_22k_market_per_gram);
    const g22s = parseFloat(gold_22k_selling_per_gram);
    // Silver rates (required)
    const silvM = parseFloat(silver_market_per_gram);
    const silvS = parseFloat(silver_selling_per_gram);

    // Optional 18k fallback to preserve backward compatibility
    const g18m = parseFloat(gold_18k_market_per_gram || Math.round(g24m * 0.75));
    const g18s = parseFloat(gold_18k_selling_per_gram || Math.round(g24s * 0.75));

    if (isNaN(g24m) || isNaN(g24s) || isNaN(g22m) || isNaN(g22s) || isNaN(silvM) || isNaN(silvS)) {
      return res.status(400).json({ success: false, error: 'All gold and silver rate inputs must be valid positive numbers' });
    }

    if (g24m <= 0 || g24s <= 0 || g22m <= 0 || g22s <= 0 || silvM <= 0 || silvS <= 0) {
      return res.status(400).json({ success: false, error: 'Rates must be greater than zero' });
    }

    const updatedAt = new Date().toISOString();
    const db = await getDatabase();

    const stmt = db.prepare(`
      INSERT INTO gold_rates (
        date,
        gold_24k_market_per_gram,
        gold_24k_selling_per_gram,
        gold_22k_market_per_gram,
        gold_22k_selling_per_gram,
        gold_18k_market_per_gram,
        gold_18k_selling_per_gram,
        silver_market_per_gram,
        silver_selling_per_gram,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        gold_24k_market_per_gram = excluded.gold_24k_market_per_gram,
        gold_24k_selling_per_gram = excluded.gold_24k_selling_per_gram,
        gold_22k_market_per_gram = excluded.gold_22k_market_per_gram,
        gold_22k_selling_per_gram = excluded.gold_22k_selling_per_gram,
        gold_18k_market_per_gram = excluded.gold_18k_market_per_gram,
        gold_18k_selling_per_gram = excluded.gold_18k_selling_per_gram,
        silver_market_per_gram = excluded.silver_market_per_gram,
        silver_selling_per_gram = excluded.silver_selling_per_gram,
        updated_at = excluded.updated_at
    `);

    stmt.run([date, g24m, g24s, g22m, g22s, g18m, g18s, silvM, silvS, updatedAt]);
    stmt.free();

    // Update settings 'lastUpdatedBy'
    db.run("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('lastUpdatedBy', ?)", [req.admin.username]);

    saveDbToDisk();
    clearLiveRateCache();

    const savedRecord = queryOne(db, "SELECT * FROM gold_rates WHERE date = ?", [date]);

    return res.json({
      success: true,
      message: `Rates for ${date} successfully recorded.`,
      data: savedRecord
    });
  } catch (err) {
    console.error('Error saving rate:', err);
    return res.status(500).json({ success: false, error: 'Failed to save rate record' });
  }
});

// PUT /api/admin/rates/:id - Edit an existing rate record by ID
router.put('/rates/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      date,
      gold_24k_market_per_gram,
      gold_24k_selling_per_gram,
      gold_22k_market_per_gram,
      gold_22k_selling_per_gram,
      gold_18k_market_per_gram,
      gold_18k_selling_per_gram,
      silver_market_per_gram,
      silver_selling_per_gram
    } = req.body;

    const db = await getDatabase();
    const existing = queryOne(db, "SELECT * FROM gold_rates WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Rate record not found' });
    }

    const targetDate = date || existing.date;
    const g24m = parseFloat(gold_24k_market_per_gram ?? existing.gold_24k_market_per_gram);
    const g24s = parseFloat(gold_24k_selling_per_gram ?? existing.gold_24k_selling_per_gram);
    const g22m = parseFloat(gold_22k_market_per_gram ?? existing.gold_22k_market_per_gram);
    const g22s = parseFloat(gold_22k_selling_per_gram ?? existing.gold_22k_selling_per_gram);
    const g18m = parseFloat(gold_18k_market_per_gram ?? existing.gold_18k_market_per_gram ?? Math.round(g24m * 0.75));
    const g18s = parseFloat(gold_18k_selling_per_gram ?? existing.gold_18k_selling_per_gram ?? Math.round(g24s * 0.75));
    const silvM = parseFloat(silver_market_per_gram ?? existing.silver_market_per_gram ?? 115.0);
    const silvS = parseFloat(silver_selling_per_gram ?? existing.silver_selling_per_gram ?? 118.0);
    const updatedAt = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE gold_rates SET
        date = ?,
        gold_24k_market_per_gram = ?,
        gold_24k_selling_per_gram = ?,
        gold_22k_market_per_gram = ?,
        gold_22k_selling_per_gram = ?,
        gold_18k_market_per_gram = ?,
        gold_18k_selling_per_gram = ?,
        silver_market_per_gram = ?,
        silver_selling_per_gram = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run([targetDate, g24m, g24s, g22m, g22s, g18m, g18s, silvM, silvS, updatedAt, id]);
    stmt.free();

    saveDbToDisk();
    clearLiveRateCache();

    const updated = queryOne(db, "SELECT * FROM gold_rates WHERE id = ?", [id]);
    return res.json({
      success: true,
      message: 'Rate record updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('Error updating rate record:', err);
    return res.status(500).json({ success: false, error: 'Failed to update record' });
  }
});

// DELETE /api/admin/rates/:id - Delete rate record by ID
router.delete('/rates/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const db = await getDatabase();
    const existing = queryOne(db, "SELECT * FROM gold_rates WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Rate record not found' });
    }

    const stmt = db.prepare("DELETE FROM gold_rates WHERE id = ?");
    stmt.run([id]);
    stmt.free();

    saveDbToDisk();
    clearLiveRateCache();

    return res.json({
      success: true,
      message: `Rate record for ${existing.date} deleted successfully`
    });
  } catch (err) {
    console.error('Error deleting rate record:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete record' });
  }
});

// GET /api/admin/settings - Fetch admin settings including GoldAPI status
router.get('/settings', requireAdminAuth, async (req, res) => {
  try {
    const db = await getDatabase();
    const rows = queryAll(db, "SELECT key, value FROM system_settings");
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    const envKey = process.env.GOLDAPI_KEY || process.env.GOLD_API_KEY || '';
    const storedKey = settings.goldapi_key || settings.goldapiKey || '';
    const activeKey = envKey || storedKey;
    const hasKey = Boolean(activeKey && activeKey.trim().length > 0);

    return res.json({
      success: true,
      data: {
        ...settings,
        hasGoldApiKey: hasKey,
        goldapiKey: activeKey ? (activeKey.length > 8 ? `${activeKey.slice(0, 4)}••••${activeKey.slice(-4)}` : '••••••••') : ''
      }
    });
  } catch (err) {
    console.error('Error fetching admin settings:', err);
    return res.status(500).json({ success: false, error: 'Database error' });
  }
});

// PUT /api/admin/settings - Update business metadata & disclaimer & api keys
router.put('/settings', requireAdminAuth, async (req, res) => {
  try {
    const db = await getDatabase();
    const entries = Object.entries(req.body);

    const stmt = db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)");
    let keyUpdated = false;
    for (const [key, value] of entries) {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        // If it's a masked placeholder (e.g. starts with ••• or contains ...), don't overwrite existing
        if ((key === 'goldapiKey' || key === 'goldapi_key') && (trimmed.includes('•') || trimmed.includes('...'))) {
          continue;
        }
        if (key === 'goldapiKey' || key === 'goldapi_key') {
          keyUpdated = true;
          // Store both keys so both lookups find it
          stmt.run(['goldapi_key', trimmed]);
          stmt.run(['goldapiKey', trimmed]);
          continue;
        }
        stmt.run([key, trimmed]);
      }
    }
    stmt.free();

    if (keyUpdated) {
      clearLiveRateCache();
    }

    saveDbToDisk();
    clearLiveRateCache();

    return res.json({
      success: true,
      message: 'Business settings and API keys updated successfully'
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    return res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// PUT /api/admin/change-password - Change admin login password
router.put('/change-password', requireAdminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    const db = await getDatabase();
    const adminUser = queryOne(db, "SELECT * FROM admin_users WHERE username = ?", [req.admin.username]);
    if (!adminUser) {
      return res.status(404).json({ success: false, error: 'Admin user not found' });
    }

    const isValid = verifyPassword(currentPassword, adminUser.password_hash, adminUser.salt);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Current password incorrect' });
    }

    const { hash, salt } = hashPassword(newPassword);
    const stmt = db.prepare("UPDATE admin_users SET password_hash = ?, salt = ? WHERE id = ?");
    stmt.run([hash, salt, adminUser.id]);
    stmt.free();

    saveDbToDisk();
    clearLiveRateCache();

    return res.json({
      success: true,
      message: 'Password successfully changed'
    });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

module.exports = router;
