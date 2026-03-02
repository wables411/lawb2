/**
 * Inspect Firebase Realtime Database for SoundCloud references.
 * Run: node inspect-firebase.js
 */
import { db } from './lawb-firebase.js';

function findInObject(obj, path = '', results = []) {
  if (!obj || typeof obj !== 'object') return results;
  const str = JSON.stringify(obj);
  if (/soundcloud/i.test(str)) {
    results.push({ path, sample: str.slice(0, 200) });
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => findInObject(v, `${path}/${i}`, results));
  } else {
    for (const [k, v] of Object.entries(obj)) {
      findInObject(v, path ? `${path}/${k}` : k, results);
    }
  }
  return results;
}

async function inspect() {
  const root = await db.ref().get();
  const val = root.val();
  if (!val) {
    console.log('Firebase root is empty or null.');
    return;
  }

  console.log('=== Top-level keys ===');
  console.log(Object.keys(val).join(', '));
  console.log('');

  const hits = findInObject(val, '');
  if (hits.length === 0) {
    console.log('No "soundcloud" (case-insensitive) found anywhere in Firebase.');
    return;
  }

  console.log(`=== Found ${hits.length} path(s) containing "soundcloud" ===`);
  hits.forEach(({ path, sample }) => {
    console.log(`\nPath: ${path}`);
    console.log(`Sample: ${sample}...`);
  });

  // Also dump structure of key paths
  console.log('\n=== lawbamp_uploads (first 2 entries) ===');
  const uploads = val.lawbamp_uploads;
  if (uploads) {
    const entries = Object.entries(uploads).slice(0, 2);
    entries.forEach(([id, e]) => {
      console.log(JSON.stringify({ id, ...e }, null, 2));
    });
  } else {
    console.log('(none)');
  }

  console.log('\n=== clawb/stream (control + lawbamp_commands sample) ===');
  const clawb = val.clawb;
  if (clawb?.stream) {
    console.log(JSON.stringify(clawb.stream, null, 2).slice(0, 800));
  }
}

inspect().catch((e) => {
  console.error(e);
  process.exit(1);
});
