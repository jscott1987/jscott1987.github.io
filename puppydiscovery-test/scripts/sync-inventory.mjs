import fs from "node:fs/promises";
import crypto from "node:crypto";

const SOURCE = "https://thenoblepaw.com/available-puppies/";
const INVENTORY = new URL("../data/inventory.json", import.meta.url);
const DIAGNOSTICS = new URL("../data/source-diagnostics.json", import.meta.url);

const now = new Date().toISOString();

function abs(url) {
  try { return new URL(url, SOURCE).href; } catch { return null; }
}
function cleanText(v) {
  return String(v ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function slug(v) {
  return cleanText(v).toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
function hash(v) {
  return crypto.createHash("sha256").update(v).digest("hex").slice(0,16);
}
function parseJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
  const objects = [];
  for (const raw of blocks) {
    try { objects.push(JSON.parse(raw)); } catch {}
  }
  return objects;
}
function walk(value, out=[]) {
  if (!value) return out;
  if (Array.isArray(value)) { for (const v of value) walk(v,out); return out; }
  if (typeof value !== "object") return out;
  const type = Array.isArray(value["@type"]) ? value["@type"].join(" ") : String(value["@type"] || "");
  const name = cleanText(value.name);
  const url = abs(value.url || value["@id"] || value.item?.url);
  const image = Array.isArray(value.image) ? value.image[0] : (value.image?.url || value.image);
  if (name && url && /Product|Offer|Animal|Pet/i.test(type)) {
    out.push({name,url,image:abs(image),raw:value});
  }
  for (const v of Object.values(value)) walk(v,out);
  return out;
}
function embeddedCandidates(html) {
  const out=[];
  const anchorRe=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m=anchorRe.exec(html))) {
    const url=abs(m[1]);
    const text=cleanText(m[2]);
    if (!url || !text) continue;
    if (/\/available-puppies\/?$/i.test(new URL(url).pathname)) continue;
    if (/pupp(y|ies)|dog|pet/i.test(url) && text.length < 120) out.push({name:text,url,image:null,raw:null});
  }
  return out;
}
function normalize(c) {
  const name=cleanText(c.name);
  const url=abs(c.url);
  if (!name || !url) return null;
  const breed = cleanText(c.raw?.breed || c.raw?.category || c.raw?.additionalProperty?.find?.(x=>/breed/i.test(x?.name))?.value || "");
  const sex = cleanText(c.raw?.gender || c.raw?.sex || c.raw?.additionalProperty?.find?.(x=>/sex|gender/i.test(x?.name))?.value || "");
  return {
    id: hash(url || name),
    name,
    slug: slug(name),
    breed: breed || null,
    breed_slug: breed ? slug(breed) : null,
    sex: sex || null,
    image_url: c.image || null,
    source_url: url,
    physical_location: "Stuart, FL",
    status: "active"
  };
}

const previous = JSON.parse(await fs.readFile(INVENTORY,"utf8"));
const res = await fetch(SOURCE,{headers:{"user-agent":"PuppyDiscoveryInventorySync/1.0 (+https://puppydiscovery.com/)","accept":"text/html,application/xhtml+xml"}});
if (!res.ok) throw new Error(`Inventory source HTTP ${res.status}`);
const html = await res.text();
if (html.length < 1000) throw new Error("Inventory source returned unexpectedly small HTML");

const ld = parseJsonLd(html);
const candidates = [...walk(ld), ...embeddedCandidates(html)];
const seen = new Map();
for (const c of candidates) {
  const n=normalize(c);
  if (!n) continue;
  if (/the noble paw|available puppies|contact us|our puppies/i.test(n.name) && !n.breed) continue;
  seen.set(n.source_url,n);
}
const extracted=[...seen.values()];

const iframeSrc=[...html.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)].map(m=>abs(m[1])).filter(Boolean);
const scriptSrc=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>abs(m[1])).filter(Boolean);
const endpointHints=[...new Set([...iframeSrc,...scriptSrc].filter(u=>/api|json|graphql|pupp|pet|inventory|widget/i.test(u)))];
await fs.writeFile(DIAGNOSTICS,JSON.stringify({
  source_url:SOURCE,
  http_status:res.status,
  html_bytes:html.length,
  jsonld_blocks:ld.length,
  extracted_records:extracted.length,
  iframe_sources:iframeSrc,
  endpoint_hints:endpointHints
},null,2)+"\n");

if (extracted.length === 0) {
  console.error("No trustworthy puppy records extracted. Existing inventory preserved.");
  process.exit(0);
}

const prevBySource=new Map((previous.puppies||[]).map(p=>[p.source_url,p]));
const next=[];
for (const n of extracted) {
  const old=prevBySource.get(n.source_url);
  next.push({...old,...n,first_seen:old?.first_seen||now,last_seen:now,missing_successful_runs:0,status:"active"});
  prevBySource.delete(n.source_url);
}
for (const old of prevBySource.values()) {
  const misses=(old.missing_successful_runs||0)+1;
  next.push({...old,missing_successful_runs:misses,status:misses>=2?"unavailable":old.status,last_seen:old.last_seen||null});
}
next.sort((a,b)=>(a.breed||"").localeCompare(b.breed||"") || a.name.localeCompare(b.name));
await fs.writeFile(INVENTORY,JSON.stringify({
  version:1,
  source_url:SOURCE,
  status:"ok",
  last_success:now,
  active_count:next.filter(p=>p.status==="active").length,
  puppies:next
},null,2)+"\n");
console.log(`Synced ${extracted.length} source records; ${next.filter(p=>p.status==="active").length} active.`);
