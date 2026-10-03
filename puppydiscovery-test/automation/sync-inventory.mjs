import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { renderPuppyPage } from './render-puppy-page.mjs';

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
  const photo = obj?.Photo || obj?.photo;
  if (photo && typeof photo === 'object') {
    const base = first(photo, ['BaseUrl','baseUrl','base_url']);
    const file = first(photo, ['Size800','Size500','Original','size800','size500','original']);
    if (base && file) return base + file;
    const direct = first(photo, ['url','src','source_url']);
    if (/^https?:\/\//i.test(direct)) return direct;
  }
  for (const k of ['image','image_url','imageUrl','photo_url','photoUrl','thumbnail','featured_image','featuredImage']) {
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
  return first(obj, ['url','link','permalink','href','source_url','sourceUrl','PublicUrl']);
}
function scoreObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return 0;
  const name = first(obj, ['name','title','pet_name','puppy_name','display_name','PetName']);
  const breed = first(obj, ['breed','breed_name','breedName','type','BreedName']);
  const sex = first(obj, ['sex','gender','Gender']);
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
  const name = first(obj, ['name','title','pet_name','puppy_name','display_name','PetName']);
  const breed = first(obj, ['breed','breed_name','breedName','type','BreedName']);
  const sex = first(obj, ['sex','gender','Gender']);
  const sourceUrl = urlFrom(obj) || SOURCE;
  const image = imageFrom(obj);

  const petId = first(obj, ['PetId','pet_id','puppy_id','id','ID']);
  const referenceNumber = first(obj, ['ReferenceNumber','reference_number','reference','ref','sku','stock_number','stockNumber']);
  const externalId = referenceNumber || petId;
  const birthDate = first(obj, ['BirthDate','birth_date','birthDate','birthday','date_of_birth','dob','born','born_on']);
  const age = first(obj, ['Age','age']);
  const readyDate = first(obj, ['ready_date','readyDate','available_date','availableDate','available_on','ready']);
  const price = first(obj, ['price','sale_price','salePrice','amount','Price','SalePrice']);
  const color = first(obj, ['Coloring','color','coat_color','coatColor']);
  const weight = first(obj, ['Weight','weight','current_weight','currentWeight','adult_weight','adultWeight']);
  const generation = first(obj, ['generation','breed_generation','breedGeneration','Generation']);
  const rawStatus = first(obj, ['Status','status']).toLowerCase();
  const orgName = first(obj, ['OrgName','org_name','organization']);
  const petType = first(obj, ['PetType','pet_type']);

  // The public partner response can contain multiple record types. Only publish
  // Noble Paw dog records with enough identity to be confidently a puppy listing.
  if (orgName && orgName.toLowerCase() !== 'the noble paw') return null;
  if (petType && petType.toLowerCase() !== 'dog') return null;
  if (rawStatus && rawStatus !== 'available') return null;

  const key = petId || referenceNumber || sourceUrl || [name, breed, sex, birthDate].filter(Boolean).join('|');
  if (!key || !name || !breed) return null;

  return {
    key: String(key),
    source_pet_id: petId || null,
    external_id: externalId || null,
    name: name || null,
    breed: breed || null,
    breed_slug: breed ? slug(breed) : null,
    sex: sex || null,
    birth_date: birthDate || null,
    age: age || null,
    ready_date: readyDate || null,
    price: price || null,
    color: color || null,
    weight: weight || null,
    generation: generation || null,
    image_url: image || null,
    source_url: sourceUrl || SOURCE,
    physical_location: 'Stuart, FL',
    source_status: rawStatus || 'available',
    status: 'available',
    last_seen_at: now,
    missing_successful_runs: 0
  };
}


