(async function(){
  const script=document.currentScript;
  const rootUrl=new URL('./',script.src);
  const rootPath=rootUrl.pathname;
  const asset=(p)=>new URL(p,rootUrl).pathname;
  let data;
  try{
    const res=await fetch(asset('data/puppies.json'),{cache:'no-store'});
    if(!res.ok) throw new Error('inventory '+res.status);
    data=await res.json();
  }catch(e){
    document.querySelectorAll('[data-live-inventory]').forEach(el=>{
      el.innerHTML='<div class="availability-box"><h2>Current availability</h2><p>Live inventory could not be loaded right now. Call 772-348-0800 or check The Noble Paw directly for current availability.</p><div class="inline-actions"><a class="btn" href="tel:7723480800">Call 772-348-0800</a><a class="btn secondary" href="https://thenoblepaw.com/available-puppies/">Check Noble Paw Inventory</a></div></div>';
    });
    return;
  }
  const all=Array.isArray(data.puppies)?data.puppies:[];
  const available=all.filter(p=>p.status==='available');
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const slug=s=>String(s||'puppy').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  function card(p){
    const puppySlug=slug((p.name||p.external_id||'puppy')+'-'+(p.external_id||p.key||'')).slice(0,90);
    const img=p.image_url?'<img src="'+esc(p.image_url)+'" alt="'+esc((p.name||'Puppy')+(p.breed?' the '+p.breed:''))+'" loading="lazy">':'<div class="inventory-photo-placeholder">Photo coming soon</div>';
    return '<article class="puppy-card"><div class="puppy-image">'+img+'</div><div class="card-body"><div class="card-kicker">'+esc(p.sex||'Puppy')+(p.external_id?' · #'+esc(p.external_id):'')+'</div><h3>'+esc(p.name||'Available Puppy')+'</h3><div class="breed">'+esc(p.breed||'Breed information available')+'</div><div class="meta">'+esc(p.physical_location||'Stuart, Florida')+'</div><div class="card-actions"><a class="btn" href="'+base+'puppies/'+puppySlug+'/">View Puppy</a><a class="phone-link" href="tel:7723480800">Call</a></div></div></article>';
  }
  document.querySelectorAll('[data-live-inventory]').forEach(el=>{
    const breed=(el.dataset.breed||'').toLowerCase();
    const location=(el.dataset.location||'').toLowerCase();
    let items=available;
    if(breed) items=items.filter(p=>(p.breed_slug||slug(p.breed)).toLowerCase()===breed || (p.breed||'').toLowerCase()===breed.replace(/-/g,' '));
    if(location) items=items.filter(p=>(p.physical_location||'').toLowerCase().includes(location));
    const limit=Number(el.dataset.limit||0); if(limit>0) items=items.slice(0,limit);
    if(!items.length){
      const label=breed?breed.replace(/-/g,' '):'puppies';
      el.innerHTML='<div class="availability-box"><h2>No verified '+esc(label)+' listings are published right now.</h2><p>Inventory changes frequently. Start a request or call The Noble Paw for the latest availability.</p><div class="inline-actions"><a class="btn" href="'+asset('find-my-puppy/')+(breed?'?breed='+encodeURIComponent(label):'')+'">Find My Puppy</a><a class="btn secondary" href="tel:7723480800">Call 772-348-0800</a></div></div>';
      return;
    }
    el.innerHTML='<div class="puppy-grid">'+items.map(card).join('')+'</div><div class="note">Last successful inventory sync: '+esc(data.last_successful_sync||'pending')+'</div>';
  });
})();