/**
 * Automated Verification Test Suite for Gold Bullion Rates App
 */

async function runTests() {
  const baseUrl = 'http://localhost:5000/api';
  console.log('--- Starting Gold Bullion Rates Verification Tests ---');

  // 1. Test Today's Rates
  console.log('1. Testing GET /rates/today...');
  const todayRes = await fetch(`${baseUrl}/rates/today`);
  const todayJson = await todayRes.json();
  if (!todayJson.success || !todayJson.data) {
    throw new Error('GET /rates/today failed: ' + JSON.stringify(todayJson));
  }
  const { today, purities, overallMovement } = todayJson.data;
  console.log('   Today Date:', today.date);
  console.log('   24K Market:', today.gold_24k_market_per_gram, '/g | Selling:', today.gold_24k_selling_per_gram, '/g');
  console.log('   24K Per 10g Selling:', purities['24k'].sellingPer10Gram);
  console.log('   24K Difference:', purities['24k'].diffPerGram, '/g |', purities['24k'].diffPer10Gram, '/10g');
  console.log('   Overall Movement:', overallMovement.formatted);

  // Validate calculations:
  if (Math.abs(purities['24k'].sellingPer10Gram - today.gold_24k_selling_per_gram * 10) > 0.01) {
    throw new Error('10g calculation mismatch');
  }
  const expectedDiff = Math.round((today.gold_24k_selling_per_gram - today.gold_24k_market_per_gram) * 100) / 100;
  if (Math.abs(purities['24k'].diffPerGram - expectedDiff) > 0.01) {
    throw new Error('Difference calculation mismatch');
  }
  if (!purities['silver'] || purities['silver'].key !== 'silver') {
    throw new Error('Fine Silver purity details missing from payload');
  }
  console.log('   Silver Selling Rate:', purities['silver'].sellingPerGram, '/g | 1kg:', purities['silver'].sellingPerKg);
  console.log('   -> Today Rates & Silver Calculations OK!');

  // 2. Test Rate History with range filters
  console.log('2. Testing GET /rates/history?range=7d...');
  const h7 = await (await fetch(`${baseUrl}/rates/history?range=7d`)).json();
  console.log('   7D Record Count:', h7.count, '| Chart data length:', h7.chartData.length);
  if (h7.count !== 7) throw new Error('Expected 7 records for 7d range');

  console.log('   Testing GET /rates/history?range=30d...');
  const h30 = await (await fetch(`${baseUrl}/rates/history?range=30d`)).json();
  console.log('   30D Record Count:', h30.count);
  if (h30.count !== 30) throw new Error('Expected 30 records for 30d range');
  console.log('   -> Rate History & Range Filters OK!');

  // 3. Test Public Settings
  console.log('3. Testing GET /rates/settings...');
  const settingsRes = await (await fetch(`${baseUrl}/rates/settings`)).json();
  if (!settingsRes.success || !settingsRes.data.businessName) {
    throw new Error('Settings check failed: ' + JSON.stringify(settingsRes));
  }
  console.log('   Business Name:', settingsRes.data.businessName);
  console.log('   Disclaimer present:', !!settingsRes.data.rateDisclaimer);
  console.log('   -> Settings OK!');

  // 4. Test Security: Unauthorized modification attempt must be rejected
  console.log('4. Testing Security: POST /admin/rates without token...');
  const unauthRes = await fetch(`${baseUrl}/admin/rates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: '2026-10-06' })
  });
  if (unauthRes.status !== 401) {
    throw new Error(`Security violation! Expected 401 Unauthorized, got ${unauthRes.status}`);
  }
  console.log('   -> Unauthorized request properly blocked with 401!');

  // 5. Test Admin Login
  console.log('5. Testing POST /admin/login...');
  const loginRes = await fetch(`${baseUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin@gold2026' })
  });
  const loginJson = await loginRes.json();
  if (!loginJson.success || !loginJson.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginJson));
  }
  const token = loginJson.token;
  console.log('   Login success. Token received.');

  // 6. Test Admin Updating Rates for a new day
  console.log('6. Testing Admin Rate Publishing via POST /admin/rates...');
  const testDate = '2026-10-06';
  const saveRes = await fetch(`${baseUrl}/admin/rates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      date: testDate,
      gold_24k_market_per_gram: today.gold_24k_market_per_gram + 100,
      gold_24k_selling_per_gram: today.gold_24k_selling_per_gram + 150, // +150 from today
      gold_22k_market_per_gram: today.gold_22k_market_per_gram + 90,
      gold_22k_selling_per_gram: today.gold_22k_selling_per_gram + 130,
      silver_market_per_gram: today.silver_market_per_gram + 2.0,
      silver_selling_per_gram: today.silver_selling_per_gram + 3.0
    })
  });
  const saveJson = await saveRes.json();
  if (!saveJson.success) {
    throw new Error('Save rates failed: ' + JSON.stringify(saveJson));
  }
  console.log('   Saved rates message:', saveJson.message);

  try {
    // 7. Verify Today's Rates updated to testDate with auto-movement calculation
    console.log('7. Verifying updated today rates and movement...');
    const verifyToday = await (await fetch(`${baseUrl}/rates/today`)).json();
    console.log('   New Today Date:', verifyToday.data.today.date);
    console.log('   New Today 24K Selling:', verifyToday.data.today.gold_24k_selling_per_gram);
    console.log('   New Movement message:', verifyToday.data.overallMovement.formatted);
    if (verifyToday.data.today.date !== testDate) {
      throw new Error('Expected today date to be ' + testDate);
    }
    if (!verifyToday.data.overallMovement.formatted.includes('↑ ₹150')) {
      throw new Error('Expected movement to show ↑ ₹150, got: ' + verifyToday.data.overallMovement.formatted);
    }
    console.log('   -> Rate update & movement auto-calculation passed!');
  } finally {
    // 8. Clean up: Delete test record so database returns to pristine state
    console.log('8. Cleaning up test record...');
    const deleteRes = await (await fetch(`${baseUrl}/admin/rates/${saveJson.data.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })).json();
    console.log('   Cleanup:', deleteRes.message);
  }

  // 9. Test Live Rate Endpoint
  console.log('9. Testing GET /rates/live endpoint...');
  const liveRes = await (await fetch(`${baseUrl}/rates/live`)).json();
  if (!liveRes.success || !liveRes.data || !liveRes.data.rates.gold_24k_market_per_gram) {
    throw new Error('Live rate endpoint failed: ' + JSON.stringify(liveRes));
  }
  console.log('   Live Source:', liveRes.data.source);
  console.log('   Live 24K Market:', liveRes.data.rates.gold_24k_market_per_gram, '/g');
  console.log('   Live Silver Market:', liveRes.data.rates.silver_market_per_gram, '/g');
  console.log('   -> Live Rate API OK!');

  console.log('\n======================================================');
  console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! (100% PASS)');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
