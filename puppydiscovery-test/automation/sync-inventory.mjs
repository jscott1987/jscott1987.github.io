import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SOURCE = 'https://thenoblepaw.com/available-puppies/';
const ROOT = path.resolve(process.cwd(), 'puppydiscovery-test');
const DATA = path.join(ROOT, 'data');
const INVENTORY = path.join(DATA, 'puppies.json');
const STATUS = path.join(DATA, 'sync-status.json');
const CANDIDATES = path.join(DATA, 'inventory-candidates.json');

fs.mkdirSync(DATA, { recursive: true });

const now = new Date().toISOString();
const existing = fs.existsSync(INVENTORY)
  ? JSON.parse(fs.readFileSync(INVENTORY, 'utf8'))
  : { version: 1, source: SOURCE, last_successful_sync: null, puppies: [] };

function writeStatus(payload) {
  fs.writeFileSync(STATUS, JSON.stringify({
    last_run: now,
    last_successful_run: existing.last_successful_sync || null,
    status: 'failed',
    records_seen: 0,
    records_published: existing.puppies?.filter(p => p.status === 'available').length || 0,
    ...payload
  }, null, 2) + '\n');
}

function text(v) {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
}
function first(obj, keys) {
  for (const k of keys) if (obj && obj[k] != null && text(String(obj[k]))) return text(String(obj[k]));
  return '';
}
function imageFrom(obj) {
  for (const k of ['image','image_url','imageUrl','photo','photo_url','photoUrl','thumbnail','featured_image','featuredImage']) {
    const v = obj?.[k];
    if (typeof v === 'string' && /^https?:\/\//i.test(v)) return v;
    if (v && typeof v === 'object') {
      const nested = first(v, ['url','src','source_url']);
      if (/^https?:\/\//i.test(nested)) return nested;
    }
  }
  return '';
}
function urlFrom(obj) {
  return first(obj, ['url','link','permalink','href','source_url','sourceUrl']);
}
function scoreObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return 0;
  const name = first(obj, ['name','title','pet_name','puppy_name','display_name']);
  const breed = first(obj, ['breed','breed_name','breedName','type']);
  const sex = first(obj, ['sex','gender']);
  const img = imageFrom(obj);
  const url = urlFrom(obj);
  let score = 0;
  if (name) score += 2;
  if (breed) score += 2;
  if (sex) score += 1;
  if (img) score += 2;
  if (url) score += 1;
  if (/pupp/i.test(JSON.stringify(obj).slice(0, 4000))) score += 1;
  return score;
}
function walk(value, out, depth = 0) {
  if (depth > 7 || value == null) return;
  if (Array.isArray(value)) {
    for (const v of value) walk(v, out, depth + 1);
    return;
  }
  if (typeof value === 'object') {
    if (scoreObject(value) >= 5) out.push(value);
    for (const v of Object.values(value)) walk(v, out, depth + 1);
  }
}
function slug(v) {
  return text(v).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
function normalize(obj) {
  const name = first(obj, ['name','title','pet_name','puppy_name','display_name']);
  const breed = first(obj, ['breed','breed_name','breedName','type']);
  const sex = first(obj, ['sex','gender']);
  const sourceUrl = urlFrom(obj);
  const image = imageFrom(obj);
  const externalId = first(obj, ['id','ID','pet_id','puppy_id','sku','stock_number','stockNumber']);
  const key = externalId || sourceUrl || [name, breed, sex].filter(Boolean).join('|');
  if (!key || (!name && !breed)) return null;
  return {
    key: String(key),
    external_id: externalId || null,
    name: name || null,
    breed: breed || null,
    breed_slug: breed ? slug(breed) : null,
    sex: sex || null,
    image_url: image || null,
    source_url: sourceUrl || null,
    physical_location: 'Stuart, FL',
    status: 'available',
    last_seen_at: now,
    missing_successful_runs: 0
  };
}

const jsonPayloads = [];
const domCandidates = [];
let browser;

try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    userAgent: 'Mozilla/5.0 (compatible; PuppyDiscoveryInventory/1.0; +https://puppydiscovery.com/)'
  });

  page.on('response', async response => {
    try {
      const ct = response.headers()['content-type'] || '';
      if (!ct.includes('json')) return;
      const url = response.url();
      if (!/thenoblepaw|api|ajax|graphql|pupp|pet/i.test(url)) return;
      const body = await response.text();
      if (body.length > 2_000_000) return;
      const parsed = JSON.parse(body);
      jsonPayloads.push({ url, parsed });
    } catch {}
  });

  const response = await page.goto(SOURCE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (!response || response.status() >= 400) throw new Error('Source returned HTTP ' + (response?.status() ?? 'unknown'));

  await page.waitForTimeout(4500);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);

  const dom = await page.evaluate(() => {
    const bad = new Set(['/','/available-puppies/','/our-puppies/','/blog/','/contact-us/','/about/','/commitment/','/financing/','/boutique/']);
    return [...document.querySelectorAll('a[href]')].map(a => {
      const img = a.querySelector('img');
      let url = '';
      try { url = new URL(a.href, location.href).href; } catch {}
      const p = url ? new URL(url).pathname : '';
      return {
        href: url,
        pathname: p,
        text: (a.innerText || a.textContent || '').trim().replace(/\s+/g,' '),
        image: img?.currentSrc || img?.src || '',
        alt: img?.alt || ''
      };
    }).filter(x =>
      x.href &&
      x.href.startsWith(location.origin) &&
      !bad.has(x.pathname) &&
      x.image &&
      x.text.length > 1 &&
      x.text.length < 220
    );
  });
  domCandidates.push(...dom);

  const discovered = [];
  for (const item of jsonPayloads) walk(item.parsed, discovered);

  // DOM fallback stays conservative. We collect it for diagnostics but only promote
  // anchors that are clearly puppy-specific by URL or text.
  for (const d of domCandidates) {
    if (/pupp(y|ies)|available pet|stock #|male|female/i.test(d.href + ' ' + d.text + ' ' + d.alt)) {
      discovered.push({
        name: d.text.split('|')[0].trim(),
        image: d.image,
        url: d.href
      });
    }
  }

  const normalized = [...new Map(
    discovered.map(normalize).filter(Boolean).map(p => [p.key, p])
  ).values()];

  fs.writeFileSync(CANDIDATES, JSON.stringify({
    run_at: now,
    source: SOURCE,
    json_responses_seen: jsonPayloads.length,
    dom_candidates_seen: domCandidates.length,
    normalized_candidates: normalized
  }, null, 2) + '\n');

  // A successful page load with zero trustworthy records is NOT a successful
  // inventory sync. Preserve the last good inventory rather than marking every
  // puppy missing.
  if (!normalized.length) {
    writeStatus({
      status: 'failed_safe',
      message: 'Source loaded, but no high-confidence puppy records were extracted. Existing inventory preserved.',
      diagnostic_candidates: domCandidates.length
    });
    process.exitCode = 2;
  } else {
    const previous = Array.isArray(existing.puppies) ? existing.puppies : [];
    const seen = new Map(normalized.map(p => [p.key, p]));
    const merged = [];

    for (const p of normalized) {
      const old = previous.find(x => x.key === p.key);
      merged.push({ ...old, ...p, first_seen_at: old?.first_seen_at || now, status: 'available', missing_successful_runs: 0 });
    }

    for (const old of previous) {
      if (seen.has(old.key)) continue;
      const misses = (old.missing_successful_runs || 0) + 1;
      merged.push({
        ...old,
        missing_successful_runs: misses,
        status: misses >= 2 ? 'unavailable' : old.status,
        last_missing_at: now
      });
    }

    const output = {
      version: 1,
      source: SOURCE,
      last_successful_sync: now,
      puppies: merged
    };
    fs.writeFileSync(INVENTORY, JSON.stringify(output, null, 2) + '\n');
    fs.writeFileSync(STATUS, JSON.stringify({
      last_run: now,
      last_successful_run: now,
      status: 'success',
      records_seen: normalized.length,
      records_published: merged.filter(p => p.status === 'available').length,
      message: 'Inventory synchronized successfully.'
    }, null, 2) + '\n');
  }
} catch (error) {
  writeStatus({ status: 'error', message: String(error?.stack || error) });
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
}
