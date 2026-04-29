import assert from 'node:assert';

const API_URL = 'http://127.0.0.1:3000/api/scan';

// A tiny 1x1 transparent png for testing when we don't have real images yet.
// In a real evaluation run, this script would load real fixture images from a local directory.
const tinyPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

async function runScan(criteriaIds) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: tinyPng,
      mimeType: 'image/png',
      criteriaIds,
      imageMeta: { width: 1, height: 1, bytes: 68 }
    })
  });
  
  if (!res.ok) throw new Error(`API failed: ${res.status}`);
  return res.json();
}

async function run() {
  console.log("Running Picky Evaluation Fixtures...");
  
  // 1. Ambiguous Case
  // We assert that an ambiguous/tiny image without clear evidence NEVER returns SAFE.
  // Without a real key, the API returns VERIFY. With a real key, an ambiguous/blank image should also return VERIFY.
  try {
    console.log("Running Ambiguous Dish Test...");
    const res = await runScan(['vegan']);
    
    assert.notStrictEqual(res.status, 'SAFE', "Ambiguous or blank image must NOT return SAFE.");
    console.log("✅ Ambiguous case test passed (Verdict: " + res.status + ").");
    
    // Future fixtures can be added here for Obvious-Safe and Obvious-Vetoed
    // once a suite of test images is placed in a /fixtures directory.
    
    console.log("\nAll evaluation fixtures passed.");
    console.log("Note: To run full AI evaluation, ensure GEMINI_API_KEY is set and the dev server is running on port 3000.");
  } catch (err) {
    if (err.cause?.code === 'ECONNREFUSED' || err.message.includes('fetch failed')) {
      console.log("⚠️ Dev server not running on port 3000. Run 'npm run dev' to test evaluation fixtures.");
    } else {
      console.error("❌ Evaluation failed:", err);
      process.exit(1);
    }
  }
}

run();