function htmlEscape(v) {
  return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function puppySlug(p) {
  return slug((p.name || p.external_id || 'puppy') + '-' + (p.external_id || p.key || '')).slice(0, 90);
}
function writePuppyPages(puppies) {
  const puppyRoot = path.join(ROOT, 'puppies');
  fs.mkdirSync(puppyRoot, { recursive: true });
  const live = puppies.filter(p => p.status === 'available');
  for (const p of puppies) {
    const ps = puppySlug(p);
    if (!ps || ps === 'stuart-fl') continue;
    const dir = path.join(puppyRoot, ps);
    fs.mkdirSync(dir, { recursive: true });
    const related = live.filter(r => r.key !== p.key).sort((a,b) => Number((b.breed_slug||'') === p.breed_slug) - Number((a.breed_slug||'') === p.breed_slug)).slice(0,3);
    fs.writeFileSync(path.join(dir, 'index.html'), renderPuppyPage(p, related));
  }
}
function updateSitemapWithPuppies(puppies) {
  const mainPath = path.join(ROOT, 'sitemap.xml');
  const puppyPath = path.join(ROOT, 'sitemap-puppies.xml');
  const active = puppies.filter(p => p.status === 'available');

  if (fs.existsSync(mainPath)) {
    let xml = fs.readFileSync(mainPath, 'utf8');
    xml = xml.replace(/\s*<url><loc>https:\/\/puppydiscovery\.com\/puppies\/(?!stuart-fl\/)[^<]+<\/loc>[\s\S]*?<\/url>/g, '');
    fs.writeFileSync(mainPath, xml);
  }

  const rows = active.map(p => {
    const ps = puppySlug(p);
    return `  <url><loc>https://puppydiscovery.com/puppies/${ps}/</loc><lastmod>${now.slice(0,10)}</lastmod></url>`;
  }).join('\n');

  const puppyXml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    (rows ? rows + '\n' : '') +
    '</urlset>\n';
  fs.writeFileSync(puppyPath, puppyXml);
}

const jsonPayloads = [];
const domCandidates = [];
const iframeCandidates = [];
const imageDiagnostics = [];
let browser;

try {
  browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Upgrade-Insecure-Requests': '1'
    }
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    try { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); } catch {}
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
      jsonPayloads.push({
        url,
        parsed,
        body_sample: '',
        top_keys: parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? Object.keys(parsed).slice(0, 80) : []
      });
    } catch {}
  });

  async function openInventory(url) {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const initialStatus = response?.status() ?? 0;

    // Some public sites return an initial challenge response before the browser
    // is allowed through. Do not fail on that first status alone.
    await page.waitForTimeout(initialStatus >= 400 ? 12000 : 4500);

    const state = await page.evaluate(() => ({
      title: document.title || '',
      text: (document.body?.innerText || '').slice(0, 5000),
      href: location.href
    }));

    const looksBlocked = /access denied|forbidden|attention required|checking your browser|verify you are human|just a moment|cloudflare/i.test(
      state.title + ' ' + state.text
    );
    const looksLikeInventoryPage = /available puppies|available pets|find your pet|pure bred puppies/i.test(state.text);

    return { initialStatus, state, looksBlocked, looksLikeInventoryPage };
  }

  let openResult = await openInventory(SOURCE);
  if (openResult.looksBlocked || !openResult.looksLikeInventoryPage) {
    const wwwSource = 'https://www.thenoblepaw.com/available-puppies/';
    openResult = await openInventory(wwwSource);
  }
  if (openResult.looksBlocked || !openResult.looksLikeInventoryPage) {
    throw new Error(
      'Inventory page remained unavailable after rendered-browser challenge handling. ' +
      'Initial HTTP status: ' + openResult.initialStatus + '; title: ' + openResult.state.title
    );
  }

  await page.waitForTimeout(2500);
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

  const visualDiagnostics = await page.evaluate(() => ({
    iframes: [...document.querySelectorAll('iframe[src]')].map(f => f.src).slice(0, 30),
    images: [...document.querySelectorAll('img')].slice(0, 80).map(img => ({
      src: img.currentSrc || img.src || '',
      alt: img.alt || '',
      parent: (img.closest('a,article,li,div')?.outerHTML || '').slice(0, 4000)
    }))
  }));
  iframeCandidates.push(...visualDiagnostics.iframes);
  imageDiagnostics.push(...visualDiagnostics.images);

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
    json_response_summaries: jsonPayloads.map(x => ({
      url: x.url,
      top_keys: x.top_keys,
      sample_type: Array.isArray(x.parsed) ? 'array' : typeof x.parsed
    })),
    dom_candidates_seen: domCandidates.length,
    iframe_candidates: iframeCandidates,
    image_diagnostics: imageDiagnostics,
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
    writePuppyPages(merged);
    updateSitemapWithPuppies(merged);
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
