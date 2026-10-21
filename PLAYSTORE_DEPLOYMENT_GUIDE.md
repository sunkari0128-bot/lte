# Gold Bullion Rates - Google Play Store Publishing & Build Guide

## 📱 Generated Application Packages

Your app is fully configured, compiled, and ready for deployment:

| Package Type | File Location | File Size | Description |
|---|---|---|---|
| **Google Play Bundle (.aab)** | `android/app/build/outputs/bundle/release/app-release.aab` | **3.05 MB** | **Required format for Google Play Console upload** |
| **Direct Install APK (.apk)** | `android/app/build/outputs/apk/debug/app-debug.apk` | **4.17 MB** | Ready for testing directly on your Android phone or tablet |

---

## 🚀 Quick Commands

From the root project directory (`e:\gold-bullion-rates`):

```bash
# 1. Build web assets & sync to Android project
npm run cap:sync

# 2. Build testable debug APK
npm run build:apk

# 3. Build Google Play Store Bundle (.aab)
npm run build:aab
```

---

## 🛠️ Google Play Store Upload Checklist

### 1. Google Play Console Account
- Sign in to [Google Play Console](https://play.google.com/console).
- Click **Create app**:
  - **App name**: `Gold Bullion Rates`
  - **Default language**: English (or your regional preference)
  - **App or Game**: App
  - **Free or Paid**: Free

### 2. App Identification & Configuration
- **Package Name / Application ID**: `com.goldbullionrates.app`
- **Target SDK**: `35` (Exceeds Google Play minimum requirement of API 34+)
- **Minimum SDK**: `23` (Supports 99%+ of all active Android devices)
- **Version Code**: `1`
- **Version Name**: `1.0.0`

### 3. App Category & Content Rating
- **Category**: Finance / Business
- **Target Age**: 18+ (Bullion & Financial investment reference)
- **Data Safety**:
  - Does the app collect personal data? **No**
  - Normal users have read-only access to bullion spot prices.
  - No payment processing, no e-commerce carts, no financial transactions.

### 4. Release Signing (Google Play App Signing)
Google Play recommends **Google Play App Signing** where Google manages your release signing key.

To generate a custom release keystore for local signing:

```powershell
keytool -genkey -v -keystore my-bullion-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias bullion-key
```

Then in `android/app/build.gradle` (under `signingConfigs`):
```groovy
signingConfigs {
    release {
        storeFile file("my-bullion-release-key.jks")
        storePassword "YOUR_PASSWORD"
        keyAlias "bullion-key"
        keyPassword "YOUR_PASSWORD"
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
    }
}
```

### 5. Uploading the AAB Bundle
1. Go to **Release** > **Production** (or **Internal testing** / **Closed testing**).
2. Click **Create new release**.
3. Upload `android/app/build/outputs/bundle/release/app-release.aab`.
4. Fill in release notes:
   > *"Initial release of Gold Bullion Rates. Daily live benchmark rates for 24K Gold, 22K Gold, and Fine Silver (999), purity breakdowns, rate calculator, and historical bullion trends."*
5. Review and roll out release.

---

## 🌐 Connecting Live Cloud Backend

When publishing to Google Play, host your backend (e.g. Render, Railway, AWS EC2, VPS, or DigitalOcean):

1. Deploy the `server/` directory:
   ```bash
   node server/index.js
   ```
2. In the mobile app:
   - Go to **Admin** tab > Log in (`admin` / `admin123`)
   - Go to **Settings** > **Mobile App & Cloud Server Sync**
   - Enter your public domain (e.g. `https://api.yourbullionstore.com`)
   - Click **Test Connection** & **Save Server URL**
3. The app will sync with your cloud database in real-time, and will automatically fall back to cached rates whenever customer phones are offline.
