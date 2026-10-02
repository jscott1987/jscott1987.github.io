import fs from 'node:fs';
import path from 'node:path';

const ROOT=path.resolve(process.cwd(),'puppydiscovery-test');
const errors=[];
const warnings=[];

function files(dir){
  const out=[];
  for(const name of fs.readdirSync(dir)){
    if(['automation','server','.git'].includes(name)) continue;
    const p=path.join(dir,name),st=fs.statSync(p);
    if(st.isDirectory()) out.push(...files(p)); else out.push(p);
  }
  return out;
}
function rel(p){return path.relative(ROOT,p).split(path.sep).join('/');}
function extract(html,re){const m=html.match(re);return m?m[1].trim():'';}
function localTarget(file,href){
  href=href.split('#')[0].split('?')[0];
  if(!href||href.startsWith('#')||/^(https?:|tel:|sms:|mailto:|javascript:)/i.test(href)) return null;
  let target;
  if(href.startsWith('/')) target=path.join(ROOT,href.replace(/^\/+/,''));
  else target=path.resolve(path.dirname(file),href);
  if(href.endsWith('/')) target=path.join(target,'index.html');
  if(!path.extname(target) && fs.existsSync(target) && fs.statSync(target).isDirectory()) target=path.join(target,'index.html');
  return target;
}

const htmlFiles=files(ROOT).filter(p=>p.endsWith('.html')&&!rel(p).startsWith('operations/'));
const canonicals=new Map();
for(const file of htmlFiles){
  const r=rel(file),html=fs.readFileSync(file,'utf8');
  const title=extract(html,/<title>([\s\S]*?)<\/title>/i);
  const desc=extract(html,/<meta\s+name="description"\s+content="([^"]*)"/i);
  const canonical=extract(html,/<link\s+rel="canonical"\s+href="([^"]+)"/i);

  if(!title) errors.push(r+': missing title');
  if(!desc) errors.push(r+': missing meta description');
  if(!canonical) errors.push(r+': missing canonical');
  if(canonical){
    if(canonicals.has(canonical)) errors.push(r+': duplicate canonical with '+canonicals.get(canonical)+' -> '+canonical);
    else canonicals.set(canonical,r);
  }
  if(!html.includes('name="robots" content="noindex') && !r.match(/^puppies\/(?!stuart-fl\/).+\/index\.html$/)){
    warnings.push(r+': staging page is not explicitly noindex');
  }
  if(r.startsWith('breeds/') && r!=='breeds/index.html'){
    if(!html.includes('data-live-inventory')) errors.push(r+': breed page missing live inventory hook');
    if(!html.includes('application/ld+json')) errors.push(r+': breed page missing JSON-LD');
  }
  if(r.startsWith('locations/') && r!=='locations/index.html' && !html.includes('application/ld+json')) errors.push(r+': location page missing JSON-LD');

  for(const m of html.matchAll(/href="([^"]+)"/g)){
    const target=localTarget(file,m[1]);
    if(target && !fs.existsSync(target)) errors.push(r+': broken local link '+m[1]+' -> '+rel(target));
  }
}

const expectedBreeds=[
'australian-shepherd','beagle','bernedoodle','bichon-frise','boston-terrier','boxer','cane-corso','cavachon','cavalier-king-charles-spaniel','cavapoo','chihuahua','cockapoo','french-bulldog','golden-retriever','goldendoodle','havanese','labrador-retriever','maltese','maltipoo','mini-australian-shepherd','mini-bernedoodle','mini-dachshund','mini-goldendoodle','miniature-poodle','miniature-schnauzer','morkie','pembroke-welsh-corgi','pomeranian','pomsky','pug','sheepadoodle','shiba-inu','shih-tzu','toy-poodle','west-highland-white-terrier','yorkshire-terrier'
];
for(const s of expectedBreeds){
  const p=path.join(ROOT,'breeds',s,'index.html');
  if(!fs.existsSync(p)) errors.push('missing breed route: '+s);
}
const expectedLocations=['palm-city-fl','jensen-beach-fl','port-st-lucie-fl','hobe-sound-fl','jupiter-fl'];
for(const s of expectedLocations){
  const p=path.join(ROOT,'locations',s,'index.html');
  if(!fs.existsSync(p)) errors.push('missing location route: '+s);
}
for(const p of ['index.html','puppies/index.html','puppies/stuart-fl/index.html','breeds/index.html','locations/index.html','find-my-puppy/index.html','sitemap.xml','production-robots.txt','inventory.js','site.js']){
  if(!fs.existsSync(path.join(ROOT,p))) errors.push('missing core artifact: '+p);
}
const sitemap=fs.readFileSync(path.join(ROOT,'sitemap.xml'),'utf8');
for(const [canonical,r] of canonicals){
  if(r.startsWith('operations/')) continue;
  const sourceHtml=fs.readFileSync(path.join(ROOT,r),'utf8');
  const intentionallyNoindex=sourceHtml.includes('name="robots" content="noindex,follow"');
  if(!intentionallyNoindex && !sitemap.includes('<loc>'+canonical+'</loc>') && !r.match(/^puppies\/(?!stuart-fl\/).+\/index\.html$/)){
    errors.push(r+': canonical missing from sitemap '+canonical);
  }
}
const inventoryJs=fs.readFileSync(path.join(ROOT,'inventory.js'),'utf8');
if(/\bbase\s*\+/.test(inventoryJs)) errors.push('inventory.js contains stale base+ path construction');

const report={
  generated_at:new Date().toISOString(),
  html_pages_checked:htmlFiles.length,
  canonicals_checked:canonicals.size,
  breed_pages_expected:expectedBreeds.length,
  location_pages_expected:expectedLocations.length+1,
  errors,
  warnings
};
fs.writeFileSync(path.join(ROOT,'qa-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(errors.length) process.exit(1);
