(async function(){
  const root=document.querySelector("[data-live-inventory]");
  if(!root) return;
  const prefix=root.dataset.prefix||"";
  try{
    const res=await fetch(prefix+"data/inventory.json",{cache:"no-store"});
    const data=await res.json();
    const active=(data.puppies||[]).filter(p=>p.status==="active");
    const breed=(root.dataset.breed||"").toLowerCase();
    const rows=breed?active.filter(p=>(p.breed_slug||"")===breed):active;
    if(!rows.length){
      root.innerHTML='<div class="availability-box"><h2>Current puppy availability</h2><p>Verified live listings are not available in PuppyDiscovery yet. We will not show invented inventory.</p><div class="inline-actions"><a class="btn" href="https://thenoblepaw.com/available-puppies/">Check current Noble Paw puppies</a><a class="btn secondary" href="'+prefix+'find-my-puppy/">Find My Puppy</a></div></div>';
      return;
    }
    root.innerHTML='<div class="puppy-grid">'+rows.slice(0,12).map(p=>'<article class="puppy-card">'+(p.image_url?'<div class="puppy-image"><img src="'+p.image_url+'" alt="'+p.name+'"></div>':'')+'<div class="card-body"><h3>'+p.name+'</h3><div class="breed">'+(p.breed||'Puppy')+'</div><div class="meta">'+(p.sex?p.sex+' · ':'')+'Stuart, Florida</div><div class="card-actions"><a class="btn" href="'+p.source_url+'">View Puppy</a><a class="phone-link" href="tel:7723480800">Call</a></div></div></article>').join('')+'</div>';
  }catch(e){
    root.innerHTML='<div class="availability-box"><h2>Current puppy availability</h2><p>We could not verify the live feed right now. Existing listings are not guessed or cached as current.</p><a class="btn" href="https://thenoblepaw.com/available-puppies/">Check Noble Paw directly</a></div>';
  }
})();