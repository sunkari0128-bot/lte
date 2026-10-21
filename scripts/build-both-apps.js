const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const stringsXmlPath = path.join(androidDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const buildGradlePath = path.join(androidDir, 'app', 'build.gradle');
const capacitorConfigPath = path.join(rootDir, 'capacitor.config.json');
const downloadsDir = path.join(rootDir, 'downloads');

function run(cmd, cwd = rootDir, extraEnv = {}) {
  console.log(`\n> [EXEC] ${cmd} (in ${cwd})`);
  const currentEnv = {
    ...process.env,
    JAVA_HOME: 'C:\\Users\\USER\\tools\\jdk-17',
    ANDROID_HOME: 'C:\\Users\\USER\\tools\\android-sdk',
    ...extraEnv
  };
  execSync(cmd, { cwd, env: currentEnv, stdio: 'inherit' });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cleanWebOutputDir() {
  const distDir = path.join(rootDir, 'dist');
  const publicDir = path.join(rootDir, 'public');
  const assetsPublicDir = path.join(androidDir, 'app', 'src', 'main', 'assets', 'public');

  [distDir, publicDir, assetsPublicDir].forEach((dir) => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        if (file.endsWith('.apk') || file.endsWith('.aab')) {
          fs.unlinkSync(path.join(dir, file));
        }
      });
    }
  });
}

function updateAndroidConfig(appId, appName) {
  // 1. Update capacitor.config.json
  const capConfig = {
    appId,
    appName,
    webDir: 'dist',
    server: {
      androidScheme: 'http',
      cleartext: true
    },
    plugins: {
      CapacitorHttp: {
        enabled: true
      }
    }
  };
  fs.writeFileSync(capacitorConfigPath, JSON.stringify(capConfig, null, 2), 'utf8');

  // 2. Update strings.xml
  const stringsXml = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">${appName}</string>
    <string name="title_activity_main">${appName}</string>
    <string name="package_name">${appId}</string>
    <string name="custom_url_scheme">${appId}</string>
</resources>
`;
  fs.writeFileSync(stringsXmlPath, stringsXml, 'utf8');

  // 3. Update build.gradle applicationId
  let gradleContent = fs.readFileSync(buildGradlePath, 'utf8');
  gradleContent = gradleContent.replace(/applicationId\s+["'][^"']+["']/, `applicationId "${appId}"`);
  fs.writeFileSync(buildGradlePath, gradleContent, 'utf8');
  console.log(`Updated Android configuration: appId=${appId}, appName="${appName}"`);
}

function copyArtifacts(targetPrefix) {
  const debugApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  const releaseAab = path.join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');

  ensureDir(downloadsDir);

  if (fs.existsSync(debugApk)) {
    const apkName = `${targetPrefix}.apk`;
    fs.copyFileSync(debugApk, path.join(rootDir, apkName));
    fs.copyFileSync(debugApk, path.join(downloadsDir, apkName));
    const sizeMb = (fs.statSync(debugApk).size / (1024 * 1024)).toFixed(1);
    console.log(`[SUCCESS] Copied ${apkName} -> ${sizeMb} MB`);
  }

  if (fs.existsSync(releaseAab)) {
    const aabName = `${targetPrefix}.aab`;
    fs.copyFileSync(releaseAab, path.join(rootDir, aabName));
    fs.copyFileSync(releaseAab, path.join(downloadsDir, aabName));
    const sizeMb = (fs.statSync(releaseAab).size / (1024 * 1024)).toFixed(1);
    console.log(`[SUCCESS] Copied ${aabName} -> ${sizeMb} MB`);
  }
}

async function buildAll() {
  cleanWebOutputDir();
  process.env.VITE_ONLINE_API_URL = 'https://0d087e90024afa.lhr.life/api';

  console.log('====================================================');
  console.log('STEP 1: BUILDING CUSTOMER APP (NO ADMIN PORTAL)');
  console.log('====================================================');
  updateAndroidConfig('com.saikiranbullion.customer', 'Saikiran Bullion');
  process.env.VITE_APP_VARIANT = 'customer';
  run('npm run build', rootDir);
  cleanWebOutputDir();
  run('npx cap sync android', rootDir);
  cleanWebOutputDir();
  run('.\\gradlew.bat assembleDebug bundleRelease', androidDir);
  copyArtifacts('saikiran-bullion-customer');
  // Copy to default saikiran-bullion.apk as well
  fs.copyFileSync(path.join(rootDir, 'saikiran-bullion-customer.apk'), path.join(rootDir, 'saikiran-bullion.apk'));
  fs.copyFileSync(path.join(rootDir, 'saikiran-bullion-customer.aab'), path.join(rootDir, 'saikiran-bullion.aab'));

  console.log('\n====================================================');
  console.log('STEP 2: BUILDING ADMIN APP (WITH ADMIN PORTAL)');
  console.log('====================================================');
  updateAndroidConfig('com.saikiranbullion.admin', 'Saikiran Bullion Admin');
  process.env.VITE_APP_VARIANT = 'admin';
  run('npm run build', rootDir);
  cleanWebOutputDir();
  run('npx cap sync android', rootDir);
  cleanWebOutputDir();
  run('.\\gradlew.bat assembleDebug bundleRelease', androidDir);
  copyArtifacts('saikiran-bullion-admin');

  console.log('\n====================================================');
  console.log('STEP 3: COMPILING WEB PRODUCTION BUNDLE WITH DUAL DOWNLOADS');
  console.log('====================================================');
  process.env.VITE_APP_VARIANT = 'web';
  run('npm run build', rootDir);
  cleanWebOutputDir();

  console.log('\n====================================================');
  console.log('BUILD COMPLETE: BOTH APPS COMPILED SUCCESSFULLY!');
  console.log('1. Customer App: saikiran-bullion-customer.apk (For Everyone)');
  console.log('2. Admin App:    saikiran-bullion-admin.apk (For Owner)');
  console.log('====================================================');
}

buildAll().catch((err) => {
  console.error('Build failure:', err);
  process.exit(1);
});
