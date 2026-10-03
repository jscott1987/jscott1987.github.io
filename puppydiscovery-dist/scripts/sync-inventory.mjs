import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const SOURCE = "https://thenoblepaw.com/available-puppies/";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INVENTORY = path.join(ROOT,"data","inventory.json");
const DIAGNOSTICS = path.join(ROOT,"data","source-diagnostics.json");
const DYNAMIC_SITEMAP = path.join(ROOT,"sitemap-puppies.xml");
const now = new Date().toISOString();

function abs(url) { try { return new URL(url, SOURCE).href; } catch { return null; } }
function cleanText(v) { return String(v ?? "").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim(); }
function slug(v) { return cleanText(v).toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
function hash(v) { return crypto.createHash("sha256").update(v).digest("hex").slice(0,16); }
function esc(v) { return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
function parseJsonLd(html) {
  const blocks=[...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
  const objects=[]; for(const raw of blocks){ try{objects.push(JSON.parse(raw));}catch{} } return objects;
}
function walk(value,out=[]) {
  if(!value) return out;
  if(Array.isArray(value)){for(const v of value)walk(v,out);return out;}
  if(typeof value!=="object") return out;
  const type=Array.isArray(value["@type"])?value["@type"].join(" "):String(value["@type"]||"");
  const name=cleanText(value.name);
  const url=abs(value.url||value["@id"]||value.item?.url);
  const image=Array.isArray(value.image)?value.image[0]:(value.image?.url||value.image);
  if(name&&url&&/Product|Offer|Animal|Pet/i.test(type)) out.push({name,url,image:abs(image),raw:value});
  for(const v of Object.values(value)) walk(v,out);
  return out;
}
function embeddedCandidates(html){
  const out=[]; const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi; let m;
  while((m=re.exec(html))){
    const url=abs(m[1]), text=cleanText(m[2]); if(!url||!text)continue;
    if(/\/available-puppies\/?$/i.test(new URL(url).pathname))continue;
    if(/pupp(y|ies)|dog|pet/i.test(url)&&text.length<120)out.push({name:text,url,image:null,raw:null});
  } return out;
}
function normalize(c){
  const name=cleanText(c.name), url=abs(c.url); if(!name||!url)return null;
  const props=Array.isArray(c.raw?.additionalProperty)?c.raw.additionalProperty:[];
  const breed=cleanText(c.raw?.breed||c.raw?.category||props.find(x=>/breed/i.test(x?.name))?.value||"");
  const sex=cleanText(c.raw?.gender||c.raw?.sex||props.find(x=>/sex|gender/i.test(x?.name))?.value||"");
  const id=hash(url||name);
  const breedSlug=breed?slug(breed):null;
  const pageSlug=[breedSlug,slug(name),id.slice(0,6)].filter(Boolean).join("-");
  return {id,name,slug:slug(name),breed:breed||null,breed_slug:breedSlug,sex:sex||null,image_url:c.image||null,source_url:url,physical_location:"Stuart, FL",status:"active",page_slug:pageSlug,page_url:`https://puppydiscovery.com/puppies/${pageSlug}/`};
}
function puppyPage(p){
  const unavailable=p.status!=="active";
  const breedLink=p.breed_slug?`../../breeds/${p.breed_slug}/`:"../../breeds/";
  const canonical=`https://puppydiscovery.com/puppies/${p.page_slug}/`;
  const statusText=unavailable?"This puppy no longer appears in the current verified inventory.":"This puppy appears in the current verified inventory.";
  const schema={"@context":"https://schema.org","@graph":[{"@type":"WebPage","name":`${p.name}${p.breed?" - "+p.breed:""} Puppy`,"url":canonical},{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://puppydiscovery.com/"},{"@type":"ListItem","position":2,"name":"Puppies","item":"https://puppydiscovery.com/puppies/"},{"@type":"ListItem","position":3,"name":p.name,"item":canonical}]}]};
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.name)}${p.breed?" - "+esc(p.breed):""} Puppy | PuppyDiscovery</title><meta name="description" content="View verified public information for ${esc(p.name)}${p.breed?", a "+esc(p.breed):""} puppy available through The Noble Paw in Stuart, Florida."><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="${canonical}"><link rel="stylesheet" href="../../styles.css"><script type="application/ld+json">${JSON.stringify(schema)}</script></head><body>
<div class="topbar"><div class="shell"><span>Questions about ${esc(p.name)}?</span><a href="tel:7723480800">Call 772-348-0800</a></div></div><header class="header"><div class="shell header-inner"><a class="wordmark" href="../../">Puppy<span>Discovery</span></a><nav class="nav"><a href="../">Puppies</a><a href="../../breeds/">Breeds</a><a href="../../find-my-puppy/">Find My Puppy</a><a href="../../puppies/stuart-fl/">Stuart</a></nav></div></header>
<main><section class="breed-hero"><div class="shell"><div class="breadcrumbs"><a href="../../">Home</a><span>/</span><a href="../">Puppies</a><span>/</span><span>${esc(p.name)}</span></div><div class="breed-hero-grid"><div><div class="eyebrow">${unavailable?"Previously listed":"Current verified puppy"}</div><h1>${esc(p.name)}</h1><p>${esc(statusText)}</p><div class="fact-row" style="grid-template-columns:repeat(3,1fr)"><div class="fact"><span>Breed</span><strong>${esc(p.breed||"Not provided")}</strong></div><div class="fact"><span>Sex</span><strong>${esc(p.sex||"Not provided")}</strong></div><div class="fact"><span>Location</span><strong>Stuart, Florida</strong></div></div><div class="hero-actions">${unavailable?`<a class="btn" href="${breedLink}">See More ${esc(p.breed||"Puppies")}</a><a class="btn secondary" href="../../find-my-puppy/${p.breed?"?breed="+encodeURIComponent(p.breed):""}">Find Another Puppy</a>`:`<a class="btn" href="sms:7723480800?body=${encodeURIComponent("Hi, I'm interested in "+p.name+(p.breed?" the "+p.breed:"")+".")}">Ask About ${esc(p.name)}</a><a class="btn secondary" href="tel:7723480800">Call The Noble Paw</a>`}</div></div>${p.image_url?`<div class="breed-photo"><img src="${esc(p.image_url)}" alt="${esc(p.name)} puppy"></div>`:""}</div></div></section>
<section class="seo-article"><div class="content-shell"><h2>About this listing</h2><p>Only public source information is shown here. PuppyDiscovery does not invent personality, health, age, color, price, or availability details that were not provided by the source.</p><h2>Original listing</h2><p><a class="btn secondary" href="${esc(p.source_url)}">View Original Listing</a></p><h2>Continue your search</h2><div class="related-links"><a href="${breedLink}">More ${esc(p.breed||"Puppies")}</a><a href="../">Current Puppies</a><a href="../../find-my-puppy/">Find My Puppy</a></div></div></section></main></body></html>`;
}
async function writePuppyPages(puppies){
  for(const p of puppies){
    const dir=path.join(ROOT,"puppies",p.page_slug); await fs.mkdir(dir,{recursive:true}); await fs.writeFile(path.join(dir,"index.html"),puppyPage(p));
  }
  const active=puppies.filter(p=>p.status==="active");
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${active.map(p=>`  <url><loc>https://puppydiscovery.com/puppies/${p.page_slug}/</loc><lastmod>${now.slice(0,10)}</lastmod></url>`).join("\n")}\n</urlset>\n`;
  await fs.writeFile(DYNAMIC_SITEMAP,xml);
}

const previous=JSON.parse(await fs.readFile(INVENTORY,"utf8"));
const res=await fetch(SOURCE,{headers:{"user-agent":"PuppyDiscoveryInventorySync/1.0 (+https://puppydiscovery.com/)","accept":"text/html,application/xhtml+xml"}});
if(!res.ok)throw new Error(`Inventory source HTTP ${res.status}`);
const html=await res.text(); if(html.length<1000)throw new Error("Inventory source returned unexpectedly small HTML");
const ld=parseJsonLd(html);
const candidates=[...walk(ld),...embeddedCandidates(html)];
const seen=new Map();
for(const c of candidates){const n=normalize(c);if(!n)continue;if(/the noble paw|available puppies|contact us|our puppies/i.test(n.name)&&!n.breed)continue;seen.set(n.source_url,n);}
const extracted=[...seen.values()];
const iframeSrc=[...html.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)].map(m=>abs(m[1])).filter(Boolean);
const scriptSrc=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>abs(m[1])).filter(Boolean);
const endpointHints=[...new Set([...iframeSrc,...scriptSrc].filter(u=>/api|json|graphql|pupp|pet|inventory|widget/i.test(u)))];
await fs.writeFile(DIAGNOSTICS,JSON.stringify({source_url:SOURCE,http_status:res.status,html_bytes:html.length,jsonld_blocks:ld.length,extracted_records:extracted.length,iframe_sources:iframeSrc,endpoint_hints:endpointHints},null,2)+"\n");
if(extracted.length===0){console.error("No trustworthy puppy records extracted. Existing inventory and puppy pages preserved.");process.exit(0);}
const prevBySource=new Map((previous.puppies||[]).map(p=>[p.source_url,p])); const next=[];
for(const n of extracted){const old=prevBySource.get(n.source_url);next.push({...old,...n,first_seen:old?.first_seen||now,last_seen:now,missing_successful_runs:0,status:"active"});prevBySource.delete(n.source_url);}
for(const old of prevBySource.values()){const misses=(old.missing_successful_runs||0)+1;next.push({...old,missing_successful_runs:misses,status:misses>=2?"unavailable":old.status,last_seen:old.last_seen||null});}
next.sort((a,b)=>(a.breed||"").localeCompare(b.breed||"")||a.name.localeCompare(b.name));
await fs.writeFile(INVENTORY,JSON.stringify({version:1,source_url:SOURCE,status:"ok",last_success:now,active_count:next.filter(p=>p.status==="active").length,puppies:next},null,2)+"\n");
await writePuppyPages(next);
console.log(`Synced ${extracted.length} source records; ${next.filter(p=>p.status==="active").length} active; puppy pages regenerated.`);
