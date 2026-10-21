# Gold Bullion Rates

A professional, mobile-first, and desktop-optimized **Gold Bullion Rate** application designed exclusively for displaying daily gold rates, market spot benchmarks, and official business counter selling prices.

---

## 🌟 Key Features

### 1. Customer Home Screen
- **Today's Gold & Silver Rates**: Clear, clean bullion and financial dashboard.
- **Purities Supported**: 
  - **24K Gold (999)**: Pure Bullion Benchmark
  - **22K Gold (916)**: Standard Hallmarked
  - **Fine Silver (999)**: Fine Bullion Silver (rates per gram, per 10g, and per 1 kg)
- **Every purity displays**:
  - Market Rate (per gram & per 10 grams)
  - **Highlighted "OUR SELLING RATE"** (large numbers per gram & per 10 grams, plus 1kg bar rate for silver)
  - Difference / spread between market and our selling rate
  - Percentage difference
- **Today's Movement**: Automatically calculated day-over-day change with indicator (e.g. `↑ ₹250/g from yesterday` or `↓ ₹150/g from yesterday`).
- **Bullion Weight Estimator**: Allows visitors to input custom weight in Grams, Tolas, or Kilograms to see instant counter valuation at Our Selling Rate (pure calculator, no shopping cart or checkout).

### 2. Rate History & Trends
- Historical rates archive spanning past daily records.
- **Clean interactive line chart**:
  - Purity toggle: 24K, 22K, 18K
  - Crosshair tooltips showing exact rates and dates
  - Filters: **7 Days**, **30 Days**, **3 Months**, **6 Months**, **1 Year**
- Full historical table with daily change indicators.

### 3. About & Disclaimer Screen
- Business background and assay guarantee
- Legal rate disclaimer and non-e-commerce disclosure
- Last update timestamp and administrator verification badge
- Physical bullion desk address, counter timings, phone, and email.

### 4. Secure Private Admin Section
- **Secure Authentication**: Protected via HMAC cryptographic session tokens and PBKDF2 salted password hashing.
- **Form to Add/Update Rates**:
  - Date selector
  - 24K Market Rate & Our Selling Rate
  - 22K Market Rate & Our Selling Rate
  - 18K Market Rate & Our Selling Rate
  - Entry mode toggle: enter per gram or per 10 grams
  - One-click auto-derivation button (calculates 91.6% and 75% ratios)
  - Live difference calculation
  - "Save Rates" button
- **Rate History Management**: View previous rate records, edit any past date, or delete records.
- **Settings**: Update business profile, disclaimer, trading hours, and change master admin password.

---

## 🗄️ Database Architecture

Stored in SQLite (`data/gold_bullion.sqlite`):

### `gold_rates` Table
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | Unique ID |
| `date` | TEXT UNIQUE NOT NULL | Date (YYYY-MM-DD) |
| `gold_24k_market_per_gram` | REAL NOT NULL | 24K Market rate / gram |
| `gold_24k_selling_per_gram` | REAL NOT NULL | 24K Our selling rate / gram |
| `gold_22k_market_per_gram` | REAL NOT NULL | 22K Market rate / gram |
| `gold_22k_selling_per_gram` | REAL NOT NULL | 22K Our selling rate / gram |
| `gold_18k_market_per_gram` | REAL NOT NULL | 18K Market rate / gram |
| `gold_18k_selling_per_gram` | REAL NOT NULL | 18K Our selling rate / gram |
| `updated_at` | TEXT NOT NULL | ISO update timestamp |

### `admin_users` Table
- `id`, `username`, `password_hash`, `salt`, `created_at`

### `system_settings` Table
- `key`, `value`

---

## 🚀 Running the Application

### Prerequisites
- Node.js (v18+)

### Commands

1. **Start production/unified server**:
   ```bash
   node server/index.js
   ```
   Access in browser: `http://localhost:5000`

2. **Development mode (with Vite hot-reload)**:
   ```bash
   npm run dev
   ```

3. **Rebuild frontend bundle**:
   ```bash
   npm run build
   ```

4. **Run automated test suite**:
   ```bash
   node test_suite.js
   ```

---

## 🔐 Default Administrator Credentials

- **Username**: `admin`
- **Password**: `admin@gold2026`
*(Password can be updated from the Admin Settings tab)*
