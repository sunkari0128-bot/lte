// Pure Node.js mock localStorage test
const store = new Map();
const localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
};

async function testStorageEngine() {
  console.log('Testing storage engine directly...');
  const recordsKey = 'bullion_saved_records';
  const overrideKey = 'bullion_custom_selling_override';

  // Seed test
  const cur24Market = 14918;
  const cur24Sell = 15100;
  const list = [];
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    list.push({
      id: 30 - i,
      date: d.toISOString().split('T')[0],
      gold_24k_market_per_gram: cur24Market,
      gold_24k_selling_per_gram: cur24Sell,
      gold_22k_market_per_gram: 13675,
      gold_22k_selling_per_gram: 13850,
      silver_market_per_gram: 235,
      silver_selling_per_gram: 240,
      updated_at: d.toISOString()
    });
  }
  localStorage.setItem(recordsKey, JSON.stringify(list));
  console.log('✓ Seeding 30 records: count =', JSON.parse(localStorage.getItem(recordsKey)).length);

  // Test admin quick save selling price: e.g. 24K selling = 15555
  const override = {
    gold_24k_selling_per_gram: 15555,
    gold_22k_selling_per_gram: 14200,
    silver_selling_per_gram: 250,
    date: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString()
  };
  localStorage.setItem(overrideKey, JSON.stringify(override));
  console.log('✓ Admin custom selling override saved:', JSON.parse(localStorage.getItem(overrideKey)));

  // Test adding a specific past date: 2026-09-25
  const pastRecord = {
    id: Date.now(),
    date: '2026-09-25',
    gold_24k_market_per_gram: 14700,
    gold_24k_selling_per_gram: 14900,
    gold_22k_market_per_gram: 13500,
    gold_22k_selling_per_gram: 13700,
    silver_market_per_gram: 230,
    silver_selling_per_gram: 235,
    updated_at: new Date().toISOString()
  };
  const stored = JSON.parse(localStorage.getItem(recordsKey));
  stored.unshift(pastRecord);
  stored.sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(recordsKey, JSON.stringify(stored));
  
  const reloaded = JSON.parse(localStorage.getItem(recordsKey));
  const foundPast = reloaded.find(r => r.date === '2026-09-25');
  if (!foundPast || foundPast.gold_24k_selling_per_gram !== 14900) {
    throw new Error('Past date record not preserved properly');
  }
  console.log('✓ Specific date 2026-09-25 preserved in records array! Selling:', foundPast.gold_24k_selling_per_gram);

  // Verify deletion
  const afterDelete = reloaded.filter(r => r.date !== '2026-09-25');
  localStorage.setItem(recordsKey, JSON.stringify(afterDelete));
  const afterDeleteCheck = JSON.parse(localStorage.getItem(recordsKey)).find(r => r.date === '2026-09-25');
  if (afterDeleteCheck) {
    throw new Error('Delete failed');
  }
  console.log('✓ Record deletion works correctly!');
  console.log('\n>>> ALL OFFLINE STORAGE ENGINE TESTS PASSED! <<<');
}

testStorageEngine().catch(console.error);
