const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const initSqlJs = require('sql.js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'gold_bullion.sqlite');

let db = null;
let SQL = null;

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Password hashing helpers
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const checkHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return checkHash === hash;
}

function saveDbToDisk() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

async function getDatabase() {
  if (db) return db;

  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS gold_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      gold_24k_market_per_gram REAL NOT NULL,
      gold_24k_selling_per_gram REAL NOT NULL,
      gold_22k_market_per_gram REAL NOT NULL,
      gold_22k_selling_per_gram REAL NOT NULL,
      gold_18k_market_per_gram REAL DEFAULT 0,
      gold_18k_selling_per_gram REAL DEFAULT 0,
      silver_market_per_gram REAL DEFAULT 115.0,
      silver_selling_per_gram REAL DEFAULT 118.0,
      updated_at TEXT NOT NULL
    );
  `);

  // Migration: ensure silver columns exist if table was created previously without them
  try {
    const tableInfo = queryAll(db, "PRAGMA table_info(gold_rates)");
    const colNames = tableInfo.map(c => c.name);
    if (!colNames.includes('silver_market_per_gram')) {
      db.run("ALTER TABLE gold_rates ADD COLUMN silver_market_per_gram REAL DEFAULT 115.0;");
    }
    if (!colNames.includes('silver_selling_per_gram')) {
      db.run("ALTER TABLE gold_rates ADD COLUMN silver_selling_per_gram REAL DEFAULT 118.0;");
    }
    // Update existing records to realistic silver rates
    db.run(`
      UPDATE gold_rates SET 
        silver_market_per_gram = CASE 
          WHEN date = (SELECT MAX(date) FROM gold_rates) THEN 115.0
          WHEN date = (SELECT MAX(date) FROM gold_rates WHERE date < (SELECT MAX(date) FROM gold_rates)) THEN 113.0
          ELSE ROUND(108.0 + ((id * 3) % 8) * 1.2, 1)
        END,
        silver_selling_per_gram = CASE 
          WHEN date = (SELECT MAX(date) FROM gold_rates) THEN 118.0
          WHEN date = (SELECT MAX(date) FROM gold_rates WHERE date < (SELECT MAX(date) FROM gold_rates)) THEN 116.0
          ELSE ROUND(111.0 + ((id * 3) % 8) * 1.2, 1)
        END
      WHERE silver_market_per_gram IS NULL OR silver_market_per_gram = 0;
    `);
  } catch (migErr) {
    console.error('Migration warning:', migErr);
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default admin if none exists
  const adminCheck = db.exec("SELECT COUNT(*) as count FROM admin_users");
  const adminCount = adminCheck[0]?.values[0][0] || 0;
  if (adminCount === 0) {
    const { hash, salt } = hashPassword('admin@gold2026');
    const stmt = db.prepare(`
      INSERT INTO admin_users (username, password_hash, salt, created_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(['admin', hash, salt, new Date().toISOString()]);
    stmt.free();
  }

  // Seed settings if empty
  const settingsCheck = db.exec("SELECT COUNT(*) as count FROM system_settings");
  const settingsCount = settingsCheck[0]?.values[0][0] || 0;
  if (settingsCount === 0) {
    const defaultSettings = [
      ['businessName', 'Saikiran Bullion'],
      ['tagline', 'Direct Certified Gold & Fine Silver Bullion Rates'],
      ['phone', '+91 98765 43210'],
      ['email', 'rates@saikiranbullion.com'],
      ['address', 'Main Road, Khammam, Telangana'],
      ['operatingHours', 'Mon - Sat: 9:30 AM to 7:00 PM IST (Counter settlement closes at 6:30 PM)'],
      ['rateDisclaimer', 'Notice: Bullion rates displayed are our benchmark spot rates and counter selling rates per gram & 10 grams (and per kg for silver). Rates are subject to international market fluctuations. All physical gold and silver are strictly BIS 999/916 hallmarked. Applicable GST (3%) extra at counter billing.'],
      ['currencySymbol', '₹'],
      ['lastUpdatedBy', 'Administrator']
    ];

    const stmt = db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)");
    for (const [k, v] of defaultSettings) {
      stmt.run([k, v]);
    }
    stmt.free();
  }

  // Seed initial rates if empty
  const ratesCheck = db.exec("SELECT COUNT(*) as count FROM gold_rates");
  const ratesCount = ratesCheck[0]?.values[0][0] || 0;
  if (ratesCount === 0) {
    seedInitialRates(db);
  }

  saveDbToDisk();
  return db;
}

function seedInitialRates(database) {
  const insertStmt = database.prepare(`
    INSERT OR REPLACE INTO gold_rates (
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
  `);

  const today = new Date();
  const days = 60;
  const historyData = [];

  let current24Market = 12500;
  let current24Selling = 12700;
  
  for (let i = days - 1; i >= 0; i--) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);
    const dateStr = targetDate.toISOString().split('T')[0];

    if (i !== days - 1 && i !== 0) {
      const step = Math.floor(Math.random() * 90) - 40;
      current24Market += step;
      current24Selling = current24Market + 200;
    }

    let silverMarket = 115.0;
    let silverSelling = 118.0;

    if (i === 1) {
      // yesterday
      current24Market = 12250;
      current24Selling = 12450;
      silverMarket = 113.0;
      silverSelling = 116.0;
    } else if (i === 0) {
      // today
      current24Market = 12500;
      current24Selling = 12700;
      silverMarket = 115.0;
      silverSelling = 118.0;
    } else {
      silverMarket = Math.round((108 + (i % 8) * 1.2) * 10) / 10;
      silverSelling = silverMarket + 3.0;
    }

    const gold22Market = Math.round(current24Market * 0.916);
    const gold22Selling = Math.round(current24Selling * 0.916);
    const gold18Market = Math.round(current24Market * 0.75);
    const gold18Selling = Math.round(current24Selling * 0.75);

    const updateTime = new Date(targetDate);
    updateTime.setHours(11, 30, 0, 0);

    historyData.push({
      date: dateStr,
      gold_24k_market_per_gram: current24Market,
      gold_24k_selling_per_gram: current24Selling,
      gold_22k_market_per_gram: gold22Market,
      gold_22k_selling_per_gram: gold22Selling,
      gold_18k_market_per_gram: gold18Market,
      gold_18k_selling_per_gram: gold18Selling,
      silver_market_per_gram: silverMarket,
      silver_selling_per_gram: silverSelling,
      updated_at: updateTime.toISOString()
    });
  }

  for (const row of historyData) {
    insertStmt.run([
      row.date,
      row.gold_24k_market_per_gram,
      row.gold_24k_selling_per_gram,
      row.gold_22k_market_per_gram,
      row.gold_22k_selling_per_gram,
      row.gold_18k_market_per_gram,
      row.gold_18k_selling_per_gram,
      row.silver_market_per_gram,
      row.silver_selling_per_gram,
      row.updated_at
    ]);
  }

  insertStmt.free();
}

// Helper to convert SQL.js query result to Array of Objects
function queryAll(database, sql, params = []) {
  const stmt = database.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(database, sql, params = []) {
  const results = queryAll(database, sql, params);
  return results.length > 0 ? results[0] : null;
}

function runQuery(database, sql, params = []) {
  database.run(sql, params);
  saveDbToDisk();
}

module.exports = {
  getDatabase,
  saveDbToDisk,
  queryAll,
  queryOne,
  runQuery,
  hashPassword,
  verifyPassword
};
