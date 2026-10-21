require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('./db');
const ratesRouter = require('./routes/rates');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for local development with Vite
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Direct APK & AAB Download Endpoints
const customerApkLocations = [
  path.join(__dirname, '..', 'downloads', 'saikiran-bullion-customer.apk'),
  path.join(__dirname, '..', 'saikiran-bullion-customer.apk'),
  path.join(__dirname, '..', 'saikiran-bullion.apk'),
  path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
];

const customerAabLocations = [
  path.join(__dirname, '..', 'downloads', 'saikiran-bullion-customer.aab'),
  path.join(__dirname, '..', 'saikiran-bullion-customer.aab'),
  path.join(__dirname, '..', 'saikiran-bullion.aab'),
  path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')
];

const adminApkLocations = [
  path.join(__dirname, '..', 'downloads', 'saikiran-bullion-admin.apk'),
  path.join(__dirname, '..', 'saikiran-bullion-admin.apk'),
  path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
];

const adminAabLocations = [
  path.join(__dirname, '..', 'downloads', 'saikiran-bullion-admin.aab'),
  path.join(__dirname, '..', 'saikiran-bullion-admin.aab'),
  path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')
];

function findExistingFile(locations) {
  for (const loc of locations) {
    if (fs.existsSync(loc)) return loc;
  }
  return null;
}

// 1. CUSTOMER APP DOWNLOAD (FOR EVERYONE)
app.get([
  '/download/customer.apk',
  '/download/saikiran-bullion-customer.apk',
  '/saikiran-bullion-customer.apk',
  '/download/app.apk',
  '/download/saikiran-bullion.apk',
  '/download-apk',
  '/saikiran-bullion.apk',
  '/apk'
], (req, res) => {
  const filePath = findExistingFile(customerApkLocations);
  if (!filePath) {
    return res.status(404).json({ error: 'Customer APK file not found. Please build the Android app first.' });
  }
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="saikiran-bullion-customer.apk"');
  res.sendFile(filePath);
});

app.get([
  '/download/customer.aab',
  '/download/saikiran-bullion-customer.aab',
  '/saikiran-bullion-customer.aab',
  '/download/app.aab',
  '/download/saikiran-bullion.aab',
  '/download-aab',
  '/saikiran-bullion.aab',
  '/aab'
], (req, res) => {
  const filePath = findExistingFile(customerAabLocations);
  if (!filePath) {
    return res.status(404).json({ error: 'Customer AAB bundle file not found.' });
  }
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="saikiran-bullion-customer.aab"');
  res.sendFile(filePath);
});

// 2. ADMIN APP DOWNLOAD (FOR OWNER / ADMINISTRATOR)
app.get([
  '/download/admin.apk',
  '/download/saikiran-bullion-admin.apk',
  '/saikiran-bullion-admin.apk'
], (req, res) => {
  const filePath = findExistingFile(adminApkLocations);
  if (!filePath) {
    return res.status(404).json({ error: 'Admin APK file not found. Please build the Admin Android app first.' });
  }
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="saikiran-bullion-admin.apk"');
  res.sendFile(filePath);
});

app.get([
  '/download/admin.aab',
  '/download/saikiran-bullion-admin.aab',
  '/saikiran-bullion-admin.aab'
], (req, res) => {
  const filePath = findExistingFile(adminAabLocations);
  if (!filePath) {
    return res.status(404).json({ error: 'Admin AAB bundle file not found.' });
  }
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="saikiran-bullion-admin.aab"');
  res.sendFile(filePath);
});

// API Routes
app.use('/api/rates', ratesRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Gold Bullion Rates API',
    customerApkAvailable: Boolean(findExistingFile(customerApkLocations)),
    adminApkAvailable: Boolean(findExistingFile(adminApkLocations))
  });
});

// Serve frontend static assets if built
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Fallback for SPA routing in Express 5
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/download')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('Gold Bullion Rates API Server is running. Start frontend with npm run dev.');
    }
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('Initializing Gold Bullion SQLite database...');
    await getDatabase();
    console.log('Database initialized successfully.');

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`Gold Bullion Rates API Server listening on port ${PORT}`);
      console.log(`API Health: http://localhost:${PORT}/api/health`);
      console.log(`Today's Rates: http://localhost:${PORT}/api/rates/today`);
      console.log(`Download APK: http://localhost:${PORT}/download/gold-bullion-rates.apk`);
      console.log(`Download AAB: http://localhost:${PORT}/download/gold-bullion-rates.aab`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

startServer();
